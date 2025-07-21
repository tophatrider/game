import Vector from "../Vector.js";
import PhysicsLine from "../items/line/PhysicsLine.js";
import SceneryLine from "../items/line/SceneryLine.js";
import Sector from "./sector/Sector.js";

// use worker to cache grid?
export default class {
	rows = new Map();
	scale = 100;
	scene = null;
	size = 1;
	helper = new Worker("./class/grid/GridHelper.js");
	constructor(parent) {
		this.scene = parent;
		this.helper.addEventListener('message', ({ data }) => {
			switch(data.event) {
				// case 'ADD_LINE': {
				// 	for (let coords of data.sectors) {
				// 		let sector = this.sector(coords.x, coords.y);
				// 		sector[data.type].push(new (data.type === 'scenery' ? SceneryLine : PhysicsLine)(data.start.x, data.start.y, data.end.x, data.end.y, this.scene));
				// 	}
				// 	break;
				// }

				// case 'ADD_LINES': {
				// 	for (let line of data.combined) {
				// 		for (let coords of line.sectors) {
				// 			let sector = this.sector(coords.x, coords.y);
				// 			sector[data.type].push(new (data.type !== 'scenery' ? PhysicsLine : SceneryLine)(data.start.x, data.start.y, data.end.x, data.end.y, this.scene));
				// 			sector.rendered = false;
				// 		}
				// 	}
				// 	break;
				// }

				case 'INSERT_LINE': {
					let sector = this.sector(data.sector.x, data.sector.y);
					sector[data.type].push(new (data.type !== 'scenery' ? PhysicsLine : SceneryLine)(data.start.x, data.start.y, data.end.x, data.end.y, this.scene));
					// sector.rendered = false;
					break;
				}

				case 'SECTOR_CACHED': {
					let sector = this.sector(data.row, data.column);
					// sector.image = data.image;
					// sector.rendered = true;
					break;
				}
			}
		});
	}

	get sectors() {
		let sectors = [];
		for (const row of this.rows.values()) {
			for (const sector of row.values()) {
				sectors.push(sector);
			}
		}

		return sectors;
	}

	addItem(item) {
		let from = item.a || item.start || item.position;
		let to = item.b || item.end || a;
		for (const sector of this.findTouchingSectors(from, to)) {
			sector.add(item);
			sector.rendered = false;
		}

		return item;
	}

	cache() {
		for (const row of this.rows.values()) {
			for (const sector of row.values()) {
				sector.rendered = false;
			}
		}
	}

	coords(vector) {
		return new Vector(Math.floor(vector.x / this.scale), Math.floor(vector.y / this.scale));
	}

	delete(x, y) {
		return this.rows.has(x) && this.rows.get(x).delete(y);
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
			if (a.x === b.x && a.y === b.y) {
				break;
			}

			let firstX = negativeX ? Math.round(Math.floor(initial.x / this.scale + 1) * this.scale) : Math.round(Math.ceil((initial.x + 1) / this.scale - 1) * this.scale) - 1;
			let firstY = Math.round(from.y + (firstX - from.x) * factor);
			let first = new Vector(firstX, firstY);

			let secondY = negativeY ? Math.round(Math.floor(initial.y / this.scale + 1) * this.scale) : Math.round(Math.ceil((initial.y + 1) / this.scale - 1) * this.scale) - 1;
			let secondX = Math.round(from.x + (secondY - from.y) / factor);
			let second = new Vector(secondX, secondY);

			let diff1 = first.clone().subtract(from);
			let diff2 = second.clone().subtract(from);
			if (diff1.lengthSquared() < diff2.lengthSquared()) {
				initial = first;
			} else {
				initial = second;
			}

			sectors.push(initial);
		}

		return sectors.map(vector => this.coords(vector)).map(vector => this.sector(vector.x, vector.y, true));
	}

	range(min, max) {
		let sectors = [];
		for (let x = Math.floor(min.x); x <= max.x; x++) {
			for (let y = Math.floor(min.y); y <= max.y; y++) {
				sectors.push(this.sector(x, y));
			}
		}

		return sectors;
	}

	removeItem(item) {
		let from = item.a || item.start || item.position;
		let to = item.b || item.end || a;
		for (const sector of this.findTouchingSectors(from, to)) {
			sector.remove(item);
		}

		return item;
	}

	resize() {
		for (const row of this.rows.values()) {
			for (const sector of row.values()) {
				sector.resize();
			}
		}
	}

	sector(x, y, add) {
		if (!this.rows.has(x)) {
			if (!add) {
				return new Sector(this, null, null);
			}

			this.rows.set(x, new Map());
		}

		const row = this.rows.get(x);
		if (!row.has(y)) {
			if (!add) {
				return new Sector(this, null, null);
			}

			row.set(y, new Sector(this, x, y));
		}

		return row.get(y);
	}
}