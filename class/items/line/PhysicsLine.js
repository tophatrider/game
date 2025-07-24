import Vector from "../../core/math/Vector.js";
import Line from "./Line.js";

export default class extends Line {
	type = 'physics';
	collided = false;
	collide(part) {
		if (!this.collided) {
			this.collided = !0;

			let vectorToPart = null;
			let posDistance = part.real.diff(this.a);
			let diffVel = posDistance.diff(part.velocity);
			let relativePosOnLine = posDistance.dot(this.vector) / this.length / this.length; // ** 2;
			if (relativePosOnLine >= 0 && relativePosOnLine <= 1) {
				let perpendicularPosCross = posDistance.x * this.vector.y - posDistance.y * this.vector.x;
				let perpendicularVelCross = diffVel.x * this.vector.y - diffVel.y * this.vector.x;
				// passedThrough is negative if the part has gone through the line during the last real update
				let passedThrough = perpendicularPosCross * perpendicularVelCross < 0 ? -1 : 1;
				vectorToPart = posDistance.diff(this.vector.scale(relativePosOnLine));
				if ((vectorToPart.length < part.size || passedThrough < 0) && vectorToPart.length !== 0) {
					part.real.add(vectorToPart.scale((part.size * passedThrough - vectorToPart.length) / vectorToPart.length));
					part.drive(new Vector(-vectorToPart.y / vectorToPart.length, vectorToPart.x / vectorToPart.length));
				}
			} else if (relativePosOnLine * this.length >= -part.size && relativePosOnLine * this.length <= this.length + part.size) {
				let edge = relativePosOnLine > 0 ? this.b : this.a;
				vectorToPart = part.real.diff(edge);
				if (vectorToPart.length < part.size && vectorToPart.length !== 0) {
					part.real.add(vectorToPart.scale((part.size - vectorToPart.length) / vectorToPart.length));
					part.drive(new Vector(-vectorToPart.y / vectorToPart.length, vectorToPart.x / vectorToPart.length));
				}
			}
		}
	}
}