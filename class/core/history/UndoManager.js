export default class UndoManager {
	#stack = [];
	#pointer = -1;
	limit = 100;
	get length() {
		return this.#stack.length;
	}

	record(undo, redo) {
		this.#stack.length = Math.min(this.#stack.length, this.#pointer + 1);
		this.#pointer = this.#stack.push({ undo, redo }) - 1;
		if (this.#stack.length > this.limit) {
			this.#stack.shift();
			this.#pointer--;
		}
	}

	undo() {
		if (this.#pointer >= 0) {
			const { undo } = Object.assign({}, this.#stack[this.#pointer--]);
			typeof undo == 'function' && undo(this);
		}
	}

	redo() {
		if (this.#pointer < this.#stack.length - 1) {
			const { redo } = Object.assign({}, this.#stack[++this.#pointer]);
			typeof redo == 'function' && redo(this);
		}
	}

	current() {
		if (this.#pointer < 0 || this.#pointer >= this.#stack.length) return null;
		return { ...this.#stack[this.#pointer] };
	}
}