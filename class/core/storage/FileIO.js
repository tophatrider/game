export default class FileIO {
	constructor(defaultFileDescriptor = 'Text File') {
		Object.defineProperty(this, 'defaultFileDescriptor', { value: defaultFileDescriptor, writable: true });
	}

	create(data, filename = null, mimeType = 'text/plain') {
		const args = [[data], { type: mimeType }];
		filename && args.splice(1, 0, filename);
		return new (filename ? File : Blob)(...args);
	}

	async download(data, filename) {
		const blob = data instanceof Blob ? data : this.create(...arguments)
			, link = document.createElement('a')
			, url = URL.createObjectURL(blob);
		link.download = blob.name || filename || this.defaultFileDescriptor;
		link.href = url;
		link.click();
		return new Promise(resolve => {
			requestAnimationFrame(() => {
				URL.revokeObjectURL(url);
				resolve(blob);
			});
		})
	}

	async open({ multiple = false, persistent, types = ['.txt'] } = {}) {
		if ('showOpenFilePicker' in window) {
			const handles = await showOpenFilePicker({
				multiple,
				types: [{ description: this.defaultFileDescriptor, accept: { 'text/plain': types } }]
			}).catch(err => {
				if (err.name !== 'AbortError') throw err;
				return [];
			});
			if (persistent) return handles;
			return Promise.all(handles.map(h => h.getFile()));
		}

		return this.upload(...arguments);
	}

	async openDir({ persistent } = {}) {
		if (!('showDirectoryPicker' in window))
			throw new RangeError('Unsupported');

		const handle = await showDirectoryPicker({
			mode: persistent ? 'readwrite' : 'read'
		}).catch(err => {
			if (err.name !== 'AbortError') throw err;
			return null;
		});
		if (!handle) return;
		if (persistent) return handle;

		const handles = [];
		for await (const entry of handle.values()) {
			if (entry.kind !== 'file') continue;
			handles.push(entry);
		}
		return handles;
	}

	async save(data, filename, handle = null) {
		if (handle) {
			if (!await this.constructor.verifyPermission(handle, true))
				throw new RangeError('Insufficient permissions');

			return this.write(handle, data);
		}

		if ('showSaveFilePicker' in window)
			return this.saveAs(data, filename);

		return this.download(data, filename);
	}

	async saveAs(data, filename) {
		if (!('showSaveFilePicker' in window)) return this.save(data, filename);
		const handle = await showSaveFilePicker({
			suggestedName: filename,
			types: [{ description: this.defaultFileDescriptor, accept: { 'text/plain': ['.txt'] } }]
		}).catch(err => {
			if (err.name !== 'AbortError') throw err;
			return null;
		});
		if (!handle) return;
		return this.write(handle, data);
	}

	async upload({ multiple = false, types = ['.txt'] } = {}) {
		const picker = document.createElement('input');
		picker.type = 'file';
		picker.accept = types.join(',');
		picker.multiple = multiple;
		return new Promise(resolve => {
			picker.addEventListener('change', () => resolve([...picker.files]), { once: true, passive: true });
			picker.click();
		});
	}

	async write(handle, data) {
		const writable = await handle.createWritable();
		await writable.write(data);
		await writable.close();
		return handle;
	}

	// zip() {}

	static async verifyPermission(fileHandle, withWrite) {
		const opts = withWrite ? { mode: "readwrite" } : {};
		if ((await fileHandle.queryPermission(opts)) === "granted") return true;
		if ((await fileHandle.requestPermission(opts)) === "granted") return true;
		return false;
	}
}