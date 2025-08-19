import EventRelay from "../EventRelay.js";

export default class GameController extends EventRelay {
	constructor(gameInstance) {
		this.instance = gameInstance;
		this.scene = gameInstance?.gameInstance?.scene;
		this.canvas = gameInstance?.canvas;
		this.setupListeners();
	}

	setupListeners() {
		this.instance.addEventListener('ready', e => {
			this.scene = e.detail.scene;
		});

		this.instance.addEventListener('trackLoad', e => {
			console.log("Track loaded", e.detail);
		});
	}

	loadTrack(code) {
		this.instance.loadTrack(code);
	}

	loadFromURL(src) {
		return fetch(src).then(r => r.text()).then(code => this.loadTrack(code));
	}

	setTool(tool) {
		this.scene?.toolHandler?.set(tool);
	}

	zoomIn() {
		this.scene?.camera?.zoomIn();
	}

	play() {
		this.scene?.paused = false;
	}

	pause() {
		this.scene?.paused = true;
	}

	reset() {
		this.scene?.reset();
	}
}