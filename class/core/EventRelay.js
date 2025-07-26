import EventEmitter from "./EventEmitter.js";

export default class EventRelay extends EventEmitter {
	#handlers = [];
	listen(...args) {
		if (args.length > 0 && args[0] !== true) {
			this.#handlers.push([...args]);
			return;
		}

		for (const [target, ...args] of this.#handlers)
			target.addEventListener(...args);
	}

	unlisten(event) {
		if (this.#handlers.length <= 0) return;
		if (typeof event == 'string') {
			for (const entry of this.#handlers.filter(([, e]) => e === event)) {
				const [target, event, listener] = entry;
				target.removeEventListener(event, listener);
				this.#handlers.splice(this.#handlers.indexOf(entry), 1);
			}
			return;
		}

		for (const [target, event, listener] of this.#handlers)
			target.removeEventListener(event, listener);
		this.#handlers.splice(0);
	}
}