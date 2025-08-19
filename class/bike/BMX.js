import Bike from "./Bike.js";
import Vector from "../core/geometry/Vector2.js";

export default class BMX extends Bike {
	constructor() {
		super(...arguments);

		this.frontWheel.size = 11.7;
		this.rearWheel.size = 11.7;

		this.rearSpring.lrest = 45;
		this.rearSpring.springConstant = .35;

		this.chasse.lrest = 42;
		this.chasse.springConstant = .35;

		this.frontSpring.springConstant = .35;
	}

	get rider() {
		const rider = {};

		let t = this.frontWheel.pos.clone().sub(this.rearWheel.pos);
		let e = new Vector(t.y, -t.x).scale(this.dir);
		let s = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(6);

		let r = this.player.hitbox.pos.clone().sub(this.rearWheel.pos).sub(t.clone().scale(.5));
		let a = this.rearWheel.pos.clone().add(t.clone().scale(.3)).add(e.clone().scale(.25));

		rider.head = a.clone().add(t.clone().scale(.15)).add(r.clone().scale(1.05));
		// rider.head = this.player.hitbox.pos.clone().sub(t.clone().scale(.05)).add(e.clone().scale(.3));
		rider.sternum /* .head */ = a.clone().add(t.clone().scale(.05)).add(r.clone().scale(.88));
		rider.hand = this.rearWheel.pos.clone().add(t.clone().scale(.8)).add(e.clone().scale(.68));
		rider.shadowHand = rider.hand.clone();

		let i = rider.sternum.clone().sub(rider.hand);
		i = new Vector(i.y, -i.x).scale(this.dir);

		rider.elbow = i.clone().scale(130 / i.lengthSquared()).add(rider.sternum.clone().sub(rider.hand).scale(.4)).add(rider.hand);
		if (typeof rider.elbow.x !== 'object' && isNaN(rider.elbow.x) || isNaN(rider.elbow.y)) {
			console.trace(this.frontWheel.pos, this.rearWheel.pos)
			throw new TypeError(`Non-numeric: (${rider.elbow.x}, ${rider.elbow.y})`);
		}
		rider.shadowElbow = rider.elbow.clone();
		rider.hip = a.sub(t.clone().scale(.1)).add(r.scale(.3));
		rider.foot = this.rearWheel.pos.clone().add(t.clone().scale(.4)).add(e.clone().scale(.05)).add(s);

		i = rider.hip.clone().sub(rider.foot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.knee = rider.hip.clone().add(rider.foot).scale(.5).add(i.clone().scale(200 / i.lengthSquared()));
		rider.shadowFoot = this.rearWheel.pos.clone().add(t.scale(.4)).add(e.scale(.05)).sub(s);

		i = rider.hip.clone().sub(rider.shadowFoot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.shadowKnee = rider.hip.clone().add(rider.shadowFoot).scale(.5).add(i.scale(200 / i.lengthSquared()));
		return rider;
	}

	draw(ctx) {
		super.draw(...arguments);

		let rearWheel = this.player.scene.camera.toScreen(this.rearWheel.pos);
		let frontWheel = this.player.scene.camera.toScreen(this.frontWheel.pos);
		let l = frontWheel.clone().sub(rearWheel);
		let i = new Vector(frontWheel.y - rearWheel.y, rearWheel.x - frontWheel.x).scale(this.dir);
		let a = rearWheel.clone().add(l.clone().scale(.3)).add(i.clone().scale(.25));
		let n = rearWheel.clone().add(l.clone().scale(.84)).add(i.clone().scale(.42));
		let c = rearWheel.clone().add(l.clone().scale(.84)).add(i.clone().scale(.37));
		let w = rearWheel.clone().add(l.clone().scale(.4)).add(i.clone().scale(.05));

		ctx.lineWidth = this.player.scene.camera.zoom * 3;
		ctx.beginPath()
		ctx.moveTo(rearWheel.x, rearWheel.y)
		ctx.lineTo(a.x, a.y)
		ctx.lineTo(n.x, n.y)
		ctx.moveTo(c.x, c.y)
		ctx.lineTo(w.x, w.y)
		ctx.lineTo(rearWheel.x, rearWheel.y);

		c = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(this.player.scene.camera.zoom * 6);
		let foot = w.clone().add(c);
		let shadowFoot = w.clone().sub(c);

		let C = rearWheel.clone().add(l.clone().scale(.17)).add(i.clone().scale(.38));
		let X = rearWheel.clone().add(l.clone().scale(.3)).add(i.clone().scale(.45));
		let T = rearWheel.clone().add(l.clone().scale(.25)).add(i.clone().scale(.4));

		ctx.moveTo(foot.x, foot.y);
		ctx.lineTo(shadowFoot.x, shadowFoot.y);
		ctx.moveTo(C.x, C.y);
		ctx.lineTo(X.x, X.y);
		ctx.moveTo(w.x, w.y);
		ctx.lineTo(T.x, T.y);

		C = rearWheel.clone().add(l.clone().scale(.97));
		X = rearWheel.clone().add(l.clone().scale(.8)).add(i.clone().scale(.48));
		T = rearWheel.clone().add(l.clone().scale(.86)).add(i.clone().scale(.5));
		let Y = rearWheel.clone().add(l.clone().scale(.82)).add(i.clone().scale(.65));
		let hand = rearWheel.clone().add(l.clone().scale(.78)).add(i.clone().scale(.67));

		ctx.moveTo(rearWheel.x + l.x, rearWheel.y + l.y),
		ctx.lineTo(C.x, C.y)
		ctx.lineTo(X.x, X.y)
		ctx.lineTo(T.x, T.y)
		ctx.lineTo(Y.x, Y.y)
		ctx.lineTo(hand.x, hand.y)
		ctx.stroke();

		if (!this.player.dead) {
			i = this.player.scene.camera.toScreen(this.player.hitbox.pos).sub(rearWheel).sub(l.clone().scale(.5));
			ctx.beginPath();
			switch (this.player.cosmetics.head) {
			case 'cap':
				ctx.moveTo(...a.clone().add(l.clone().scale(.4)).add(i.clone().scale(1.1)));
				ctx.lineTo(...a.clone().add(l.clone().scale(.05)).add(i.clone().scale(1.05)));
			case 'hat':
				let head = a.clone().add(l.clone().scale(.35)).add(i.clone().scale(1.15));
				let h = a.clone().sub(l.clone().scale(.05)).add(i.clone().scale(1.1));
				ctx.moveTo(head.x, head.y),
				ctx.lineTo(...a.clone().add(l.clone().scale(.25)).add(i.clone().scale(1.13))),
				ctx.lineTo(...head.clone().sub(l.clone().scale(.1)).add(i.clone().scale(.2))),
				ctx.lineTo(...h.clone().add(l.clone().scale(.02)).add(i.clone().scale(.2))),
				ctx.lineTo(...a.add(l.scale(.05)).add(i.scale(1.11))),
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

	reset(depth) {
		depth !== 1 && super.reset();

		this.rotationFactor = 6;

		this.player.hitbox.setPosition(0, -1);
		this.rearWheel.setPosition(-21, 38);
		this.frontWheel.setPosition(21, 38);

		this.rearSpring.leff = 45;
		this.chasse.leff = 42;
	}
}