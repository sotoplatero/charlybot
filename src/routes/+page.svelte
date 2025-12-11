<script>
	import { onMount } from 'svelte';
	import { cocktails } from '$lib/data/cocktails.js';
	import { startStatusPolling, startBackgroundPolling } from '$lib/stores/cocktailStatus.js';
	import CocktailCard from '$lib/components/CocktailCard.svelte';
	import CustomCocktailCard from '$lib/components/CustomCocktailCard.svelte';
	import CustomCocktailModal from '$lib/components/CustomCocktailModal.svelte';
	import StatusMonitor from '$lib/components/StatusMonitor.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import VoiceControl from '$lib/components/VoiceControl.svelte';
	import { Bot, AlertCircle, Loader2, Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';

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
		// Start background polling to detect when robot becomes busy
		// This allows auto-opening modal when someone else orders a drink
		startBackgroundPolling();

		// Check initial robot state (existing functionality)
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

			// Start real-time status polling with custom ID and ingredients
			startStatusPolling('custom', ingredients);

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

<div class="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
	<!-- Animated background -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" style="animation: float 6s ease-in-out infinite;"></div>
		<div class="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl" style="animation: float 8s ease-in-out infinite reverse;"></div>
	</div>

	<!-- Header -->
	<header class="relative backdrop-blur-md bg-white/80 border-b border-cyan-200/50 shadow-sm">
		<div class="container mx-auto px-8 py-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-6">
					<img src="/image/krkalogotranspartent.png" alt="KRKA Power Inc" class="h-16 md:h-20 w-auto" />
					<div class="h-12 md:h-14 w-px bg-gradient-to-b from-transparent via-cyan-300 to-transparent"></div>
					<h1 class="text-4xl md:text-5xl font-bold gradient-text">Charly Bot</h1>
				</div>
				<div class="flex items-center gap-2">
					<button
						class="btn btn-circle btn-lg text-gray-700 hover:bg-cyan-100 border-2 border-gray-300 active:scale-95 transition-transform"
						onclick={() => goto('/settings')}
						aria-label="Settings"
					>
						<Settings class="w-7 h-7" />
					</button>
					<ThemeToggle />
				</div>
			</div>
		</div>
	</header>

	<!-- Error Alert -->
	{#if errorMessage}
		<div class="container mx-auto px-8 mt-8" style="animation: slideUp 0.5s ease-out;">
			<div class="alert bg-red-50 border-2 border-red-300 backdrop-blur-md shadow-lg p-6">
				<div class="flex items-center gap-4">
					<AlertCircle class="w-8 h-8 text-red-600" />
					<span class="text-red-900 font-medium text-xl">{errorMessage}</span>
				</div>
				<button class="btn btn-lg btn-ghost text-red-700 hover:bg-red-100" onclick={() => errorMessage = ''}>Close</button>
			</div>
		</div>
	{/if}

	<!-- Cocktail Menu -->
	<section class="relative container mx-auto px-8 py-16 ">
		{#if initializing}
			<!-- Initializing State -->
			<div class="flex flex-col items-center justify-center py-32">
				<Loader2 class="w-20 h-20 text-cyan-600 animate-spin mb-8" />
				<h2 class="text-4xl font-bold text-gray-800 mb-4">Connecting to Robot...</h2>
				<p class="text-2xl text-gray-600">Checking robot status</p>
			</div>
		{:else}
			<!-- Menu -->
			<div class="mb-12 text-center">
				<h2 class="text-5xl md:text-6xl font-bold text-gray-800 mb-6">Select Your Drink</h2>
				<p class="text-2xl md:text-3xl text-gray-600">Choose from our premium automated cocktail selection</p>
				<div class="mt-6 h-1.5 w-32 mx-auto krka-accent-gradient rounded-full"></div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-10  mx-auto" style="animation: fadeIn 0.8s ease-out;">
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

<!-- Voice Control -->
<VoiceControl
	onCocktailSelected={handleCocktailSelect}
	onCustomCocktailSelected={handleCustomCocktailOrder}
/>

<!-- Loading Overlay -->
{#if loading}
	<div class="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50" style="animation: fadeIn 0.3s ease-out;">
		<div class="flex flex-col items-center gap-6 bg-white p-12 rounded-3xl shadow-2xl border-2 border-cyan-200">
			<Loader2 class="w-16 h-16 text-cyan-600 animate-spin" />
			<p class="text-gray-800 text-2xl font-medium">Processing your order...</p>
		</div>
	</div>
{/if}
