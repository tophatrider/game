import Vector from "../geometry/Vector.js";

export default class Body extends Vector {
	old = new Vector;
	constructor() {
		super(...arguments);
		this.old.set(this);
	}

	set() {
		this.old.set(this);
		return super.set(...arguments);
	}

	add() {
		this.old.set(this);
		return super.add(...arguments);
	}

	sub() {
		this.old.set(this);
		return super.sub(...arguments);
	}

	scaleSelf() {
		this.old.set(this);
		return super.scaleSelf(...arguments);
	}

	lerpTo() {
		this.old.set(this);
		return super.lerpTo(...arguments);
	}
}