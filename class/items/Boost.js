import Triangle from "./Directional.js";

export default class Boost extends Triangle {
	type = 'B';
	static color = '#ff0';
	activate(part) {
		for (const point of part.parent.points)
			point.real.add(this.dir);
	}
}