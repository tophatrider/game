import EventRelay from "../EventRelay.js";

export default class BaseStorage extends EventRelay {
	cache = new Map();
	dispose() {
		super.dispose();
		this.cache.clear();
	}

	destroy() {
		this.dispose();
		super.destroy();
		this.cache = null;
	}
}