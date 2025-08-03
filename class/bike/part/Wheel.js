import Mass from "../../core/entities/Mass.js";

export default class extends Mass {
	motor = 0.3;
	rotationSpeed = 0;
	speed = 0;
	draw(ctx) {
		const pos = this.pos.toPixel();
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, this.size * this.parent.player.scene.camera.zoom - ctx.lineWidth / 2, 0, 2 * Math.PI);
		ctx.stroke();
	}

	drive(vector) {
		this.real.add(vector.scale(this.speed * this.parent.dir));
		this.parent.player.gamepad.downKeys.has('down') && this.addFriction(vector);
		this.rotationSpeed = vector.dot(this.velocity) / this.size;
		this.touching = true;
	}
}