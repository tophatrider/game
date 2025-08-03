import EventEmitter from "../EventEmitter.js";
import { PALETTES } from "../constants.js";

export default class ColorScheme extends EventEmitter {
	static AutoModes = {
		OFF: 'off',
		SYSTEM: 'system',
		SOLAR: 'solar'
	};

	#autoMode = this.constructor.AutoModes.SYSTEM;
	#media = matchMedia('(prefers-color-scheme: dark)');
	#registry = new Map(Object.entries(PALETTES));
	#solarTimer = null;

	get auto() { return this.#autoMode !== 'off' }
	get autoMode() { return this.#autoMode }
	set autoMode(mode) {
		this.auto && this.stop();
		this.#autoMode = mode;
		this.auto && (this.#applyAutoScheme(),
		this.start());
	}

	scheme = null;
	palette = null;
	constructor({ sunrise = 6, sunset = 18, scheme } = {}) {
		super();
		this.sunrise = sunrise;
		this.sunset = sunset;
		this.set(scheme || this.constructor.AutoModes.SYSTEM);
	}

	#applySystemScheme = ({ matches }) => {
		if (!this.auto) return;
		const theme = matches ? 'dark' : 'light';
		this._applyScheme(theme);
	};

	#scheduleNextSolarCheck() {
		clearTimeout(this.#solarTimer);

		const now = new Date();
		const currentHour = now.getHours();

		// Next transition point
		let nextTransition = new Date(now);
		if (currentHour < this.sunrise) {
			nextTransition.setHours(this.sunrise, 0, 0, 0);
		} else if (currentHour < this.sunset) {
			nextTransition.setHours(this.sunset, 0, 0, 0);
		} else {
			nextTransition.setDate(nextTransition.getDate() + 1);
			nextTransition.setHours(this.sunrise, 0, 0, 0);
		}

		const delay = nextTransition - now;
		this.#solarTimer = setTimeout(() => {
			if (this.#autoMode !== this.constructor.AutoModes.SOLAR) return;
			const hour = new Date().getHours();
			const scheme = (hour >= this.sunrise && hour < this.sunset) ? 'light' : 'dark';
			this._applyScheme(scheme);
			this.#scheduleNextSolarCheck();
		}, delay);
	}

	#applyAutoScheme() {
		if (!this.auto) return;
		if (this.#autoMode === this.constructor.AutoModes.SYSTEM) {
			this.#applySystemScheme(this.#media);
		} else if (this.#autoMode === this.constructor.AutoModes.SOLAR) {
			this._applyScheme(this._getSunBasedTheme());
		}
	}

	_applyScheme(theme) {
		if (this.scheme === theme) return;
		this.scheme = theme;
		this.palette = this.#resolvePalette(theme);
		this.emit('preferenceChange', theme);
		this.emit('paletteChange', this.palette);
	}

	#resolvePalette(theme) {
		return this.#registry.get(theme) ?? this.#registry.get('dark');
	}

	set(theme) {
		if ([this.constructor.AutoModes.SYSTEM, this.constructor.AutoModes.SOLAR].includes(theme)) {
			this.setAuto(theme);
		} else {
			this.autoMode = 'off';
			this._applyScheme(theme);
		}
	}

	setAuto(mode) {
		this.autoMode = mode;
	}

	register(name, palette) {
		this.#registry.set(name, Object.freeze(palette));
	}

	registeredSchemes() {
		return [...this.#registry.keys()];
	}

	getPalette(name) {
		return this.#registry.get(name) ?? null;
	}

	start() {
		if (!this.auto) return;
		if (this.#autoMode === this.constructor.AutoModes.SYSTEM) this.#media.addEventListener('change', this.#applySystemScheme, { passive: true });
		else if (this.#autoMode === this.constructor.AutoModes.SOLAR) this.#scheduleNextSolarCheck();
	}

	stop() {
		if (!this.auto) return;
		if (this.#autoMode === this.constructor.AutoModes.SYSTEM) this.#media.removeEventListener('change', this.#applySystemScheme);
		else if (this.#autoMode === this.constructor.AutoModes.SOLAR) {
			clearTimeout(this.#solarTimer);
			this.#solarTimer = null;
		}
	}

	destroy() {
		this.stop();
		this.removeAllListeners();
	}
}