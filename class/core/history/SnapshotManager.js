export default class extends Array {
	constructor() {
		super();
		Object.defineProperty(this, 'cache', { value: [], writable: true });
	}

	push() {
		this.cache.splice(0);
		return super.push(...arguments);
	}

	reset() {
		this.splice(0);
		this.cache.splice(0);
	}
}