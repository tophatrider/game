export default class RecursiveProxy {
	/**
	 * Creates a RecursiveProxy object.
	 * The RecursiveProxy object allows you to create an object that can be used in place of the original object,
	 * but which may redefine fundamental Object operations like getting, setting, and defining properties.
	 * Proxy objects are commonly used to log property accesses, validate, format, or sanitize inputs.
	 * @param {Object} target A target object to wrap with Proxy.
	 * @param {Object} handler An object whose properties define the behavior of Proxy when an operation is attempted on it.
	 * @param {boolean} [handler.cache] cache proxies
	 * @param {Function} [handler.deleteProperty] trap
	 * @param {Function} [handler.get] getter
	 * @param {boolean} [handler.precache] pre-cache proxies
	 * @param {Function} [handler.set] setter
	 */
	constructor(target, handler) {
		if ((typeof target != 'object' || target === null) || (typeof handler != 'object' || handler === null))
			throw new TypeError("Cannot create proxy with a non-object as target or handler");

		const cache = handler.cache !== false ? new WeakMap() : null;

		const wrap = obj => {
			if (typeof obj != 'object' || obj === null)
				return obj;

			if (cache && cache.has(obj))
				return cache.get(obj);

			const proxy = new Proxy(obj, {
				deleteProperty(...args) {
					if (typeof handler.deleteProperty == 'function') {
						const result = handler.deleteProperty(...args);
						if (result !== undefined)
							return result;
					}

					const value = Reflect.get(...args);
					if (cache && typeof value == 'object' && value !== null)
						cache.delete(value);

					return Reflect.deleteProperty(...args);
				},
				get(...args) {
					if (typeof handler.get == 'function') {
						const result = handler.get(...args);
						if (result !== undefined)
							return result;
					}

					const value = Reflect.get(...args);
					if (typeof value == 'object' && value !== null)
						return wrap(value);

					return value;
				},
				set(target, prop, value, receiver) {
					if (handler.precache !== false && typeof value == 'object' && value !== null)
						wrap(value);

					if (typeof handler.set == 'function') {
						const result = handler.set(target, prop, value, receiver);
						if (result !== undefined)
							return result;
					}

					return Reflect.set(target, prop, value, receiver);
				}
			});

			cache && cache.set(obj, proxy);

			return proxy;
		};

		if (handler.precache !== false) {
			for (const key in target) {
				const value = target[key];
				if (typeof value != 'object' || value === null) continue;
				wrap(value);
			}
		}

		return wrap(target);
	}
}