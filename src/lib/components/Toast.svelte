<script>
	import { toast } from '$lib/stores/toast.svelte.js';
</script>

{#if toast.mensaje}
	<div class="position-fixed top-0 end-0 p-3" style="z-index:2000">
		<div class="alert alert-{toast.tipo} shadow d-flex align-items-center gap-2 mb-0" role="alert">
			<i class="bi {toast.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}"></i>
			<span>{toast.mensaje}</span>
		</div>
	</div>
{/if}
