const request = require('request');
const crypto = require('crypto');

const config = {
	'checkTimeout': 30000,
	'mattcoinApiUrl': 'https://mattcoin.now.sh/api/v1/crypto',
	'username': 'EncloCreations'
}

function hasher(){
	
	return new Promise(function(resolve, reject){
			
			const val = crypto.randomBytes(32).toString('hex')
			const hash = crypto.createHash('sha256').update(val).digest('hex');

			resolve({'val': val, 'hash': hash})
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
				console.log(`# Block key integrity nullified! New key ${minerKey} registered.`)

			}
		}

		let hashObject = await hasher();
		
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


			}else{
					
				console.log(`# An error occured with the provided hash, mining has continued.`)

				minerKey = serverConfig.key;

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