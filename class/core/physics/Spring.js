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
		return this.b.real.clone().sub(this.a.real);
	}

	get length() {
		return this.vector.length;
	}

	lean(rotation) {
		this.leff += (this.lrest - rotation - this.leff) / 5;
	}

	rotate(a) {
		let b = this.b.real.clone().sub(this.a.real);
		b.set(-b.y / this.leff, b.x / this.leff);
		this.a.real.add(b.clone().scale(a));
		this.b.real.add(b.scale(-a));
	}

	swap() {
		let a = this.a.real.clone();
		this.a.setPosition(this.b.real);
		this.b.setPosition(a);
		a.set(this.a.velocity);
		this.a.velocity.set(this.b.velocity);
		this.b.velocity.set(a);
		a = this.a.rotationSpeed;
		this.a.rotationSpeed = this.b.rotationSpeed;
		this.b.rotationSpeed = a
	}

	fixedUpdate() {
		let distance = this.b.real.clone().sub(this.a.real);
		let length = distance.length;
		if (length < 1) return;
		distance.scale(1 / length);
		let force = distance.clone().scale((length - this.leff) * this.springConstant);
		force.add(distance.scale(this.b.velocity.clone().sub(this.a.velocity).dot(distance) * this.dampConstant));
		this.b.velocity.add(force.clone().scale(-1));
		this.a.velocity.add(force);
	}
}