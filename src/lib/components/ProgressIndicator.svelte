<script>
	/** @type {{ progress: number }} */
	let { progress } = $props();
</script>

<div class="w-full">
	<div class="flex items-center gap-4">
		<div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
			<div
				class="h-3 rounded-full transition-all duration-500 ease-out {
					progress === 100 ? 'bg-green-500' : 'krka-accent-gradient'
				}"
				style="width: {progress}%"
			></div>
		</div>
		<span class="text-xl md:text-2xl font-bold text-gray-800 min-w-[4rem] text-right">{progress}%</span>
	</div>
</div>
