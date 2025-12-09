<script>
	import { onMount } from 'svelte';
	import { Sun, Moon } from '@lucide/svelte';

	let isDark = $state(false);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		const savedTheme = localStorage.getItem('theme') || 'light';
		isDark = savedTheme === 'dark';
		applyTheme(savedTheme);
	});

	function toggleTheme() {
		isDark = !isDark;
		const theme = isDark ? 'dark' : 'light';
		applyTheme(theme);
		localStorage.setItem('theme', theme);
	}

	/**
	 * @param {string} theme
	 */
	function applyTheme(theme) {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', theme);
			document.documentElement.classList.toggle('dark', theme === 'dark');
		}
	}
</script>

{#if mounted}
<button
	class="btn btn-circle btn-lg text-gray-700 hover:bg-cyan-100 border-2 border-gray-300 active:scale-95 transition-all duration-300 {isDark ? 'dark-theme-btn' : ''}"
	onclick={toggleTheme}
	aria-label="Toggle theme"
>
	{#if isDark}
		<Sun class="w-7 h-7 text-amber-400" />
	{:else}
		<Moon class="w-7 h-7" />
	{/if}
</button>
{/if}

<style>
	.dark-theme-btn {
		background-color: rgba(72, 201, 224, 0.1);
		border-color: rgba(72, 201, 224, 0.3);
	}

	.dark-theme-btn:hover {
		background-color: rgba(72, 201, 224, 0.2);
	}
</style>
