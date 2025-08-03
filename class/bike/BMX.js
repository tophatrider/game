import Bike from "./Bike.js";
import Vector from "../core/geometry/Vector.js";

export default class BMX extends Bike {
	constructor() {
		super(...arguments);

		this.hitbox.size = 14;
		this.frontWheel.size = 11.7;
		this.rearWheel.size = 11.7;

		this.hitbox.real.set(new Vector(0, -1));
		this.hitbox.pos = this.hitbox.real;
		this.hitbox.old = this.hitbox.real.clone();
		this.rearWheel.real = new Vector(-21, 38);
		this.rearWheel.pos = this.rearWheel.real;
		this.rearWheel.old = this.rearWheel.real.clone();
		this.frontWheel.real = new Vector(21, 38);
		this.frontWheel.pos = this.frontWheel.real;
		this.frontWheel.old = this.frontWheel.real.clone();

		this.rearSpring.lrest = 45;
		this.rearSpring.leff = 45;
		this.rearSpring.springConstant = .35;
		this.rearSpring.dampConstant = .3;

		this.chasse.lrest = 42;
		this.chasse.leff = 42;
		this.chasse.springConstant = .35;
		this.chasse.dampConstant = .3;

		this.frontSpring.lrest = 45;
		this.frontSpring.leff = 45;
		this.frontSpring.springConstant = .35;
		this.frontSpring.dampConstant = .3;

		this.rotationFactor = 6;
	}

	get rider() {
		const rider = {};

		let t = this.frontWheel.pos.diff(this.rearWheel.pos);
		let e = new Vector(t.y, -t.x).scale(this.dir);
		let s = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(6);

		let r = this.hitbox.pos.diff(this.rearWheel.pos).diff(t.scale(0.5));
		let a = this.rearWheel.pos.sum(t.scale(0.3)).sum(e.scale(0.25));

		rider.head = a.sum(t.scale(0.15)).sum(r.scale(1.05));
		// rider.head = this.hitbox.pos.diff(t.scale(0.05)).sum(e.scale(0.3));
		rider.sternum /* .head */ = a.sum(t.scale(0.05)).sum(r.scale(0.88));
		rider.hand = this.rearWheel.pos.sum(t.scale(0.8)).sum(e.scale(0.68));
		rider.shadowHand = rider.hand.clone();

		let i = rider.sternum.diff(rider.hand);
		i = new Vector(i.y, -i.x).scale(this.dir);

		rider.elbow = i.scale(130 / i.lengthSquared()).sum(rider.sternum.diff(rider.hand).scale(.4)).sum(rider.hand);
		rider.shadowElbow = rider.elbow.clone();
		rider.hip = a.diff(t.scale(0.1)).sum(r.scale(0.3));
		rider.foot = this.rearWheel.pos.sum(t.scale(0.4)).sum(e.scale(0.05)).sum(s);

		i = rider.hip.diff(rider.foot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.knee = rider.hip.sum(rider.foot).scale(0.5).sum(i.scale(200 / i.lengthSquared()));
		rider.shadowFoot = this.rearWheel.pos.sum(t.scale(0.4)).sum(e.scale(0.05)).diff(s);

		i = rider.hip.diff(rider.shadowFoot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.shadowKnee = rider.hip.sum(rider.shadowFoot).scale(0.5).sum(i.scale(200 / i.lengthSquared()));
		return rider;
	}

	draw(ctx) {
		ctx.save();
		this.player.ghost && (ctx.globalAlpha /= 2,
		this.player.scene.camera.controller.focalPoint && this.player.scene.camera.controller.focalPoint !== this.hitbox && (ctx.globalAlpha *= Math.min(1, Math.max(0.5, this.hitbox.pos.distanceTo(this.player.scene.camera.controller.target) / (this.hitbox.size / 2) ** 2))));
		ctx.lineWidth = 3.5 * this.player.scene.camera.zoom;
		this.rearWheel.draw(ctx);
		this.frontWheel.draw(ctx);

		let rearWheel = this.rearWheel.pos.toPixel();
		let frontWheel = this.frontWheel.pos.toPixel();
		let l = frontWheel.diff(rearWheel);
		let i = new Vector(frontWheel.y - rearWheel.y, rearWheel.x - frontWheel.x).scale(this.dir);
		let a = rearWheel.sum(l.scale(0.3)).sum(i.scale(0.25));
		let n = rearWheel.sum(l.scale(0.84)).sum(i.scale(0.42));
		let c = rearWheel.sum(l.scale(0.84)).sum(i.scale(0.37));
		let w = rearWheel.sum(l.scale(0.4)).sum(i.scale(0.05));

		ctx.lineWidth = this.player.scene.camera.zoom * 3;
		ctx.beginPath()
		ctx.moveTo(rearWheel.x, rearWheel.y)
		ctx.lineTo(a.x, a.y)
		ctx.lineTo(n.x, n.y)
		ctx.moveTo(c.x, c.y)
		ctx.lineTo(w.x, w.y)
		ctx.lineTo(rearWheel.x, rearWheel.y);

		c = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(this.player.scene.camera.zoom * 6);
		let foot = w.sum(c);
		let shadowFoot = w.diff(c);

		let C = rearWheel.sum(l.scale(0.17)).sum(i.scale(0.38));
		let X = rearWheel.sum(l.scale(0.3)).sum(i.scale(0.45));
		let T = rearWheel.sum(l.scale(0.25)).sum(i.scale(0.4));

		ctx.moveTo(foot.x, foot.y);
		ctx.lineTo(shadowFoot.x, shadowFoot.y);
		ctx.moveTo(C.x, C.y);
		ctx.lineTo(X.x, X.y);
		ctx.moveTo(w.x, w.y);
		ctx.lineTo(T.x, T.y);

		C = rearWheel.sum(l.scale(0.97));
		X = rearWheel.sum(l.scale(0.8)).sum(i.scale(0.48));
		T = rearWheel.sum(l.scale(0.86)).sum(i.scale(0.5));
		let Y = rearWheel.sum(l.scale(0.82)).sum(i.scale(0.65));
		let hand = rearWheel.sum(l.scale(0.78)).sum(i.scale(0.67));

		ctx.moveTo(rearWheel.x + l.x, rearWheel.y + l.y),
		ctx.lineTo(C.x, C.y)
		ctx.lineTo(X.x, X.y)
		ctx.lineTo(T.x, T.y)
		ctx.lineTo(Y.x, Y.y)
		ctx.lineTo(hand.x, hand.y)
		ctx.stroke();

		if (!this.player.dead) {
			i = this.hitbox.pos.toPixel().diff(rearWheel).diff(l.scale(0.5));
			ctx.beginPath();
			switch (this.player.cosmetics.head) {
			case 'cap':
				ctx.moveTo(...Object.values(a.sum(l.scale(0.4)).sum(i.scale(1.1))));
				ctx.lineTo(...Object.values(a.sum(l.scale(0.05)).sum(i.scale(1.05))));
			case 'hat':
				let head = a.sum(l.scale(0.35)).sum(i.scale(1.15));
				let h = a.diff(l.scale(0.05)).sum(i.scale(1.1));
				ctx.moveTo(head.x, head.y),
				ctx.lineTo(...Object.values(a.sum(l.scale(0.25)).sum(i.scale(1.13)))),
				ctx.lineTo(...Object.values(head.diff(l.scale(0.1)).sum(i.scale(0.2)))),
				ctx.lineTo(...Object.values(h.sum(l.scale(0.02)).sum(i.scale(0.2)))),
				ctx.lineTo(...Object.values(a.sum(l.scale(0.05)).sum(i.scale(1.11)))),
				ctx.lineTo(h.x, h.y);
				const fillStyle = ctx.fillStyle;
				ctx.fillStyle = this.player.scene.game.colorScheme.palette.track;
				ctx.fill();
				ctx.fillStyle = fillStyle;
			}

			ctx.lineWidth = this.player.scene.camera.zoom * 2;
			ctx.stroke();
		}

		ctx.restore();
	}
}