import StaticVector from "./StaticVector.js";
import Vector from "./Vector.js";

export default class SmartVector extends Vector {
	real = new StaticVector;
	constructor() {
		super(...arguments);
		this.real = StaticVector.from(this);
		super.scaleSelf(window.devicePixelRatio);
	}

	#sync() {
		return super.set(this.real.scale(window.devicePixelRatio));
	}

	set() {
		this.real = StaticVector.from(...arguments);
		return this.#sync();
	}

	add() {
		this.real = this.real.add(...arguments);
		return this.#sync();
	}

	sub() {
		this.real = this.real.sub(...arguments);
		return this.#sync();
	}

	scaleSelf() {
		this.real = this.real.scale(...arguments);
		return this.#sync();
	}
}