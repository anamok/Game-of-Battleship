var numOfPlayers = 1;
var curPlayer = "";
var playerOne;
var playerTwo;
var mapPlayerOne = new Map();		// playerOne's ship locations
var mapPlayerTwo = new Map();		// playerTwo's ship locations
var historyOfPlayers = new Map();	// history of hits and misses for both boards
var reportedSunkCoords = [];		// all prev. reported sunk ships (to not report them again)
var pointsPlayerOne = 24;
var pointsPlayerTwo = 24;
var numOfSunkShipsP1 = 0;
var numOfSunkShipsP2 = 0;

document.addEventListener("DOMContentLoaded", () => {
	// record player name and ship placement
	document.getElementById("subButton").addEventListener("click", () => {
		document.getElementById("errorMessage").style.display = 'none';
		var curName = document.getElementById("playerName").value;
		var curPlacement = document.getElementById("shipPlacement").value;
		if (!curName || !curPlacement) {
			document.getElementById("errorMessage").innerText = "Please enter an input";
			document.getElementById("errorMessage").style.display = 'inline';
			return;
		}
		let validPlacement = checkPlacement(curPlacement);
		if (validPlacement != 0) {
			document.getElementById("errorMessage").innerText = "Placement is invalid, try again";
			document.getElementById("errorMessage").style.display = 'inline';
			return;
		}
		document.getElementById("playerName").value = "";
		document.getElementById("shipPlacement").value = "";
		if (numOfPlayers == 1) {
			playerOne = curName;
			numOfPlayers++;
			document.getElementById("playerTitle").innerText = "Player Two";
		} else {
			playerTwo = curName;

			//start game setup		
			document.getElementById("startPage").style.display = 'none';
			document.getElementById("subButton").style.display = 'none';
			switchPlayer();				
		}
	});

	// when player okays next turn, show boards
	document.getElementById("nextButton").addEventListener("click", () => {
		document.getElementById("nextButton").style.display = 'none';
		document.getElementById("popUpMessage").className = "msgWrapper";
		document.getElementById("popUpMessage").style.display = 'none';
		updateBoard();
	});
});

// check if input is valid and if ships overlay
function checkPlacement(placement) {
	let arrOne = [];
	let arrTwo = [];
	placement = placement.slice(0, -1);
	let arr = placement.split(";");
	let map = new Map();
	let flag = false;
	for (let i = 0; i < 3; i++) {
		let ship = arr[i];
		if (ship.length === 10) map.set(ship.substring(0,1), ship.substring(2,9));
		else if (ship.length === 9) map.set(ship.substring(0,1), ship.substring(2,8));
		else if (ship.length === 8) map.set(ship.substring(0,1), ship.substring(2,7));
		else return 1;
	}
	for (let [key, value] of map.entries()) {
		let str = value.replace(/[^0-9\-]/g,'');
		let arrSplit = str.split("-");
		let number = parseInt(arrSplit[1]) - parseInt(arrSplit[0]);
		let letter;
		if (value.length === 7) letter = value.charCodeAt(4) - value.charCodeAt(0); 
		else letter = value.charCodeAt(3) - value.charCodeAt(0);
		if (key === "A") {
			if (!((number === 0 && letter === 4) || (number === 4 && letter === 0))) return 1;
		} else if (key === "B") {
			if (!((number === 0 && letter === 3) || (number === 3 && letter === 0))) return 1;
		} else if (key === "S") {
			if (!((number === 0 && letter === 2) || (number === 2 && letter === 0))) return 1;
		} else {
			return 1;
		}
		if (numOfPlayers == 1) flag = arrShips("boardOne", arrOne, arrSplit, value);
		else flag = arrShips("boardTwo", arrTwo, arrSplit, value);
		if (flag) return 1;
	}
	if (numOfPlayers == 1) {
		mapPlayerOne.set("A", arrOne.slice(0, 5));
		mapPlayerOne.set("B", arrOne.slice(5, 9));
		mapPlayerOne.set("S", arrOne.slice(9, 12));
		// console.log(mapPlayerOne);
	} else {
		mapPlayerTwo.set("A", arrTwo.slice(0, 5));
		mapPlayerTwo.set("B", arrTwo.slice(5, 9));
		mapPlayerTwo.set("S", arrTwo.slice(9, 12));
		// console.log(mapPlayerTwo);
	}
	return 0;
}

// helper function: reports if the ships overlay, if they are placed too close, and produces coords array
function arrShips(boardNum, arr, arrNumbers, coordinates){
	let start, end, str;
	let msg = "ok";
	if (arrNumbers[0] === arrNumbers[1]) {
		if (coordinates.length === 7) {
			start = coordinates.charCodeAt(0);
			end = coordinates.charCodeAt(4);
		} else {
			start = coordinates.charCodeAt(0);
			end = coordinates.charCodeAt(3);
		}
		for (let i = 0; i <= end-start; i++) {
			str = boardNum + String.fromCharCode(start + i) + arrNumbers[0].toString();
			if (arr.includes(str)) msg = "overlay";
			else arr.push(str);
		}
	} else {
		start = parseInt(arrNumbers[0]);
		end = parseInt(arrNumbers[1]);
		for (let i = start; i <= end; i++) {
			str = boardNum + coordinates.charAt(0) + i.toString();
			if (arr.includes(str)) msg = "overlay";
			else arr.push(str);
		}
	}
	if (msg === "overlay") return true;
	return false;
}

function switchPlayer() {
	if (curPlayer === "" || curPlayer === playerTwo) curPlayer = playerOne;
	else curPlayer = playerTwo;
	let str = "Click to begin " + curPlayer + "'s turn";
	document.getElementById("nextButton").innerText = str;
	document.getElementById("nextButton").style.display = 'inline';
	document.getElementById("plOne").style.display = 'none';
	document.getElementById("plTwo").style.display = 'none';
	document.getElementById("gridOne").style.display = 'none';
	document.getElementById("gridTwo").style.display = 'none';
}

function fire(cell) {
	if (historyOfPlayers.has(cell)) {
		document.getElementById("errorMessage").innerText = "Can't fire at the same spot twice! Try again";
		document.getElementById("errorMessage").style.display = 'inline';
		return;
	}
	let arr;
	let hit = false;
	if (curPlayer === playerOne) {
		for (let [key, value] of mapPlayerTwo.entries()) {
			arr = value;
			if (arr.includes(cell.toString())) {
				pointsPlayerTwo -= 2;
				hit = true;
			}
		}
	} else {
		for (let [key, value] of mapPlayerOne.entries()) {
			arr = value;
			if (arr.includes(cell.toString())) {
				pointsPlayerOne -= 2;
				hit = true;
			}
		}
	}
	if (hit) {
		historyOfPlayers.set(cell, true);
		let sunkShip = checkIfSunk(curPlayer);
		let msg = "";
		if (numOfSunkShipsP1 === 3) {
			updateHistory();
			gameOver(playerTwo);
		}
		else if (numOfSunkShipsP2 === 3) {
			updateHistory();
			gameOver(playerOne);
		} 
		else {
			if (sunkShip != "") {
				msg = "You sunk "
				if (curPlayer === playerOne) msg += playerTwo;
				else msg += playerOne;
				msg += "'s " + sunkShip;
				// alert(msg); // z-index overlay HERE
			} else {
				// alert("You hit"); // z-index overlay HERE
				msg = "You hit";
			}
			document.getElementById("popUpMessage").className = "popUp";
			document.getElementById("popUpMessage").innerText = msg;
			document.getElementById("popUpMessage").style.display = 'block';
			switchPlayer();
		}
	} else {
		historyOfPlayers.set(cell, false);
		// alert("You missed"); // z-index overlay HERE
		document.getElementById("popUpMessage").className = "popUp";
		document.getElementById("popUpMessage").innerText = "You missed";
		document.getElementById("popUpMessage").style.display = 'block';
		switchPlayer();
	}
	
}

function checkIfSunk(playerWhoFired) {
	let givenShipCoordinates = [];
	if (playerWhoFired === playerOne) {
		for (let [key, value] of mapPlayerTwo.entries()) {
			givenShipCoordinates = value;
			let hitShipCoordinates = [];
			for (let [k, v] of historyOfPlayers.entries()) {
				if (v == true && givenShipCoordinates.includes(k) && !reportedSunkCoords.includes(k)) {
					hitShipCoordinates.push(k);
				}
			}
			// console.log("givenshipcoords: " + givenShipCoordinates);
			// console.log("hitshipcoords: " + hitShipCoordinates);
			if (hitShipCoordinates.length == givenShipCoordinates.length) {
				reportedSunkCoords = reportedSunkCoords.concat(hitShipCoordinates);
				// console.log(reportedSunkCoords);
				numOfSunkShipsP2++;
				if (key === 'A') return "aircraft carrier";
				if (key === 'B') return "battleship";
				if (key === 'S') return "submarine";
			}
		}
	} else {
		for (let [key, value] of mapPlayerOne.entries()) {
			givenShipCoordinates = value;
			let hitShipCoordinates = [];
			for (let [k, v] of historyOfPlayers.entries()) {
				if (v == true && givenShipCoordinates.includes(k) && !reportedSunkCoords.includes(k)) {
					hitShipCoordinates.push(k);
				}
			}
			// console.log("givenshipcoords: " + givenShipCoordinates);
			// console.log("hitshipcoords: " + hitShipCoordinates);
			if (hitShipCoordinates.length == givenShipCoordinates.length) {
				reportedSunkCoords = reportedSunkCoords.concat(hitShipCoordinates);
				// console.log(reportedSunkCoords);
				numOfSunkShipsP1++;
				if (key === 'A') return "aircraft carrier";
				if (key === 'B') return "battleship";
				if (key === 'S') return "submarine";
			}
		}
	}
	return "";
}

function updateHistory() {
	for (let [key, value] of historyOfPlayers.entries()) {
		if (value == true) document.getElementById(key).style.backgroundColor = "red";
		else document.getElementById(key).style.backgroundColor = "white";
	}
}

function updateBoard() {
	if (curPlayer === playerOne) {
		empty("boardTwo");
		populate("boardOne");
		document.getElementById("gridOne").className = "gridBottom";
		document.getElementById("gridTwo").className = "gridTop";
		document.getElementById("plOne").innerText = playerTwo + "'s board";
		document.getElementById("plTwo").innerText = playerOne + "'s board";
	} else {
		empty("boardOne");
		populate("boardTwo");
		document.getElementById("gridTwo").className = "gridBottom";
		document.getElementById("gridOne").className = "gridTop";
		document.getElementById("plOne").innerText = playerOne + "'s board";
		document.getElementById("plTwo").innerText = playerTwo + "'s board";
	}
	updateHistory();
	document.getElementById("gridOne").style.display = 'block';
	document.getElementById("gridTwo").style.display = 'block';
	document.getElementById("plOne").style.display = 'inline';
	document.getElementById("plTwo").style.display = 'inline';
}

function populate(boardNum) {
	if (boardNum === "boardOne") {
		for (let [key, value] of mapPlayerOne.entries()) {
			let arr = value;
			for (let i = 0; i < arr.length; i++) {
				document.getElementById(arr[i]).innerText = key;
				document.getElementById(arr[i]).style.backgroundColor = "lightslategray";
			}
		}
	} else {
		for (let [key, value] of mapPlayerTwo.entries()) {
			let arr = value;
			for (let i = 0; i < arr.length; i++) {
				document.getElementById(arr[i]).innerText = key;
				document.getElementById(arr[i]).style.backgroundColor = "lightslategray";
			}
		}
	}
}

function empty(boardNum) {
	if (boardNum === "boardOne") {
		for (let [key, value] of mapPlayerOne.entries()) {
			let arr = value;
			for (let i = 0; i < arr.length; i++) {
				document.getElementById(arr[i]).innerText = "";
				document.getElementById(arr[i]).style.backgroundColor = "lightblue";
			}
		}
	} else {
		for (let [key, value] of mapPlayerTwo.entries()) {
			let arr = value;
			for (let i = 0; i < arr.length; i++) {
				document.getElementById(arr[i]).innerText = "";
				document.getElementById(arr[i]).style.backgroundColor = "lightblue";
			}
		}
	}
}

function gameOver(winner) {
	document.getElementById("plOne").style.opacity = '0.6';
	document.getElementById("plTwo").style.opacity = '0.6';
	document.getElementById("gridOne").style.opacity = '0.6';
	document.getElementById("gridTwo").style.opacity = '0.6';
	let winMsg, loseMsg;
	if (winner === playerOne) {
		winMsg = playerOne + " won. They earned " + pointsPlayerOne + " points.";
		loseMsg = playerTwo + " lost. They earned " + pointsPlayerTwo + " points.";
	} else {
		winMsg = playerTwo + " won. They earned " + pointsPlayerTwo + " points";
		loseMsg = playerOne + " lost. They earned " + pointsPlayerOne + " points.";
	}
	document.getElementById("winText").innerText = winMsg;
	document.getElementById("loseText").innerText = loseMsg;
	document.getElementById("gameOverText").className = "gameOverPage";
	document.getElementById("gameOverText").style.display = 'block';
	document.getElementById("winText").className = "gameOverPage";
	document.getElementById("winText").style.display = 'block';
	document.getElementById("loseText").className = "gameOverPage";
	document.getElementById("loseText").style.display = 'block';
}