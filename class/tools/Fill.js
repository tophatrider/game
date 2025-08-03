import Tool from "./Tool.js";

import Vector from "../core/physics/Vector.js";

export default class extends Tool {
	selected = [];
	press() {
		const vector = new Vector(this.points[0], this.points[1]).toCanvas(this.scene.game.canvas);
		this.scene.sectors.sector(Math.floor(vector.x / this.scene.sectors.scale), Math.floor(vector.y / this.scene.sectors.scale))
			.fill(vector);
	}

	draw(ctx) {
		// draw bucket?
	}
}