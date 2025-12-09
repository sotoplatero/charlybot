<script>
	import { onMount } from 'svelte';
	import { CheckCircle, XCircle, Loader2, RefreshCw } from '@lucide/svelte';

	let testResults = $state(null);
	let loading = $state(true);
	let error = $state('');

	async function runTest() {
		loading = true;
		error = '';
		testResults = null;

		try {
			const response = await fetch('/api/modbus-test');
			const data = await response.json();
			testResults = data;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		runTest();
	});
</script>

<svelte:head>
	<title>Modbus Diagnostics</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
	<div class="container mx-auto max-w-4xl">
		<div class="mb-8">
			<a href="/" class="btn btn-ghost text-white mb-4">← Back to Home</a>
			<h1 class="text-4xl font-bold text-white mb-2">Modbus Diagnostics</h1>
			<p class="text-purple-200">Testing which Modbus functions are supported by the device</p>
		</div>

		<div class="card bg-black/20 backdrop-blur-md border border-white/10">
			<div class="card-body">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-2xl font-bold text-white">Test Results</h2>
					<button
						class="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white border-0"
						onclick={runTest}
						disabled={loading}
					>
						<RefreshCw class={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
						Retest
					</button>
				</div>

				{#if loading}
					<div class="flex items-center justify-center py-12">
						<Loader2 class="w-8 h-8 text-purple-400 animate-spin" />
					</div>
				{:else if error}
					<div class="alert alert-error">
						<XCircle class="w-6 h-6" />
						<span>{error}</span>
					</div>
				{:else if testResults}
					<!-- Connection Status -->
					<div class="mb-6 p-4 rounded-lg {testResults.connection ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}">
						<div class="flex items-center gap-3">
							{#if testResults.connection}
								<CheckCircle class="w-6 h-6 text-green-400" />
								<div>
									<div class="font-bold text-white">Connected</div>
									<div class="text-sm text-green-200">Successfully connected to Modbus device</div>
								</div>
							{:else}
								<XCircle class="w-6 h-6 text-red-400" />
								<div>
									<div class="font-bold text-white">Connection Failed</div>
									<div class="text-sm text-red-200">{testResults.error || 'Could not connect to device'}</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Function Tests -->
					{#if testResults.tests && testResults.tests.length > 0}
						<div class="space-y-3">
							<h3 class="text-lg font-bold text-white mb-4">Supported Functions</h3>
							{#each testResults.tests as test}
								<div class="p-4 rounded-lg border {test.status === 'supported' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}">
									<div class="flex items-start gap-3">
										{#if test.status === 'supported'}
											<CheckCircle class="w-5 h-5 text-green-400 mt-0.5" />
										{:else}
											<XCircle class="w-5 h-5 text-red-400 mt-0.5" />
										{/if}
										<div class="flex-1">
											<div class="flex items-center gap-2 mb-1">
												<span class="font-bold text-white">{test.name}</span>
												<span class="badge badge-sm bg-white/10 border-white/20 text-white">FC {test.code}</span>
											</div>
											{#if test.status === 'failed'}
												<div class="text-sm text-red-200">
													{test.error}
													{#if test.modbusCode}
														<span class="opacity-60">(Code: {test.modbusCode})</span>
													{/if}
												</div>
											{:else}
												<div class="text-sm text-green-200">Function is supported</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>

						<!-- Recommendations -->
						<div class="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
							<h3 class="font-bold text-white mb-2">💡 Recommendations</h3>
							<div class="text-sm text-blue-200 space-y-1">
								{#each testResults.tests as test}
									{#if test.status === 'supported' && test.code === 2}
										<p>✓ Use <code class="bg-black/30 px-1 rounded">readDiscreteInputs</code> for reading robot states (addresses 32-40, 90-92)</p>
									{/if}
									{#if test.status === 'supported' && test.code === 3}
										<p>✓ Use <code class="bg-black/30 px-1 rounded">readHoldingRegisters</code> for reading holding registers</p>
									{/if}
									{#if test.status === 'supported' && test.code === 5}
										<p>✓ Use <code class="bg-black/30 px-1 rounded">writeCoil</code> for triggering cocktails (addresses 100-106)</p>
									{/if}
									{#if test.status === 'supported' && test.code === 6}
										<p>✓ Use <code class="bg-black/30 px-1 rounded">writeRegister</code> for writing single registers</p>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Device Info -->
		<div class="mt-6 text-center text-purple-200 text-sm">
			<p>Device: localhost:502 | Unit ID: 1</p>
		</div>
	</div>
</div>
