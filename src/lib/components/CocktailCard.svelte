<script>
	/**
	 * @typedef {Object} Cocktail
	 * @property {string} id
	 * @property {string} name
	 * @property {string} imageUrl
	 * @property {number} modbusAddress
	 */

	/** @type {{ cocktail: Cocktail, onSelect: (id: string) => void }} */
	let { cocktail, onSelect } = $props();

	let isHovered = $state(false);
</script>

<button
	class="group relative overflow-hidden rounded-3xl card-glow cursor-pointer bg-white border-4 border-gray-200 hover:border-cyan-300 active:scale-95 transition-all"
	onclick={() => onSelect(cocktail.id)}
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
>
	<figure class="relative h-80 md:h-96 overflow-hidden">
		<img
			src={cocktail.imageUrl}
			alt={cocktail.name}
			class="w-full h-full object-cover transition-transform duration-700 ease-out aspect-square"
			class:scale-110={isHovered}
		/>
		<!-- Gradient overlay -->
		<div class="absolute inset-0 bg-gradient-to-t from-base-300/90 via-base-300/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

		<!-- Glow effect on hover -->
		<div class="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

		<!-- Content -->
		<div class="absolute inset-0 flex items-end p-8">
			<div class="w-full">
				<h2 class="text-3xl font-bold text-base-content mb-2 transform transition-transform duration-300 group-hover:translate-y-[-4px]">
					{cocktail.name}
				</h2>
				<div class="w-16 h-1 bg-primary rounded-full transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100 mx-auto"></div>
			</div>
		</div>

		<!-- Corner accent -->
		<div class="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
	</figure>
</button>
