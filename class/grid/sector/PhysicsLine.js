import Vector from "../../Vector.js";
import Line from "./Line.js";

export default class extends Line {
	type = 'physics';
	collided = false;
	collide(part) {
		if (this.collided) {
			return this;
		}

		this.collided = !0;
		var b = part.real,
			c = part.velocity,
			d = part.size,
			e = new Vector(0, 0),
			f = 0,
			e = b.difference(this.a),
			h = e.dot(this.vector) / this.len / this.len;
		if (0 <= h && 1 >= h && (c = 0 > (e.x * this.vector.y - e.y * this.vector.x) * ((e.x - c.x) * this.vector.y - (e.y - c.y) * this.vector.x) ? -1 : 1,
			e = e.difference(this.vector.scale(h)), f = e.length, (f < d || 0 > c) && (0 !== f)))
			return b.add(e.scale((d * c - f) / f)),
				part.drive(new Vector(-e.y / f, e.x / f)),
				this;
		if (h * this.len < -d || h * this.len > this.len + d)
			return this;
		e = b.difference(0 < h ? this.b : this.a);
		f = e.length;
		if (f < d && 0 !== f)
			return b.add(e.scale((d - f) / f)),
				part.drive(new Vector(-e.y / f, e.x / f)),
				this
	}
}