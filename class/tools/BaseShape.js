import Line from "./Line.js";

export default class extends Line {
	lines = [];
	onClip() {
		this.lines.splice(0);
	}
}