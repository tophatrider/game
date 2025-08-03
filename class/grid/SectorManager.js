import RendererBridge from "../core/render/RendererBridge.js";
import Vector from "../core/geometry/Vector.js";
import Sector from "./Sector.js";

export default class SectorManager {
	columns = new Map;
	scale = 100;
	size = 1;
	renderer = new RendererBridge(this._handleRendererMessage.bind(this));
	visible = [];
	constructor(parent) {
		Object.defineProperty(this, 'scene', { value: parent, writable: true });
		this.config();
	}

	_handleRendererMessage(column, row, bitmap) {
		const sector = this.sector(column, row);
		if (!sector) return;
		sector.bitmap = bitmap;
		sector.cached = true;
		sector._rendering = false;
	}

	get sectors() {
		let sectors = [];
		for (const column of this.columns.values()) {
			for (const sector of column.values()) {
				sectors.push(sector);
			}
		}

		return sectors;
	}

	updateVisible() {
		// const camera = this.scene.camera;
		// const { viewportWidth, viewportHeight } = camera;

		// const topLeft = camera.toWorld(0, 0);
		// const bottomRight = camera.toWorld(viewportWidth, viewportHeight);

		// const min = new Vector(topLeft.x, topLeft.y).downScale(this.scale).map(Math.floor);
		// const max = new Vector(bottomRight.x, bottomRight.y).downScale(this.scale).map(Math.floor);

		// const nextVisible = this.range(min, max).filter(s =>
		// 	s.physics.length + s.scenery.length + s.powerups.length
		// );

		// if (this.visible.length === nextVisible.length && this.visible.every((s, i) => s === nextVisible[i])) return;

		// this.visible.splice(0, this.visible.length, ...nextVisible);
	}

	config() {
		this.renderer.config({
			palette: this.scene.game.colorScheme.palette,
			sectorSize: this.scale * this.scene.camera.zoom,
			viewport: {
				width: this.scene.camera.viewportWidth,
				height: this.scene.camera.viewportHeight
			},
			zoom: this.scene.camera.zoom
		});
	}

	addItem(item) {
		let from = item.a || item.start || item.position;
		let to = item.b || item.end || item.alt || from;
		for (const sector of this.findTouchingSectors(from, to)) {
			sector.add(item);
			sector.cached = false;
		}

		return item;
	}

	coords(vector) {
		return new Vector(Math.floor(vector.x / this.scale), Math.floor(vector.y / this.scale));
	}

	delete(x, y) {
		return this.columns.has(x) && this.columns.get(x).delete(y);
	}

	findTouchingSectors(from, to) {
		let sectors = [from];
		let initial = from.clone();
		let factor = (to.y - from.y) / (to.x - from.x);
		let negativeX = from.x < to.x;
		let negativeY = from.y < to.y;
		let b = this.coords(to);
		for (let i = 0; i < 5e3; i++) {
			let a = this.coords(initial);
			if (a.x === b.x && a.y === b.y) break;

			let firstX = negativeX ? Math.round(Math.floor(initial.x / this.scale + 1) * this.scale) : Math.round(Math.ceil((initial.x + 1) / this.scale - 1) * this.scale) - 1;
			let firstY = Math.round(from.y + (firstX - from.x) * factor);
			let first = new Vector(firstX, firstY);

			let secondY = negativeY ? Math.round(Math.floor(initial.y / this.scale + 1) * this.scale) : Math.round(Math.ceil((initial.y + 1) / this.scale - 1) * this.scale) - 1;
			let secondX = Math.round(from.x + (secondY - from.y) / factor);
			let second = new Vector(secondX, secondY);

			let diff1 = first.clone().sub(from);
			let diff2 = second.clone().sub(from);
			if (diff1.lengthSquared() < diff2.lengthSquared()) {
				initial = first;
			} else {
				initial = second;
			}

			sectors.push(initial);
		}

		return sectors
			.map(vector => this.coords(vector))
			.map(vector => this.sector(vector.x, vector.y, true));
	}

	range(min, max) {
		let sectors = [];
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
			, to = item.b || item.end || item.alt || item.position;
		for (const sector of this.findTouchingSectors(from, to))
			sector.remove(item);

		return item;
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
}