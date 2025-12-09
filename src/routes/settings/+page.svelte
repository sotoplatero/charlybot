<script>
	import { onMount } from 'svelte';
	import { modbusConfig, updateModbusConfig, resetModbusConfig } from '$lib/stores/modbusConfig.js';
	import { Settings, Save, RotateCcw, Home, Wifi, WifiOff, AlertCircle } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let formData = $state({
		host: '192.168.125.1',
		port: 502,
		unitId: 1,
		timeout: 5000
	});

	let testStatus = $state({ testing: false, result: null, error: null });
	let saveStatus = $state({ saving: false, saved: false });

	// Load current config on mount
	onMount(() => {
		formData.host = $modbusConfig.host;
		formData.port = $modbusConfig.port;
		formData.unitId = $modbusConfig.unitId;
		formData.timeout = $modbusConfig.timeout;
		console.log('[Settings] Loaded config:', formData);
	});

	// Sync form with store changes
	$effect(() => {
		formData.host = $modbusConfig.host;
		formData.port = $modbusConfig.port;
		formData.unitId = $modbusConfig.unitId;
		formData.timeout = $modbusConfig.timeout;
	});

	async function handleSave() {
		saveStatus.saving = true;
		saveStatus.saved = false;

		const newConfig = {
			host: formData.host,
			port: Number(formData.port),
			unitId: Number(formData.unitId),
			timeout: Number(formData.timeout)
		};

		console.log('[Settings] Saving configuration:', newConfig);

		try {
			// Save to browser localStorage
			updateModbusConfig(newConfig);

			// Update server configuration and force reconnection
			const response = await fetch('/api/modbus/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newConfig)
			});

			const data = await response.json();

			if (response.ok) {
				console.log('[Settings] Configuration saved successfully:', data);
				saveStatus.saved = true;
				setTimeout(() => {
					saveStatus.saved = false;
				}, 3000);
			} else {
				throw new Error(data.message || 'Failed to save configuration');
			}
		} catch (error) {
			console.error('[Settings] Failed to save configuration:', error);
			alert(`Failed to save configuration: ${error.message}`);
		} finally {
			saveStatus.saving = false;
		}
	}

	async function handleReset() {
		if (confirm('¿Estás seguro de que quieres restablecer la configuración a los valores por defecto?')) {
			resetModbusConfig();
		}
	}

	async function handleTest() {
		testStatus.testing = true;
		testStatus.result = null;
		testStatus.error = null;

		const testConfig = {
			host: formData.host,
			port: Number(formData.port),
			unitId: Number(formData.unitId),
			timeout: Number(formData.timeout)
		};

		console.log('[Settings] Testing connection with config:', testConfig);

		try {
			const response = await fetch('/api/modbus/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(testConfig)
			});

			const data = await response.json();

			if (response.ok) {
				testStatus.result = 'success';
			} else {
				testStatus.result = 'error';
				testStatus.error = data.message || 'Connection failed';
			}
		} catch (error) {
			testStatus.result = 'error';
			testStatus.error = error.message || 'Failed to test connection';
		} finally {
			testStatus.testing = false;
		}
	}

	function handleGoHome() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Modbus Settings - Robot Bartender</title>
	<meta name="description" content="Configure Modbus connection settings" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
	<!-- Animated background -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" style="animation: float 6s ease-in-out infinite;"></div>
	</div>

	<!-- Header -->
	<header class="relative backdrop-blur-md bg-white/80 border-b border-cyan-200/50 shadow-sm">
		<div class="container mx-auto px-8 py-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-6">
					<Settings class="w-12 h-12 text-cyan-600" />
					<div>
						<h1 class="text-4xl md:text-5xl font-bold gradient-text">Modbus Settings</h1>
						<p class="text-lg text-gray-600 mt-1">Configure robot connection parameters</p>
					</div>
				</div>
				<button
					class="btn btn-circle btn-lg text-gray-700 hover:bg-cyan-100 border-2 border-gray-300 active:scale-95 transition-transform"
					onclick={handleGoHome}
					aria-label="Go to home"
				>
					<Home class="w-7 h-7" />
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-8 py-12">
		<div class="max-w-3xl mx-auto">
			<!-- Configuration Form -->
			<div class="bg-white rounded-3xl shadow-2xl border-4 border-cyan-200 p-8 md:p-12 mb-8" style="animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
				<h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
					<Settings class="w-8 h-8 text-cyan-600" />
					Connection Configuration
				</h2>

	<form class="space-y-6" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
					<!-- Host -->
					<div>
						<label for="host" class="block text-xl font-semibold text-gray-700 mb-2">
							Host / IP Address
						</label>
						<input
							id="host"
							type="text"
							bind:value={formData.host}
							class="input input-bordered w-full text-lg py-6 px-4 bg-gray-50 border-2 border-gray-300 focus:border-cyan-400 focus:bg-white transition-colors"
							placeholder="192.168.125.1"
							required
						/>
					</div>

					<!-- Port -->
					<div>
						<label for="port" class="block text-xl font-semibold text-gray-700 mb-2">
							Port
						</label>
						<input
							id="port"
							type="number"
							bind:value={formData.port}
							min="1"
							max="65535"
							class="input input-bordered w-full text-lg py-6 px-4 bg-gray-50 border-2 border-gray-300 focus:border-cyan-400 focus:bg-white transition-colors"
							placeholder="502"
							required
						/>
					</div>

					<!-- Unit ID -->
					<div>
						<label for="unitId" class="block text-xl font-semibold text-gray-700 mb-2">
							Unit ID (Slave ID)
						</label>
						<input
							id="unitId"
							type="number"
							bind:value={formData.unitId}
							min="0"
							max="247"
							class="input input-bordered w-full text-lg py-6 px-4 bg-gray-50 border-2 border-gray-300 focus:border-cyan-400 focus:bg-white transition-colors"
							placeholder="1"
							required
						/>
					</div>

					<!-- Timeout -->
					<div>
						<label for="timeout" class="block text-xl font-semibold text-gray-700 mb-2">
							Timeout (ms)
						</label>
						<input
							id="timeout"
							type="number"
							bind:value={formData.timeout}
							min="1000"
							max="30000"
							step="1000"
							class="input input-bordered w-full text-lg py-6 px-4 bg-gray-50 border-2 border-gray-300 focus:border-cyan-400 focus:bg-white transition-colors"
							placeholder="5000"
							required
						/>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-col md:flex-row gap-4 pt-4">
						<button
							type="submit"
							class="btn btn-lg krka-accent-gradient border-0 text-white hover:shadow-xl text-xl px-8 py-6 h-auto active:scale-95 transition-all disabled:opacity-50"
							disabled={saveStatus.saving}
						>
							{#if saveStatus.saving}
								<span class="loading loading-spinner"></span>
								Saving...
							{:else if saveStatus.saved}
								<Save class="w-6 h-6" />
								Saved!
							{:else}
								<Save class="w-6 h-6" />
								Save
							{/if}
						</button>
						<button
							type="button"
							class="btn btn-lg border-0 text-white text-xl px-8 py-6 h-auto active:scale-95 transition-all disabled:opacity-50 {
								testStatus.result === 'success'
									? 'bg-green-600 hover:bg-green-700'
									: testStatus.result === 'error'
										? 'bg-red-600 hover:bg-red-700'
										: 'bg-cyan-600 hover:bg-cyan-700'
							}"
							onclick={handleTest}
							disabled={testStatus.testing}
						>
							{#if testStatus.testing}
								<span class="loading loading-spinner"></span>
								Testing...
							{:else if testStatus.result === 'success'}
								<Wifi class="w-6 h-6" />
								Connected
							{:else if testStatus.result === 'error'}
								<WifiOff class="w-6 h-6" />
								Failed
							{:else}
								<Wifi class="w-6 h-6" />
								Test
							{/if}
						</button>
					</div>

					<!-- Test Result -->
					{#if testStatus.result && testStatus.error}
						<div class="mt-6 p-4 rounded-xl bg-red-50 border-2 border-red-400" style="animation: slideUp 0.3s ease-out;">
							<div class="flex items-start gap-3">
								<AlertCircle class="w-6 h-6 text-red-600 shrink-0 mt-1" />
								<div>
									<h3 class="font-bold text-red-900">Connection Failed</h3>
									<p class="text-red-700 mt-1">{testStatus.error}</p>
								</div>
							</div>
						</div>
					{/if}
				</form>
			</div>
		</div>
	</main>
</div>
