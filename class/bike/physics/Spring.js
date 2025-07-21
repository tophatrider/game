import Vector from "../../Vector.js";

export default class Spring {
	dampConstant = .5;
	leff = 40;
	lrest = 40;
	springConstant = .7;
	constructor(a, b) {
		this.a = a;
		this.b = b;
	}

	get vector() {
		return this.b.real.difference(this.a.real);
	}

	get length() {
		return this.vector.length;
	}

	lean(rotation) {
		this.leff += (this.lrest - rotation - this.leff) / 5;
	}

	rotate(a) {
		let b = this.b.real.difference(this.a.real);
		b = new Vector(-b.y / this.leff, b.x / this.leff);
		this.a.real.add(b.scale(a));
		this.b.real.add(b.scale(-a));
	}

	swap() {
		let a = this.a.pos.clone();
		this.a.pos = this.b.pos.clone();
		this.b.pos = a.clone();
		a.set(this.a.real);
		this.a.real.set(this.b.real);
		this.b.real.set(a);
		a.set(this.a.old);
		this.a.old.set(this.b.old);
		this.b.old.set(a);
		a.set(this.a.velocity);
		this.a.velocity.set(this.b.velocity);
		this.b.velocity.set(a);
		a = this.a.rotationSpeed;
		this.a.rotationSpeed = this.b.rotationSpeed;
		this.b.rotationSpeed = a
	}

	fixedUpdate() {
		let distance = this.b.real.difference(this.a.real);
		let length = distance.length;
		if (length < 1) return;
		distance = distance.scale(1 / length);
		let force = distance.scale((length - this.leff) * this.springConstant);
		force.add(distance.scale(this.b.velocity.difference(this.a.velocity).dot(distance) * this.dampConstant));
		this.b.velocity.add(force.scale(-1));
		this.a.velocity.add(force);
	}
}