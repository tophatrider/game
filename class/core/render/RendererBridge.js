export default class RendererBridge {
	worker = new Worker(new URL('../workers/renderer.js', import.meta.url), { type: "module" });
	constructor(onBitmapReady) {
		this.worker.addEventListener('message', ({ data }) => {
			const { column, row, bitmap } = data || {};
			if (bitmap && typeof column == "number" && typeof row == "number") {
				onBitmapReady(column, row, bitmap);
			}
		});
	}

	_send(type, data = {}) {
		this.worker.postMessage({ ...data, type });
	}

	config(config) {
		this._send('CONFIG', { config });
	}

	createSector(column, row) {
		this._send('CREATE_SECTOR', { column, row });
	}

	addItem(column, row, item) {
		this._send('ADD_ITEM', { column, row, item });
	}

	addScenery(column, row, item) {
		this._send('ADD_SCENERY', { column, row, item });
	}

	render({ column, row, data }) {
		this._send('RENDER', { column, row, data });
	}

	removeScenery(column, row, itemId) {
		this._send('REMOVE_SCENERY', { column, row, itemId });
	}

	removeItem(column, row, itemId) {
		this._send('REMOVE_ITEM', { column, row, itemId });
	}

	destroy() {
		this.worker?.terminate();
		this.worker = null;
	}
}