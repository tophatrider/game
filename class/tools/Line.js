import CSSCursor from "../core/ui/CSSCursor.js";
import Tool from "./Tool.js";

export default class extends Tool {
	static cursor = new CSSCursor('path', {
		d: 'M10 0 L10 20 M0 10 L20 10',
		size: 20,
		strokeLineCap: 'round',
		strokeWidth: 2
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
		this.anchors.size > 0 && (this.scene.cameraLock = true);
	}

	draw(ctx) {
		if (!this.scene.cameraLock || this.anchors.size < 1) return;
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
		if (!this.scene.cameraLock || this.anchors.size < 1) return;
		const pos = this.mouse.position.toPixel()
			, margin = 50
			, dirX = (pos.x > this.scene.parent.canvas.width - margin) - (pos.x < margin);
		if (dirX !== 0) {
			this.scene.camera.x += 4 / this.scene.zoom * dirX;
			this.mouse.position.x += 4 / this.scene.zoom * dirX;
		}

		const dirY = (pos.y > this.scene.parent.canvas.height - margin) - (pos.y < margin);
		if (dirY !== 0) {
			this.scene.camera.y += 4 / this.scene.zoom * dirY;
			this.mouse.position.y += 4 / this.scene.zoom * dirY;
		}
	}

	press(event, pointer) {
		// Disabled due to select-tool shortcut
		// if (event.ctrlKey) {
		// 	this.anchors.set(event.pointerId, this.old.clone());
		// 	return;
		// }

		this.anchors.set(event.pointerId, pointer.initial.toCanvas(this.scene.parent.canvas));
	}
}