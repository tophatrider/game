import Vector2 from "../geometry/Vector2.js";
import TemporalVector from "../geometry/TemporalVector.js";

export default class {
	real = new Vector2; // new TemporalVector;
	size = 10;
	velocity = new Vector2;

	#displayPosition = this.real;
	get pos() { return this.#displayPosition }

	#lastFixedPos = new TemporalVector;
	get old() { return this.#lastFixedPos }

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

		this.#lastFixedPos.set(this.real);
		this.#lastFixedPos.old.set(this.real);
	}

	fixedUpdate() {
		this.old.set(this.real);
		this.#displayPosition = this.real;
	}

	update(delta) {
		this.#displayPosition = this.#lastFixedPos.old.lerp(this.real, delta);
	}

	setPosition() {
		this.real.set(...arguments);
		this.#lastFixedPos.set(this.real);
		this.#lastFixedPos.old.set(this.real);
	}
}