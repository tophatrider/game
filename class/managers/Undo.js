export default class UndoManager {
	stack = []
	position = 0;
	push(a) {
		this.stack.length = Math.min(this.stack.length, this.position + 1);
		this.position = this.stack.push(a) - 1;
	}

	undo() {
		if (this.position >= 0) {
			const { undo } = Object.assign({}, this.stack[this.position--]);
			typeof undo == 'function' && undo(this);
		}

		return this;
	}

	redo() {
		if (this.position < this.stack.length - 1) {
			const { redo } = Object.assign({}, this.stack[++this.position]);
			typeof redo == 'function' && redo(this);
		}

		return this;
	}
}