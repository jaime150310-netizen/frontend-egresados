<script>
	let { titulo, icono = '', subtitulo = '', acciones } = $props();
</script>

<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
	<div>
		<h4 class="fw-bold m-0">{#if icono}<i class="bi {icono} me-2"></i>{/if}{titulo}</h4>
		{#if subtitulo}<p class="text-muted small m-0">{subtitulo}</p>{/if}
	</div>
	{#if acciones}<div class="d-flex gap-2">{@render acciones()}</div>{/if}
</div>
