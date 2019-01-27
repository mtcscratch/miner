const request = require('request');
const crypto = require('crypto');
const fs = require('fs')
var colors = require('colors');
const figlet = require('figlet');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

function checkHash(difficulty, hash){

	const hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
	
	let preKey = ''

	for(let i = 0; i <= Math.floor((difficulty - 1)/16); i++){

		preKey += '0'
	}

	if (difficulty % 16 != 0){
		
		for (let i = 0; i < (16 - (difficulty % 16)); i++){
			
			if (hash.startsWith(preKey + hex[i])){

				return true;
			}
		}

		return false;

	}else{

		return hash.startsWith(preKey)
	}

}
function hasher(s){
	
	return new Promise(function(resolve, reject){
			
			const val = crypto.randomBytes(32).toString('hex')
			const hash = crypto.createHash('sha256').update(val + s).digest('hex');

			resolve({'val': val + s, 'hash': hash})
	});

}


function post(url, jsonObject){
	return new Promise(function(resolve, reject){
		var options = {
			
			uri: url,

			method: 'POST',

			json: jsonObject
		};

		request(options, function (error, response, body) {
			
			if (!error) {
			
				resolve(response.body);
			}else{

				reject(error)
			}
		});
	})
}

function get(url){
	return new Promise(function(resolve, reject){
		let object = {};
		request(
		    { uri: url },
		    
			    function(error, response, body) {

	       			if (!error) {
	
						resolve(JSON.parse(response.body))
					}else{

						reject(error)
					}
				}
			);
	})
}

let hashCount = 0;
let hashLast = Date.now();
let minerKey = null;
let salt = null;
let lastSecond = null;

async function loop(){
	let serverConfig = null;
	let e = null;


	while (true){
		if(hashLast + 5000 < Date.now()){

			console.log(`HASHRATE`.bgBlue.black + ` ${hashCount/5000}KHS\n`)
			hashLast = Date.now()
			hashCount = 0;
		}
		
		if (lastSecond + config.checkTimeout < Date.now()){

			lastSecond = Date.now();

			console.log(`NOTICE`.bgWhite.black + ` Checking block difficulty integrity at ` + `${Date.now()}ms`.underline +'\n')
			
			serverConfig = await get(`${config.mattcoinApiUrl}/config`)

			if (minerDifficulty != serverConfig.difficulty){

				minerDifficulty = serverConfig.difficulty;

				salt = serverConfig.salt

				console.log(`WARNING`.bgYellow.black + ` Block hash nullified! New difficulty ${minerDifficulty} registered.\n`)

			}
		}

		let hashObject = await hasher(salt);
		let check = checkHash(minerDifficulty, hashObject.hash);

		hashCount++;
		
		if(check){

			console.log(`SUCCESS`.bgGreen.black + ` Found hash that satisfies block difficulty:\n`)
			
			console.log(hashObject.hash.underline + '\n')

			console.log(`NOTICE`.bgWhite.black + ` Attempting hash verification\n`)

			e = await post(`${config.mattcoinApiUrl}/submission`, {'value': hashObject.val, 'user': config.username} );

			serverConfig = await get(`${config.mattcoinApiUrl}/config`)

			if(e.response){
					
				console.log(`SUCCESS`.bgGreen.black + ` Authored block ${serverConfig.blockCount - 1} with success!\n`)

				minerDifficulty = serverConfig.difficulty;

				salt = serverConfig.salt



			}else{
					
				console.log(`ERROR`.bgRed.black + ` An error occured with the provided hash, mining has continued.\n`)

				minerDifficulty = serverConfig.difficulty;

				salt = serverConfig.salt


			}

			
		}
	}

}


figlet('Mattcoin Miner', function(err, data) {
    if (err) {
        console.dir(err);
        return;
    }
    console.log(data.yellow)
    console.log('Created by EncloCreations'.bgYellow.black)
    console.log(`Mining as ${config.username}`.bgWhite.black +'\n')

    get(`${config.mattcoinApiUrl}/config`).then(function(serverConfig){

		minerDifficulty = serverConfig.difficulty;

		console.log(`NOTICE`.bgWhite.black + ` Starting miner with difficulty of ${minerDifficulty}\n`)
		lastSecond = Date.now()
		loop()

	})
});
