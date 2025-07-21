self.canvas = new OffscreenCanvas(0, 0);
addEventListener('message', ({ data }) => {
	if ('canvas' in data) {
		self.canvas = data.canvas;
		self.ctx = self.canvas.getContext('2d');
		return;
	}

	switch (data.cmd) {
	case 'PARSE_TRACK': {
		const [physics, scenery, powerups] = data.code.split('#');
		physics && parseLines(physics.split(/,+/g));
		scenery && parseLines(scenery.split(/,+/g), true);
		if (!powerups) break;
		for (let powerup of powerups) {
			powerup = powerup.split(/\s+/g);
			let x = parseInt(powerup[1], 32);
			let y = parseInt(powerup[2], 32);
			let a = parseInt(powerup[3], 32);
			switch (powerup[0]) {
				case 'T':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Target', args: [x, y] });
					break;

				case 'C':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Checkpoint', args: [x, y] });
					break;

				case 'B':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Boost', args: [x, y, a + 180] });
					break;

				case 'G':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Gravity', args: [x, y, a + 180] });
					break;

				case 'O':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Bomb', args: [x, y] });
					break;

				case 'S':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Slowmo', args: [x, y] });
					break;

				case 'A':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Antigravity', args: [x, y] });
					break;

				case 'W':
					self.postMessage({ cmd: 'ADD_POWERUP', type: 'Teleporter', args: [x, y, a, parseInt(powerup[4], 32)] });
					break;
			}
		}
		break;
	}

	case 'RENDER_SCENE':
		console.log(data)
	}
});

function parseLines(lines, scenery) {
	for (let line of lines) {
		line = line.split(/\s+/g);
		if (line.length < 4) continue;
		for (let o = 0; o < line.length - 2; o += 2) {
			let x = parseInt(line[o], 32),
				y = parseInt(line[o + 1], 32),
				l = parseInt(line[o + 2], 32),
				c = parseInt(line[o + 3], 32);
			isNaN(x + y + l + c) || self.postMessage({ cmd: 'ADD_LINE', args: [{ x, y }, { x: l, y: c }, scenery, false] })
		}
	}
}