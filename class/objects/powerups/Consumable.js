import BasePowerup from "./BasePowerup.js";

export default class extends BasePowerup {
	// consumedBy = new WeakSet(); // players
	id = crypto.randomUUID();
	get consumed() {
		return this.scene.firstPlayer.itemsConsumed.has(this.id);
	}

	draw(ctx, position = this.scene.camera.toScreen(this.position)) {
		ctx.beginPath();
		ctx.arc(position.x, position.y, 7 * this.scene.camera.zoom, 0, 2 * Math.PI);
		ctx.fillStyle = this.consumed ? this.constructor.color.replaceAll('0', 'a') : this.constructor.color;
		ctx.fill();
		ctx.stroke();
	}

	collide(part) {
		// part.real.distanceTo(this.position) < part.size + this.size + ctx.lineWidth
		if (part.parent.player.itemsConsumed.has(this.id)) return;
		if (part.real.distanceToSquared(this.position) >= 500 || part.parent.player.dead) return;
		part.parent.player.itemsConsumed.add(this.id);
		!part.parent.player.ghost && this.activate(part);
	}
}