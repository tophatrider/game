import Vector2 from "../../core/geometry/Vector2.js";

export default class {
	constructor(t, e, i, s, n) {
		Object.defineProperty(this, 'scene', { value: n, writable: true });
		// this.coords = new BigInt64Array(4);
		// this.coords[0] = BigInt(ax);
		// this.coords[1] = BigInt(ay);
		// this.coords[2] = BigInt(bx);
		// this.coords[3] = BigInt(by);
		this.a = t instanceof Vector2 ? t : new Vector2(t, e);
		this.b = e instanceof Vector2 ? e : new Vector2(i, s);
	}

	get vector() {
		return this.b.clone().sub(this.a);
	}

	get length() {
		return this.a.distanceTo(this.b);
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.a.x, this.a.y);
		ctx.lineTo(this.b.x, this.b.y);
		ctx.stroke();
	}

	erase(vector) {
		const v = this.vector;
		let b = vector.clone().sub(this.a).dot(v.clone().downScale(this.length));
		let c = new Vector2;
		if (b >= this.length) {
			c.set(this.b)
		} else {
			c.set(this.a);
			b > 0 && c.add(v.downScale(this.length).scale(b));
		}

		return vector.clone().sub(c).length <= this.scene.toolHandler.currentTool.size;
	}

	move(vector) {
		this.scene.sectors.removeItem(this);
		this.a.add(vector);
		this.b.add(vector);
		this.scene.sectors.addItem(this);
		if (arguments[1] !== false) {
			this.scene.history.record(
				() => this.move(Vector2.from(vector).scale(-1), false),
				() => this.move(vector, false)
			);
		}
	}

	serialize() {
		const buffer = new Int32Array(4);
		buffer[0] = this.a.x;
		buffer[1] = this.a.y;
		buffer[2] = this.b.x;
		buffer[3] = this.b.y;
		return {
			buffer,
			p1: this.a.serialize(),
			p2: this.b.serialize(),
			type: this.constructor.type
		}
	}

	remove() {
		this.scene.sectors.removeItem(this);
		this.removed = true;
		return this;
	}

	toString() {
		return this.a.toString() + ' ' + this.b.toString();
	}
}