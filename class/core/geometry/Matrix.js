export default class Matrix extends Float64Array {
	constructor() {
		super(6);
		this[0] = 1;
		this[1] = 0;
		this[2] = 0;
		this[3] = 1;
		this[4] = 0;
		this[5] = 0;
	}

	get a() { return this[0] }
	set a(v) { this[0] = v }
	get b() { return this[1] }
	set b(v) { this[1] = v }
	get c() { return this[2] }
	set c(v) { this[2] = v }
	get d() { return this[3] }
	set d(v) { this[3] = v }
	get tx() { return this[4] }
	set tx(v) { this[4] = v }
	get ty() { return this[5] }
	set ty(v) { this[5] = v }

	translate(x, y) {
		this.tx += x;
		this.ty += y;
		return this
	}

	scale(sx, sy) {
		this.a *= sx;
		this.d *= sy;
		return this
	}

	rotate(angle) {
		const cos = Math.cos(angle)
			, sin = Math.sin(angle)
			, a = this.a, b = this.b, c = this.c, d = this.d;

		this.a = a * cos + c * sin;
		this.c = -a * sin + c * cos;
		this.b = b * cos + d * sin;
		this.d = -b * sin + d * cos;

		return this
	}

	apply(vector) {
		return {
			x: vector.x * this.a + vector.y * this.c + this.tx,
			y: vector.x * this.b + vector.y * this.d + this.ty
		}
	}
}