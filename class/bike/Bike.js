import Vector from "../core/math/Vector.js";
import Mass from "../core/entities/Mass.js";
import Wheel from "./part/Wheel.js";
import Spring from "../core/physics/Spring.js";

export default class {
	dir = 1;
	joints = [];
	pedalSpeed = 0;
	points = [];
	rotationFactor = 0;
	constructor(parent) {
		Object.defineProperty(this, 'player', { value: parent });

		this.hitbox = new Mass(this); // hitbox
		this.hitbox.drive = this.destroy.bind(this);
		this.rearWheel = new Wheel(this);
		this.frontWheel = new Wheel(this);

		this.rearSpring = new Spring(this.hitbox, this.rearWheel);
		this.chasse = new Spring(this.rearWheel, this.frontWheel);
		this.frontSpring = new Spring(this.frontWheel, this.hitbox);

		this.points.push(this.hitbox, this.frontWheel, this.rearWheel);
		this.joints.push(this.rearSpring, this.chasse, this.frontSpring);

		Object.defineProperty(this, 'name', { value: this.constructor.name });
	}

	get rider() {
		const rider = {};

		let t = this.frontWheel.pos.diff(this.rearWheel.pos);
		let e = new Vector(t.y, -t.x).scale(this.dir);
		let s = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(6);

		rider.head = this.rearWheel.pos.sum(t.scale(0.35)).sum(this.hitbox.pos.diff(this.frontWheel.pos.sum(this.rearWheel.pos).scale(0.5)).scale(1.2));
		rider.hand = this.rearWheel.pos.sum(t.scale(0.8)).sum(e.scale(0.68));
		rider.shadowHand = rider.hand.clone();

		let i = rider.head.diff(rider.hand);
		i = new Vector(i.y, -i.x).scale(this.dir);

		rider.elbow = rider.head.sum(rider.hand).scale(0.5).sum(i.scale(130 / i.lengthSquared()));
		rider.shadowElbow = rider.elbow.clone();
		rider.hip = this.rearWheel.pos.sum(t.scale(0.2).sum(e.scale(0.5)));
		rider.foot = this.rearWheel.pos.sum(t.scale(0.4)).sum(e.scale(0.05)).sum(s);

		i = rider.hip.diff(rider.foot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.knee = rider.hip.sum(rider.foot).scale(0.5).sum(i.scale(160 / i.lengthSquared()));
		rider.shadowFoot = this.rearWheel.pos.sum(t.scale(0.4)).sum(e.scale(0.05)).diff(s);

		i = rider.hip.diff(rider.shadowFoot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.shadowKnee = rider.hip.sum(rider.shadowFoot).scale(0.5).sum(i.scale(160 / i.lengthSquared()));
		return rider;
	}

	destroy() {
		this.player.dead = true;
		this.hitbox.tangible = false;
		this.rearWheel.speed = 0;
		this.player.createRagdoll();
	}

	swap() {
		this.dir *= -1;
		this.chasse.swap();
		let rearSpring = this.rearSpring.leff;
		this.rearSpring.leff = this.frontSpring.leff;
		this.frontSpring.leff = rearSpring;
		this.player.ragdoll.setPosition(this.rider);
	}

	fixedUpdate() {
		if (this.player.slow && this.rearWheel.touching && this.frontWheel.touching && !this.player.dead) {
			this.player.slow = false;
			this.player.slowParity = 0;
		}

		if (this.player.slow) {
			this.player.slowParity = 1 - this.player.slowParity;
		}

		if (!this.player.slow || this.player.slowParity === 0) {
			if (!this.player.dead)
				this.updatePhysics();

			for (let a = this.joints.length - 1; a >= 0; a--)
				this.joints[a].fixedUpdate();
			for (let a = this.points.length - 1; a >= 0; a--)
				this.points[a].fixedUpdate();
		}
	}

	update(progress) {
		if (this.player.slow) {
			progress = (progress + this.player.slowParity) / 2;
		}

		for (let a = this.points.length - 1; a >= 0; a--)
			this.points[a].update(progress);
	}

	updatePhysics() {
		this.rearWheel.speed += (this.player.gamepad.downKeys.has('up') - this.rearWheel.speed) / 10;
		let rotate = this.player.gamepad.downKeys.has('left') - this.player.gamepad.downKeys.has('right');
		this.rearSpring.lean(rotate * this.dir * 5);
		this.frontSpring.lean(-rotate * this.dir * 5);
		this.chasse.rotate(rotate / this.rotationFactor);
		if (this.player.gamepad.downKeys.has('up')) {
			this.pedalSpeed += this.rearWheel.rotationSpeed / 5;
			if (!rotate) {
				this.rearSpring.lean(-7);
				this.frontSpring.lean(7);
			}
		}
	}

	move(x, y) {
		for (const point of this.points) {
			point.real.x += x;
			point.real.y += y;
			point.old.x += x;
			point.old.y += y;
		}
	}

	clone() {
		const clone = new this.constructor(this.player);
		clone.dir = this.dir;

		clone.hitbox.real.set(this.hitbox.real);
		clone.hitbox.old.set(this.hitbox.old);
		clone.hitbox.velocity.set(this.hitbox.velocity);

		clone.frontWheel.real.set(this.frontWheel.real);
		clone.frontWheel.old.set(this.frontWheel.old);
		clone.frontWheel.velocity.set(this.frontWheel.velocity);

		clone.rearWheel.real.set(this.rearWheel.real);
		clone.rearWheel.old.set(this.rearWheel.old);
		clone.rearWheel.velocity.set(this.rearWheel.velocity);
		clone.rearWheel.speed = this.rearWheel.speed;

		clone.rearSpring.leff = this.rearSpring.leff;
		clone.chasse.leff = this.chasse.leff;
		clone.frontSpring.leff = this.frontSpring.leff;
		return clone;
	}
}