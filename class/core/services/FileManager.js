import FileIO from "../storage/FileIO.js";
import FileSystemStorage from "../storage/FileSystemStorage.js";

export default class FileManager {
	handles = new Map();
	cache = new Map();
	io = new FileIO('THR File');
	// systemStorage = new FileSystemStorage;
	writables = new Map();
	constructor(storage = new FileSystemStorage()) {
		this.fileSystemStorage = storage;
	}

	async openFile(options = {}) {
		if (!('showOpenFilePicker' in window))
			throw new RangeError('Unsupported');

		const handles = await this.io.open({ ...options, persistent: true });
		if (!handles?.length) return;

		return Promise.all(handles.map(async handle => {
			const id = handle.name || options.name || crypto.randomUUID();
			this.cache.set(id, handle);
			const writable = await handle.createWritable({ mode: options.mode || 'exclusive' });
			this.writables.set(id, writable);
			return writable;
		}));
	}

	async openFolder(id) {
		if (!('showDirectoryPicker' in window))
			throw new RangeError('Unsupported');

		const handle = await this.io.openDir({ persistent: true });
		this.cache.set(handle.name || id || `Unknown directory (${this.cache.size})`, handle);
		return handle;
	}

	getRecentFiles() {
		return [...this.fileSystemStorage.cache.keys()];
	}

	// async removeFile(name) {
	// 	this.fileSystemStorage.cache.delete(name);
	// 	this.fileSystemStorage.writables.delete(name);
	// }

	async dispose() {
		const writables = [...this.writables.values()];
		this.writables.clear();
		this.cache.clear();
		await Promise.allSettled(
			writables.map(w => w.close?.().catch(() => {}))
		);
	}

	async [Symbol.asyncDispose]() {
		return this.dispose();
	}
}