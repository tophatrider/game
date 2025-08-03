import Vector from "../../core/geometry/Vector.js";

export default class {
	constructor(t, e, i, s, n) {
		Object.defineProperty(this, 'scene', { value: n, writable: true });
		this.a = t instanceof Vector ? t : new Vector(t, e);
		this.b = e instanceof Vector ? e : new Vector(i, s);
	}

	get vector() {
		return this.b.diff(this.a);
	}

	get length() {
		return this.vector.length;
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.a.x, this.a.y);
		ctx.lineTo(this.b.x, this.b.y);
		ctx.stroke();
	}

	erase(vector) {
		let b = vector.diff(this.a).dot(this.vector.downScale(this.length));
		let c = new Vector();
		if (b >= this.length) {
			c.set(this.b)
		} else {
			c.set(this.a);
			b > 0 && c.add(this.vector.downScale(this.length).scale(b));
		}

		return vector.diff(c).length <= this.scene.toolHandler.currentTool.size;
	}

	move(vector) {
		this.scene.grid.removeItem(this);
		this.a.add(vector);
		this.b.add(vector);
		this.scene.grid.addItem(this);
		if (arguments[1] !== false) {
			this.scene.history.record(
				() => this.move(Vector.from(vector).scale(-1), false),
				() => this.move(vector, false)
			);
		}
	}

	remove() {
		this.scene.grid.removeItem(this);
		this.removed = true;
		return this;
	}

	toString() {
		return this.a.toString() + ' ' + this.b.toString();
	}

	toJSON() {
		return {
			p1: this.a.toJSON(),
			p2: this.b.toJSON(),
			type: this.type
		}
	}
}