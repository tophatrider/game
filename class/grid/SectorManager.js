import RendererBridge from "../core/render/RendererBridge.js";
import Vector from "../core/geometry/Vector2.js";
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
		this.updateVisible();
	}

	updateVisible() {
		const camera = this.scene.camera;
		const { viewportWidth, viewportHeight } = camera;

		const topLeft = camera.toWorld(0, 0);
		const bottomRight = camera.toWorld(viewportWidth, viewportHeight);

		const min = new Vector(topLeft.x, topLeft.y).downScale(this.scale).map(Math.floor);
		const max = new Vector(bottomRight.x, bottomRight.y).downScale(this.scale).map(Math.floor);

		const nextVisible = this.range(min, max).filter(({ length: l }) => l > 0);

		if (this.visible.length === nextVisible.length && this.visible.every((s, i) => s === nextVisible[i])) return;

		this.visible.splice(0, this.visible.length, ...nextVisible);
	}

	// updateVisible() {
	// 	const camera = this.scene.camera;
	// 	const { viewportWidth, viewportHeight } = camera;

	// 	const topLeft = camera.toWorld(0, 0);
	// 	const bottomRight = camera.toWorld(viewportWidth, viewportHeight);

	// 	const minX = Math.floor(topLeft.x / this.scale);
	// 	const minY = Math.floor(topLeft.y / this.scale);
	// 	const maxX = Math.floor(bottomRight.x / this.scale);
	// 	const maxY = Math.floor(bottomRight.y / this.scale);

	// 	const sectorCountX = maxX - minX + 1;
	// 	const sectorCountY = maxY - minY + 1;
	// 	const totalSectors = sectorCountX * sectorCountY;

	// 	// Allocate a Float32Array to store sector positions [x0, y0, x1, y1, ...]
	// 	const positions = new Float32Array(totalSectors * 2);

	// 	let idx = 0;
	// 	for (let x = minX; x <= maxX; x++) {
	// 		for (let y = minY; y <= maxY; y++) {
	// 			positions[idx++] = x * this.scale;   // x position
	// 			positions[idx++] = y * this.scale;   // y position
	// 		}
	// 	}

	// 	// Example transform: apply camera zoom & pan to all sectors in one loop
	// 	const zoom = camera.zoom;
	// 	const offsetX = camera.x;
	// 	const offsetY = camera.y;

	// 	for (let i = 0; i < positions.length; i += 2) {
	// 		positions[i] = (positions[i] - offsetX) * zoom
	// 		positions[i + 1] = (positions[i + 1] - offsetY) * zoom
	// 	}

	// 	// Now you have all sectors' screen positions ready in one array
	// 	// You can efficiently filter visible sectors or draw them

	// 	// For example, you could also keep a reference array to sector objects:
	// 	const visibleSectors = [];
	// 	idx = 0;
	// 	for (let x = minX; x <= maxX; x++) {
	// 		for (let y = minY; y <= maxY; y++) {
	// 			const sector = this.sector(x, y);
	// 			if (sector && (sector.physics.length + sector.scenery.length + sector.powerups.length) > 0) {
	// 				visibleSectors.push(sector);
	// 			}
	// 			idx++
	// 		}
	// 	}

	// 	// Update visible list only if changed:
	// 	if (this.visible.length !== visibleSectors.length || !this.visible.every((s, i) => s === visibleSectors[i])) {
	// 		this.visible.splice(0, this.visible.length, ...visibleSectors);
	// 	}
	// }

	config() {
		this.renderer.config({
			palette: this.scene.game.colorScheme.palette,
			scale: this.scale,
			sectorSize: this.scale * this.scene.camera.zoom * window.devicePixelRatio,
			viewport: {
				width: this.scene.camera.viewportWidth,
				height: this.scene.camera.viewportHeight
			},
			zoom: this.scene.camera.zoom * window.devicePixelRatio
		});
	}

	addItem(item) {
		const from = item.a || item.start || item.position
			, to = item.b || item.end || item.alt || from;
		for (const sector of this.findTouchingSectors(from, to, true)) {
			sector.add(item);
			sector.cached = false;
		}

		// this.updateVisible();
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

	// groupLinesBySector(physicsLines, sceneryLines) {
	// 	const sectorGroups = new Map();

	// 	function addLineToSector(line, type) {
	// 		for (const sector of this.findTouchingSectors(line.a, line.b, true)) {
	// 			if (!sector) continue; // skip nulls
	// 			const key = `${sector.x},${sector.y}`;
	// 			if (!sectorGroups.has(key)) {
	// 				sectorGroups.set(key, { physics: [], scenery: [] });
	// 			}
	// 			sectorGroups.get(key)[type].push(line);
	// 		}
	// 	}

	// 	for (const line of physicsLines) {
	// 		addLineToSector.call(this, line, 'physics');
	// 	}

	// 	for (const line of sceneryLines) {
	// 		addLineToSector.call(this, line, 'scenery');
	// 	}

	// 	// Optional: convert Map to Object for easier usage
	// 	return Object.fromEntries(sectorGroups.entries());
	// }

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