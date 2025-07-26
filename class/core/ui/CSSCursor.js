export default class CSSCursor {
	constructor(tag, options = {}) {
		Object.defineProperties(this, {
			size: { value: 32, writable: true },
			tag: { value: tag || 'path', writable: true }
		});
		Object.assign(this, options);
	}

	toString() {
		const masterAttributes = [];
		for (const key in this) {
			let attrName = key;
			switch (key.toLowerCase()) {
			case 'strokelinecap':
				attrName = 'stroke-linecap';
				break;
			case 'strokelinejoin':
				attrName = 'stroke-linejoin';
				break;
			case 'strokewidth':
				attrName = 'stroke-width';
			}

			masterAttributes.push([attrName, this[key]]);
		}

		const raw = `<${this.tag}${masterAttributes.length > 0 ? ' ' + masterAttributes.map(([key, value]) => `${key}="${encodeURIComponent(value)}"`).join(' ') : ''}/>`
			, halfSize = this.size / 2;
		return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}">${raw}</svg>') ${halfSize} ${halfSize}, auto`;
	}
}