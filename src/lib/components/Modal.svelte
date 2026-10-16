<script>
	// Ventana emergente reutilizable. Se cierra con la X, con Escape o al hacer clic fuera.
	let { abierto = $bindable(false), titulo = '', tam = '', children, pie } = $props();
	const cerrar = () => (abierto = false);
</script>

<svelte:window onkeydown={(e) => abierto && e.key === 'Escape' && cerrar()} />

{#if abierto}
	<div class="modal-backdrop fade show"></div>
	<div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" onmousedown={(e) => e.target === e.currentTarget && cerrar()}>
		<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable {tam}">
			<div class="modal-content border-0 shadow">
				<div class="modal-header">
					<h5 class="modal-title fw-bold">{titulo}</h5>
					<button type="button" class="btn-close" aria-label="Cerrar" onclick={cerrar}></button>
				</div>
				<div class="modal-body">{@render children?.()}</div>
				{#if pie}<div class="modal-footer">{@render pie()}</div>{/if}
			</div>
		</div>
	</div>
{/if}
