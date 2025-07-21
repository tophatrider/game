import Game from "./class/Game.js";

window.game = new Game(document.querySelector('#view'));
window.game.on('stateChange', function(paused) {
	// container shadow root
	const playPauseButton = document.querySelector('.playpause > input');
	if (playPauseButton !== null) {
		playPauseButton.checked = !paused;
	}
});

window.game.on('trackComplete', async function(payload) {
	// check current leaderboard to compare the times
	// let leaderboard = document.querySelector('.track-leaderboard');
	// if (leaderboardTime > payload.time) {
	// 	let overwrite = confirm("You did not beat your best time. Would you like to overwrite your ghost anyway?");
	// 	if (!overwrite) {
	// 		return;
	// 	}

	// 	payload.overwrite = overwrite;
	// }

	const response = await fetch("/api/tracks/ghosts/save", {
		body: new URLSearchParams(payload),
		method: 'post'
	}).then(r => r.text());
	if (response == '1') {
		// update leaderboard
		alert("Ghost saved!");
	} else {
		alert("Something went wrong. Your ghost has not been saved. Keep this somewhere safe if you wish to keep your ghost!\n\n" + JSON.stringify(payload));
	}
});