import Effect from "./Effect.js";
import Shard from "../entities/Shard.js";

export default class Explosion extends Effect {
	duration = 80; // duration in milliseconds
	size = 24 + 16 * Math.random();
	constructor(parent, part) {
		super();
		Object.defineProperty(this, 'player', { value: parent, writable: true });
		this.pos = part.real.clone();
		this.shards = [
			new Shard(this, this.pos),
			new Shard(this, this.pos),
			new Shard(this, this.pos),
			new Shard(this, this.pos),
			new Shard(this, this.pos)
		];
		this.sizeDiminution = this.size / (this.duration / (this.player.scene.parent.ups / 2));
	}

	draw(ctx) {
		if (this.size > 0) {
			// this.size -= this.sizeDiminution;
			ctx.beginPath();
			const pos = this.pos.toPixel();
			ctx.moveTo(pos.x + this.size / 2 * Math.cos(Math.random() * 2 * Math.PI) * this.player.scene.zoom, pos.y + this.size / 2 * Math.sin(Math.random() * 2 * Math.PI) * this.player.scene.zoom);
			for (let a = 1; a < 16; a++) {
				let d = (this.size + 30 * Math.random()) / 2 * this.player.scene.zoom;
				ctx.lineTo(pos.x + d * Math.cos(Math.random() * 2 * Math.PI + 2 * Math.PI * a / 16), pos.y + d * Math.sin(Math.random() * 2 * Math.PI + 2 * Math.PI * a / 16));
			}

			ctx.save();
			ctx.fillStyle = '#ff0';
			ctx.fill();
			ctx.restore();
		}

		for (const shard of this.shards)
			shard.draw(ctx);
	}

	fixedUpdate() {
		this.size -= this.sizeDiminution;
		for (const shard of this.shards)
			shard.fixedUpdate();
	}

	update() {
		for (const shard of this.shards)
			shard.update(...arguments);
	}
}