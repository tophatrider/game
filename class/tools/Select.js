import Tool from "./Tool.js";
import Vector from "../core/geometry/Vector2.js";

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

	onPress() {
		this.anchor = this.mouse.raw.toStatic();
	}

	onStroke() {
		if (!this.mouse.down || this.anchor.distanceTo(this.mouse.raw) < 4) return;

		const { position } = this.mouse
			, old = this.anchor;
		this.points = [Math.min(position.x, old.x), Math.min(position.y, old.y), Math.abs(position.x - old.x), Math.abs(position.y - old.y)];
	}

	onClip() {
		this.anchor = null;
		for (const type in this.selected) {
			typeof this.selected[type] == 'object' && this.selected[type].splice(0);
		}

		let min = this.scene.camera.toWorld(this.points[0], this.points[1]);
		let max = this.scene.camera.toWorld(this.points[0] + this.points[2], this.points[1] + this.points[3]);
		for (const sector of this.scene.sectors.range(min.map(value => Math.floor(value / this.scene.sectors.scale)), max.map(value => Math.floor(value / this.scene.sectors.scale))).filter(sector => sector.physics.length + sector.scenery.length > 0)) {
			const types = sector.search(min, max);
			for (const type in types) {
				typeof this.selected[type] == 'object' && this.selected[type].push(...types[type].filter(object => this.selected[type].indexOf(object) === -1));
			}
		}

		// don't remove until deselect is called
		this.points.splice(0);
	}

	deleteSelected() {
		for (const type in this.selected) {
			if (typeof this.selected[type] != 'object') continue;
			for (const object of this.selected[type])
				object.remove();

			this.selected[type].splice(0);
		}
	}

	draw(ctx) {
		if (this.points.length < 1) return;

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
}