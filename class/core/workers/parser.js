Object.defineProperty(self, 'CHUNK_SIZE', { value: 500, writable: true });

addEventListener('message', async ({ data }) => {
	switch (data.cmd) {
	case 'PARSE': {
		const match = data.code.match(/(?:[-\d\s,a-v]*#){2}[-\d\s,a-w]*(?:#(?:BMX|MTB))?(?:#\d+)?/i);
		if (match === null) break;
		const code = match[0].split('#');
		sceneryLines = await chunk.call(code[1].split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
			postMessage({ cmd: 'PROGRESS', type: 'sceneryLines', value: progress });
			const { buffer } = new Int32Array(chunkData);
			postMessage({
				cmd: 'PARSED',
				partial: true,
				payload: { sceneryLines: buffer },
				type: 'sceneryLines'
			}, [buffer]);
		});
		physicsLines = await chunk.call(code[0].split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
			postMessage({ cmd: 'PROGRESS', type: 'physicsLines', value: progress });
			const { buffer } = new Int32Array(chunkData);
			postMessage({
				cmd: 'PARSED',
				partial: true,
				payload: { physicsLines: buffer },
				type: 'physicsLines'
			}, [buffer]);
		});
		powerups = await chunk.call(code[2].split(/\s*,+\s*/g), processPowerup, (chunkData, { progress }) => {
			postMessage({ cmd: 'PROGRESS', value: progress });
			postMessage({
				cmd: 'PARSED',
				partial: true,
				payload: { powerups: chunkData },
				type: 'powerups'
			});
		});

		// Parallel parsing
		// const [physicsLines, sceneryLines, powerups] = await Promise.all([
		// 	chunk.call(code[1].split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
		// 		// postMessage({ cmd: 'PROGRESS', value: progress });
		// 		postMessage({
		// 			cmd: 'PROGRESS',
		// 			type: 'sceneryLines',
		// 			value: progress
		// 		});
		// 		const { buffer } = new Int32Array(chunkData);
		// 		postMessage({
		// 			cmd: 'PARSED',
		// 			partial: true,
		// 			payload: { sceneryLines: buffer },
		// 			type: 'scenery'
		// 		}, [buffer]);
		// 	}),
		// 	chunk.call(code[0].split(/\s*,+\s*/g), processLine, (chunkData, { progress }) => {
		// 		// postMessage({ cmd: 'PROGRESS', value: progress });
		// 		postMessage({
		// 			cmd: 'PROGRESS',
		// 			type: 'physicsLines',
		// 			value: progress
		// 		});
		// 		const { buffer } = new Int32Array(chunkData);
		// 		postMessage({
		// 			cmd: 'PARSED',
		// 			partial: true,
		// 			payload: { physicsLines: buffer },
		// 			type: 'track'
		// 		}, [buffer]);
		// 	}),
		// 	chunk.call(code[2].split(/\s*,+\s*/g), processPowerup, (chunkData, { progress }) => {
		// 		// postMessage({ cmd: 'PROGRESS', value: progress });
		// 		postMessage({
		// 			cmd: 'PROGRESS',
		// 			type: 'powerups',
		// 			value: progress
		// 		});
		// 		postMessage({
		// 			cmd: 'PARSED',
		// 			partial: true,
		// 			payload: { powerups: chunkData },
		// 			type: 'powerups'
		// 		});
		// 	})
		// ]);
		// postMessage({
		// 	cmd: 'PARSED',
		// 	payload: {
		// 		physicsLines,
		// 		sceneryLines,
		// 		powerups
		// 	}
		// });
		// postMessage({
		// 	cmd: 'PARSED',
		// 	partial: false
		// });
		postMessage({ cmd: 'COMPLETE' });
		break;
	}

	case 'TRANSLATE':
		// transformations
	}
});

function processLine(raw) {
	const line = raw.split(/\s+/g);
	if (line.length < 4) return false;

	const N = Math.floor(line.length / 2)
		, lines = new Int32Array(4 * (N - 1));

	let index = 0
	for (let i = 0; i < N - 1; i++) {
		const x1 = parseInt(line[2 * i], 32)
			, y1 = parseInt(line[2 * i + 1], 32)
			, x2 = parseInt(line[2 * (i + 1)], 32)
			, y2 = parseInt(line[2 * (i + 1) + 1], 32);

		if (isNaN(x1 + y1 + x2 + y2)) continue;

		lines[index++] = x1;
		lines[index++] = y1;
		lines[index++] = x2;
		lines[index++] = y2;
	}

	if (index === lines.length) return lines;
	return lines.subarray(0, index)
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

	return new Int32Array(lines);
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
		if (Array.isArray(processed) || ArrayBuffer.isView(processed)) chunkData.push(...processed);
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