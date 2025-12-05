<script>
	import { Sparkles } from '@lucide/svelte';

	/** @type {{ onSelect: () => void }} */
	let { onSelect } = $props();

	let isHovered = $state(false);
</script>

<button
	class="group relative overflow-hidden rounded-3xl card-glow cursor-pointer bg-white border-4 border-cyan-400 hover:border-cyan-300 active:scale-95 transition-all"
	onclick={onSelect}
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
>
	<div class="relative h-80 md:h-96 overflow-hidden flex items-center justify-center bg-gradient-to-br from-cyan-400 to-teal-600">
		<!-- Content -->
		<div class="relative z-10 flex flex-col items-center justify-center p-8">
			<div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
				<Sparkles class="w-12 h-12 text-white" />
			</div>
			<h2 class="text-4xl md:text-5xl font-bold text-white mb-3 text-center drop-shadow-lg">
				Customize
			</h2>
			<p class="text-xl md:text-2xl text-white text-center drop-shadow">Create your own drink</p>
		</div>
	</div>
</button>
