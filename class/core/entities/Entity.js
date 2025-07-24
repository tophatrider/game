import Vector from "../math/Vector.js";
import Body from "../physics/Body.js";

export default class {
	real = new Body;
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

	update(delta) {
		this.pos = this.lastFixedPos.lerp(this.real, delta);
	}
}