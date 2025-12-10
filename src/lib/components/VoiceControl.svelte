<script>
	import { Mic, MicOff, Loader2 } from '@lucide/svelte';
	import { browser } from '$app/environment';

	let {
		onCocktailSelected,
		onCustomCocktailSelected
	} = $props();

	let isRecording = $state(false);
	let isProcessing = $state(false);
	let errorMessage = $state('');

	let mediaRecorder = null;
	let stream = null;
	let chunks = [];

	// Audio visualization
	let audioContext = null;
	let analyser = null;
	let dataArray = null;
	let animationId = null;
	let audioLevels = $state([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
	let smoothedLevels = [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2];

	function setupAudioVisualization(audioStream) {
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;

		const source = audioContext.createMediaStreamSource(audioStream);
		source.connect(analyser);

		const bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);

		updateAudioLevels();
	}

	function updateAudioLevels() {
		if (!analyser || !isRecording) return;

		animationId = requestAnimationFrame(updateAudioLevels);
		analyser.getByteFrequencyData(dataArray);

		// Create 7 bars with different frequency ranges for more natural effect
		const bars = 7;
		const centerBar = Math.floor(bars / 2);

		// Calculate new levels for each bar with different frequency ranges
		const newLevels = [];

		for (let i = 0; i < bars; i++) {
			// Map each bar to a different frequency range
			// Lower bars (0,6) = low/high freq, center bars = mid freq (voice)
			const distanceFromCenter = Math.abs(i - centerBar);
			let startFreq, endFreq;

			if (distanceFromCenter === 0) {
				// Center bar - mid frequencies (voice range)
				startFreq = Math.floor(dataArray.length * 0.1);
				endFreq = Math.floor(dataArray.length * 0.3);
			} else if (distanceFromCenter === 1) {
				// Near center - mid-low and mid-high
				startFreq = Math.floor(dataArray.length * 0.05);
				endFreq = Math.floor(dataArray.length * 0.25);
			} else if (distanceFromCenter === 2) {
				// Second from center
				startFreq = Math.floor(dataArray.length * 0.03);
				endFreq = Math.floor(dataArray.length * 0.15);
			} else {
				// Outer bars - low frequencies
				startFreq = Math.floor(dataArray.length * 0.01);
				endFreq = Math.floor(dataArray.length * 0.1);
			}

			const bandData = dataArray.slice(startFreq, endFreq);
			const average = bandData.reduce((a, b) => a + b, 0) / bandData.length;
			const normalizedValue = average / 255;

			// Apply smoothing
			const smoothingFactor = 0.3;
			smoothedLevels[i] = smoothedLevels[i] * (1 - smoothingFactor) + normalizedValue * smoothingFactor;

			// Add minimum height and some random variation for naturalness
			const minHeight = 0.15;
			const maxHeight = 1.0;
			newLevels[i] = Math.min(maxHeight, Math.max(minHeight, smoothedLevels[i] + Math.random() * 0.05));
		}

		// Update reactive state with new array
		audioLevels = newLevels;
	}

	async function startRecording() {
		try {
			isRecording = true;
			errorMessage = '';
			chunks = [];

			console.log('[VoiceControl] Requesting microphone...');
			stream = await navigator.mediaDevices.getUserMedia({
				audio: true
			});

			// Check if track is live and producing audio
			const audioTrack = stream.getAudioTracks()[0];
			console.log('[VoiceControl] Audio track:', audioTrack.label, 'enabled:', audioTrack.enabled, 'muted:', audioTrack.muted, 'readyState:', audioTrack.readyState);

			// Setup audio visualization
			setupAudioVisualization(stream);

			console.log('[VoiceControl] Creating MediaRecorder...');
			mediaRecorder = new MediaRecorder(stream);
			console.log('[VoiceControl] MediaRecorder mimeType:', mediaRecorder.mimeType);

			mediaRecorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					console.log('[VoiceControl] Chunk received:', e.data.size, 'bytes');
					chunks.push(e.data);
				}
			};

			mediaRecorder.onstop = async () => {
				console.log('[VoiceControl] Recording stopped. Total chunks:', chunks.length);
				const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
				console.log('[VoiceControl] Final blob size:', blob.size, 'bytes');

				isRecording = false;
				cleanup();

				if (blob.size > 1000) {
					await processAudio(blob);
				} else {
					errorMessage = 'Recording too short. Please try again and speak longer.';
				}
			};

			console.log('[VoiceControl] Starting recording...');
			mediaRecorder.start(1000); // Request data every 1 second
			console.log('[VoiceControl] ✅ Recording started');

		} catch (err) {
			console.error('[VoiceControl] Error:', err);
			errorMessage = 'Could not access microphone. Please check permissions.';
			isRecording = false;
			cleanup();
		}
	}

	async function stopRecording() {
		if (!mediaRecorder) return;

		console.log('[VoiceControl] Stopping recording...');
		if (mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	}

	function cleanup() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		if (animationId) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
		analyser = null;
		dataArray = null;
		mediaRecorder = null;
		chunks = [];
		audioLevels = [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2];
		smoothedLevels = [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2];
	}

	async function processAudio(audioBlob) {
		try {
			isProcessing = true;
			errorMessage = '';

			console.log('[VoiceControl] Sending', audioBlob.size, 'bytes to API...');

			const formData = new FormData();
			formData.append('audio', audioBlob, 'audio.webm');

			const response = await fetch('/api/voice-recognition', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();
			console.log('[VoiceControl] API response:', data);

			if (!response.ok) {
				throw new Error(data.message || 'Error processing audio');
			}

			// Handle different response types
			if (data.success) {
				if (data.type === 'predefined' && data.cocktail) {
					console.log('[VoiceControl] ✅ Predefined Cocktail:', data.cocktail.name, data.cocktail.id);
					onCocktailSelected?.(data.cocktail.id);
				} else if (data.type === 'custom' && data.ingredients) {
					console.log('[VoiceControl] ✅ Custom Cocktail:', data.ingredients);
					onCustomCocktailSelected?.(data.ingredients);
				} else {
					errorMessage = 'Unexpected response format';
				}
			} else {
				console.log('[VoiceControl] No match. Transcript:', data.transcript);
				errorMessage = data.message || 'Could not understand your request';
			}
		} catch (err) {
			console.error('[VoiceControl] Error:', err);
			errorMessage = err.message || 'Error processing audio';
		} finally {
			isProcessing = false;
		}
	}

	function handlePressStart(e) {
		if (isProcessing || isRecording) return;
		e.preventDefault();
		startRecording();
	}

	function handlePressEnd(e) {
		if (!isRecording || isProcessing) return;
		e.preventDefault();
		stopRecording();
	}

	$effect(() => {
		if (!errorMessage) return;
		const timeout = setTimeout(() => {
			errorMessage = '';
		}, 5000);
		return () => clearTimeout(timeout);
	});
</script>

{#if isRecording}
	<div class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-md flex flex-col items-center justify-center">
		<h2 class="text-5xl font-bold text-white mb-4">Listening...</h2>
		<div class="flex items-end justify-center gap-2 mt-6 h-32">
			{#each audioLevels as level, i (i)}
				<div
					class="w-3 bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-full transition-all duration-75 ease-out shadow-lg shadow-cyan-400/50"
					style="height: {level * 100}px; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);"
				></div>
			{/each}
		</div>
		<p class="text-xl text-white/80 text-center max-w-md px-4 mt-8">
			Speak a cocktail name or describe your custom drink ingredients
		</p>
	</div>
{/if}

{#if errorMessage}
	<div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
		<div class="alert alert-error shadow-lg bg-red-50 border-2 border-red-300">
			<span class="text-lg font-semibold">{errorMessage}</span>
		</div>
	</div>
{/if}

<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
	<button
		onmousedown={handlePressStart}
		onmouseup={handlePressEnd}
		onmouseleave={handlePressEnd}
		ontouchstart={handlePressStart}
		ontouchend={handlePressEnd}
		ontouchcancel={handlePressEnd}
		disabled={isProcessing}
		class="voice-button btn btn-circle btn-xl shadow-xl transition-all duration-200 select-none"
		class:btn-error={isRecording}
		class:btn-primary={!isRecording && !isProcessing}
		class:btn-disabled={isProcessing}
		class:scale-110={isRecording}
	>
		{#if isProcessing}
			<Loader2 class="w-6 h-6 animate-spin" />
		{:else if isRecording}
			<MicOff class="w-6 h-6" />
		{:else}
			<Mic class="w-6 h-6" />
		{/if}
	</button>

	{#if isRecording}
		<div class="absolute -top-2 -right-2">
			<span class="relative flex h-4 w-4">
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
				<span class="relative inline-flex rounded-full h-4 w-4 bg-error"></span>
			</span>
		</div>
	{/if}
</div>

<style>
	.voice-button {
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		touch-action: none;
	}

	.animate-ping {
		animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	@keyframes ping {
		75%, 100% {
			transform: scale(2);
			opacity: 0;
		}
	}
</style>
