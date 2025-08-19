export default class HUDRenderer {
	_cache = {
		textMetrics: new Map(),   // key: text string, value: resolvedText object
		sortedTargets: null,      // last sorted array
		lastTargetsVersion: 0     // track when targets change
	};

	constructor(scene) {
		Object.defineProperty(this, 'scene', { value: scene, writable: true });
	}

	calculateRemainingDistance(player) {
		const targets = this.scene.track.powerupTypes['T'];
		const nearestTargets = [...targets].sort((a, b) => a.position.distanceTo(player.hitbox.pos) - b.position.distanceTo(player.hitbox.pos));
		const consumedTargets = nearestTargets.filter(item => player.itemsConsumed.has(item.id));
		const lastConsumedTargetId = player.itemsConsumed.size > 0 && player.itemsConsumed.values().toArray().filter(itemId => targets.find(({ id }) => id === itemId)).at(-1);
		const lastConsumedTarget = lastConsumedTargetId && consumedTargets.find(({ id }) => id === lastConsumedTargetId) || { position: this.scene.camera.toWorld(0, 0) };
		const unusedTargets = nearestTargets.filter(item => !consumedTargets.includes(item));
		const nearestTarget = unusedTargets.length > 0 && unusedTargets[0];
		const goal = nearestTarget && lastConsumedTarget.position.distanceTo(nearestTarget.position);
		const progress = nearestTarget && player.hitbox.pos.distanceTo(nearestTarget.position);
		return progress / goal
	}

	render(ctx) {
		ctx.save();
		if (this.scene.pictureMode) {
			this.renderPictureMode(ctx);
		} else if (!this.scene.transformMode) { // this.scene.track.mode !== Track.Modes.Transform
			this.renderStatus(ctx);
			this.scene.track.targets > 0 && this.scene.camera.controller.focalPoint && this.renderTargetProgress(ctx);
			this.scene.ghosts.length > 0 && this.renderGhosts(ctx);
			this.renderDebug(ctx);
		}
		ctx.restore();
	}

	renderPictureMode(ctx) {
		const dpr = window.devicePixelRatio;
		const { camera, pictureMode } = this.scene;
		const x = (camera.viewportWidth / 2 - pictureMode.width / 2) * dpr
			, y = (camera.viewportHeight / 2 - pictureMode.height / 2) * dpr;
		const imageData = ctx.getImageData(x, y, pictureMode.width * dpr, pictureMode.height * dpr);

		ctx.fillStyle = 'hsla(0, 0%, 0%, 0.4)';
		ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
		ctx.lineWidth = 2;
		ctx.strokeRect(
			camera.viewportWidth / 2 - pictureMode.width / 2 - ctx.lineWidth / 2,
			camera.viewportHeight / 2 - pictureMode.height / 2 - ctx.lineWidth / 2,
			pictureMode.width + ctx.lineWidth,
			pictureMode.height + ctx.lineWidth
		);

		ctx.putImageData(imageData, x, y);

		ctx.fillStyle = 'red';
		let fontSize = Math.max(
			12,
			Math.min(16, Math.min(camera.viewportWidth, camera.viewportHeight) * (4 / 100))
		);
		ctx.font = fontSize + 'px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(
			'Use your mouse to drag & fit an interesting part of your track in the thumbnail',
			camera.viewportWidth / 2,
			camera.viewportHeight * (2 / 100)
		);
	}

	renderStatus(ctx) {
		const camera = this.scene.camera;
		const fill = ctx.fillStyle;
		ctx.font = `bold 16px Arial`;
		// replace with message display system
		let text = this.scene.timeText;
		if (this.scene.track.processing) {
			text = "Loading, please wait... " + Math.floor((this.scene.track.physicsProgress + this.scene.track.sceneryProgress) / 2);
		} else if (this.scene.paused) {
			text += " - Game paused";
		} else if (this.scene.firstPlayer && this.scene.firstPlayer.dead && camera.controller.focalPoint == this.scene.firstPlayer.hitbox) {
			text = "Press ENTER to restart";
			if (this.scene.firstPlayer.snapshots.length > 1) {
				text += " or BACKSPACE to cancel Checkpoint"
			}
		} else if (this.scene.track.writable) {
			text += " - " + this.scene.toolHandler.selected.replace(/^\w/, char => char.toUpperCase());
			if (this.scene.toolHandler.selected === 'brush') {
				text += " ( size " + this.scene.toolHandler.currentTool.length + " )";
			}
		}

		const textContainer = this.constructor.resolveText(ctx, text, { padding: 6 })
			, x = camera.viewportWidth / 2 - textContainer.width / 2
			, y = camera.viewportHeight - textContainer.height - 40;
		ctx.beginPath();
		ctx.roundRect(x, y, textContainer.width, textContainer.height, 40);
		ctx.strokeStyle = 'hsl(0deg 0% 50% / 15%)';
		ctx.lineWidth = 1.5;
		ctx.stroke();
		ctx.fill();
		ctx.fillStyle = this.scene.game.colorScheme.palette.track;
		ctx.fillText(textContainer.text, x + textContainer.padding * 1.5, y + textContainer.height / 2);
		ctx.fillStyle = fill;
	}

	renderTargetProgress(ctx) {
		const camera = this.scene.camera
			, track = this.scene.track;
		const fill = ctx.fillStyle;
		ctx.font = 'bold 12px Arial';
		const text = this.scene.firstPlayer.targetsCollected + ' / ' + track.targets
			, textContainer = this.constructor.resolveText(ctx, text, { padding: 4 });
		textContainer.width = Math.max(textContainer.width + textContainer.padding * 3, Math.min(800, camera.viewportWidth / 4));
		const x = camera.viewportWidth / 2 - textContainer.width / 2;
		const y = 12;
		ctx.beginPath();
		ctx.roundRect(x, y, textContainer.width, textContainer.height, 40);
		ctx.strokeStyle = 'hsl(0deg 0% 50% / 15%)';
		ctx.stroke();
		ctx.fill();

		const playerInFocus = camera.controller.focalPoint === this.scene.firstPlayer.hitbox ? this.scene.firstPlayer : this.scene.ghostInFocus;
		const maxWidth = textContainer.width - textContainer.padding;
		const valueWidth = maxWidth * (this.scene.firstPlayer.targetsCollected / track.targets);
		const targets = track.powerupTypes['T'];
		const quadrantWidth = targets && maxWidth / targets.length;
		const calculatedDistanceRemaining = targets && targets.length > 0 && this.calculateRemainingDistance(playerInFocus);
		const predictedAdditionalValueWidth = calculatedDistanceRemaining && Math.max(0, Math.min(quadrantWidth, quadrantWidth - calculatedDistanceRemaining * quadrantWidth));
		ctx.beginPath();
		ctx.roundRect(x + textContainer.padding, y + textContainer.padding, valueWidth + predictedAdditionalValueWidth, textContainer.height - textContainer.padding * 2, textContainer.height);
		ctx.fillStyle = 'hsl(40deg 50% 50% / 50%)';
		ctx.fill();

		ctx.fillStyle = this.scene.game.colorScheme.palette.track;
		ctx.fillText(textContainer.text, x + textContainer.width / 2 - textContainer.padding * 3, y + textContainer.height / 2);
		ctx.fillStyle = fill;
	}

	renderGhosts(ctx) {
		const camera = this.scene.camera
			, ghosts = this.scene.ghosts;
		const fill = ctx.fillStyle
			, textAlign = ctx.textAlign;
		ctx.font = `11px Arial`;
		ctx.textAlign = 'right';
		for (const index in ghosts) {
			const playerGhost = ghosts[index];
			const isInFocus = camera.controller.focalPoint === playerGhost.hitbox;
			ctx.globalAlpha = isInFocus ? .85 : .5;
			const text = (playerGhost.name || 'Ghost') + (playerGhost.targetsCollected === this.scene.track.targets ? " finished!" : ": " + playerGhost.targetsCollected + " / " + this.scene.track.targets)
				, textContainer = this.constructor.resolveText(ctx, text, { padding: 2 })
				, x = camera.viewportWidth - 12
				, top = 8
				, gap = 10
				, y = top + textContainer.height * index + index * gap;
			ctx.beginPath();
			ctx.roundRect(x - textContainer.width, y, textContainer.width + textContainer.padding * 2, textContainer.height + textContainer.padding * 2, 40);
			ctx.strokeStyle = 'hsl(0deg 0% 50% / 20%)' // if ghost is in focus, make it apparent
			ctx.fill();
			ctx.fillStyle = this.scene.game.colorScheme.palette.track;
			ctx.fillText(textContainer.text, x - textContainer.padding, y + textContainer.height / 2 + textContainer.padding);
			ctx.fillStyle = fill;
		}

		ctx.globalAlpha = 1;
		ctx.textAlign = textAlign;
	}

	renderDebug(ctx) {
		// ctx.font = `10px sans-serif`;
		if (this.scene.game.settings.displayFPS) {
			ctx.font = `10px sans-serif`;
			const fill = ctx.fillStyle;
			ctx.fillStyle = this.scene.game.colorScheme.palette.track;
			ctx.fillText(`${this.scene.game.stats.fps} FPS`, 8, 16);
			ctx.fillStyle = fill;
		}
	}

	static resolveText(ctx, text, { padding = 5 } = {}) {
		const textMetrics = ctx.measureText(text);
		return {
			padding, text,
			width: textMetrics.width + padding * 3,
			height: (textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent) + padding * 2
		}
	}

	// static renderText(ctx, text, x, y, { padding = 5 } = {}) {
	// 	const textMetrics = ctx.measureText(text)
	// 		, width = textMetrics.width + padding * 3
	// 		, height = (textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent) + padding * 2;
	// 	ctx.beginPath();
	// 	ctx.roundRect(x, y, width, height, 40);
	// 	ctx.strokeStyle = 'hsl(0deg 0% 50% / 15%)';
	// 	ctx.lineWidth = 1.5;
	// 	ctx.stroke();
	// 	ctx.fill();
	// 	ctx.fillText(i, x + padding * 1.5, y + height / 2);
	// }
}