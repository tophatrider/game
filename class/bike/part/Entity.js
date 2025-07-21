import Vector from "../../Vector.js";

export default class {
	real = new Vector;
	old = this.real.clone();
	size = 10;
	velocity = new Vector;
	pos = this.real;
	lastFixedPos = Object.assign(new Vector, {
		recorded: true,
		rendered:  false
	});
	constructor(parent, options) {
		Object.defineProperty(this, 'parent', { value: parent, writable: true });
		for (const key in options = Object.assign({}, options)) {
			const option = options[key];
			switch (key) {
			case 'real':
			case 'velocity':
				typeof option == 'object' && this[key].set(option);
				break;
			case 'size':
				if (typeof option == 'number' || typeof option == 'string') {
					this[key] = option;
				}
			}
		}

		this.old.set(this.real);
		// Object.defineProperty(this.real, 'old', { value: this.real.clone(), writable: true });
	}

	fixedUpdate() {
		this.pos = this.real;
	}

	lastTime = -1;
	update(delta) {
		if (this.lastFixedPos.rendered) return;
		if (delta < this.lastTime) {
			this.lastFixedPos.set(this.real);
			this.lastFixedPos.rendered = true;
			this.lastTime = 0;
			return;
		}

		this.pos = this.lastFixedPos.lerp(this.real, delta);
		this.lastTime = delta
	}

	lateUpdate() {
		this.lastFixedPos.recorded || (// this.lastFixedPos.equ(this.pos),
		this.lastFixedPos.recorded = true)
	}
}