import SectorLineBatch from "./SectorLineBatch.js";

export default class WebGLRenderer {
	constructor(canvas) {
		const gl = canvas.getContext('webgl', {
			antialias: true,
			alpha: true, // if you want transparency
			preserveDrawingBuffer: true // so snapshot works reliably
		});
		if (!gl) throw new Error("WebGL not supported");
		this.gl = gl;

		// Simple shaders
		const vsSource = `
			attribute vec2 aPosition;
			uniform mat4 uMatrix;
			void main() {
				gl_Position = uMatrix * vec4(aPosition, 0.0, 1.0);
			}
		`;
		const fsSource = `
			precision mediump float;
			uniform vec4 uColor;
			void main() {
				gl_FragColor = uColor;
			}
		`;

		this.program = this._createProgram(vsSource, fsSource);
		this.positionLocation = gl.getAttribLocation(this.program, 'aPosition');
		this.colorLocation = gl.getUniformLocation(this.program, 'uColor');
		this.matrixLocation = gl.getUniformLocation(this.program, 'uMatrix');

		// Pre-make some sectors
		this.sectors = [];
	}

	_createShader(type, src) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(shader));
		}
		return shader;
	}

	_createProgram(vs, fs) {
		const gl = this.gl;
		const vShader = this._createShader(gl.VERTEX_SHADER, vs);
		const fShader = this._createShader(gl.FRAGMENT_SHADER, fs);
		const program = gl.createProgram();
		gl.attachShader(program, vShader);
		gl.attachShader(program, fShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(gl.getProgramInfoLog(program));
		}
		return program;
	}

	addSector(float64Points) {
		const batch = new SectorLineBatch(this.gl);
		batch.setLines(float64Points);
		this.sectors.push(batch);
	}

	render(matrix, color = [0,0,0,1]) {
		const gl = this.gl;
		gl.useProgram(this.program);

		// Set background color to white
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
		gl.uniform4fv(this.colorLocation, color);

		for (const sector of this.sectors) {
			sector.draw(this.program, this.positionLocation);
		}
	}
}