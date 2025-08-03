import CSSCursor from "../core/ui/CSSCursor.js";
import Tool from "./Tool.js";

export default class extends Tool {
	static cursor = new CSSCursor([
		['path', {
			d: 'M10 0V20M0 10H20',
			strokeLineCap: 'round',
			strokeWidth: 2
		}]
	], {
		size: 20
	});

	anchors = new Map();
	old = null;
	scenery = false;
	clip(event, pointer) {
		if (!this.anchors.has(event.pointerId)) return;
		const anchor = this.anchors.get(event.pointerId);
		this.scene.addLine(anchor, pointer.position, this.scenery);
		this.old = pointer.position.toStatic();
		this.anchors.delete(event.pointerId);
		this.anchors.size > 0 && (this.scene.camera.locked = true);
	}

	draw(ctx) {
		if (!this.scene.camera.locked || this.anchors.size < 1) return;
		for (const pointer of this.mouse.pointers.filter(({ id }) => this.anchors.has(id))) {
			const anchor = this.anchors.get(pointer.id)
				, pos = pointer.position.toPixel();
			ctx.beginPath();
			const old = anchor.toPixel();
			ctx.moveTo(old.x, old.y);
			ctx.lineTo(pos.x, pos.y);
			const strokeStyle = ctx.strokeStyle;
			ctx.strokeStyle = pointer.position.distanceTo(anchor) >= 2 ? '#0f0' : '#f00';
			ctx.stroke();
			ctx.strokeStyle = strokeStyle;
		}
	}

	update() {
		if (!this.scene.camera.locked || this.anchors.size < 1) return;
		const pos = this.mouse.position.toPixel()
			, margin = 50
			, dirX = (pos.x > this.scene.game.canvas.width - margin) - (pos.x < margin);
		if (dirX !== 0) {
			const offset = 4 / this.scene.camera.zoom * dirX;
			this.scene.camera.move(offset, 0);
			this.mouse.position.x += offset;
			this.mouse.primary && (this.mouse.primary.position.x += offset);
		}

		const dirY = (pos.y > this.scene.game.canvas.height - margin) - (pos.y < margin);
		if (dirY !== 0) {
			const offset = 4 / this.scene.camera.zoom * dirY;
			this.scene.camera.move(0, offset);
			this.mouse.position.y += offset;
			this.mouse.primary && (this.mouse.primary.position.y += offset);
		}
	}

	press(event, pointer) {
		// Disabled due to select-tool shortcut
		// if (event.ctrlKey) {
		// 	this.anchors.set(event.pointerId, this.old.clone());
		// 	return;
		// }

		this.anchors.set(event.pointerId, pointer.initial.toCanvas(this.scene.game.canvas));
	}
}