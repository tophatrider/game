import Game from "./class/Game.js";

const canvas = document.querySelector('#view')
	, game = new Game(canvas)
	, overlayToggle = game.container.querySelector('.game-overlay > input');

Object.defineProperty(window, 'game', { value: game });

game.on('playerFocusChange', function(player) {
	const progress = this.gui.querySelector('.replay-progress');
	if (!progress) return console.warn('Progress bar not found');
	this.scene.cameraFocus === this.scene.firstPlayer.vehicle.hitbox ? progress.style.setProperty('display', 'none') : (progress.style.removeProperty('display'),
	progress.setAttribute('max', player.runTime ?? 100),
	progress.setAttribute('value', player.ticks));
});

game.on('replayAdd', function(player) {
	const progress = this.gui.querySelector('.replay-progress');
	if (!progress) return console.warn('Progress bar not found');
	progress.style.removeProperty('display');
	progress.setAttribute('max', player.runTime ?? 100);
	progress.setAttribute('value', player.ticks);
});

game.on('reset', function() {
	const progress = this.gui.querySelector('.replay-progress');
	if (!progress) return console.warn('Progress bar not found');
	this.scene.cameraFocus === this.scene.firstPlayer.vehicle.hitbox ? progress.style.setProperty('display', 'none') : (progress.style.removeProperty('display'),
	progress.setAttribute('max', this.scene.cameraFocus.parent.player.runTime ?? 100),
	progress.setAttribute('value', this.scene.cameraFocus.parent.player.ticks));
});

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

game.on('settingsChange', _handleSettingsChange);

window.addEventListener('paste', function(event) {
	const raw = event.clipboardData.getData('text');
	if (!raw.match(/^(?:[-\d\sa-v]*#){2}[-\d\sa-w]*(?:#(?:BMX|MTB))?(?:#\d+)?$/i)) return;
	if (raw.length > 5e4) {
		event.preventDefault();
		confirm("Would you like to load the track you pasted? (" + Math.floor(raw.length / 1e3) + "k)") && game.init({ code: raw, write: true });
		if (overlayToggle.checked) {
			overlayToggle.checked = false;
			if (trackdialog.open) {
				trackdialog.close();
			}
		}
		return;
	}

	// event.preventDefault();
	if (!trackdialog.open) {
		if (!overlayToggle.checked) {
			overlayToggle.checked = true;
			game.scene.paused = true;
		}

		trackdialog.showModal();
	}

	// code.value = raw;
});

document.addEventListener('keyup', function(event) {
	switch (event.key.toLowerCase()) {
	case 'escape':
		event.preventDefault();
		overlayToggle.checked = !overlayToggle.checked;
		game.scene.paused = overlayToggle.checked;
	}
});

// document.addEventListener('pointerlockchange', function() {
// 	if (this.pointerLockElement) return;
// 	overlayToggle.checked = !overlayToggle.checked;
// 	game.scene.paused = overlayToggle.checked;
// });

function _handleSettingsChange(settings) {
	let element;
	for (const setting in settings) {
		const value = settings[setting];
		switch (setting) {
		case 'theme':
			let stylesheet = document.querySelector('#game-theme'), href;
			if (stylesheet && (href = stylesheet.href.replace(/[^/]*(\.css)$/, `${value}$1`)) && href !== stylesheet.href) {
				stylesheet.setAttribute('href', href);
			}

			(element = document.getElementById(value)) && (element.checked = true);
			break;
		default:
			if (typeof value != 'boolean') continue;
			(element = document.getElementById(setting.replace(/([A-Z])/g, '-$1').toLowerCase())) && (element.checked = value);
		}
	}
}

_handleSettingsChange(game.settings);