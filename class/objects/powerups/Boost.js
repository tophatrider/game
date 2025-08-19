import Triangle from "./Directional.js";

export default class Boost extends Triangle {
	static color = '#ff0';
	static type = 'B';
	activate(part) {
		for (const point of part.parent.points)
			point.real.add(this.dir);
	}
}