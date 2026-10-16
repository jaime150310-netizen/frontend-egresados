<script>
	import Modal from './Modal.svelte';
	let { abierto = $bindable(false), titulo = 'Confirmar acción', mensaje = '', textoConfirmar = 'Eliminar', color = 'danger', alConfirmar } = $props();
	let trabajando = $state(false);

	async function confirmar() {
		trabajando = true;
		try { await alConfirmar?.(); } finally { trabajando = false; abierto = false; }
	}
</script>

<Modal bind:abierto {titulo} tam="modal-sm">
	<p class="mb-0">{mensaje}</p>
	{#snippet pie()}
		<button class="btn btn-light" onclick={() => (abierto = false)}>Cancelar</button>
		<button class="btn btn-{color}" disabled={trabajando} onclick={confirmar}>{textoConfirmar}</button>
	{/snippet}
</Modal>
