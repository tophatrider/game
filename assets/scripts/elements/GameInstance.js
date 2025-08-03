class GameInstance extends HTMLElement {
	static observedAttributes = ['auto-load', 'performance', 'replay-src', 'replaying', 'show-controls', 'track-id', 'track-src', 'write'];

	static styleSheet = (() => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(`
			:host {
				-webkit-tap-highlight-color: transparent;
				-webkit-user-drag: none;
				display: block;
				margin: auto;
				max-height: 100vh;
				max-width: 100vw;
				overflow: hidden;
				overscroll-behavior: none;
				pointer-events: stroke;
				position: relative;
				touch-action: none;
				user-select: none;
			}
			.gui { display: flex }
			.gui, .hud {
				inset: 0;
				position: absolute;
			}
			.hud { pointer-events: none }
		`);
		return sheet;
	})();

	constructor() {
		super();

		const shadow = this.attachShadow({ mode: 'open' });

		const hud = document.createElement('div');
		hud.classList.add('hud', 'gui');

		const slot = document.createElement('slot');
		slot.addEventListener('slotchange', () => {
			if (!this.querySelector('[part="main"]') || this.canvas) return;
			this.init();
		}, { passive: true });

		shadow.append(slot, hud);
		shadow.adoptedStyleSheets.push(GameInstance.styleSheet);

		Object.defineProperties(this, {
			_resizeFrame: { value: null, writable: true },
			canvas: { value: null, writable: true },
			gameInstance: { value: null, writable: true },
			hud: { value: hud, writable: true },
			resizeObserver: { value: null, writable: true }
		});
	}

	async init() {
		this.canvas = this.querySelector('[part="main"]');
		if (!this.canvas) return;

		this.resizeObserver = new ResizeObserver(this.resize.bind(this));
		this.resizeObserver.observe(this);

		const Game = await GameInstance.loadGame();
		const instance = new Game(this.canvas);
		instance.setContainer(this);
		this.gameInstance = instance;

		this.dispatchEvent(new CustomEvent('ready', { detail: instance }));

		if (this.autoLoad && this.trackSrc)
			this.loadTrackFromSrc(this.trackSrc);
	}

	connectedCallback() {
		if (this.querySelector('[part="main"]')) {
			this.init();
		}
	}

	disconnectedCallback() {
		this.gameInstance?.destroy();
		this.resizeObserver?.disconnect();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		switch (name) {
		case 'track-src':
			if (typeof newValue === 'string' && this.autoLoad && this.gameInstance)
				this.loadTrackFromSrc(newValue);
			break;
		case 'write':
			this.gameInstance?.scene.toolHandler.setTool(newValue ? 'line' : 'camera');
		}
	}

	resize() {
		cancelAnimationFrame(this._resizeFrame);
		this._resizeFrame = requestAnimationFrame(() => {
			const dpr = window.devicePixelRatio;
			const rect = this.getBoundingClientRect();
			if (!this.canvas) return;
			this.canvas.width = rect.width * dpr;
			this.canvas.height = rect.height * dpr;
			this.canvas.style.width = `${rect.width}px`;
			this.canvas.style.height = `${rect.height}px`;
			this.gameInstance?.configCanvas?.();
		});
	}

	loadTrack(code, options = {}) {
		this.gameInstance.init({ code, write: this.write, ...options });
		this.dispatchEvent(new CustomEvent('trackLoad', { detail: code }));
	}

	async loadTrackFromSrc(src) {
		try {
			const code = await fetch(src).then(r => {
				if (!r.ok) throw new Error(`Failed to fetch ${src}: ${r.status}`);
				return r.text();
			});
			this.loadTrack(code);
		} catch (err) {
			console.error('[bhr-instance] Load error:', err);
			this.dispatchEvent(new CustomEvent('error', { detail: { src, error: err }}));
		}
	}

	get autoLoad() { return this.hasAttribute('auto-load') }
	set autoLoad(v) { this.toggleAttribute('auto-load', !!v) }

	get replaying() { return this.hasAttribute('replaying') }
	set replaying(v) { this.toggleAttribute('replaying', !!v) }

	get showControls() { return this.hasAttribute('show-controls') }
	set showControls(v) { this.toggleAttribute('show-controls', !!v) }

	get write() { return this.hasAttribute('write') }
	set write(v) { this.toggleAttribute('write', !!v) }

	get trackId() { return this.getAttribute('track-id') }
	set trackId(v) { this.setAttribute('track-id', v) }

	get trackSrc() { return this.getAttribute('track-src') }
	set trackSrc(v) {
		if (typeof v !== 'string') this.removeAttribute('track-src');
		else this.setAttribute('track-src', v);
	}

	static Game = null;
	static async loadGame() {
		if (this.Game) return this.Game;
		const { default: Game } = await import("../../../class/Game.js");
		this.Game = Game;
		return Game;
	}
}

customElements.define('bhr-instance', GameInstance);
Object.defineProperty(window, 'BHRInstance', { value: GameInstance, writable: true });