import Tool from "./Tool.js";
import Vector from "../core/math/Vector.js";

export default class extends Tool {
	anchor = null;
	points = [];
	selected = {
		physics: [],
		scenery: [],
		powerups: [],
		toString() {
			return Array(this.physics.join(','), this.scenery.join(','), this.powerups.join(',')).join('#')
		}
	}

	clip() {
		this.anchor = null;
		for (const type in this.selected) {
			typeof this.selected[type] == 'object' && this.selected[type].splice(0);
		}

		let min = new Vector(this.points[0], this.points[1]).toCanvas(this.scene.parent.canvas);
		let max = new Vector(this.points[0] + this.points[2], this.points[1] + this.points[3]).toCanvas(this.scene.parent.canvas);
		for (const sector of this.scene.grid.range(min.map(value => Math.floor(value / this.scene.grid.scale)), max.map(value => Math.floor(value / this.scene.grid.scale))).filter(sector => sector.physics.length + sector.scenery.length > 0)) {
			const types = sector.search(min, max);
			for (const type in types) {
				typeof this.selected[type] == 'object' && this.selected[type].push(...types[type].filter(object => this.selected[type].indexOf(object) === -1));
			}
		}

		// don't remove until deselect is called
		this.points = [];
	}

	deleteSelected() {
		for (const type in this.selected) {
			if (typeof this.selected[type] != 'object') return;
			for (const object of this.selected[type]) {
				object.remove();
			}

			this.selected[type].splice(0);
		}
	}

	draw(ctx) {
		if (this.points.length < 1) {
			return;
		}

		ctx.beginPath(),
		ctx.rect(...this.points),
		ctx.save(),
		ctx.fillStyle = '#87CEEB80'
		ctx.lineWidth = 2 * window.devicePixelRatio
		ctx.strokeStyle = '#87CEEB'
		ctx.fill(),
		ctx.stroke(),
		ctx.restore();
	}

	press() {
		this.anchor = this.mouse.position.clone();
	}

	stroke() {
		if (!this.mouse.down || this.anchor.distanceTo(this.mouse.position) < 4) {
			return;
		}

		let position = this.mouse.position.toPixel();
		let old = this.anchor.toPixel();
		this.points = [Math.min(position.x, old.x), Math.min(position.y, old.y), Math.abs(position.x - old.x), Math.abs(position.y - old.y)];
	}
}