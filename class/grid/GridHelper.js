self.lines = {};
self.powerups = {};
self.rows = new Map();
addEventListener('message', ({ data }) => {
	switch(data.cmd) {
	case 'CREATE_SECTOR': {
		let sector = self.sector(data.row, data.column, {
			width: data.width,
			height: data.height
		});
		// console.log(sector)
		break;
	}

	case 'CACHE_SECTOR': {
		// let sector = self.sector(data.row, data.column);
		// sector.ctx.clearRect(0, 0, sector.width, sector.height);
		// sector.ctx.strokeStyle = '#000';
		// for (const line of data.physics) {
		// 	sector.ctx.beginPath();
		// 	sector.ctx.moveTo(line.start.x, line.start.y);
		// 	sector.ctx.lineTo(line.end.x, line.end.y);
		// 	sector.ctx.stroke();
		// }

		// sector.ctx.strokeStyle = '#aaa';
		// for (const line of data.scenery) {
		// 	sector.ctx.beginPath();
		// 	sector.ctx.moveTo(line.start.x, line.start.y);
		// 	sector.ctx.lineTo(line.end.x, line.end.y);
		// 	sector.ctx.stroke();
		// }

		// self.postMessage({
		// 	event: 'SECTOR_CACHED',
		// 	row: data.row,
		// 	column: data.column,
		// 	image: sector.transferToImageBitmap()
		// });
		self.cacheSector(data.row, data.column, data);

		// self.postMessage({
		// 	event: 'SECTOR_CACHED',
		// 	row: data.row,
		// 	column: data.column
		// 	// image: ctx.canvas.transferToImageBitmap()
		// });
		break;
	}

	case 'INIT_SECTOR': {
		if (!self.rows.has(data.row)) {
			self.rows.set(data.row, new Map());
		}
	
		const row = self.rows.get(data.row);
		const ctx = data.offscreen.getContext('2d');
		ctx.canvas.width = data.size;
		ctx.canvas.height = data.size;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.strokeWidth = data.lineWidth;
		ctx.strokeStyle = data.strokeStyle;
		row.set(data.column, ctx);
		// console.log(data)
		break;
	}

	case 'RESIZE_SECTOR': {
		const ctx = self.rows.get(data.row)?.get(data.column);
		if (ctx) {
			ctx.canvas.width = data.size;
			ctx.canvas.height = data.size;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeWidth = data.lineWidth;
			ctx.strokeStyle = data.strokeStyle;
			self.cacheSector(data.row, data.column);
		}
		break;
	}

	case 'PARSE_TRACK': {
		const [physics, scenery, powerups] = String(data.code).split('#');
		physics && (self.lines['physics'] = parseLines(physics.split(/,+/g)));
		scenery && (self.lines['scenery'] = parseLines(scenery.split(/,+/g), 1));
		// if (!powerups) break;
		// for (let powerup of powerups) {
		// 	powerup = powerup.split(/\s+/g);
		// 	let x = parseInt(powerup[1], 32);
		// 	let y = parseInt(powerup[2], 32);
		// 	let a = parseInt(powerup[3], 32);
		// 	switch (powerup[0]) {
		// 		case 'T':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Target', args: [x, y] });
		// 			break;

		// 		case 'C':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Checkpoint', args: [x, y] });
		// 			break;

		// 		case 'B':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Boost', args: [x, y, a + 180] });
		// 			break;

		// 		case 'G':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Gravity', args: [x, y, a + 180] });
		// 			break;

		// 		case 'O':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Bomb', args: [x, y] });
		// 			break;

		// 		case 'S':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Slowmo', args: [x, y] });
		// 			break;

		// 		case 'A':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Antigravity', args: [x, y] });
		// 			break;

		// 		case 'W':
		// 			self.postMessage({ cmd: 'ADD_POWERUP', type: 'Teleporter', args: [x, y, a, parseInt(powerup[4], 32)] });
		// 			break;
		// 	}
		// }
		break;
	}

	case 'ADD_LINE':
		break;
	}
});

// self.scale = 100;
self.coords = function(vector) {
	return {
		x: Math.floor(vector.x / self.scale),
		y: Math.floor(vector.y / self.scale)
	}
}

self.findTouchingSectorCoords = function(from, to) {
	let sectors = [from];
	let initial = Object.assign({}, from);
	let factor = (to.y - from.y) / (to.x - from.x);
	let negativeX = from.x < to.x;
	let negativeY = from.y < to.y;
	let b = self.coords(to);
	for (let i = 0; i < 5e3; i++) {
		let a = self.coords(initial);
		if (a.x === b.x && a.y === b.y) {
			break;
		}

		let firstX = negativeX ? Math.round(Math.floor(initial.x / self.scale + 1) * self.scale) : Math.round(Math.ceil((initial.x + 1) / self.scale - 1) * self.scale) - 1;
		let firstY = Math.round(from.y + (firstX - from.x) * factor);
		let first = {
			x: firstX,
			y: firstY
		}

		let secondY = negativeY ? Math.round(Math.floor(initial.y / self.scale + 1) * self.scale) : Math.round(Math.ceil((initial.y + 1) / self.scale - 1) * self.scale) - 1;
		let secondX = Math.round(from.x + (secondY - from.y) / factor);
		let second = {
			x: secondX,
			y: secondY
		}

		let diff1 = {
			x: first.x - from.x,
			y: first.y - from.y
		}
		let diff2 = {
			x: second.x - from.x,
			y: second.y - from.y
		}
		if ((diff1.x ** 2 + diff1.y ** 2) < (diff2.x ** 2 + diff2.y ** 2)) {
			initial = first;
		} else {
			initial = second;
		}

		sectors.push(initial);
	}

	return sectors.map(vector => self.coords(vector));
}

self.findTouchingSectors = function() {
	return self.findTouchingSectorCoords(...arguments).map(vector => self.sector(vector.x, vector.y, true));
}

self.sector = function(x, y, options = {}) {
	if (!self.rows.has(x)) {
		self.rows.set(x, new Map());
	}

	const row = self.rows.get(x);
	if (!row.has(y)) {
		const canvas = new OffscreenCanvas(options.width ?? 100, options.height ?? 100);
		canvas.ctx = canvas.getContext('2d');
		canvas.ctx.lineCap = 'round';
		canvas.ctx.lineJoin = 'round';
		canvas.ctx.strokeWidth = '2px';
		row.set(y, canvas);
	}

	return row.get(y);
}

self.cacheSector = function(x, y, data) {
	let ctx = self.sector(x, y);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.strokeStyle = '#000';
	for (const line of data.physics) {
		ctx.beginPath();
		ctx.moveTo(line.start.x, line.start.y);
		ctx.lineTo(line.end.x, line.end.y);
		ctx.stroke();
	}

	ctx.strokeStyle = '#aaa';
	for (const line of data.scenery) {
		ctx.beginPath();
		ctx.moveTo(line.start.x, line.start.y);
		ctx.lineTo(line.end.x, line.end.y);
		ctx.stroke();
	}

	// self.postMessage({
	// 	event: 'SECTOR_CACHED',
	// 	row: data.row,
	// 	column: data.column
	// 	// image: ctx.canvas.transferToImageBitmap()
	// });
}

function parseLines(lines, scenery) {
	let combined = [];
	for (let line of lines) {
		let coords = line.split(/\s+/g);
		if (coords.length < 4) continue;
		for (let o = 0; o < coords.length - 2; o += 2) {
			let x = parseInt(coords[o], 32),
				y = parseInt(coords[o + 1], 32),
				l = parseInt(coords[o + 2], 32),
				c = parseInt(coords[o + 3], 32);
			isNaN(x + y + l + c) || (combined.push({ start: { x, y }, end: { x: l, y: c }, type: scenery ? 'scenery': 'physics', sectors: findTouchingSectorCoords({ x, y }, { x: l, y: c }) }) )//,
			// self.postMessage({ event: 'ADD_LINE', start: { x, y }, end: { x: l, y: c }, type: scenery ? 'scenery': 'physics', sectors: findTouchingSectorCoords({ x, y }, { x: l, y: c }) }))
			// if (!isNaN(x + y + l + c)) {
			// 	for (let sector of findTouchingSectorCoords({ x, y }, { x: l, y: c })) {
			// 		self.postMessage({ event: 'INSERT_LINE', start: { x, y }, end: { x: l, y: c }, type: scenery ? 'scenery': 'physics', sector });
			// 	}
			// }
		}
	}

	// determine line sector before hand
	console.log(combined)
	self.postMessage({ event: 'ADD_LINES', combined });
	return combined;
}