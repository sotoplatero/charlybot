<script>
	import { cocktailStatus, stopStatusPolling } from '$lib/stores/cocktailStatus.js';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import { Bot, XCircle, Circle, Loader2, CheckCircle, X, Maximize2 } from '@lucide/svelte';
	import { getCocktailById } from '$lib/data/cocktails.js';

	let showModal = $state(false);
	let modalMinimized = $state(false);
	let dialogElement = $state(/** @type {HTMLDialogElement | null} */ (null));

	$effect(() => {
		// Show modal when a cocktail is being prepared (only if not minimized)
		if ($cocktailStatus.activeCocktailId && !showModal && !modalMinimized) {
			showModal = true;
		}

		// Close modal and banner when activeCocktailId is cleared (store handles stopping polling)
		if (!$cocktailStatus.activeCocktailId) {
			showModal = false;
			modalMinimized = false;
		}
	});

	// Scroll to top when modal opens
	$effect(() => {
		if (showModal && dialogElement) {
			dialogElement.scrollTop = 0;
		}
	});

	function closeModal() {
		showModal = false;
		modalMinimized = true;
	}

	function openModal() {
		modalMinimized = false;
		showModal = true;
	}

	async function cancelPreparation() {
		try {
			// Reset addresses to stop the preparation
			await fetch('/api/reset-addresses', { method: 'POST' });
			console.log('[StatusMonitor] Preparation cancelled, addresses reset');

			// Stop polling and clear active cocktail
			stopStatusPolling();
		} catch (error) {
			console.error('[StatusMonitor] Failed to cancel preparation:', error);
		}
	}

	/** @returns {import('$lib/data/cocktails.js').Cocktail | undefined} */
	function getCurrentCocktail() {
		if (!$cocktailStatus.activeCocktailId) return undefined;
		return getCocktailById($cocktailStatus.activeCocktailId, $cocktailStatus.customIngredients);
	}

	/**
	 * Check if a step is active based on robot state
	 * @param {string} stateKey
	 */
	function isStepActive(stateKey) {
		return $cocktailStatus.robotState[stateKey] === true;
	}

	/**
	 * Check if a step is the current active step (first incomplete step)
	 * @param {number} stepIndex
	 */
	function isCurrentStep(stepIndex) {
		const cocktail = getCurrentCocktail();
		if (!cocktail) return false;

		// Find the first step that hasn't been completed yet
		for (let i = 0; i < cocktail.steps.length; i++) {
			const step = cocktail.steps[i];
			if (!isStepActive(step.stateKey)) {
				return i === stepIndex;
			}
		}
		return false;
	}

	// Debug effect to log state changes
	$effect(() => {
		if ($cocktailStatus.activeCocktailId) {
			console.log('[StatusMonitor] Robot state update:', JSON.stringify($cocktailStatus.robotState, null, 2));
			const cocktail = getCurrentCocktail();
			if (cocktail) {
				console.log('[StatusMonitor] Step states:');
				cocktail.steps.forEach((step, index) => {
					const isActive = isStepActive(step.stateKey);
					const isCurrent = isCurrentStep(index);
					console.log(`  ${index}. ${step.label} (${step.stateKey}): active=${isActive}, current=${isCurrent}`);
				});
			}
		}
	});
</script>

<!-- Banner when modal is minimized -->
{#if modalMinimized && $cocktailStatus.activeCocktailId}
	<div class="fixed top-0 left-0 right-0 z-50 bg-cyan-600 text-white shadow-lg" style="animation: slideDown 0.3s ease-out;">
		<div class="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<Loader2 class="w-5 h-5 animate-spin" />
				<span class="font-semibold">Preparing {getCurrentCocktail()?.name || 'cocktail'}...</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={openModal}
					class="btn btn-sm bg-white/20 hover:bg-white/30 border-0 text-white"
					aria-label="Show details"
				>
					<Maximize2 class="w-4 h-4" />
					Details
				</button>
				<button
					onclick={cancelPreparation}
					class="btn btn-sm bg-red-600 hover:bg-red-700 border-0 text-white"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showModal}
<dialog bind:this={dialogElement} class="modal modal-open overflow-y-auto items-start" style="animation: fadeIn 0.3s ease-out;">
	<div class="modal-box max-w-3xl w-full max-h-none my-8 bg-white border-4 border-cyan-200 shadow-2xl" style="animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
		<!-- Close Button -->
		<button
			onclick={closeModal}
			class="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost hover:bg-gray-200"
			aria-label="Close modal"
		>
			<X class="w-5 h-5" />
		</button>

		<!-- Compact Header -->
		<div class="flex flex-col gap-4 mb-8 pb-6 border-b-2 ">
			<div class="flex items-center gap-4">
				<Bot class="w-12 h-12 text-cyan-600 animate-pulse" />
				<div class="flex-1">
					<h3 class="font-bold text-3xl md:text-4xl gradient-text">
						Preparing {getCurrentCocktail()?.name || 'Your Cocktail'}
					</h3>
					<!-- <p class="text-lg md:text-xl text-gray-600 mt-1">Please wait while Charly crafts your drink...</p> -->
				</div>
			</div>
			<!-- <ProgressIndicator progress={$cocktailStatus.progress} /> -->
		</div>

		<!-- Cocktail Steps in Grid -->
		{#if getCurrentCocktail()}
			<div class="grid grid-cols-1 gap-2">
				{#each getCurrentCocktail().steps as step, index (step.stateKey)}
					{@const isActive = isStepActive(step.stateKey)}
					{@const isCurrent = isCurrentStep(index)}
					<div
						class="flex items-center gap-5 p-4 rounded-xl border-2 transition-all duration-300 {
							isActive
								? 'bg-green-50 border-green-400'
								: isCurrent
									? 'bg-cyan-50 border-cyan-400'
									: 'bg-gray-50 border-gray-200 opacity-50'
						}"
						style="animation: slideUp 0.5s ease-out {index * 0.05}s both;"
					>
						<!-- Icon -->
						<div class="shrink-0">
							{#if isActive}
								<CheckCircle class="w-8 h-8 text-green-600" />
							{:else if isCurrent}
								<Loader2 class="w-8 h-8 text-cyan-600 animate-spin" />
							{:else}
								<Circle class="w-8 h-8 text-gray-300" />
							{/if}
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-lg md:text-xl text-gray-800 truncate">
								{step.label}
							</div>
							<div class="text-base md:text-lg {isActive ? 'text-green-700' : isCurrent ? 'text-cyan-700' : 'text-gray-500'} truncate">
								{step.description}
							</div>
						</div>

						<!-- Status Icon (compact) -->
						<div class="shrink-0">
							{#if isActive}
								<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							{:else if isCurrent}
								<div class="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
							{:else}
								<div class="w-3 h-3 bg-gray-300 rounded-full"></div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Error Display -->
		{#if $cocktailStatus.error}
			<div class="alert alert-error mt-6 border-2 border-red-500/30" style="animation: slideUp 0.5s ease-out;">
				<div class="flex items-start gap-3">
					<XCircle class="w-6 h-6 shrink-0" />
					<div>
						<h3 class="font-bold">Connection Error</h3>
						<div class="text-sm">{$cocktailStatus.error.message}</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop bg-gray-900/50 backdrop-blur-sm">
		<button>close</button>
	</form>
</dialog>
{/if}

<style>
	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
