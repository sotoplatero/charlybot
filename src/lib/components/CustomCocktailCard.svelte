<script>
	import { Sparkles } from '@lucide/svelte';

	/** @type {{ onSelect: () => void }} */
	let { onSelect } = $props();

	let isHovered = $state(false);
</script>

<button
	class="group relative bg-cyan-500 overflow-hidden rounded-3xl card-glow cursor-pointer border-4 border-cyan-400 hover:border-cyan-300 active:scale-95 transition-all w-full aspect-square"
	onclick={onSelect}
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
>
	<div class="relative w-full h-full overflow-hidden bg-gradient-to-br from-cyan-400 to-teal-600">
		<!-- Glow effect on hover -->
		<div class="absolute inset-0 bg-gradient-to-t from-cyan-500/30 via-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

		<!-- Content -->
		<div class="absolute inset-0 flex items-center justify-center p-8 z-10">
			<div class="flex flex-col items-center justify-center">
				<div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:scale-110">
					<Sparkles class="w-12 h-12 text-white" />
				</div>
				<h2 class="text-4xl md:text-5xl font-bold text-white mb-3 text-center drop-shadow-lg transform transition-transform duration-300 group-hover:translate-y-[-4px]">
					Customize
				</h2>
				<p class="text-xl md:text-2xl text-white/90 text-center drop-shadow-md">Create your own drink</p>
			</div>
		</div>

		<!-- Corner accent -->
		<div class="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-white/40 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
	</div>
</button>
