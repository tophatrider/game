import Grid from "./modules/Grid.js";
import Sector from "./modules/Sector.js";

// const offscreen = new OffscreenCanvas(0, 0);

Object.defineProperties(self, {
	config: { value: {}, writable: true },
	grid: { value: new Grid(), writable: true }
});

addEventListener('message', async function({ data }) {
	switch (data.type) {
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

	case 'PUSH': {
		const { column, row, buffer, scenery } = data;
		const sector = grid.get(column, row);
		if (!sector) break;
		const intView = new Int32Array(buffer);
		sector.add(intView, scenery);
		if (!scenery) {
			sector.draw(intView);
			break;
		}

		sector.render();
		break;
	}

	case 'RENDER': {
		const { column, row } = data;
		const sector = grid.get(column, row);
		if (!sector) return console.warn(`Sector not found (${column}, ${row})`);
		sector.timeout && sector.cancel();
		sector.dirty = true;
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