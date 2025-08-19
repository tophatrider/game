import Spring from "../../core/physics/Spring.js";
import Mass from "../../core/entities/Mass.js";

export default class {
	points = [
		this.head = new Mass(this),
		this.hip = new Mass(this),
		this.elbow = new Mass(this),
		this.shadowElbow = new Mass(this),
		this.hand = new Mass(this),
		this.shadowHand = new Mass(this),
		this.knee = new Mass(this),
		this.shadowKnee = new Mass(this),
		this.foot = new Mass(this),
		this.shadowFoot = new Mass(this)
	]

	joints = [
		new Spring(this.head, this.hip),
		new Spring(this.head, this.elbow),
		new Spring(this.elbow, this.hand),
		new Spring(this.head, this.shadowElbow),
		new Spring(this.shadowElbow, this.shadowHand),
		new Spring(this.hip, this.knee),
		new Spring(this.knee, this.foot),
		new Spring(this.hip, this.shadowKnee),
		new Spring(this.shadowKnee, this.shadowFoot)
	]

	constructor(parent, stickman) {
		Object.defineProperty(this, 'player', { value: parent, writable: true });
		for (const point of this.points) {
			point.size = 3;
			point.friction = .05;
		}

		this.head.size = 5;
		this.hip.size = 6;
		// this.reset();
		for (const joint of this.joints) {
			joint.springConstant = .4;
			joint.dampConstant = .7;
		}

		this.setPosition(stickman);
	}

	draw(ctx) {
		const camera = this.player.scene.camera
			, head = camera.toScreen(this.head.pos)
			, elbow = camera.toScreen(this.elbow.pos)
			, hand = camera.toScreen(this.hand.pos)
			, shadowElbow = camera.toScreen(this.shadowElbow.pos)
			, shadowHand = camera.toScreen(this.shadowHand.pos)
			, knee = camera.toScreen(this.knee.pos)
			, foot = camera.toScreen(this.foot.pos)
			, shadowKnee = camera.toScreen(this.shadowKnee.pos)
			, shadowFoot = camera.toScreen(this.shadowFoot.pos)
			, hip = camera.toScreen(this.hip.pos)
			, sternum = head.clone().sub(hand.clone().sub(hip).scale(.08)).sub(head.clone().sub(hip).scale(.2));

		this.player.ghost && (ctx.globalAlpha /= 2,
		this.player.scene.camera.controller.focalPoint && this.player.scene.camera.controller.focalPoint !== this.player.hitbox && (ctx.globalAlpha *= Math.min(1, Math.max(0.5, this.player.hitbox.pos.distanceTo(this.player.scene.camera.controller.target) / (this.player.hitbox.size / 2) ** 2))));
		ctx.lineWidth = 6 * this.player.scene.camera.zoom;

		ctx.beginPath()
		this.player.dead && (ctx.moveTo(sternum.x, sternum.y),
		ctx.lineTo(shadowElbow.x, shadowElbow.y),
		ctx.lineTo(shadowHand.x, shadowHand.y))
		ctx.moveTo(hip.x, hip.y)
		ctx.lineTo(shadowKnee.x, shadowKnee.y)
		ctx.lineTo(shadowFoot.x, shadowFoot.y)
		ctx.save();
		ctx.strokeStyle = this.player.scene.game.colorScheme.palette.track + '80';
		ctx.stroke();
		ctx.restore();

		ctx.beginPath()
		ctx.moveTo(sternum.x, sternum.y)
		ctx.lineTo(elbow.x, elbow.y)
		ctx.lineTo(hand.x, hand.y)
		ctx.moveTo(hip.x, hip.y)
		ctx.lineTo(knee.x, knee.y)
		ctx.lineTo(foot.x, foot.y)
		ctx.stroke();

		ctx.lineWidth = 8 * this.player.scene.camera.zoom;

		ctx.beginPath()
		ctx.moveTo(hip.x, hip.y)
		ctx.lineTo(sternum.x, sternum.y)
		ctx.stroke();

		ctx.beginPath()
		ctx.lineWidth = 2 * this.player.scene.camera.zoom;
		ctx.arc(head.x, head.y, this.head.size * this.player.scene.camera.zoom, 0, 2 * Math.PI),
		ctx.stroke()

		ctx.globalAlpha = 1;
	}

	fixedUpdate() {
		for (const joint of this.joints)
			joint.fixedUpdate();
		for (const point of this.points)
			point.fixedUpdate();
	}

	update() {
		for (const point of this.points)
			point.update(...arguments);
	}

	setPosition(stickman) {
		for (const part in stickman) {
			if (part in this) {
				this[part].setPosition(stickman[part]);
			}
		}
	}

	setVelocity(a, b) {
		a.scale(.5);
		b.scale(.5);
		for (const joint of this.joints) {
			const len = Math.min(20, joint.length);
			joint.lrest = len;
			joint.leff = len;
		}

		for (let c = 1; c < 5; c++) {
			this.joints[c].lrest = 13;
			this.joints[c].leff = 13;
		}

		let upper = [this.head, this.elbow, this.shadowElbow, this.hand, this.shadowHand];
		let lower = [this.hip, this.knee, this.shadowKnee, this.foot, this.shadowFoot];
		for (const point of upper)
			point.old.set(point.real.clone().sub(a));
		for (const point of lower)
			point.old.set(point.real.clone().sub(b));
		for (const point of this.points) {
			point.velocity.set(point.real.clone().sub(point.old));
			point.velocity.x += Math.random() - Math.random();
			point.velocity.y += Math.random() - Math.random();
		}
	}

	clone() {
		const stickman = {};
		for (const part in this) {
			if (part instanceof Mass) {
				stickman[part] = this[part].real.clone();
			}
		}

		return new this.constructor(this.player, stickman);
	}

	kill() {
		this.head.drive = Mass.prototype.drive;
		this.hip.drive = Mass.prototype.drive;
	}

	reset() {
		const drive = this.player.crash.bind(this.player);
		this.head.drive = drive;
		this.hip.drive = drive;
	}

	*[Symbol.iterator]() {
		for (const point of this.points)
			yield point;
	}
}