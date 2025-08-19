export default class LineRenderer {
	#currentPosition = null;

	vertices = [];
	constructor(gl) {
		this.gl = gl;

		// Minimal vertex shader (positions in clip space)
		const vsSource = `
			attribute vec2 aPosition;
			void main() {
				gl_Position = vec4(aPosition, 0.0, 1.0);
			}
		`;

		// Minimal fragment shader (white color)
		const fsSource = `
			precision mediump float;
			void main() {
				gl_FragColor = vec4(0, 0, 0, 1);
			}
		`;

		this.program = this._createProgram(vsSource, fsSource);
		this.positionLocation = gl.getAttribLocation(this.program, "aPosition");

		this.buffer = gl.createBuffer();

		// State tracking for moveTo / lineTo
		this.#currentPosition = null;
	}

	_createShader(type, source) {
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			throw new Error(this.gl.getShaderInfoLog(shader));
		}
		return shader;
	}

	_createProgram(vsSource, fsSource) {
		const gl = this.gl;
		const vertexShader = this._createShader(gl.VERTEX_SHADER, vsSource);
		const fragmentShader = this._createShader(gl.FRAGMENT_SHADER, fsSource);
		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(gl.getProgramInfoLog(program));
		}
		return program;
	}

	moveTo(x, y) {
		const arr = new Float64Array(2);
		arr[0] = x;
		arr[1] = y;
		this.#currentPosition = arr;
	}

	lineTo(x, y) {
		if (this.#currentPosition === null) {
			this.moveTo(x, y);
			return;
		}
		// Add line vertices (from current position to new)
		this.vertices.push(...this.#currentPosition, x, y);
		this.moveTo(x, y);
	}

	clear() {
		this.vertices.splice(0);
		this.#currentPosition = null;
	}

	draw() {
		const gl = this.gl;
		if (this.vertices.length === 0) return;

		gl.useProgram(this.program);

		// Bind and upload vertices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STREAM_DRAW);

		// Enable attribute and set pointer
		gl.enableVertexAttribArray(this.positionLocation);
		gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

		// Draw lines
		gl.drawArrays(gl.LINES, 0, this.vertices.length / 2);

		gl.disableVertexAttribArray(this.positionLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}
}