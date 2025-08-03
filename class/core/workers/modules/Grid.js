import CanvasPool from "./CanvasPool.js";

export default class Grid {
	canvasPool = new CanvasPool();
	sectors = new Map();
	_column(x, { createIfNotExists } = {}) {
		let column = this.sectors.get(x);
		if (!column && createIfNotExists) {
			column = new Map();
			this.sectors.set(x, column);
		}

		return column ?? null
	}

	clear(x, y) {
		const sector = this.get(x, y);
		if (!sector) return;
		const { ctx, offscreen } = sector;
		if (!ctx || !offscreen) return;
		ctx.clearRect(0, 0, offscreen.width, offscreen.height);
		sector.ctx = null;
		this.canvasPool.releaseCanvas(offscreen);
		sector.offscreen = null
	}

	create(x, y, data) {
		return !this.has(x, y) && this.set(x, y, data)
	}

	has(x, y) {
		return null !== this.get(x, y)
	}

	get(x, y) {
		const column = this._column(x);
		return column?.get(y) ?? null
	}

	set(x, y, data) {
		const column = this._column(x, { createIfNotExists: true });
		column.set(y, data);
		return data;
	}

	update(x, y, data) {
		const sector = this.get(x, y);
		if (!sector) return null;
		Object.assign(sector, data);
		return sector;
	}
}