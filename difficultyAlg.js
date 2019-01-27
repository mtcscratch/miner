const difficulty = 0;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

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

console.log(new Date().getTime())

console.log(checkHash(32, '00a'))