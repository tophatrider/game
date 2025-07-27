export default class {
	/** @private */
	#events = new Map();
	#temp = new WeakSet();

	/**
	 * 
	 * @private
	 * @param {string} event 
	 * @param  {...any} [args] 
	 */
	emit(event, ...args) {
		const listeners = this.#events.get(event);
		if (!listeners) return;
		for (const listener of listeners) {
			listener.apply(this, args);
			if (this.#temp.delete(listener)) {
				listeners.delete(listener);
			}
		}
	}

	/**
	 * 
	 * @private
	 * @param {Array<string>} events 
	 * @param {...any} [args] 
	 */
	emits(events, ...args) {
		if (typeof events[Symbol.iterator] != 'function') {
			throw new TypeError("Events must be of type: Iterable<string>");
		}

		events.forEach(event => this.emit(event, ...args));
	}

	/**
	 * 
	 * @param {string} event 
	 * @param {Function} listener 
	 * @returns {number}
	 */
	on(event, listener) {
		if (typeof event != 'string') {
			throw new TypeError("Event must be of type: string");
		} else if (typeof listener != 'function') {
			throw new TypeError("Listener must be of type: Function");
		}

		if (!this.#events.has(event)) {
			this.#events.set(event, new Set());
		}

		const events = this.#events.get(event);
		return events.add(listener),
			events.size;
	}

	/**
	 * 
	 * @param {string} event 
	 * @param {Function} listener 
	 * @returns {Function}
	 */
	once(event, listener) {
		const size = this.on(...arguments);
		this.#temp.add(listener);
		return size;
	}

	/**
	 * 
	 * @param {string} event 
	 * @returns {Set}
	 */
	listeners(event) {
		return this.#events.get(event) || new Set();
	}

	/**
	 * 
	 * @param {string} event 
	 * @returns {number}
	 */
	listenerCount(event) {
		return this.listeners(event).size;
	}

	/**
	 * Removes any or all listeners
	 * @param {string?} [event] 
	 * @param {Function?} [listener] 
	 * @returns {boolean}
	 */
	off(event, listener = null) {
		if (typeof event != 'string') {
			if (this.#events.size < 1) return false;
			this.#events.clear();
			return true;
		}

		const listeners = this.#events.get(event);
		if (!listeners || listeners.size < 1) return false;
		if (typeof listener != 'function') {
			for (const listener of listeners)
				this.#temp.delete(listener);
			listeners.clear();
			this.#events.delete(event);
			return true;
		}

		const removed = listeners.delete(listener);
		removed && this.#temp.delete(listener);
		if (listeners.size === 0) this.#events.delete(event);
		return removed;
	}

	/**
	 * 
	 * @param {string} event 
	 * @param {Function} listener 
	 * @returns {boolean}
	 */
	removeListener(event, listener) {
		if (typeof event != 'string') {
			throw new TypeError("Event must be of type: string");
		}

		const listeners = this.#events.get(event);
		if (listeners !== void 0) {
			listeners.delete(listener);
		}

		return true;
	}

	/**
	 * 
	 * @param {string} event 
	 * @returns {boolean}
	 */
	removeAllListeners(event) {
		if (typeof event != 'string') {
			throw new TypeError("Event must be of type: string");
		}

		return this.#events.delete(event);
	}

	dispose() {
		this.#events.clear();
		this.#temp = new WeakSet();
	}

	destroy() {
		this.dispose();
		this.#events = null;
		this.#temp = null;
	}
}