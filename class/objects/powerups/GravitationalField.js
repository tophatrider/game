import BasePowerup from "./BasePowerup.js";

export default class GravitationalField extends BasePowerup {
	static color = '#222';
	static type = 'F';

	radius = 30;
	strength = 1;
	activate(part) {
		const toCenter = this.position.clone().sub(part.pos);
		const distance = toCenter.length;

		if (distance === 0 || distance > this.radius) return;

		const direction = toCenter.normalize();
		const proximity = 1 - (distance / this.radius);
		const forceMagnitude = this.strength * proximity;

		part.force.add(direction.scale(forceMagnitude));
	}

	collide(part) {
		part.real.distanceTo(this.position) < this.radius && this.activate(part);
	}

	draw(ctx, pos = this.scene.camera.toScreen(this.position)) {
		const fill = ctx.fillStyle;
		const stroke = ctx.strokeStyle;
		const strokeWidth = ctx.strokeWidth;
		// Darker circle if strength is greater -- multiply opacity by strength
		// Weak gravitational forces should have a low opacity
		ctx.fillStyle = this.radius >= 30 ? 'hsl(0 0% 53% / 5%)' : '#f331';
		ctx.strokeStyle = this.radius >= 30 ? 'hsl(0 0% 53% / 4%)' : '#f333';
		ctx.strokeWidth = 1 * this.scene.camera.zoom;
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, this.radius * this.scene.camera.zoom, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.fillStyle = fill;
		ctx.strokeStyle = stroke;
		ctx.strokeWidth = strokeWidth;
		super.draw(...arguments);
	}
}