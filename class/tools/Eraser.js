// import CSSCursor from "../core/ui/CSSCursor.js";
import Tool from "./Tool.js";

export default class extends Tool {
	// static cursor = new CSSCursor('circle', {
	// 	cx: 14,
	// 	cy: 14,
	// 	fill: '#ffb6c199',
	// 	r: 14,
	// 	size: 28
	// });

	// #size = 15;
	// get size() {
	// 	return this.#size;
	// }

	// set size(value) {
	// 	this.#size = value;
	// 	const cursor = this.constructor.cursor;
	// 	cursor.cx = value;
	// 	cursor.cy = value;
	// 	cursor.r = value;
	// 	cursor.size = value * 2;
	// 	this.parent._setCursor(cursor);
	// }

	size = 15;
	ignoring = new Set();
	onPress() {
		this.scene.track.erase(this.scene.camera.toWorld(this.mouse.raw));
	}

	onStroke() {
		this.mouse.down && this.scene.track.erase(this.scene.camera.toWorld(this.mouse.raw));
	}

	onScroll(event) {
		if (this.size > 5 && (0 < event.detail || 0 > event.wheelDelta)) {
			this.size -= 5;
		} else {
			if (40 > this.size && (0 > event.detail || 0 < event.wheelDelta)) {
				this.size += 5
			}
		}
	}

	draw(ctx) {
		ctx.beginPath();
		const { position } = this.mouse;
		ctx.arc(position.x, position.y, (this.size - 1) * this.scene.camera.zoom, 0, 2 * Math.PI);
		ctx.save();
		ctx.fillStyle = '#ffb6c199';
		ctx.fill();
		ctx.restore();
	}
}