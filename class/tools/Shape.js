import BaseShape from "./BaseShape.js";

export default class extends BaseShape {
	length = 2;
	onScroll(event) {
		if (this.length > 4 && (0 < event.detail || event.wheelDelta < 0)) {
			this.length -= 8;
		} else if (this.length < 200 && (0 > event.detail || event.wheelDelta > 0)) {
			this.length += 8;
		}
	}
}