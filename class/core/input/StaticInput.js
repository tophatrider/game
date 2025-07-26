import EventRelay from "../EventRelay.js";
import { KEYMAP } from "../constants.js";

export default class StaticInput extends EventRelay {
	downKeys = new Set();
	keymap = KEYMAP;
	_maskKey(key) {
		const keys = Object.entries(this.keymap)
			, mask = keys.find(([, keys]) => keys.includes(key.toLowerCase()))?.[0];
		return mask ?? null
	}

	_setKey(key, down = true) {
		if (down) this.downKeys.add(key);
		else this.downKeys.delete(key);
	}

	_toggle(key, force = null) {
		if (typeof force == 'boolean') this._setKey(key, force);
		else this.downKeys.delete(key) || this.downKeys.add(key);
	}

	setKeymap(keymap) {
		this.keymap = keymap;
	}

	isDown(key) {
		return this.downKeys.has(key);
	}
}