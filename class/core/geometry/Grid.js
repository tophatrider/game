export default class Grid {
	constructor(type = 'square', size = 1) {
		this.type = type;
		this.size = size;
	}

	setType(type) {
		this.type = type;
	}

	setSize(size) {
		this.size = size;
	}

	snap(worldPosition) {
		switch (this.type) {
		case 'isometric':
			return this.snapIsometric(worldPosition);
		case 'square':
		default:
			return this.snapSquare(worldPosition);
		}
	}

	snapSquare(pos) {
		return pos.clone().downScale(this.size).map(Math.round).scale(this.size);
	}

	snapIsometric(pos) {
		// Assume isometric grid aligned 30° (or 2:1 ratio)
		const size = this.size
			, isoX = (pos.x / size - pos.y / size) / 2
			, isoY = (pos.x / size + pos.y / size) / 2
			, snappedX = Math.round(isoX)
			, snappedY = Math.round(isoY)
			, x = (snappedX + snappedY) * size / 2
			, y = (snappedY - snappedX) * size / 2;
		return pos.clone().set(x, y);
	}

	getSnappedScreenPosition(position, camera) {
		const snapped = this.getSnappedWorldPosition(position, camera);
		return camera.toScreen(snapped);
	}

	getSnappedWorldPosition(pointer, camera) {
		const world = camera.toWorld(pointer);
		return this.snap(world);
	}
}