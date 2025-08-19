import Tool from "./Tool.js";

export default class extends Tool {
	selected = [];
	onPress() {
		const vector = this.scene.camera.toWorld(this.points[0], this.points[1]);
		this.scene.sectors.sector(Math.floor(vector.x / this.scene.sectors.scale), Math.floor(vector.y / this.scene.sectors.scale))
			.fill(vector);
	}

	draw(ctx) {
		// draw bucket?
	}
}