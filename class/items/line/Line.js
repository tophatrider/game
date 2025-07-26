import Vector from "../../core/math/Vector.js";

export default class {
	constructor(t, e, i, s, n) {
		this.a = t instanceof Vector ? t : new Vector(t, e);
		this.b = e instanceof Vector ? e : new Vector(i, s);
		this.scene = n;
	}

	get vector() {
		return this.b.diff(this.a);
	}

	get length() {
		return this.vector.length;
	}

	draw(ctx, e, i) {
		ctx.beginPath();
		ctx.moveTo((this.a.x - e) * this.scene.zoom, (this.a.y - i) * this.scene.zoom);
		ctx.lineTo((this.b.x - e) * this.scene.zoom, (this.b.y - i) * this.scene.zoom);
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
}