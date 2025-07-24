import Vector from "../math/Vector.js";
import Mass from "./Mass.js";

export default class Shard extends Mass {
	friction = .05;
	rotation = 6.2 * Math.random();
	rotationSpeed = Math.random() - Math.random();
	shape = [1, 0.7, 0.8, 0.9, 0.5, 1, 0.7, 1];
	size = 2 + 9 * Math.random();
	velocity = new Vector(11 * (Math.random() - Math.random()), 11 * (Math.random() - Math.random()));
	constructor(parent, pos) {
		super(parent, {
			real: new Vector(pos.x + 5 * (Math.random() - Math.random()), pos.y + 5 * (Math.random() - Math.random()))
		});
	}

	draw(ctx) {
		ctx.beginPath();
		const pos = this.pos.toPixel();
		let b = this.shape[0] * this.size * this.parent.player.scene.zoom;
		ctx.moveTo(pos.x + b * Math.cos(this.rotation), pos.y + b * Math.sin(this.rotation));
		for (let e = 2; e < 8; e++) {
			b = this.shape[e - 1] * this.size * this.parent.player.scene.zoom / 2,
			ctx.lineTo(pos.x + b * Math.cos(this.rotation + 6.283 * e / 8), pos.y + b * Math.sin(this.rotation + 6.283 * e / 8));
		}

		ctx.fill();
	}

	drive(velocity) {
		super.drive(...arguments);
		this.rotation += this.rotationSpeed;
		if (velocity.length > 0) {
			velocity = new Vector(-velocity.y / velocity.length, velocity.x / velocity.length);
			this.old.add(velocity.scale(velocity.dot(this.velocity) * 0.8));
		}
	}

	update(delta) {
		super.update(...arguments);
		this.rotation += this.rotationSpeed * delta / 40;
	}
}