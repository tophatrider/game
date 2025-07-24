import Game from "./class/Game.js";

const canvas = document.querySelector('#view')
	, game = new Game(canvas);

Object.defineProperty(window, 'game', { value: game });

game.on('stateChange', function(paused) {
	// container shadow root
	const playPauseButton = document.querySelector('.playpause > input');
	if (playPauseButton !== null) {
		playPauseButton.checked = !paused;
	}
});

game.on('trackComplete', async function(payload) {
	if ('navigator' in window && !navigator.onLine) {
		const TEMP_KEY = 'bhr-temp'
			, data = localStorage.getItem(TEMP_KEY) || {};
		data.savedGhosts ||= [];
		data.savedGhosts.push(payload);
		localStorage.setItem(TEMP_KEY, JSON.stringify(data));
		return;
	}

	// check current leaderboard to compare the times
	// let leaderboard = document.querySelector('.track-leaderboard');
	// if (leaderboardTime > payload.time) {
	// 	let overwrite = confirm("You did not beat your best time. Would you like to overwrite your ghost anyway?");
	// 	if (!overwrite) {
	// 		return;
	// 	}

	// 	payload.overwrite = overwrite;
	// }

	uploadGhost(payload);
});

window.addEventListener('online', async event => {
	const TEMP_KEY = 'bhr-temp'
		, data = JSON.parse(localStorage.getItem(TEMP_KEY));
	if (data && data.hasOwnProperty('savedGhosts')) {
		if (data.savedGhosts.length > 0) {
			for (const record of data.savedGhosts)
				await uploadGhost(record);

			delete data.savedGhosts;
		}

		localStorage.setItem(TEMP_KEY, JSON.stringify(data));
	}
});

async function uploadGhost(payload) {
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
}