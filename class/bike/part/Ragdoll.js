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
			point.friction = 0.05;
		}

		this.head.size = this.hip.size = 8;
		for (const joint of this.joints) {
			joint.springConstant = 0.4;
			joint.dampConstant = 0.7;
		}

		this.setPosition(stickman);
	}

	draw(ctx) {
		const head = this.head.pos.toPixel()
		// 	, sternum = this.sternum.pos.toPixel()
			, elbow = this.elbow.pos.toPixel()
			, hand = this.hand.pos.toPixel()
			, shadowElbow = this.shadowElbow.pos.toPixel()
			, shadowHand = this.shadowHand.pos.toPixel()
			, knee = this.knee.pos.toPixel()
			, foot = this.foot.pos.toPixel()
			, shadowKnee = this.shadowKnee.pos.toPixel()
			, shadowFoot = this.shadowFoot.pos.toPixel()
			, hip = this.hip.pos.toPixel()
			, sternum = head.diff(hand.diff(hip).scale(0.08)).diff(head.diff(hip).scale(0.2));

		// ctx.save();
		this.player.ghost && (ctx.globalAlpha /= 2,
		this.player.scene.cameraFocus && this.player.scene.cameraFocus !== this.player.vehicle.hitbox && (ctx.globalAlpha *= Math.min(1, Math.max(0.5, this.player.vehicle.hitbox.pos.distanceTo(this.player.scene.cameraFocus.pos) / (this.player.vehicle.hitbox.size / 2) ** 2))));
		ctx.lineWidth = 6 * this.player.scene.zoom;

		ctx.beginPath()
		this.player.dead && (ctx.moveTo(sternum.x, sternum.y),
		ctx.lineTo(shadowElbow.x, shadowElbow.y),
		ctx.lineTo(shadowHand.x, shadowHand.y))
		ctx.moveTo(hip.x, hip.y)
		ctx.lineTo(shadowKnee.x, shadowKnee.y)
		ctx.lineTo(shadowFoot.x, shadowFoot.y)
		ctx.save();
		ctx.strokeStyle = /^dark$/i.test(this.player.scene.parent.settings.theme) ? '#fbfbfb80' : /^midnight$/i.test(this.player.scene.parent.settings.theme) ? '#cccccc80' : 'rgba(0,0,0,0.5)';
		ctx.stroke();
		ctx.restore();

		ctx.beginPath()
		// ctx.moveTo(head.x, head.y)
		ctx.moveTo(sternum.x, sternum.y)
		ctx.lineTo(elbow.x, elbow.y)
		ctx.lineTo(hand.x, hand.y)
		ctx.moveTo(hip.x, hip.y)
		ctx.lineTo(knee.x, knee.y)
		ctx.lineTo(foot.x, foot.y)
		ctx.stroke();

		ctx.lineWidth = 8 * this.player.scene.zoom;

		ctx.beginPath()
		ctx.moveTo(hip.x, hip.y)
		ctx.lineTo(sternum.x, sternum.y)
		ctx.stroke();

		ctx.beginPath()
		ctx.lineWidth = 2 * this.player.scene.zoom;
		// this.head.size * (this.player.scene.zoom / 2.8)
		ctx.arc(head.x, head.y, 5 * this.player.scene.zoom, 0, 2 * Math.PI),
		ctx.stroke()

		ctx.globalAlpha = 1;
		// ctx.restore();
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
				this[part].real.set(stickman[part]);
				this[part].pos.set(this[part].real);
			}
		}
	}

	setVelocity(a, b) {
		a.scaleSelf(0.5);
		b.scaleSelf(0.5);
		for (const joint of this.joints) {
			let len = joint.length;
			len > 20 && (len = 20);
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
			point.old.set(point.real.diff(a));
		for (const point of lower)
			point.old.set(point.real.diff(b));
		for (const point of this.points) {
			point.velocity.set(point.real.diff(point.old));
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
}