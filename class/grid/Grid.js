import Vector2 from "../core/geometry/Vector2.js";
import Sector from "./Sector.old.js";

export default class Grid {
	columns = new Map;
	scale = 100;
	size = 1;
	visible = [];
	constructor(parent) {
		Object.defineProperty(this, 'scene', { value: parent, writable: true });
	}

	updateVisible() {
		const camera = this.scene.camera;
		const { viewportWidth, viewportHeight } = camera;

		const topLeft = camera.toWorld(0, 0);
		const bottomRight = camera.toWorld(viewportWidth, viewportHeight);

		const min = new Vector2(topLeft.x, topLeft.y).downScale(this.scale).map(Math.floor);
		const max = new Vector2(bottomRight.x, bottomRight.y).downScale(this.scale).map(Math.floor);

		const nextVisible = this.range(min, max).filter(s =>
			s.physics.length + s.scenery.length + s.powerups.length
		);

		if (this.visible.length === nextVisible.length && this.visible.every((s, i) => s === nextVisible[i])) return;

		this.visible.splice(0, this.visible.length, ...nextVisible);
	}

	config() {
		for (const sector of this.visible)
			sector.resized = true;
	}

	addItem(item) {
		const from = item.a || item.start || item.position
			, to = item.b || item.end || from;
		for (const sector of this.findTouchingSectors(from, to, true)) {
			sector.add(item);
			sector.rendered = false;
		}

		this.updateVisible();
	}

	coords(v) {
		const invScale = 1 / this.scale;
		return {
			x: Math.floor(v.x * invScale),
			y: Math.floor(v.y * invScale)
		};
	}

	delete(x, y) {
		return this.columns.has(x) && this.columns.get(x).delete(y);
	}

	*findTouchingSectors(from, to, createIfNotExists) {
		const invScale = 1 / this.scale;
		let sector = this.sector(
			Math.floor(from.x * invScale),
			Math.floor(from.y * invScale),
			createIfNotExists
		);
		if (sector !== null) yield sector;

		let initial = from.clone();
		const factor = (to.y - from.y) / (to.x - from.x),
			negativeX = from.x < to.x,
			negativeY = from.y < to.y,
			b = this.coords(to);

		for (let i = 0; i < 5e3; i++) {
			const a = this.coords(initial);
			if (a.x === b.x && a.y === b.y) break;

			const firstX = (negativeX
				? Math.floor(initial.x * invScale + 1)
				: Math.ceil((initial.x + 1) * invScale - 1)) * this.scale - (negativeX ? 0 : 1);
			const first = {
				x: firstX,
				y: Math.round(from.y + (firstX - from.x) * factor)
			};

			const secondY = (negativeY
				? Math.floor(initial.y * invScale + 1)
				: Math.ceil((initial.y + 1) * invScale - 1)) * this.scale - (negativeY ? 0 : 1);
			const second = {
				x: Math.round(from.x + (secondY - from.y) / factor),
				y: secondY
			};

			const dx1 = first.x - from.x, dy1 = first.y - from.y
				, dx2 = second.x - from.x, dy2 = second.y - from.y;

			initial = (dx1 * dx1 + dy1 * dy1) < (dx2 * dx2 + dy2 * dy2)
				? first
				: second;

			sector = this.sector(
				Math.floor(initial.x * invScale),
				Math.floor(initial.y * invScale),
				createIfNotExists
			);
			if (sector !== null) yield sector;
		}
	}

	range(min, max) {
		const sectors = [];
		for (let x = Math.floor(min.x); x <= max.x; x++) {
			for (let y = Math.floor(min.y); y <= max.y; y++) {
				const sector = this.sector(x, y);
				sector && sectors.push(sector);
			}
		}

		return sectors;
	}

	removeItem(item) {
		const from = item.a || item.start || item.position
			, to = item.b || item.end || item.alt || from;
		for (const sector of this.findTouchingSectors(from, to, false)) {
			sector.remove(item);
			sector.length < 1 && sector.delete();
		}
	}

	sector(x, y, add = false) {
		let col = this.columns.get(x);
		if (!col) {
			if (!add) return null;
			col = new Map();
			this.columns.set(x, col);
		}

		let sector = col.get(y);
		if (!sector && add) {
			sector = new Sector(this, x, y);
			col.set(y, sector);
		}
		return sector ?? null;
	}

	*[Symbol.iterator]() {
		for (const column of this.columns.values()) {
			for (const sector of column.values()) {
				yield sector;
			}
		}
	}
}