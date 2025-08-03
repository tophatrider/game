export default class Sector {
	column = null;
	row = null;
	physicsLines = [];
	sceneryLines = [];
	offscreen = grid.canvasPool.getCanvas();
	ctx = this.offscreen.getContext('2d');
	constructor(data) {
		Object.assign(this, data);
		// this.config();
	}

	async render() {
		// this.ctx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);
		this.ctx.clearRect(this.column, this.row, this.offscreen.width / config.zoom, this.offscreen.height / config.zoom);
		// this.ctx.fillRect(this.column, this.row, this.offscreen.width / config.zoom, this.offscreen.height / config.zoom);

		const sendBitmap = async (partial = false) => {
			const bitmap = snapshotCanvas(this.offscreen);
			postMessage({
				column: this.column,
				row: this.row,
				partial,
				bitmap
			}, [bitmap]);
		};
		const sendBitmapUpdate = () => sendBitmap(true);

		const sessionId = crypto.randomUUID();
		this.sessionId = sessionId;

		this.sceneryLines.length > 0 && await drawLinesInChunks(this.ctx, {
			lines: this.sceneryLines,
			strokeColor: config.palette.foreground,
			sector: this,
			sessionId
		}, sendBitmapUpdate);

		this.physicsLines.length > 0 && await drawLinesInChunks(this.ctx, {
			lines: this.physicsLines,
			strokeColor: config.palette.track,
			sector: this,
			sessionId
		}, sendBitmapUpdate);

		delete this.sessionId;
		sendBitmap(false);
	}

	config() {
		config.sectorSize !== this.offscreen.width && (this.offscreen.width = config.sectorSize);
		config.sectorSize !== this.offscreen.height && (this.offscreen.height = config.sectorSize);
		this.ctx.setTransform(config.zoom, 0, 0, config.zoom, -this.column * config.sectorSize, -this.row * config.sectorSize);
		this.ctx.strokeStyle = config.palette.track;
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
		this.ctx.lineWidth = 2;
	}

	draw() {
		// only draw added line -- no need to clear unless line is foreground
	}
}

async function drawLinesInChunks(ctx, {
	lines,
	sector,
	sessionId,
	strokeColor,
	timeout,
	chunkSize = 500,
	progressEvery = 1
}, onChunkDrawn) {
	if (!lines || lines.length < 1) return;
	return new Promise((resolve, reject) => {
		try {
			const len = lines.length
			let index = 0
			  , chunkCount = 0;
			strokeColor && (ctx.strokeStyle = strokeColor);
			const drawChunk = () => {
				if (sector.sessionId !== sessionId) return reject('Cancelled');

				const end = Math.min(index + chunkSize, len);
				ctx.beginPath();
				// Use Path2D for Polylines (lines with 3 or more points)
				for (; index < end; index++) {
					const { p1: s, p2: n } = lines[index];
					ctx.moveTo(s.x, s.y);
					ctx.lineTo(n.x, n.y);
				}

				ctx.stroke();

				const complete = index >= len;
				if (++chunkCount % progressEvery === 0 || complete) {
					onChunkDrawn?.();
				}

				if (!complete) {
					const timeoutId = setTimeout(drawChunk, 0);
					sector.timeout = timeoutId;
					sector.cancel = () => {
						clearTimeout(timeoutId);
						delete sector.timeout;
						delete sector.sessionId
					};
					timeout?.(timeoutId);
				} else {
					delete sector.timeout;
					resolve();
				}
			};
			drawChunk();
		} catch (err) {
			reject(err)
		}
	})
}

// Bug: await createImageBitmap(offscreen) can still flicker
// If you're trying to incrementally preview drawing progress, this can still cause visual flickering due to how createImageBitmap reads current GPU buffer state.
// Fix suggestion:
// Use the same snapshot(offscreen) strategy mentioned earlier:
function snapshotCanvas(offscreen) {
	const tmp = new OffscreenCanvas(offscreen.width, offscreen.height);
	tmp.getContext('2d').drawImage(offscreen, 0, 0);
	return tmp.transferToImageBitmap();
}




// Ignore white-spaces
function trimTransparentEdges(canvas) {
	const ctx = canvas.getContext('2d');
	const { width, height } = canvas;
	const imageData = ctx.getImageData(0, 0, width, height).data;

	let top = null, bottom = null, left = null, right = null;

	// Go row by row and column by column
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const alpha = imageData[(y * width + x) * 4 + 3];
			if (alpha !== 0) {
				if (top === null) top = y;
				bottom = y;
				if (left === null || x < left) left = x;
				if (right === null || x > right) right = x;
			}
		}
	}

	if (top === null) {
		// Fully transparent
		return null;
	}

	const trimmedWidth = right - left + 1;
	const trimmedHeight = bottom - top + 1;

	// Create new canvas with trimmed size
	const trimmed = document.createElement('canvas');
	trimmed.width = trimmedWidth;
	trimmed.height = trimmedHeight;
	const trimmedCtx = trimmed.getContext('2d');
	trimmedCtx.drawImage(canvas, left, top, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

	return {
		canvas: trimmed,
		offsetX: left,
		offsetY: top,
		width: trimmedWidth,
		height: trimmedHeight
	};
}