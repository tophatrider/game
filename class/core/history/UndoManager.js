import EventRelay from "../EventRelay.js";

export default class UndoManager extends EventRelay {
	#stack = [];
	#pointer = -1;
	limit = 100;
	get length() {
		return this.#stack.length;
	}

	listen() {
		super.listen(window, 'beforeunload', event => {
			event.preventDefault();
			return event.returnValue = false;
		});
		super.listen();
	}

	record(undo, redo) {
		this.#stack.length = Math.min(this.length, this.#pointer + 1);
		this.#pointer = this.#stack.push({ undo, redo }) - 1;
		if (this.length > this.limit) {
			this.#stack.shift();
			this.#pointer--;
		} else if (this.length === 1) {
			this.listen();
		}
	}

	undo() {
		if (this.#pointer >= 0) {
			const { undo } = Object.assign({}, this.#stack[this.#pointer--]);
			typeof undo == 'function' && undo(this);
			if (this.length < 1 || this.#pointer === -1) {
				this.unlisten();
			}
		}
	}

	redo() {
		if (this.#pointer < this.length - 1) {
			const { redo } = Object.assign({}, this.#stack[++this.#pointer]);
			typeof redo == 'function' && redo(this);
		}
	}

	current() {
		if (this.#pointer < 0 || this.#pointer >= this.length) return null;
		return { ...this.#stack[this.#pointer] };
	}

	clear() {
		this.#stack.splice(0);
		this.unlisten();
	}

	dispose() {
		super.dispose();
		this.clear();
	}
}