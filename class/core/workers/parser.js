Object.defineProperty(self, 'CHUNK_SIZE', { value: 500, writable: true });

addEventListener('message', async ({ data }) => {
	switch (data.cmd) {
	case 'PARSE': {
		const match = data.code.match(/(?:[-\d\s,a-v]*#){2}[-\d\s,a-w]*(?:#(?:BMX|MTB))?(?:#\d+)?/i);
		if (match === null) break;
		const code = match[0].split('#');
		// physicsLines = await chunk.call(physicsLines.split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
		// 	postMessage({ cmd: 'PROGRESS', value: progress });
		// 	postMessage({
		// 		cmd: 'PARSED',
		// 		payload: { physicsLines: chunkData }
		// 	});
		// });
		// sceneryLines = await chunk.call(sceneryLines.split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
		// 	postMessage({ cmd: 'PROGRESS', value: progress });
		// 	postMessage({
		// 		cmd: 'PARSED',
		// 		payload: { sceneryLines: chunkData }
		// 	});
		// });
		// powerups = await chunk.call(powerups.split(/\s*,+\s*/g), processPowerup, (chunkData, { progress }) => {
		// 	postMessage({ cmd: 'PROGRESS', value: progress });
		// 	postMessage({
		// 		cmd: 'PARSED',
		// 		payload: { powerups: chunkData }
		// 	});
		// });

		// Parallel parsing
		const [physicsLines, sceneryLines, powerups] = await Promise.all([
			chunk.call(code[0].split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
				// postMessage({ cmd: 'PROGRESS', value: progress });
				postMessage({
					cmd: 'PROGRESS',
					type: 'physicsLines',
					value: progress
				});
				postMessage({
					cmd: 'PARSED',
					partial: true,
					payload: { physicsLines: chunkData }
				});
			}),
			chunk.call(code[1].split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
				// postMessage({ cmd: 'PROGRESS', value: progress });
				postMessage({
					cmd: 'PROGRESS',
					type: 'sceneryLines',
					value: progress
				});
				postMessage({
					cmd: 'PARSED',
					partial: true,
					payload: { sceneryLines: chunkData }
				});
			}),
			chunk.call(code[2].split(/\s*,+\s*/g), processPowerup, (chunkData, { progress }) => {
				// postMessage({ cmd: 'PROGRESS', value: progress });
				postMessage({
					cmd: 'PROGRESS',
					type: 'powerups',
					value: progress
				});
				postMessage({
					cmd: 'PARSED',
					partial: true,
					payload: { powerups: chunkData }
				});
			})
		]);
		// postMessage({
		// 	cmd: 'PARSED',
		// 	payload: {
		// 		physicsLines,
		// 		sceneryLines,
		// 		powerups
		// 	}
		// });
		postMessage({
			cmd: 'PARSED',
			partial: false
		});
		break;
	}

	case 'TRANSLATE':
		// transformations
	}
});

function processLine(raw) {
	const line = raw.split(/\s+/g);
	if (line.length < 4) return false;
	const lines = [];
	for (let o = 0; o < line.length - 2; o += 2) {
		let x = parseInt(line[o], 32),
			y = parseInt(line[o + 1], 32),
			l = parseInt(line[o + 2], 32),
			c = parseInt(line[o + 3], 32);
		isNaN(x + y + l + c) || lines.push([{ x, y }, { x: l, y: c }])
	}

	return lines;
}

function processPowerup(raw) {
	const powerups = [];
	const powerup = raw.split(/\s+/g);
	let x = parseInt(powerup[1], 32);
	let y = parseInt(powerup[2], 32);
	let a = parseInt(powerup[3], 32);
	switch (powerup[0]) {
	case 'T':
		powerups.push({ type: 'Target', args: [x, y] });
		break;
	case 'C':
		powerups.push({ type: 'Checkpoint', args: [x, y] });
		break;
	case 'B':
		powerups.push({ type: 'Boost', args: [x, y, a + 180] });
		break;
	case 'G':
		powerups.push({ type: 'Gravity', args: [x, y, a + 180] });
		break;
	case 'O':
		powerups.push({ type: 'Bomb', args: [x, y] });
		break;
	case 'S':
		powerups.push({ type: 'Slowmo', args: [x, y] });
		break;
	case 'A':
		powerups.push({ type: 'Antigravity', args: [x, y] });
		break;
	case 'W':
		powerups.push({ type: 'Teleporter', args: [x, y, a, parseInt(powerup[4], 32)] });
	}

	return powerups;
}

function parseLines(raw) {
	if (raw.length < 1) return [];
	const lines = [];
	for (const lineData of raw.split(/\s*,+\s*/g))
		lines.push(...processLine(lineData));

	return lines;
}

function parsePowerups(raw) {
	if (raw.length < 1) return [];
	const powerups = [];
	for (const powerupData of raw.split(/\s*,+\s*/g))
		powerups.push(...processPowerup(powerupData));

	return powerups;
}

async function chunk(processChunk, chunkComplete, index = 0, result = []) {
	if (!Array.isArray(this) || this.length === 0) return result;

	const chunkData = [];

	let chunkSize = CHUNK_SIZE;
	while (chunkSize-- && index < this.length) {
		const processed = processChunk(this[index++]);
		if (processed === false) continue;
		if (Array.isArray(processed)) chunkData.push(...processed);
		else chunkData.push(processed);
	}

	result.push(...chunkData);

	const progress = index / this.length * 100
		, complete = index >= this.length;
	if (chunkComplete?.(chunkData, { progress, complete }) === false || complete) return result;
	return new Promise((res, rej) => {
		setTimeout(() =>
			chunk.call(this, processChunk, chunkComplete, index, result)
				.then(res)
				.catch(rej)
		, 0);
	});
}