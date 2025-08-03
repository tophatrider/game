import Grid from "./modules/Grid.js";
import Sector from "./modules/Sector.js";

Object.defineProperties(self, {
	config: { value: {}, writable: true },
	grid: { value: new Grid(), writable: true }
});

addEventListener('message', async function({ data }) {
	switch (data.type) {
	case 'ADD_ITEM': {
		const { column, row, foreground, track } = data;
		const sector = grid.get(column, row);
		if (!sector) break;
		if (foreground && foreground.length > 0)
			for (const line of foreground)
				sector.sceneryLines.push(line);
		if (track && track.length > 0)
			for (const line of track)
				sector.physicsLines.push(line);
		// sector.render();
		break;
	}

	case 'ADD_SCENERY': {
		const { column, row, item } = data;
		const sector = grid.get(column, row);
		if (!sector) break;
		sector.sceneryLines.push(item);
		sector.render();
		break;
	}

	case 'CONFIG': {
		Object.assign(config, data.config);
		for (const column of grid.sectors.values()) {
			for (const sector of column.values()) {
				const { offscreen } = sector;
				config.sectorSize !== offscreen.width && (offscreen.width = config.sectorSize);
				config.sectorSize !== offscreen.height && (offscreen.height = config.sectorSize);
				sector.config();
				sector.render();
			}
		}
		break;
	}

	case 'RENDER': {
		const { column, row, data: { physicsLines, sceneryLines }} = data;
		const sector = grid.get(column, row);
		if (!sector) return console.warn(`Sector not found (${column}, ${row})`);

		sector.timeout && sector.cancel();

		sector.physicsLines = physicsLines;
		sceneryLines && (sector.sceneryLines = sceneryLines);

		sector.render();
		break;
	}

	case 'CLEAR_SECTOR': {
		const { column, row } = data;
		grid.clear(column, row);
		break;
	}

	case 'CREATE_SECTOR':
		const { column, row } = data;
		if (grid.has(column, row)) break;
		grid.set(column, row, new Sector({ row, column })).config();
	}
});