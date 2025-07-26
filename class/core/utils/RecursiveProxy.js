export default class RecursiveProxy {
	/**
	 * Creates a Proxy object.
	 * The Proxy object allows you to create an object that can be used in place of the original object,
	 * but which may redefine fundamental Object operations like getting, setting, and defining properties.
	 * Proxy objects are commonly used to log property accesses, validate, format, or sanitize inputs.
	 * @param {object} target A target object to wrap with Proxy.
	 * @param {object} handler An object whose properties define the behavior of Proxy when an operation is attempted on it.
	 * @param {function} [handler.get] getter
	 * @param {function} [handler.set] setter
	 */
	constructor(target, handler) {
		if ((typeof target != 'object' && target !== null) || (typeof handler != 'object' && handler !== null))
			throw new TypeError("Cannot create proxy with a non-object as target or handler");

		return target = new Proxy(target, {
			...handler,
			get(object, property) {
				let filtered = JSON.parse(JSON.stringify(object));
				if (typeof filtered[property] == 'object' && filtered[property] !== null) {
					object[property] = new Proxy(object[property], this);
				}

				if (typeof handler.get == 'function') {
					return handler.get.apply(target, arguments);
				}

				return Reflect.get(...arguments);
			},
			set() {
				if (typeof handler.set == 'function') {
					return handler.set.apply(target, arguments);
				}

				return Reflect.set(...arguments);
			},
			deleteProperty() {
				if (typeof handler.deleteProperty == 'function') {
					return handler.deleteProperty.apply(target, arguments);
				}

				return Reflect.deleteProperty(...arguments);
			}
		});
	}
}