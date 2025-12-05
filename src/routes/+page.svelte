<script>
	import { onMount } from 'svelte';
	import { cocktails } from '$lib/data/cocktails.js';
	import { startStatusPolling } from '$lib/stores/cocktailStatus.js';
	import CocktailCard from '$lib/components/CocktailCard.svelte';
	import CustomCocktailCard from '$lib/components/CustomCocktailCard.svelte';
	import CustomCocktailModal from '$lib/components/CustomCocktailModal.svelte';
	import StatusMonitor from '$lib/components/StatusMonitor.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { Bot, AlertCircle, Loader2 } from '@lucide/svelte';

	let loading = $state(false);
	let errorMessage = $state('');
	let showCustomModal = $state(false);
	let initializing = $state(true);

	/**
	 * Check robot initial state on app load
	 * - If address 92 = 1: Robot ready, show menu
	 * - If address 92 = 0: Robot busy, detect and show active cocktail
	 */
	async function checkInitialState() {
		try {
			const response = await fetch('/api/initial-state');
			const data = await response.json();

			console.log('[Initial State]', data);

			if (data.activeCocktailId) {
				// Robot is busy, start monitoring the active cocktail
				console.log(`[Initial State] Resuming monitoring for ${data.activeCocktailId}`);
				startStatusPolling(data.activeCocktailId);
			} else if (data.robotReady) {
				// Robot ready, just show menu (default state)
				console.log('[Initial State] Robot ready - showing menu');
			} else if (data.error) {
				errorMessage = data.error;
			}
		} catch (error) {
			console.error('[Initial State] Error checking robot state:', error);
			errorMessage = 'Failed to connect to robot. Please check connection.';
		} finally {
			initializing = false;
		}
	}

	// Run initial state check when component mounts
	onMount(() => {
		checkInitialState();
	});

	/**
	 * Handle cocktail selection
	 * @param {string} cocktailId
	 */
	async function handleCocktailSelect(cocktailId) {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch(`/api/cocktails/${cocktailId}`, {
				method: 'POST'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to order cocktail');
			}

			const result = await response.json();

			// Start real-time status polling
			startStatusPolling(cocktailId);

		} catch (error) {
			errorMessage = error.message;
			console.error('Order error:', error);
		} finally {
			loading = false;
		}
	}

	/**
	 * Handle custom cocktail order
	 * @param {string[]} ingredients
	 */
	async function handleCustomCocktailOrder(ingredients) {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/cocktails/custom', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ingredients })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to order custom cocktail');
			}

			const result = await response.json();

			// Start real-time status polling with custom ID
			startStatusPolling('custom');

		} catch (error) {
			errorMessage = error.message;
			console.error('Custom order error:', error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Robot Bartender</title>
	<meta name="description" content="Automated cocktail preparation system" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Animated background -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" style="animation: float 6s ease-in-out infinite;"></div>
	</div>

	<!-- Header -->
	<header class="relative backdrop-blur-md bg-base-300/50 border-b border-base-300">
		<div class="container mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
						<Bot class="w-7 h-7 text-primary-content" />
					</div>
					<h1 class="text-3xl font-bold text-primary">Charly Bot</h1>
				</div>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Error Alert -->
	{#if errorMessage}
		<div class="container mx-auto px-6 mt-6 " style="animation: slideUp 0.5s ease-out;">
			<div class="alert alert-error">
				<div class="flex items-center gap-3">
					<AlertCircle class="w-6 h-6" />
					<span>{errorMessage}</span>
				</div>
				<button class="btn btn-sm btn-ghost" onclick={() => errorMessage = ''}>Close</button>
			</div>
		</div>
	{/if}

	<!-- Cocktail Menu -->
	<section class="relative container mx-auto px-6 py-12 max-w-5xl">
		<div class="mb-8 text-center">
			<h2 class="text-5xl font-bold text-base-content mb-3">Select Your Drink</h2>
			<p class="text-lg text-base-content/70">Choose from our premium automated cocktail selection</p>
		</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto" style="animation: fadeIn 0.8s ease-out;">
				<!-- Regular Cocktails -->
				{#each cocktails as cocktail, index}
					<div style="animation: slideUp 0.5s ease-out {index * 0.1}s both;">
						<CocktailCard
							{cocktail}
							onSelect={handleCocktailSelect}
						/>
					</div>
				{/each}

				<!-- Custom Cocktail Card -->
				<div style="animation: slideUp 0.5s ease-out {cocktails.length * 0.1}s both;">
					<CustomCocktailCard onSelect={() => showCustomModal = true} />
				</div>
			</div>
		{/if}
	</section>
</div>

<!-- Status Monitor Modal -->
<StatusMonitor />

<!-- Custom Cocktail Modal -->
<CustomCocktailModal
	bind:isOpen={showCustomModal}
	onClose={() => showCustomModal = false}
	onOrder={handleCustomCocktailOrder}
/>

<!-- Loading Overlay -->
{#if loading}
	<div class="fixed inset-0 bg-base-300/70 backdrop-blur-sm flex items-center justify-center z-50" style="animation: fadeIn 0.3s ease-out;">
		<div class="flex flex-col items-center gap-4">
			<Loader2 class="w-12 h-12 text-primary animate-spin" />
			<p class="text-base-content text-lg font-medium">Processing your order...</p>
		</div>
	</div>
{/if}
