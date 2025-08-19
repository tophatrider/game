// import CSSCursor from "../core/ui/CSSCursor.js";
import Tool from "./Tool.js";

export default class extends Tool {
	// static cursor = new CSSCursor([
	// 	['path', {
	// 		d: 'M10 0V20M0 10H20',
	// 		strokeLineCap: 'round',
	// 		strokeWidth: 2
	// 	}]
	// ], { size: 20  });

	anchors = new Map();
	old = null;
	scenery = false;
	onPress(event, pointer) {
		// Disabled ctrlKey due to select-tool shortcut
		if (event.altKey /* ctrlKey */) {
			this.anchors.set(event.pointerId, this.old.clone());
			return;
		}

		this.anchors.set(event.pointerId, this.scene.camera.toWorld(pointer.raw));
	}

	onClip(event, pointer) {
		if (!this.anchors.has(event.pointerId)) return;
		const anchor = this.anchors.get(event.pointerId);
		this.scene.track.addLine(anchor, this.scene.camera.toWorld(pointer.raw), this.scenery);
		this.old = pointer.raw.toStatic();
		this.anchors.delete(event.pointerId);
		this.anchors.size > 0 && (this.scene.camera.locked = true);
	}

	draw(ctx) {
		if (!this.scene.camera.locked || this.anchors.size < 1) return;
		for (const pointer of this.mouse.pointers.filter(({ id }) => this.anchors.has(id))) {
			const anchor = this.scene.camera.toScreen(this.anchors.get(pointer.id))
				, pos = pointer.raw;
			ctx.beginPath();
			ctx.moveTo(anchor.x, anchor.y);
			ctx.lineTo(pos.x, pos.y);
			const strokeStyle = ctx.strokeStyle;
			ctx.strokeStyle = pointer.raw.distanceTo(anchor) >= 2 ? '#0f0' : '#f00';
			ctx.stroke();
			ctx.strokeStyle = strokeStyle;
		}
	}

	update() {
		if (!this.scene.camera.locked || this.anchors.size < 1) return;
		let offsetX = 0, offsetY = 0;
		const pos = this.mouse.raw
			, margin = 50
			, maxSpeed = 7
			, dirX = (pos.x > this.scene.camera.viewportWidth - margin) - (pos.x < margin);
		if (dirX !== 0) {
			const deltaX = margin - (dirX > 0 ? this.scene.camera.viewportWidth - pos.x : pos.x);
			offsetX = maxSpeed * (deltaX / margin) / this.scene.camera.zoom * dirX;
		}

		const dirY = (pos.y > this.scene.camera.viewportHeight - margin) - (pos.y < margin);
		if (dirY !== 0) {
			const deltaY = margin - (dirY > 0 ? this.scene.camera.viewportHeight - pos.y : pos.y);
			offsetY = maxSpeed * (deltaY / margin) / this.scene.camera.zoom * dirY;
		}

		this.scene.camera.move(offsetX, offsetY);
	}
}