export default class CanvasPool {
	canvasPool = [];
	poolCap = 5e3;
	getCanvas() {
		let t = this.canvasPool.pop();
		return t ??= new OffscreenCanvas(0, 0)
	}

	releaseCanvas(t) {
		this.canvasPool.length < this.poolCap && this.canvasPool.push(t)
	}
}