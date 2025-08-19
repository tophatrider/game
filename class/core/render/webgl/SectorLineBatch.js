export default class SectorLineBatch {
	constructor(gl) {
		this.gl = gl;
		this.buffer = gl.createBuffer();
		this.count = 0;
	}

	setLines(points) {
		// WebGL doesn't accept Float64Array, so convert if necessary
		let gpuArray;
		if (points instanceof Float32Array) {
			gpuArray = points;
		} else if (points instanceof Float64Array || points instanceof Int32Array) {
			gpuArray = new Float32Array(points);
		} else {
			throw new Error('Points must be a typed array');
		}

		this.count = gpuArray.length / 2;

		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, gpuArray, gl.STATIC_DRAW);
	}

	draw(program, positionLocation) {
		const gl = this.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

		gl.drawArrays(gl.LINES, 0, this.count);
	}
}