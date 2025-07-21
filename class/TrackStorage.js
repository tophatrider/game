import EventEmitter from "./EventEmitter.js";

export default class extends EventEmitter {
	#storage = null;
	readyState = 0;
	cache = new Map();
	writables = new Map();
	constructor() {
		super();
		navigator.storage.getDirectory()
		.then(root => root.getDirectoryHandle('tracks', { create: true }))
		.then(async dir => {
			this.#storage = dir;
			for await (const [fileName, fileHandle] of dir.entries()) {
				if (fileName.endsWith('.crswap')) continue;
				this.cache.set(fileName, fileHandle);
			}

			this.readyState = 1;
			this.emit('open');
		}).catch(err => {
			this.emit('error', err);
			console.warn('Storage:', err);
		});

		navigation.addEventListener('navigate', this._onnavigate = this.close.bind(this));
		// window.addEventListener('beforeunload', this._onbeforeunload = async event => {
		// 	event.preventDefault();
		// 	event.returnValue = false;

		// 	for (const [fileName, writable] of this.writables.entries()) {
		// 		await writable.close();

		// 		// const fileHandle = this.cache.get(fileName);
		// 		// this.writables.set(fileName, await fileHandle.createWritable({ keepExistingData: true }));
		// 	}

		// 	return event.returnValue;
		// });

		window.addEventListener('unload', this.close.bind(this));
	}

	/**
	 * 
	 * @param {string} name file name
	 * @param {object} [options] options
	 * @param {boolean} [options.create] create if not exists
	 * @returns {Promise<FileSystemHandle>}
	 */
	async getFileHandle(name, options = { create: true }) {
		if (!this.cache.has(name)) {
			this.cache.set(name, await this.#storage.getFileHandle(name, options));
		}

		return this.cache.get(name);
	}

	/**
	 * 
	 * @param {string} name file name
	 * @param {string} content file data
	 * @param {object} [options] options
	 * @param {boolean} [options.overwrite] overwrite data
	 * @returns {Promise<FileSystemWritableFileStream>}
	 */
	async set(name, content, options) {
		const writable = await this.open(name, options);
		await writable.write(content);
		await writable.close();
		return writable;
	}

	/**
	 * 
	 * @param {string} name file name
	 * @param {object} [options] options
	 * @param {boolean} [options.overwrite] overwrite file data
	 * @returns {Promise<FileSystemWritableFileStream>}
	 */
	async open(name, { cache = false, overwrite = true } = {}) {
		const fileHandle = await this.getFileHandle(name);
		const writable = await fileHandle.createWritable({ keepExistingData: !overwrite });
		cache && this.writables.set(name, writable);
		return writable;
		// const fileHandle = await this.getFileHandle(name);
		// return fileHandle.createWritable({ keepExistingData: !overwrite });
		// if (!this.writables.has(name)) {
		// 	const fileHandle = await this.getFileHandle(name);
		// 	this.writables.set(name, await fileHandle.createWritable({ keepExistingData: !overwrite }));
		// }

		// return this.writables.get(name);
	}

	/**
	 * 
	 * @param {string} name file name
	 * @returns {Promise<string>}
	 */
	async read(name) {
		const fileHandle = await this.getFileHandle(name);
		const fileData = await fileHandle.getFile();
		return await fileData.text();
	}

	/**
	 * 
	 * @param {string} name file name
	 * @param {string} content file contents
	 * @param {object} [options] options
	 * @returns {Promise<boolean>}
	 */
	async write(name, content, options) {
		const writable = await this.open(name, options);
		await writable.write(content);
		await writable.close();
		return true;
		// const writable = await this.open(name);
		// await writable.write(content);
		// await writable.close();
		// this.writables.delete(name);
		// this.open(name, options);
		// return true;
	}

	/**
	 * 
	 * @param {string} name file name
	 * @returns {Promise<boolean>}
	 */
	async delete(name) {
		const fileHandle = await this.getFileHandle(name);
		return fileHandle && fileHandle.remove();
	}

	close() {
		this.writables.clear();
		navigation.removeEventListener('navigate', this._onnavigate);
		window.removeEventListener('beforeunload', this._onbeforeunload);
		window.removeEventListener('unload', this._onunload);
	}
}