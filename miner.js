const request = require('request');
const crypto = require('crypto');
const fs = require('fs')
require('http').createServer().listen(3000)


const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
console.log(config.username)

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
let minerKey = null;
let salt = null;
let lastSecond = null;


async function loop(){
	let serverConfig = null;
	let e = null;


	while (true){

		if (lastSecond + config.checkTimeout < Date.now()){

			lastSecond = Date.now();

			console.log(`# Checking block key integrity at ${Date.now()}ms`)
			
			serverConfig = await get(`${config.mattcoinApiUrl}/config`)

			if (minerKey != serverConfig.key){

				minerKey = serverConfig.key;

				salt = serverConfig.salt

				console.log(`# Block key integrity nullified! New key ${minerKey} registered.`)

			}
		}

		let hashObject = await hasher(salt);
		
		hashCount++;
		
		if(hashObject.hash.startsWith(minerKey)){

			console.log(`# Found hash that satisfies block key`)
			
			console.log(hashObject.hash)

			console.log(`# Attempting hash verification`)

			e = await post(`${config.mattcoinApiUrl}/submission`, {'value': hashObject.val, 'user': config.username} );

			serverConfig = await get(`${config.mattcoinApiUrl}/config`)

			if(e.response){
					
				console.log(`# Authored block ${serverConfig.blockCount - 1} with success!`)

				minerKey = serverConfig.key;

				salt = serverConfig.salt



			}else{
					
				console.log(`# An error occured with the provided hash, mining has continued.`)

				minerKey = serverConfig.key;

				salt = serverConfig.salt


			}

			
		}
	}

}



get(`${config.mattcoinApiUrl}/config`).then(function(serverConfig){

	minerKey = serverConfig.key;

	console.log(`Starting miner with key ${minerKey} as first block key.`)
	lastSecond = Date.now()
	loop()

})