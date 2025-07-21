import Bike from "./Bike.js";
import Vector from "../Vector.js";

export default class MTB extends Bike {
	constructor(parent) {
		super(...arguments);

		this.hitbox.size = 14;
		this.frontWheel.size = 14;
		this.rearWheel.size = 14;

		this.hitbox.real = new Vector(2, -3);
		this.hitbox.pos = this.hitbox.real;
		this.hitbox.old = this.hitbox.real.clone();
		this.frontWheel.real = new Vector(23, 35);
		this.frontWheel.pos = this.frontWheel.real;
		this.frontWheel.old = this.frontWheel.real.clone();
		this.rearWheel.real = new Vector(-23, 35);
		this.rearWheel.pos = this.rearWheel.real;
		this.rearWheel.old = this.rearWheel.real.clone();

		this.rearSpring.lrest = 47;
		this.rearSpring.leff = 47;
		this.rearSpring.springConstant = 0.2;
		this.rearSpring.dampConstant = 0.3;

		this.chasse.lrest = 45;
		this.chasse.leff = 45;
		this.chasse.springConstant = 0.2;
		this.chasse.dampConstant = 0.3;

		this.frontSpring.lrest = 45;
		this.frontSpring.leff = 45;
		this.frontSpring.springConstant = 0.2;
		this.frontSpring.dampConstant = 0.3;

		this.rotationFactor = 8;
	}

	get rider() {
		const rider = {};

		let t = this.frontWheel.pos.difference(this.rearWheel.pos);
		let s = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(6);

		let r = this.hitbox.pos.difference(this.rearWheel.pos).difference(t.scale(0.5));
		let b = this.rearWheel.pos.sum(t.scale(0.3)).sum(r.scale(0.25));

		rider.head = b.sum(t.scale(0.2)).sum(r.scale(1.09));
		// rider.head = this.hitbox.pos.difference(t.scale(0.05)).sum(e.scale(0.3));
		rider.sternum /* .head */ = b.sum(t.scale(0.1)).sum(r.scale(0.93));
		rider.hand = this.rearWheel.pos.sum(t.scale(0.67)).sum(r.scale(0.8));
		// rider.hand = this.rearWheel.pos.sum(t.scale(0.8)).sum(r.scale(0.68));
		rider.shadowHand = rider.hand.clone();

		let i = rider.sternum.difference(rider.hand);

		rider.elbow = rider.hand.sum(i.scale(0.3)).sum(new Vector(i.y, -i.x).scale(80 / i.lengthSquared() * this.dir));
		rider.shadowElbow = rider.elbow.clone();
		rider.hip = b.sum(t.scale(-0.05)).sum(r.scale(0.42));
		rider.foot = this.rearWheel.pos.sum(t.scale(0.4)).sum(r.scale(0.05)).sum(s);

		i = rider.hip.difference(rider.foot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.knee = rider.hip.sum(rider.foot).scale(0.5).sum(i.scale(200 / i.lengthSquared()));
		rider.shadowFoot = this.rearWheel.pos.sum(t.scale(0.4)).sum(r.scale(0.05)).difference(s);

		i = rider.hip.difference(rider.shadowFoot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.shadowKnee = rider.hip.sum(rider.shadowFoot).scale(0.5).sum(i.scale(200 / i.lengthSquared()));
		return rider;
	}

	draw(ctx) {
		ctx.save();
		this.parent.ghost && (ctx.globalAlpha /= 2,
		this.parent.scene.cameraFocus && this.parent.scene.cameraFocus !== this.hitbox && (ctx.globalAlpha *= Math.min(1, Math.max(0.5, this.hitbox.pos.distanceTo(this.parent.scene.cameraFocus.pos) / (this.hitbox.size / 2) ** 2))));
		ctx.lineWidth = 3.5 * this.parent.scene.zoom;
		this.rearWheel.draw(ctx);
		this.frontWheel.draw(ctx);

		let rearWheel = this.rearWheel.pos.toPixel();
		let frontWheel = this.frontWheel.pos.toPixel();
		ctx.beginPath()
		ctx.arc(rearWheel.x, rearWheel.y, 5 * this.parent.scene.zoom, 0, 2 * Math.PI)
		ctx.arc(frontWheel.x, frontWheel.y, 4 * this.parent.scene.zoom, 0, 2 * Math.PI)
		ctx.save()
		ctx.fillStyle = 'grey'
		ctx.fill()
		ctx.restore()

		var d = this.hitbox.pos.toPixel();
		var e = frontWheel.difference(rearWheel);
		var f = new Vector(frontWheel.y - rearWheel.y, rearWheel.x - frontWheel.x).scale(this.dir);
		var h = d.difference(rearWheel.sum(e.scale(0.5)));

		ctx.beginPath()
		ctx.moveTo(rearWheel.x, rearWheel.y)
		ctx.lineTo(rearWheel.x + 0.4 * e.x + 0.05 * f.x, rearWheel.y + 0.4 * e.y + 0.05 * f.y)
		ctx.moveTo(rearWheel.x + 0.72 * e.x + 0.64 * h.x, rearWheel.y + 0.72 * e.y + 0.64 * h.y)
		ctx.lineTo(rearWheel.x + 0.46 * e.x + 0.4 * h.x, rearWheel.y + 0.46 * e.y + 0.4 * h.y)
		ctx.lineTo(rearWheel.x + 0.4 * e.x + 0.05 * f.x, rearWheel.y + 0.4 * e.y + 0.05 * f.y)
		ctx.lineWidth = 5 * this.parent.scene.zoom;
		ctx.stroke();

		ctx.beginPath()
		var i = new Vector(6 * Math.cos(this.pedalSpeed) * this.parent.scene.zoom, 6 * Math.sin(this.pedalSpeed) * this.parent.scene.zoom);
		ctx.moveTo(rearWheel.x + 0.72 * e.x + 0.64 * h.x, rearWheel.y + 0.72 * e.y + 0.64 * h.y),
		ctx.lineTo(rearWheel.x + 0.43 * e.x + 0.05 * f.x, rearWheel.y + 0.43 * e.y + 0.05 * f.y),
		ctx.moveTo(rearWheel.x + 0.45 * e.x + 0.3 * h.x, rearWheel.y + 0.45 * e.y + 0.3 * h.y),
		ctx.lineTo(rearWheel.x + 0.3 * e.x + 0.4 * h.x, rearWheel.y + 0.3 * e.y + 0.4 * h.y),
		ctx.lineTo(rearWheel.x + 0.25 * e.x + 0.6 * h.x, rearWheel.y + 0.25 * e.y + 0.6 * h.y),
		ctx.moveTo(rearWheel.x + 0.17 * e.x + 0.6 * h.x, rearWheel.y + 0.17 * e.y + 0.6 * h.y),
		ctx.lineTo(rearWheel.x + 0.3 * e.x + 0.6 * h.x, rearWheel.y + 0.3 * e.y + 0.6 * h.y),
		ctx.moveTo(rearWheel.x + 0.43 * e.x + 0.05 * f.x + i.x, rearWheel.y + 0.43 * e.y + 0.05 * f.y + i.y),
		ctx.lineTo(rearWheel.x + 0.43 * e.x + 0.05 * f.x - i.x, rearWheel.y + 0.43 * e.y + 0.05 * f.y - i.y),
		ctx.lineWidth = 2 * this.parent.scene.zoom;
		ctx.stroke();

		ctx.beginPath(),
		ctx.moveTo(rearWheel.x + 0.46 * e.x + 0.4 * h.x, rearWheel.y + 0.46 * e.y + 0.4 * h.y),
		ctx.lineTo(rearWheel.x + 0.28 * e.x + 0.5 * h.x, rearWheel.y + 0.28 * e.y + 0.5 * h.y),
		ctx.lineWidth = this.parent.scene.zoom;
		ctx.stroke();

		ctx.beginPath(),
		ctx.moveTo(frontWheel.x, frontWheel.y),
		ctx.lineTo(rearWheel.x + 0.71 * e.x + 0.73 * h.x, rearWheel.y + 0.71 * e.y + 0.73 * h.y),
		ctx.lineTo(rearWheel.x + 0.73 * e.x + 0.77 * h.x, rearWheel.y + 0.73 * e.y + 0.77 * h.y),
		ctx.lineTo(rearWheel.x + 0.7 * e.x + 0.8 * h.x, rearWheel.y + 0.7 * e.y + 0.8 * h.y),
		ctx.lineWidth = 3 * this.parent.scene.zoom;
		ctx.stroke();
		if (!this.parent.dead) {
			var c = rearWheel.sum(e.scale(0.3)).sum(h.scale(0.25))
			  , k = rearWheel.sum(e.scale(0.4)).sum(h.scale(0.05))
			  , l = k.difference(i)
			  , i = c.sum(e.scale(-0.05)).sum(h.scale(0.42))

			ctx.beginPath();
			switch (this.parent.cosmetics.head) {
				case 'cap':
					ctx.moveTo(...Object.values(c.sum(e.scale(0.4)).sum(h.scale(1.15))));
					ctx.lineTo(...Object.values(c.sum(e.scale(0.1)).sum(h.scale(1.05))));
					break;

				case 'hat':
					d = c.sum(e.scale(0.37)).sum(h.scale(1.19))
					i = c.difference(e.scale(0.02)).sum(h.scale(1.14))
					l = c.sum(e.scale(0.28)).sum(h.scale(1.17))
					c = c.sum(e.scale(0.09)).sum(h.scale(1.15))
					let n = d.difference(e.scale(0.1)).add(h.scale(0.2))
					e = i.sum(e.scale(0.02)).add(h.scale(0.2))
					ctx.moveTo(d.x, d.y)
					ctx.lineTo(l.x, l.y)
					ctx.lineTo(n.x, n.y)
					ctx.lineTo(e.x, e.y)
					ctx.lineTo(c.x, c.y)
					ctx.lineTo(i.x, i.y)
					ctx.fill();
			}

			ctx.lineWidth = this.parent.scene.zoom * 2
			ctx.stroke();
		}

		ctx.restore();
	}
}