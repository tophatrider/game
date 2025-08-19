import EventEmitter from "./EventEmitter.js";

export default class TrackParserBridge extends EventEmitter {
	worker = new Worker(new URL('./workers/parser.js', import.meta.url));
	constructor() {
		super();
		this.worker.addEventListener('message', this._handleMessage.bind(this));
	}

	_handleMessage({ data }) {
		const { cmd, payload } = data;
		switch (cmd) {
		case 'COMPLETE':
			this.emit('complete');
			break;
		case 'PARSED':
			this.emit('parsed', payload, data.partial);
			break;
		case 'PROGRESS':
			this.emit('progress', data.value, data.type);
		}
	}

	parse(code) {
		this.worker.postMessage({ cmd: 'PARSE', code });
	}

	dispose() {
		this.worker.terminate();
		this.worker = null;
	}
}