// import Vector from "../core/geometry/Vector.js";
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

		this.player.hitbox.size = 14;

		this.rearWheel = new Wheel(this);
		this.frontWheel = new Wheel(this);

		this.rearSpring = new Spring(parent.hitbox, this.rearWheel);
		this.chasse = new Spring(this.rearWheel, this.frontWheel);
		this.frontSpring = new Spring(this.frontWheel, parent.hitbox);

		this.rearSpring.dampConstant = .3;
		this.chasse.dampConstant = .3;
		this.frontSpring.dampConstant = .3;
		this.frontSpring.leff = 45;
		this.frontSpring.lrest = 45;

		this.points.push(parent.hitbox, this.frontWheel, this.rearWheel);
		this.joints.push(this.rearSpring, this.chasse, this.frontSpring);

		this.reset(1);

		Object.defineProperty(this, 'name', { value: this.constructor.name });
	}

	// get rider() {
	// 	const rider = {};

	// 	let t = this.frontWheel.pos.clone().sub(this.rearWheel.pos);
	// 	let e = new Vector(t.y, -t.x).scale(this.dir);
	// 	let s = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(6);

	// 	rider.head = this.rearWheel.pos.clone().add(t.clone().scale(.35)).add(this.player.hitbox.pos.clone().sub(this.frontWheel.pos.clone().add(this.rearWheel.pos).scale(.5)).scale(1.2));
	// 	rider.hand = this.rearWheel.pos.clone().add(t.clone().scale(.8)).add(e.clone().scale(.68));
	// 	rider.shadowHand = rider.hand.clone();

	// 	let i = rider.head.clone().sub(rider.hand);
	// 	i = new Vector(i.y, -i.x).scale(this.dir);

	// 	rider.elbow = rider.head.clone().add(rider.hand).clone().scale(.5).add(i.clone().scale(130 / i.lengthSquared()));
	// 	rider.shadowElbow = rider.elbow.clone();
	// 	rider.hip = this.rearWheel.pos.clone().add(t.clone().scale(.2).add(e.clone().scale(.5)));
	// 	rider.foot = this.rearWheel.pos.clone().add(t.clone().scale(.4)).add(e.clone().scale(.05)).add(s);

	// 	i = rider.hip.clone().sub(rider.foot);
	// 	i = new Vector(-i.y, i.x).scale(this.dir);

	// 	rider.knee = rider.hip.clone().add(rider.foot).scale(.5).add(i.clone().scale(160 / i.lengthSquared()));
	// 	rider.shadowFoot = this.rearWheel.pos.clone().add(t.scale(.4)).add(e.clone().scale(.05)).sub(s);

	// 	i = rider.hip.clone().sub(rider.shadowFoot);
	// 	i = new Vector(-i.y, i.x).scale(this.dir);

	// 	rider.shadowKnee = rider.hip.clone().add(rider.shadowFoot).scale(.5).add(i.clone().scale(160 / i.lengthSquared()));
	// 	return rider;
	// }

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
			this.player._slowParity = 0;
		}

		if (this.player.slow) {
			this.player._slowParity = 1 - this.player._slowParity;
		}

		if (!this.player.slow || this.player._slowParity === 0) {
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
			progress = (progress + this.player._slowParity) / 2;
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

	draw(ctx) {
		ctx.save();
		this.player.ghost && (ctx.globalAlpha /= 2,
		this.player.scene.camera.controller.focalPoint && this.player.scene.camera.controller.focalPoint !== this.player.hitbox && (ctx.globalAlpha *= Math.min(1, Math.max(.5, this.player.hitbox.pos.distanceTo(this.player.scene.camera.controller.target) / (this.player.hitbox.size / 2) ** 2))));
		ctx.lineWidth = 3.5 * this.player.scene.camera.zoom;
		this.rearWheel.draw(ctx);
		this.frontWheel.draw(ctx);
	}

	move(x, y) {
		for (const point of this.points) {
			point.real.x += x;
			point.real.y += y;
			// point.pos.x += x;
			// point.pos.y += y;
			point.old.x += x;
			point.old.y += y;
		}
	}

	serialize() {
		let offset = 0;

		const totalBytes =
			1 + // dir: Int8
			4 * 2 * 3 * 2 + // 2 wheels: 3 vectors (x,y each Float32)
			4 + // rearWheel.speed: Float32
			4 * 3; // springs leff

		const buffer = new ArrayBuffer(totalBytes)
			, view = new DataView(buffer);

		view.setInt8(offset++, this.dir);

		for (const unit of this.frontWheel.real)
			view.setFloat32(offset, unit, true), offset += 4;
		for (const unit of this.frontWheel.old)
			view.setFloat32(offset, unit, true), offset += 4;
		for (const unit of this.frontWheel.velocity)
			view.setFloat32(offset, unit, true), offset += 4;

		for (const unit of this.rearWheel.real)
			view.setFloat32(offset, unit, true), offset += 4;
		for (const unit of this.rearWheel.old)
			view.setFloat32(offset, unit, true), offset += 4;
		for (const unit of this.rearWheel.velocity)
			view.setFloat32(offset, unit, true), offset += 4;
		view.setFloat32(offset, this.rearWheel.speed, true); offset += 4;

		view.setFloat32(offset, this.rearSpring.leff, true); offset += 4;
		view.setFloat32(offset, this.chasse.leff, true); offset += 4;
		view.setFloat32(offset, this.frontSpring.leff, true); offset += 4;

		return buffer;
	}

	deserialize(buffer) {
		const view = new DataView(buffer);
		let offset = 0;

		this.dir = view.getInt8(offset); offset += 1;

		this.frontWheel.setPosition(
			view.getFloat32(offset, true),
			view.getFloat32(offset + 4, true)
		); offset += 8;
		this.frontWheel.old.set(
			view.getFloat32(offset, true),
			view.getFloat32(offset + 4, true)
		); offset += 8;
		this.frontWheel.velocity.set(
			view.getFloat32(offset, true),
			view.getFloat32(offset + 4, true)
		); offset += 8;

		this.rearWheel.setPosition(
			view.getFloat32(offset, true),
			view.getFloat32(offset + 4, true)
		); offset += 8;
		this.rearWheel.old.set(
			view.getFloat32(offset, true),
			view.getFloat32(offset + 4, true)
		); offset += 8;
		this.rearWheel.velocity.set(
			view.getFloat32(offset, true),
			view.getFloat32(offset + 4, true)
		); offset += 8;
		this.rearWheel.speed = view.getFloat32(offset, true); offset += 4;

		this.rearSpring.leff = view.getFloat32(offset, true); offset += 4;
		this.chasse.leff = view.getFloat32(offset, true); offset += 4;
		this.frontSpring.leff = view.getFloat32(offset, true);
	}

	reset() {
		this.dir !== 1 && this.swap();
		for (const point of this.points)
			point.velocity.set(0, 0);
		this.rearWheel.speed = 0;
		this.frontSpring.leff = 45;
	}
}