<script>
	// Tarjeta de indicador con degradado e icono. Si recibe href, es un acceso directo.
	let { icono, valor, titulo, color = 'blue', href = '' } = $props();
</script>

{#if href}
	<a {href} class="acceso-card bg-g-{color}"><i class="bi {icono}"></i><div class="n">{valor}</div><div>{titulo}</div></a>
{:else}
	<div class="acceso-card bg-g-{color}"><i class="bi {icono}"></i><div class="n">{valor}</div><div>{titulo}</div></div>
{/if}
