import StaticInput from "./StaticInput.js";

export default class KeyboardHandler extends StaticInput {
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
		super.listen(window, 'blur', this._handleBlur.bind(this));
		super.listen(window, 'keydown', this._handleKeydown.bind(this));
		super.listen(window, 'keyup', this._handleKeyup.bind(this));
		super.listen();
		console.debug('[KeyboardHandler] Listeners bound');
	}

	dispose() {
		this.unlisten();
	}
}