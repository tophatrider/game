import Bike from "./Bike.js";
import Vector from "../core/geometry/Vector2.js";

export default class MTB extends Bike {
	constructor() {
		super(...arguments);

		this.frontWheel.size = 14;
		this.rearWheel.size = 14;

		this.rearSpring.lrest = 47;
		this.rearSpring.springConstant = .2;

		this.chasse.lrest = 45;
		this.chasse.springConstant = .2;

		this.frontSpring.springConstant = .2;
	}

	get rider() {
		const rider = {};

		let t = this.frontWheel.pos.clone().sub(this.rearWheel.pos);
		let s = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(6);

		let r = this.player.hitbox.pos.clone().sub(this.rearWheel.pos).sub(t.clone().scale(.5));
		let b = this.rearWheel.pos.clone().add(t.clone().scale(.3)).add(r.clone().scale(.25));

		rider.head = b.clone().add(t.clone().scale(.2)).add(r.clone().scale(1.09));
		// rider.head = this.player.hitbox.pos.clone().sub(t.clone().scale(.05)).add(e.clone().scale(.3));
		rider.sternum /* .head */ = b.clone().add(t.clone().scale(.1)).add(r.clone().scale(.93));
		rider.hand = this.rearWheel.pos.clone().add(t.clone().scale(.67)).add(r.clone().scale(.8));
		// rider.hand = this.rearWheel.pos.clone().add(t.clone().scale(.8)).add(r.clone().scale(.68));
		rider.shadowHand = rider.hand.clone();

		let i = rider.sternum.clone().sub(rider.hand);

		rider.elbow = rider.hand.clone().add(i.clone().scale(.3)).add(new Vector(i.y, -i.x).scale(80 / i.lengthSquared() * this.dir));
		rider.shadowElbow = rider.elbow.clone();
		rider.hip = b.add(t.clone().scale(-.05)).add(r.clone().scale(.42));
		rider.foot = this.rearWheel.pos.clone().add(t.clone().scale(.4)).add(r.clone().scale(.05)).add(s);

		i = rider.hip.clone().sub(rider.foot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.knee = rider.hip.clone().add(rider.foot).scale(.5).add(i.clone().scale(200 / i.lengthSquared()));
		rider.shadowFoot = this.rearWheel.pos.clone().add(t.scale(.4)).add(r.scale(.05)).sub(s);

		i = rider.hip.clone().sub(rider.shadowFoot);
		i = new Vector(-i.y, i.x).scale(this.dir);

		rider.shadowKnee = rider.hip.clone().add(rider.shadowFoot).scale(.5).add(i.scale(200 / i.lengthSquared()));
		return rider;
	}

	draw(ctx) {
		super.draw(...arguments);

		let rearWheel = this.player.scene.camera.toScreen(this.rearWheel.pos);
		let frontWheel = this.player.scene.camera.toScreen(this.frontWheel.pos);
		ctx.beginPath()
		ctx.arc(rearWheel.x, rearWheel.y, 5 * this.player.scene.camera.zoom, 0, 2 * Math.PI)
		ctx.arc(frontWheel.x, frontWheel.y, 4 * this.player.scene.camera.zoom, 0, 2 * Math.PI)
		ctx.save()
		ctx.fillStyle = 'grey'
		ctx.fill()
		ctx.restore()

		let d = this.player.scene.camera.toScreen(this.player.hitbox.pos)
		  , e = frontWheel.clone().sub(rearWheel)
		  , f = new Vector(frontWheel.y - rearWheel.y, rearWheel.x - frontWheel.x).scale(this.dir)
		  , h = d.sub(rearWheel.clone().add(e.clone().scale(.5)));

		ctx.beginPath()
		ctx.moveTo(rearWheel.x, rearWheel.y)
		ctx.lineTo(rearWheel.x + .4 * e.x + .05 * f.x, rearWheel.y + .4 * e.y + .05 * f.y)
		ctx.moveTo(rearWheel.x + .72 * e.x + .64 * h.x, rearWheel.y + .72 * e.y + .64 * h.y)
		ctx.lineTo(rearWheel.x + .46 * e.x + .4 * h.x, rearWheel.y + .46 * e.y + .4 * h.y)
		ctx.lineTo(rearWheel.x + .4 * e.x + .05 * f.x, rearWheel.y + .4 * e.y + .05 * f.y)
		ctx.lineWidth = 5 * this.player.scene.camera.zoom;
		ctx.stroke();

		ctx.beginPath()
		var i = new Vector(Math.cos(this.pedalSpeed), Math.sin(this.pedalSpeed)).scale(6 * this.player.scene.camera.zoom);
		ctx.moveTo(rearWheel.x + .72 * e.x + .64 * h.x, rearWheel.y + .72 * e.y + .64 * h.y),
		ctx.lineTo(rearWheel.x + .43 * e.x + .05 * f.x, rearWheel.y + .43 * e.y + .05 * f.y),
		ctx.moveTo(rearWheel.x + .45 * e.x + .3 * h.x, rearWheel.y + .45 * e.y + .3 * h.y),
		ctx.lineTo(rearWheel.x + .3 * e.x + .4 * h.x, rearWheel.y + .3 * e.y + .4 * h.y),
		ctx.lineTo(rearWheel.x + .25 * e.x + .6 * h.x, rearWheel.y + .25 * e.y + .6 * h.y),
		ctx.moveTo(rearWheel.x + .17 * e.x + .6 * h.x, rearWheel.y + .17 * e.y + .6 * h.y),
		ctx.lineTo(rearWheel.x + .3 * e.x + .6 * h.x, rearWheel.y + .3 * e.y + .6 * h.y),
		ctx.moveTo(rearWheel.x + .43 * e.x + .05 * f.x + i.x, rearWheel.y + .43 * e.y + .05 * f.y + i.y),
		ctx.lineTo(rearWheel.x + .43 * e.x + .05 * f.x - i.x, rearWheel.y + .43 * e.y + .05 * f.y - i.y),
		ctx.lineWidth = 2 * this.player.scene.camera.zoom;
		ctx.stroke();

		ctx.beginPath(),
		ctx.moveTo(rearWheel.x + .46 * e.x + .4 * h.x, rearWheel.y + .46 * e.y + .4 * h.y),
		ctx.lineTo(rearWheel.x + .28 * e.x + .5 * h.x, rearWheel.y + .28 * e.y + .5 * h.y),
		ctx.lineWidth = this.player.scene.camera.zoom;
		ctx.stroke();

		ctx.beginPath(),
		ctx.moveTo(frontWheel.x, frontWheel.y),
		ctx.lineTo(rearWheel.x + .71 * e.x + .73 * h.x, rearWheel.y + .71 * e.y + .73 * h.y),
		ctx.lineTo(rearWheel.x + .73 * e.x + .77 * h.x, rearWheel.y + .73 * e.y + .77 * h.y),
		ctx.lineTo(rearWheel.x + .7 * e.x + .8 * h.x, rearWheel.y + .7 * e.y + .8 * h.y),
		ctx.lineWidth = 3 * this.player.scene.camera.zoom;
		ctx.stroke();
		if (!this.player.dead) {
			var c = rearWheel.clone().add(e.clone().scale(.3)).add(h.clone().scale(.25))
			  , k = rearWheel.clone().add(e.clone().scale(.4)).add(h.clone().scale(.05))
			  , l = k.sub(i)
			  , i = c.clone().add(e.clone().scale(-.05)).add(h.clone().scale(.42))

			ctx.beginPath();
			switch (this.player.cosmetics.head) {
			case 'cap':
				ctx.moveTo(...c.clone().add(e.clone().scale(.4)).add(h.clone().scale(1.15)));
				ctx.lineTo(...c.clone().add(e.clone().scale(.1)).add(h.clone().scale(1.05)));
			case 'hat':
				d = c.clone().add(e.clone().scale(.37)).add(h.clone().scale(1.19))
				i = c.clone().sub(e.clone().scale(.02)).add(h.clone().scale(1.14))
				l = c.clone().add(e.clone().scale(.28)).add(h.clone().scale(1.17))
				c.add(e.clone().scale(.09)).add(h.clone().scale(1.15))
				let n = d.clone().sub(e.clone().scale(.1)).add(h.clone().scale(.2))
				e = i.clone().add(e.scale(.02)).add(h.scale(.2))
				ctx.moveTo(d.x, d.y)
				ctx.lineTo(l.x, l.y)
				ctx.lineTo(n.x, n.y)
				ctx.lineTo(e.x, e.y)
				ctx.lineTo(c.x, c.y)
				ctx.lineTo(i.x, i.y)
				const fillStyle = ctx.fillStyle;
				ctx.fillStyle = this.player.scene.game.colorScheme.palette.track;
				ctx.fill();
				ctx.fillStyle = fillStyle;
			}

			ctx.lineWidth = this.player.scene.camera.zoom * 2
			ctx.stroke();
		}

		ctx.restore();
	}

	reset(depth) {
		depth !== 1 && super.reset();

		this.rotationFactor = 8;

		this.player.hitbox.setPosition(2, -3);
		this.frontWheel.setPosition(23, 35);
		this.rearWheel.setPosition(-23, 35);

		this.rearSpring.leff = 47;
		this.chasse.leff = 45;
	}
}