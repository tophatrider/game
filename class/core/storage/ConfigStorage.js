import RecursiveProxy from "../utils/RecursiveProxy.js";
import { DEFAULTS } from "../constants.js";

const defaultsFilter = (key, value) => (typeof value == 'object' || DEFAULTS.hasOwnProperty(key)) ? value : void 0;

export default class ConfigStorage extends RecursiveProxy {
	static StorageKey = 'app.config';
	static Defaults = DEFAULTS;
	static DefaultsFilter = (key, value) => (typeof value == 'object' || DEFAULTS.hasOwnProperty(key)) ? value : void 0;

	constructor(listener) {
		if (typeof listener != 'function')
			throw new TypeError('First positional argument, "listener", must be of type: function');

		super(Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(ConfigStorage.StorageKey), defaultsFilter)), {
			set: (...args) => {
				const returnValue = Reflect.set(...args);
				localStorage.setItem(ConfigStorage.StorageKey, JSON.stringify(this, defaultsFilter));
				listener(this);
				return returnValue;
			},
			deleteProperty: (...args) => {
				const returnValue = Reflect.deleteProperty(...args);
				localStorage.setItem(ConfigStorage.StorageKey, JSON.stringify(this, defaultsFilter));
				listener(this);
				return returnValue;
			}
		});

		const handlePageHide = event => {
			if (!event.presistent) return;
			window.removeEventListener('pagehide', handlePageHide);
			window.removeEventListener('storage', handleStorage);
		};
		const handleStorage = event => {
			if (event.storageArea != localStorage || event.key !== ConfigStorage.StorageKey || event.oldValue === event.newValue || !event.newValue) return;
			const value = Object.assign({}, DEFAULTS, JSON.parse(event.newValue, defaultsFilter));
			Object.assign(this, value);
		};
		window.addEventListener('pagehide', handlePageHide);
		window.addEventListener('storage', handleStorage);
	}
}