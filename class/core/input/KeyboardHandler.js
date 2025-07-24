import StaticInput from "./StaticInput.js";

export default class KeyboardHandler extends StaticInput {
	#handlers = [];
	#bindListeners() {
		if (this.#handlers.length > 0) return;
		this.#handlers.push([window, 'blur', this._handleBlur.bind(this)]);
		this.#handlers.push([window, 'keydown', this._handleKeydown.bind(this)]);
		this.#handlers.push([window, 'keyup', this._handleKeyup.bind(this)]);
		console.debug('[KeyboardHandler] Listeners bound');
	}

	_handleBlur() {
		this.downKeys.clear();
	}

	_handleKeydown(event) {
		event.preventDefault();
		const key = this._maskKey(event.key);
		if (key === null || this.downKeys.has(key)) return;

		this.downKeys.add(key);
		this.emit('down', key);
	}

	_handleKeyup(event) {
		event.preventDefault();
		const key = this._maskKey(event.key);
		if (key === null) return;

		this.downKeys.delete(key);
		// Only dispatch if an entry was removed?
		this.emit('up', key);
	}

	listen() {
		this.#bindListeners();
		for (const [target, ...params] of this.#handlers)
			target.addEventListener(...params);
	}

	unlisten() {
		for (const [target, event, handler] of this.#handlers)
			target.removeEventListener(event, handler);
		this.#handlers.splice(0);
	}

	dispose() {
		this.unlisten();
	}
}