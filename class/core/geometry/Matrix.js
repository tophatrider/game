export default class Matrix {
	a = 1;
	b = 0;
	c = 0;
	d = 1;
	tx = 0;
	ty = 0;
	translate(x, y) {
		this.tx += x;
		this.ty += y;
		return this;
	}

	scale(sx, sy) {
		this.a *= sx;
		this.d *= sy;
		return this;
	}

	rotate(angle) {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		const a = this.a, b = this.b, c = this.c, d = this.d;
		this.a = a * cos + c * sin;
		this.c = -a * sin + c * cos;
		this.b = b * cos + d * sin;
		this.d = -b * sin + d * cos;

		return this;
	}

	apply(vector) {
		return {
			x: vector.x * this.a + vector.y * this.c + this.tx,
			y: vector.x * this.b + vector.y * this.d + this.ty
		}
	}
}