<script>
	import { Sparkles, Check, X, AlertCircle } from '@lucide/svelte';

	/** @type {{ isOpen: boolean, onClose: () => void, onOrder: (ingredients: string[]) => void }} */
	let { isOpen = $bindable(false), onClose, onOrder } = $props();

	const availableIngredients = [
		{ id: 'mint', label: 'Mint', icon: '🌿', stateKey: 'mint', category: 'other' },
		{ id: 'ice', label: 'Ice', icon: '🧊', stateKey: 'ice', category: 'other' },
		{ id: 'syrup', label: 'Syrup', icon: '🍯', stateKey: 'syrup', category: 'other' },
		{ id: 'lime', label: 'Lime', icon: '🍋', stateKey: 'lime', category: 'other' },
		{ id: 'white-rum', label: 'White Rum', icon: '🥃', stateKey: 'whiteRum', category: 'alcohol' },
		{ id: 'cognac', label: 'Cognac', icon: '🥃', stateKey: 'cognac', category: 'alcohol' },
		{ id: 'whiskey', label: 'Whiskey', icon: '🥃', stateKey: 'whiskey', category: 'alcohol' },
		{ id: 'soda', label: 'Soda', icon: '🥤', stateKey: 'soda', category: 'mixer' },
		{ id: 'coke', label: 'Coke', icon: '🥤', stateKey: 'coke', category: 'mixer' }
	];

	let selectedIngredients = $state([]);
	let validationError = $state('');

	/**
	 * Get count of selected ingredients by category
	 * @param {string} category
	 */
	function getSelectedCountByCategory(category) {
		return selectedIngredients.filter(id => {
			const ingredient = availableIngredients.find(i => i.id === id);
			return ingredient?.category === category;
		}).length;
	}

	/**
	 * Check if ingredient can be selected
	 * @param {string} ingredientId
	 */
	function canSelectIngredient(ingredientId) {
		const ingredient = availableIngredients.find(i => i.id === ingredientId);
		if (!ingredient) return false;

		// If already selected, can always deselect
		if (selectedIngredients.includes(ingredientId)) return true;

		// Check alcohol limit (max 2)
		if (ingredient.category === 'alcohol') {
			const alcoholCount = getSelectedCountByCategory('alcohol');
			return alcoholCount < 2;
		}

		// Check mixer limit (max 1)
		if (ingredient.category === 'mixer') {
			const mixerCount = getSelectedCountByCategory('mixer');
			return mixerCount < 1;
		}

		return true;
	}

	/**
	 * Toggle ingredient selection
	 * @param {string} ingredientId
	 */
	function toggleIngredient(ingredientId) {
		validationError = '';
		const ingredient = availableIngredients.find(i => i.id === ingredientId);

		if (selectedIngredients.includes(ingredientId)) {
			selectedIngredients = selectedIngredients.filter(id => id !== ingredientId);
		} else {
			// Check if can select
			if (!canSelectIngredient(ingredientId)) {
				if (ingredient.category === 'alcohol') {
					validationError = 'You can only select up to 2 alcohols (White Rum, Cognac, or Whiskey)';
				} else if (ingredient.category === 'mixer') {
					validationError = 'You can only select 1 mixer (Soda or Coke)';
				}
				return;
			}
			selectedIngredients = [...selectedIngredients, ingredientId];
		}
	}

	function handleOrder() {
		if (selectedIngredients.length > 0) {
			onOrder(selectedIngredients);
			selectedIngredients = [];
			isOpen = false;
		}
	}

	function handleClose() {
		selectedIngredients = [];
		validationError = '';
		onClose();
		isOpen = false;
	}
</script>

{#if isOpen}
<dialog class="modal modal-open" style="animation: fadeIn 0.3s ease-out;">
	<div class="modal-box max-w-2xl w-full bg-white border-4 border-cyan-200 shadow-2xl" style="animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
		<!-- Header -->
		<div class="flex items-center justify-between mb-8">
			<div class="flex items-center gap-4">
				<div class="w-14 h-14 rounded-xl krka-accent-gradient flex items-center justify-center">
					<Sparkles class="w-8 h-8 text-white" />
				</div>
				<div>
					<h3 class="font-bold text-3xl md:text-4xl gradient-text">Customize Your Drink</h3>
					<p class="text-lg md:text-xl text-gray-600">Select your ingredients</p>
				</div>
			</div>
			<button
				class="btn btn-circle btn-lg text-gray-700 hover:bg-gray-100 border-2 border-gray-300"
				onclick={handleClose}
			>
				<X class="w-7 h-7" />
			</button>
		</div>

		<!-- Validation Error -->
		{#if validationError}
			<div class="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl" style="animation: slideUp 0.3s ease-out;">
				<div class="flex items-center gap-3">
					<AlertCircle class="w-6 h-6 text-red-600 shrink-0" />
					<p class="text-lg text-red-900 font-medium">{validationError}</p>
				</div>
			</div>
		{/if}

		<!-- Ingredients Grid -->
		<div class="mb-8">
			<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
				{#each availableIngredients as ingredient}
					{@const isSelected = selectedIngredients.includes(ingredient.id)}
					{@const canSelect = canSelectIngredient(ingredient.id)}
					{@const isDisabled = !canSelect && !isSelected}
					<button
						class="relative p-6 rounded-2xl border-4 transition-all duration-300 active:scale-95 aspect-square {
							isSelected
								? 'bg-cyan-50 border-cyan-400 shadow-lg'
								: isDisabled
									? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
									: 'bg-white border-gray-300 hover:border-cyan-300'
						}"
						onclick={() => toggleIngredient(ingredient.id)}
						disabled={isDisabled}
					>
						<!-- Selected checkmark -->
						{#if isSelected}
							<div class="absolute top-3 right-3 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
								<Check class="w-5 h-5 text-white" />
							</div>
						{/if}

						<div class="flex flex-col items-center gap-3">
							<div class="text-5xl">{ingredient.icon}</div>
							<div class="text-xl md:text-2xl font-semibold {isSelected ? 'text-cyan-700' : 'text-gray-700'}">
								{ingredient.label}
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Selected Count & Limits -->
		<!-- <div class="mb-6 p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="text-center">
					<p class="text-lg text-gray-600 mb-1">Total Selected</p>
					<p class="text-2xl md:text-3xl font-bold text-cyan-600">
						{selectedIngredients.length}
					</p>
				</div>
				<div class="text-center">
					<p class="text-lg text-gray-600 mb-1">Alcohols</p>
					<p class="text-2xl md:text-3xl font-bold {getSelectedCountByCategory('alcohol') >= 2 ? 'text-red-600' : 'text-gray-700'}">
						{getSelectedCountByCategory('alcohol')} / 2
					</p>
				</div>
				<div class="text-center">
					<p class="text-lg text-gray-600 mb-1">Mixers</p>
					<p class="text-2xl md:text-3xl font-bold {getSelectedCountByCategory('mixer') >= 1 ? 'text-red-600' : 'text-gray-700'}">
						{getSelectedCountByCategory('mixer')} / 1
					</p>
				</div>
			</div>
		</div> -->

		<!-- Action Buttons -->
		<div class="flex gap-4">
			<!-- <button
				class="btn btn-lg flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 border-0 text-xl md:text-2xl px-8 py-6 h-auto active:scale-95 transition-all"
				onclick={handleClose}
			>
				Cancel
			</button> -->
			<button
				class="btn btn-lg flex-1 krka-accent-gradient border-0 text-white hover:shadow-xl text-xl md:text-2xl p-4 h-auto active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={handleOrder}
				disabled={selectedIngredients.length === 0}
			>
				<Sparkles class="w-6 h-6" />
				Order Custom Drink
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop bg-gray-900/50 backdrop-blur-sm">
		<button onclick={handleClose}>close</button>
	</form>
</dialog>
{/if}
