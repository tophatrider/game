import Vector from "../../core/geometry/Vector2.js";
import Line from "./Line.js";

export default class extends Line {
	static type = 'physics';

	collided = false;
	// collide(part) {
	// 	if (this.collided) return;
	// 	this.collided = !0;
	// 	const v = this.vector;
	// 	let vectorToPart;
	// 	let posDistance = part.real.clone().sub(this.a);
	// 	let relativePosOnLine = posDistance.dot(v) / this.length / this.length; // ** 2;
	// 	if (relativePosOnLine >= 0 && relativePosOnLine <= 1) {
	// 		let diffVel = posDistance.clone().sub(part.velocity);
	// 		let perpendicularPosCross = posDistance.x * v.y - posDistance.y * v.x;
	// 		let perpendicularVelCross = diffVel.x * v.y - diffVel.y * v.x;
	// 		// passedThrough is negative if the part has gone through the line during the last real update
	// 		let passedThrough = perpendicularPosCross * perpendicularVelCross < 0 ? -1 : 1;
	// 		vectorToPart = posDistance.sub(v.scale(relativePosOnLine));
	// 		if ((vectorToPart.length < part.size || passedThrough < 0) && vectorToPart.length !== 0) {
	// 			part.real.add(vectorToPart.clone().scale((part.size * passedThrough - vectorToPart.length) / vectorToPart.length));
	// 			part.drive(new Vector(-vectorToPart.y / vectorToPart.length, vectorToPart.x / vectorToPart.length));
	// 		}
	// 	} else if (relativePosOnLine * this.length >= -part.size && relativePosOnLine * this.length <= this.length + part.size) {
	// 		let edge = relativePosOnLine > 0 ? this.b : this.a;
	// 		vectorToPart = part.real.clone().sub(edge);
	// 		if (vectorToPart.length < part.size && vectorToPart.length !== 0) {
	// 			part.real.add(vectorToPart.clone().scale((part.size - vectorToPart.length) / vectorToPart.length));
	// 			part.drive(new Vector(-vectorToPart.y / vectorToPart.length, vectorToPart.x / vectorToPart.length));
	// 		}
	// 	}
	// }

	collide(part) {
		if (this.collided) return;
		this.collided = true;

		const v = this.vector;
		const len = this.length;
		const invLenSq = 1 / (len ** 2);

		// Reuse vectors to avoid allocations
		const posDistance = part.real.clone().sub(this.a);
		const relativePosOnLine = posDistance.dot(v) * invLenSq;

		if (relativePosOnLine >= 0 && relativePosOnLine <= 1) {
			const diffVel = posDistance.clone().sub(part.velocity);
			const perpendicularPosCross = posDistance.x * v.y - posDistance.y * v.x;
			const perpendicularVelCross = diffVel.x * v.y - diffVel.y * v.x;
			const passedThrough = perpendicularPosCross * perpendicularVelCross < 0 ? -1 : 1;

			const vectorToPart = posDistance.sub(v.clone().scale(relativePosOnLine));

			// Use squared length for the comparison
			const distSq = vectorToPart.x * vectorToPart.x + vectorToPart.y * vectorToPart.y;
			const size = part.size;
			if ((distSq < size * size || passedThrough < 0) && distSq !== 0) {
				const dist = Math.sqrt(distSq);
				part.real.add(vectorToPart.clone().scale((size * passedThrough - dist) / dist));
				part.drive(new Vector(-vectorToPart.y / dist, vectorToPart.x / dist));
			}

		} else if (relativePosOnLine * len >= -part.size && relativePosOnLine * len <= len + part.size) {
			const edge = relativePosOnLine > 0 ? this.b : this.a;
			const vectorToPart = part.real.clone().sub(edge);
			const distSq = vectorToPart.x * vectorToPart.x + vectorToPart.y * vectorToPart.y;
			const size = part.size;
			if (distSq < size * size && distSq !== 0) {
				const dist = Math.sqrt(distSq);
				part.real.add(vectorToPart.clone().scale((size - dist) / dist));
				part.drive(new Vector(-vectorToPart.y / dist, vectorToPart.x / dist));
			}
		}
	}
}