export default class Color extends Uint8ClampedArray {
	get [Symbol.toStringTag]() { return 'Color' }

	get hue() {
		const r = this.r / 255, g = this.g / 255, b = this.b / 255;
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		const delta = max - min;

		if (delta === 0) return 0;
		switch (max) {
		case r: return ((60 * ((g - b) / delta) + 360) % 360);
		case g: return ((60 * ((b - r) / delta) + 120) % 360);
		case b: return ((60 * ((r - g) / delta) + 240) % 360);
		}
	}

	set hue(deg) {
		this.setHSL(deg, this.saturation, this.lightness);
	}

	get saturation() {
		const r = this.r / 255, g = this.g / 255, b = this.b / 255;
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		const l = (max + min) / 2;
		const delta = max - min;
		return max === min ? 0 : delta / (1 - Math.abs(2 * l - 1) || 1);
	}

	set saturation(value) {
		this.setHSL(this.hue, value, this.lightness);
	}

	get lightness() {
		const r = this.r / 255, g = this.g / 255, b = this.b / 255;
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		return (max + min) / 2;
	}

	set lightness(value) {
		this.setHSL(this.hue, this.saturation, value);
	}

	get r() { return this[0] }
	set r(v) { this[0] = v }
	get g() { return this[1] }
	set g(v) { this[1] = v }
	get b() { return this[2] }
	set b(v) { this[2] = v }
	get a() { return this[3] }
	set a(v) { this[3] = v }

	/**
	 * 
	 * @param {any} [value]
	 */
	constructor() {
		super(4);
		this[3] = 255;
		this.set(...arguments);
	}

	clone() {
		return new this.constructor(this);
	}

	set(value) {
		if (Array.isArray(value) || ArrayBuffer.isView(value)) {
			super.set(value.map(v => Number(v) || 0));
			return;
		}

		if (typeof value == 'object' && value !== null) {
			return this.set([
				value.r ?? value.red ?? 0,
				value.g ?? value.green ?? 0,
				value.b ?? value.blue ?? 0,
				value.a ?? value.alpha ?? 255
			]);
		}

		if (isFinite(value)) {
			if (arguments.length >= 3) {
				this.set([...arguments].map(Number));
			} else {
				const num = Number(value) >>> 0;
				const a = (num & 0xFF000000) ? (num >> 24) & 0xFF : 255;
				const r = (num >> 16) & 0xFF;
				const g = (num >> 8) & 0xFF;
				const b = num & 0xFF;
				this.set([r, g, b, a]);
			}
			return;
		}

		if (typeof value == 'string') {
			value = value.trim();

			const hslMatch = value.match(/^hsla?\(([^)]+)\)$/i);
			if (hslMatch) {
				let [h, s, l, a = 1] = hslMatch[1].split(/\s*[\s,]\s*/).map(str => str.includes('%') ? parseFloat(str) / 100 : Number(str));
				this.setHSL(h, s, l);
				this.a = Math.round((a ?? 1) * 255);
				return;
			}

			const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
			if (rgbMatch) {
				let [r, g, b, a = 1] = rgbMatch[1].split(/\s*[\s,]\s*/).map(Number);
				a = Math.round((a ?? 1) * 255);
				this.set(r, g, b, a);
				return;
			}

			const hexMatch = value.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
			if (!hexMatch) throw new TypeError(`Unrecognized color input ${value}`);

			const bytes = [];
			if (hexMatch.length <= 4) {
				for (let c of hexMatch) bytes.push(parseInt(c + c, 16));
				if (hexMatch.length === 3) bytes.push(255); // default alpha
			} else {
				for (let i = 0; i < hexMatch.length; i += 2) bytes.push(parseInt(hexMatch[i] + hexMatch[i + 1], 16));
			}
			if (bytes.length === 3) bytes.push(255);
			super.set(bytes);
			return;
		}

		throw new TypeError(`Unrecognized color input ${value}`);
	}

	/**
	 * Set color via HSL
	 * @param {number} h Hue 0-360
	 * @param {number} s Saturation 0-1
	 * @param {number} l Lightness 0-1
	 */
	setHSL(h, s, l) {
		h = ((h % 360) + 360) % 360;
		s = Math.min(Math.max(s, 0), 1);
		l = Math.min(Math.max(l, 0), 1);

		const c = (1 - Math.abs(2 * l - 1)) * s;
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = l - c / 2;
		let r1, g1, b1;

		if (h < 60) [r1, g1, b1] = [c, x, 0];
		else if (h < 120) [r1, g1, b1] = [x, c, 0];
		else if (h < 180) [r1, g1, b1] = [0, c, x];
		else if (h < 240) [r1, g1, b1] = [0, x, c];
		else if (h < 300) [r1, g1, b1] = [x, 0, c];
		else [r1, g1, b1] = [c, 0, x];

		this.r = Math.round((r1 + m) * 255);
		this.g = Math.round((g1 + m) * 255);
		this.b = Math.round((b1 + m) * 255);
	}

	/**
	 * Set color via RGB
	 * @param {number} r 0-255
	 * @param {number} g 0-255
	 * @param {number} b 0-255
	 * @param {number} a 0-255
	 */
	setRGB(r, g, b, a = this.a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	/**
	 * Convert color to decimal value
	 * @param {boolean} [alpha] include alpha in decimal
	 * @returns {number}
	 */
	toDecimal(alpha = this.a !== 255) {
		return ((alpha ? this.a << 24 : 0) | (this.r << 16) | (this.g << 8) | this.b) >>> 0;
	}

	/**
	 * Convert color to hexadecimal value
	 * @returns {string}
	 */
	toHex(alpha = this.a !== 255) {
		return `#${this.r.toString(16).padStart(2, '0')}${this.g.toString(16).padStart(2, '0')}${this.b.toString(16).padStart(2, '0')}${alpha ? this.a.toString(16).padStart(2, '0') : ''}`;
	}

	/**
	 * Convert color to HSL value
	 * @returns {string}
	 */
	toHSL() {
		return [this.hue, this.saturation, this.lightness];
	}

	/**
	 * Convert color to RGB
	 * @returns {string}
	 */
	toRGB(alpha = this.a !== 255) {
		const values = Array.prototype.slice.call(this, 0, 3);
		alpha && values.push(this.a);
		return values;
	}

	/**
	 * Convert color to string
	 * @returns {string}
	 */
	toString(alpha = this.a !== 255) {
		const values = this.toRGB(...arguments);
		return `rgb${alpha ? 'a' : ''}(${values.join(', ')})`;
	}

	[Symbol.isConcatSpreadable] = true;
	[Symbol.match](string) {
		const escape = str => str.replace(/([()])/g, '\\$1');
		const regex = new RegExp(`^(?:${this.toDecimal(true)}|${this.toDecimal(false)}|${escape(this.toHex(true))}|${escape(this.toHex(false))}|${escape(this.toString(true))}|${escape(this.toString(false))})$`, 'i');
		return string.match(regex);
	}

	[Symbol.matchAll](string) {
		const escape = str => str.replace(/([()])/g, '\\$1');
		const regex = new RegExp(`(?:${this.toDecimal(true)}|${this.toDecimal(false)}|${escape(this.toHex(true))}|${escape(this.toHex(false))}|${escape(this.toString(true))}|${escape(this.toString(false))})`, 'gi');
		return string.matchAll(regex);
	}

	[Symbol.toPrimitive](hint) {
		if (hint === 'string') return this.toString();
		return this.toDecimal();
	}

	static from() {
		return new this(...arguments);
	}

	static [Symbol.match](string) {
		return string.match(/^(?:#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})|(?:hsl|rgb)(?:\(\d{1,3}(?:deg)?(?:\s*,?\s*\d{1,3}%?){2}|a\(\d{1,3}(?:deg)?(?:\s*,?\s*\d{1,3}%?){2}(?:\s*[\/,]\s*[\d\.]{1,3}%?))\))$/i);
	}

	static [Symbol.matchAll](string) {
		return string.matchAll(/(?:#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})|(?:hsl|rgb)(?:\(\d{1,3}(?:deg)?(?:\s*,?\s*\d{1,3}%?){2}|a\(\d{1,3}(?:deg)?(?:\s*,?\s*\d{1,3}%?){2}(?:\s*[\/,]\s*[\d\.]{1,3}%?))\))/gi);
	}

	static [Symbol.split](string) {
		return string.match(/(?<=^rgba?\()(\d{0,3}%?[\s,]+){2,3}\d{0,3}%?(?=\)$)/)?.[0].split(/[\s,]+/).map(parseFloat);
	}
}