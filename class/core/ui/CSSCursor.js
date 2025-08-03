const normalizeAttributes = attr => {
	const attributes = [];
	for (const key in attr) {
		let attrName = key.toLowerCase();
		switch (attrName) {
		case 'strokelinecap':
		case 'strokelinejoin':
		case 'strokewidth':
			attrName = attrName.replace(/^(\w{6})/, '$1-');
		}

		attributes.push([attrName, attr[key]]);
	}

	return attributes;
};
const stringifyAttributes = attr => attr.length > 0 ? ' ' + attr.map(([key, value]) => `${key}="${encodeURIComponent(value)}"`).join(' ') : '';

export default class CSSCursor {
	constructor(children, options = {}) {
		if (!Array.isArray(children))
			throw new TypeError('First positional argument, children, must be of type: Array');

		Object.defineProperties(this, {
			children: { value: [...children], writable: true },
			size: { value: 32, writable: true }
		});
		Object.assign(this, options);
	}

	addChild(tag, attributes) {
		this.children.push([tag, attributes]);
	}

	toSVG() {
		const masterAttributes = normalizeAttributes(this);

		let raw = '';
		for (const [tag, attr] of this.children) {
			const attributes = normalizeAttributes(attr);
			raw += `<${tag}${stringifyAttributes(attributes)}/>`;
		}

		return `<svg xmlns="http://www.w3.org/2000/svg"${stringifyAttributes(masterAttributes)} width="${this.size}" height="${this.size}">${raw}</svg>`;
	}

	toString() {
		const halfSize = this.size / 2;
		return `url('data:image/svg+xml;utf8,${this.toSVG()}') ${halfSize} ${halfSize}, auto`;
	}
}