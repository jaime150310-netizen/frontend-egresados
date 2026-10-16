<script>
	// Tabla reutilizable construida con la librería DataTables (búsqueda, orden y paginación).
	// columnas: [{ clave, titulo, valor?(fila), badge?(fila) -> color bootstrap, ordenable? }]
	// acciones: snippet opcional que dibuja los botones de cada fila.
	import { datatable, ES } from '$lib/datatable.js';

	let { columnas, filas = [], porPagina = 10, buscar = true, vacio = 'No hay registros para mostrar.', acciones } = $props();

	const valor = (f, c) => (c.valor ? c.valor(f) : f[c.clave]);
	const texto = (f, c) => String(valor(f, c) ?? '');

	// Recuerda la búsqueda y la página para no perderlas cuando se recargan los datos.
	const recuerdo = { busqueda: '', pagina: 0 };

	function iniciar(nodo) {
		const definiciones = columnas.map((c, i) => (c.ordenable === false ? { targets: i, orderable: false } : null)).filter(Boolean);
		if (acciones) definiciones.push({ targets: columnas.length, orderable: false, searchable: false });

		const accion = datatable(nodo, {
			pageLength: porPagina,
			lengthMenu: [5, 10, 25, 50],
			searching: buscar,
			order: [],
			columnDefs: definiciones,
			language: { ...ES, emptyTable: vacio }
		});

		return {
			destroy() { accion.destroy(); }
		};
	}
</script>

<div class="card shadow-sm">
	<div class="card-body">
		{#key filas}
			<div>
				<table class="table table-hover align-middle w-100" use:iniciar>
					<thead>
						<tr>
							{#each columnas as c}<th class="text-nowrap">{c.titulo}</th>{/each}
							{#if acciones}<th class="text-end">Acciones</th>{/if}
						</tr>
					</thead>
					<tbody>
						{#each filas as fila}
							<tr>
								{#each columnas as c}
									<td>
										{#if c.badge}
											<span class="badge bg-{c.badge(fila)} {c.badge(fila) === 'warning' || c.badge(fila) === 'info' ? 'text-dark' : ''}">{texto(fila, c)}</span>
										{:else}
											{texto(fila, c) || '—'}
										{/if}
									</td>
								{/each}
								{#if acciones}<td class="text-end text-nowrap">{@render acciones(fila)}</td>{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/key}
	</div>
</div>
