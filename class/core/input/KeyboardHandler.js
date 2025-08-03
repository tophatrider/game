import StaticInput from "./StaticInput.js";

export default class KeyboardHandler extends StaticInput {
	_handleBlur() {
		this.downKeys.clear();
	}

	_handleKeydown(event) {
		const key = this._maskKey(event.key);
		if (key === null || this.downKeys.has(key)) return;
		event.preventDefault();
		this.downKeys.add(key);
		this.emit('down', key);
	}

	_handleKeyup(event) {
		const key = this._maskKey(event.key);
		if (key === null) return;
		event.preventDefault();
		this.downKeys.delete(key);
		// Only dispatch if an entry was removed?
		this.emit('up', key);
	}

	listen() {
		'keyboard' in navigator && navigator.keyboard.lock(this.constructor.KeyLockKeymap);
		super.listen(window, 'blur', this._handleBlur.bind(this));
		super.listen(window, 'keydown', this._handleKeydown.bind(this));
		super.listen(window, 'keyup', this._handleKeyup.bind(this));
		super.listen();
		console.debug('[KeyboardHandler] Listeners bound');
	}

	dispose() {
		'keyboard' in navigator && navigator.keyboard.unlock();
		this.unlisten();
		super.dispose();
	}

	static KeyLockKeymap = [
		'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown',
		'KeyW', 'KeyA', 'KeyS', 'KeyD',
		'Space', 'Enter', 'Backspace'
	];
}