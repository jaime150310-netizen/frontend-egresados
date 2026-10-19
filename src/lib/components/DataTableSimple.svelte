<script>
	// Tabla reutilizable con búsqueda, orden por columna, paginación y selector de filas por página.
	// columnas: [{ clave, titulo, valor?(fila), badge?(fila) -> color bootstrap, ordenable? }]
	// acciones: snippet opcional que dibuja los botones de cada fila.
	let { columnas, filas = [], porPagina = 10, buscar = true, vacio = 'No hay registros para mostrar.', acciones } = $props();

	let q = $state('');
	let orden = $state({ clave: null, asc: true });
	let pagina = $state(1);
	let tam = $state(PorPagina);

	const valor = (f, c) => (c.valor ? c.valor(f) : f[c.clave]);
	const texto = (f, c) => String(valor(f, c) ?? '');

	let filtradas = $derived.by(() => {
		const t = q.trim().toLowerCase();
		let r = t ? filas.filter((f) => columnas.some((c) => texto(f, c).toLowerCase().includes(t))) : [...filas];
		if (orden.clave) {
			const col = columnas.find((c) => c.clave === orden.clave);
			r.sort((a, b) => texto(a, col).localeCompare(texto(b, col), 'es', { numeric: true }) * (orden.asc ? 1 : -1));
		}
		return r;
	});
	let totalPaginas = $derived(Math.max(1, Math.ceil(filtradas.length / tam)));
	let visibles = $derived(filtradas.slice((pagina - 1) * tam, pagina * tam));
	let desde = $derived(filtradas.length ? (pagina - 1) * tam + 1 : 0);
	let hasta = $derived(Math.min(pagina * tam, filtradas.length));

	$effect(() => { q; tam; if (pagina > totalPaginas) pagina = 1; });
	$effect(() => { q; pagina = 1; });

	function ordenar(c) {
		if (c.ordenable === false) return;
		orden = orden.clave === c.clave ? { clave: c.clave, asc: !orden.asc } : { clave: c.clave, asc: true };
	}
</script>

<div class="card shadow-sm">
	<div class="card-body">
		<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
			<div class="d-flex align-items-center gap-2 small text-muted">
				Mostrar
				<select class="form-select form-select-sm" style="width:auto" bind:value={tam} aria-label="Filas por página">
					<option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
				</select>
				registros
			</div>
			{#if buscar}
				<div class="input-group input-group-sm" style="max-width:260px">
					<span class="input-group-text"><i class="bi bi-search"></i></span>
					<input class="form-control" placeholder="Buscar en la tabla..." bind:value={q} />
				</div>
			{/if}
		</div>

		<div class="table-responsive">
			<table class="table table-hover align-middle mb-0">
				<thead class="table-light">
					<tr>
						{#each columnas as c}
							<th class="text-nowrap" style={c.ordenable === false ? '' : 'cursor:pointer'} onclick={() => ordenar(c)}>
								{c.titulo}
								{#if orden.clave === c.clave}<i class="bi {orden.asc ? 'bi-sort-up' : 'bi-sort-down'} text-primary"></i>{/if}
							</th>
						{/each}
						{#if acciones}<th class="text-end">Acciones</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each visibles as fila}
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
					{:else}
						<tr><td colspan={columnas.length + (acciones ? 1 : 0)} class="text-center text-muted py-4"><i class="bi bi-inbox fs-3 d-block"></i>{vacio}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
			<small class="text-muted">Mostrando {desde} a {hasta} de {filtradas.length} registros</small>
			<nav aria-label="Paginación">
				<ul class="pagination pagination-sm mb-0">
					<li class="page-item" class:disabled={pagina === 1}><button class="page-link" onclick={() => (pagina -= 1)}>Anterior</button></li>
					{#each Array.from({ length: totalPaginas }, (_, i) => i + 1).filter((n) => Math.abs(n - pagina) <= 2 || n === 1 || n === totalPaginas) as n}
						<li class="page-item" class:active={n === pagina}><button class="page-link" onclick={() => (pagina = n)}>{n}</button></li>
					{/each}
					<li class="page-item" class:disabled={pagina === totalPaginas}><button class="page-link" onclick={() => (pagina += 1)}>Siguiente</button></li>
				</ul>
			</nav>
		</div>
	</div>
</div>
