import Tool from "./Tool.js";

import Vector from "../Vector.js";

export default class extends Tool {
	selected = [];
	press() {
		let vector = new Vector(this.points[0], this.points[1]).toCanvas(this.scene.parent.canvas);
		this.scene.grid.sector(Math.floor(vector.x / this.scene.grid.scale), Math.floor(vector.y / this.scene.grid.scale)).fill(vector);
	}

	draw(ctx) {
		// draw bucket?
	}
}