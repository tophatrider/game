import BaseStorage from "./BaseStorage.js";

export default class FileSystemStorage extends BaseStorage {
	#handle = null;
	// readyState = 0;
	writables = new Map();
	async openDir(prompt = false) {
		try {
			if (prompt === true) {
				if (!('showDirectoryPicker' in window))
					throw new RangeError('Your browser does not support showDirectoryPicker');

				const handle = await showDirectoryPicker({
					mode: 'readwrite',
					startIn: 'documents'
				});
				this.#handle = handle;
			} else {
				if (!('storage' in navigator))
					throw new RangeError('Your browser does not support the Storage API');

				const root = await navigator.storage.getDirectory()
					, dir = await root.getDirectoryHandle('tracks', { create: true });
				this.#handle = dir;
			}

			for await (const [fileName, fileHandle] of this.#handle.entries()) {
				if (!fileName.endsWith('.txt')) continue;
				this.cache.set(fileName, fileHandle);
			}
		} catch (err) {
			if (this.listenerCount('error') > 0) {
				return this.emit('error', err);
			} else
				throw err;
		}

		this.listen();
		this.readyState = 1;
		this.emit('open');
	}

	/**
	 * 
	 * @param {string} name file name
	 * @param {object} [options] options
	 * @param {boolean} [options.create] create if not exists
	 * @returns {Promise<FileSystemHandle>}
	 */
	async getFileHandle(name, options = { create: true }) {
		let entry = this.cache.get(name);
		if (!entry) {
			entry = await this.#handle.getFileHandle(name, options);
			this.cache.set(name, entry);
		}

		return entry;
	}

	async exists(name) {
		if (this.cache.has(name)) return true;
		try {
			await this.getFileHandle(name, { create: false });
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Set the contents of a stored file
	 * @param {string} name file name
	 * @param {string} content file data
	 * @param {object} [options] options
	 * @returns {Promise<FileSystemWritableFileStream>}
	 */
	async set(name, content, options) {
		await this.write(name, content, { ...(options || {}), overwrite: true });
	}

	/**
	 * 
	 * @param {string} name file name
	 * @param {object} [options] options
	 * @param {boolean} [options.overwrite] overwrite file data
	 * @returns {Promise<FileSystemWritableFileStream>}
	 */
	async openWritable(name, { cache = false, force = false, overwrite = true } = {}) {
		const fileHandle = await this.getFileHandle(name);
		const writable = await fileHandle.createWritable({ keepExistingData: !overwrite });
		cache && this.writables.set(name, writable);
		return writable;
	}

	/**
	 * 
	 * @param {string} name file name
	 * @returns {Promise<string>}
	 */
	async read(name) {
		const fileHandle = await this.getFileHandle(name);
		const fileData = await fileHandle.getFile();
		return fileData.text();
	}

	/**
	 * 
	 * @param {string} name file name
	 * @param {string} content file contents
	 * @param {object} [options] options
	 * @returns {Promise<void>}
	 */
	async write(name, content, options) {
		const writable = await this.openWritable(name, options);
		await writable.write(content);
		await writable.close();
		// this.writables.delete(name);
		// await this.openWritable(name, options);
	}

	/**
	 * Stage content to be written later
	 * @param {string} name 
	 * @param {string|Blob|BufferSource} content 
	 * @param {object} [options]
	 * @param {boolean} [options.overwrite] Whether to overwrite file contents
	 * @returns {Promise<void>}
	 */
	async stage(name, content, options = {}) {
		let writable = this.writables.get(name);
		if (!writable) {
			writable = await this.openWritable(name, { ...(options || {}), cache: true });
		}

		await writable.write(content);
	}

	async commit(name) {
		if (arguments.length < 1) return this.flush();
		const writable = this.writables.get(name);
		if (writable) {
			await writable.close();
			this.writables.delete(name);
		}
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

	async flush() {
		for (const [name, writable] of this.writables.entries()) {
			try {
				await writable.close();
			} catch (err) {
				console.warn(`Failed to close writable for ${name}`, err);
			}
		}
		this.writables.clear();
	}

	listen() {
		'navigation' in window && super.listen(navigation, 'navigate', this.destroy.bind(this));
		// super.listen(window, 'beforeunload', async event => {
		// 	if (this.writables.size < 1) return;

		// 	event.preventDefault();
		// 	event.returnValue = false;

		// 	for (const [fileName, writable] of this.writables.entries()) {
		// 		await writable.close();

		// 		// const fileHandle = this.cache.get(fileName);
		// 		// this.writables.set(fileName, await fileHandle.createWritable({ keepExistingData: true }));
		// 	}

		// 	return event.returnValue;
		// });
		super.listen(window, 'pagehide', e => !e.persisted && this.destroy());
		super.listen(document, 'visibilitychange', () => document.visibilityState === 'hidden' && this.flush());
		super.listen();
	}

	dispose() {
		super.dispose();
		this.readyState = 0;
		this.writables.clear();
	}

	async destroy() {
		await this.flush();
		super.destroy();
		this.readyState = null;
		this.writables = null;
	}
}