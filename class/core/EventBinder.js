export default class EventRelay {
	#handlers = [];
	#listening = false;
	listen(...args) {
		if (args.length > 0 && args[0] !== true) {
			const [, event, listener] = args
				, existingListener = this.#handlers.find(([, e, l]) => e === event && l === listener);
			if (existingListener) return;
			this.#handlers.push([...args]);
			if (!this.#listening) return;
		}

		for (const [target, ...args] of this.#handlers)
			target.addEventListener(...args);
	}

	unlisten(event) {
		if (this.#handlers.length <= 0) return;
		if (typeof event == 'string') {
			for (const entry of this.#handlers.filter(([, e]) => e === event)) {
				const [target, event, listener] = entry;
				this.#listening && target.removeEventListener(event, listener);
				this.#handlers.splice(this.#handlers.indexOf(entry), 1);
			}
			return;
		}

		for (const [target, event, listener] of this.#handlers)
			target.removeEventListener(event, listener);
		this.#handlers.splice(0);
	}

	dispose() {
		this.unlisten();
	}

	destroy() {
		this.dispose();
		this.#handlers.splice(0);
		this.#handlers = null;
	}
}