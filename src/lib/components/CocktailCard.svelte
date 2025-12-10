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
	class="group relative overflow-hidden rounded-3xl card-glow cursor-pointer bg-white border-4 border-gray-200 hover:border-cyan-300 active:scale-95 transition-all w-full aspect-square"
	onclick={() => onSelect(cocktail.id)}
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
>
	<figure class="relative overflow-hidden">
		<img
			src={cocktail.imageUrl}
			alt={cocktail.name}
			class="w-full h-full object-cover transition-transform duration-700 ease-out aspect-square select-none pointer-events-none"
			class:scale-110={isHovered}
			draggable="false"
		/>
		<!-- Gradient overlay -->
		<div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-800/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300"></div>

		<!-- Glow effect on hover -->
		<div class="absolute inset-0 bg-gradient-to-t from-cyan-500/30 via-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

		<!-- Content -->
		<div class="absolute inset-0 flex items-end p-8">
			<div class="w-full">
				<h2 class="text-4xl md:text-4xl font-bold text-white mb-3 transform transition-transform duration-300 group-hover:translate-y-[-4px] drop-shadow-lg">
					{cocktail.name}
				</h2>
				<div class="w-20 h-1.5 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100"></div>
			</div>
		</div>

		<!-- Corner accent -->
		<div class="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-cyan-300 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
	</figure>
</button>

<style>
	img {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
	}
</style>
