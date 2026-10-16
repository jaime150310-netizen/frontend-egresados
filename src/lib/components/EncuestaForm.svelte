<script>
	// Formulario de la encuesta de seguimiento laboral. Sirve para crear y para editar.
	// opcionesEgresado: si viene, se muestra el selector de egresado (uso del personal).
	let { inicial = null, opcionesEgresado = null, alGuardar, alCancelar } = $props();

	const AREAS = ['Tecnología', 'Administración', 'Finanzas', 'Logística', 'Ingeniería', 'Salud', 'Marketing', 'Educación', 'Otra'];
	let f = $state({
		id_egresado: inicial?.id_egresado ?? opcionesEgresado?.[0]?.id ?? '',
		esta_empleado: inicial ? (inicial.esta_empleado ? 'si' : 'no') : '',
		empresa_actual: inicial?.empresa_actual ?? '', cargo_actual: inicial?.cargo_actual ?? '', area_laboral: inicial?.area_laboral ?? 'Tecnología',
		tipo_contrato: inicial?.tipo_contrato ?? 'Tiempo completo', modalidad_trabajo: inicial?.modalidad_trabajo ?? 'Presencial',
		salario: inicial?.salario ?? '', relacion_carrera: inicial ? (inicial.relacion_carrera ? 'si' : 'no') : 'si',
		tiempo_conseguir_empleo: inicial?.tiempo_conseguir_empleo ?? '', satisfaccion_laboral: inicial?.satisfaccion_laboral ?? 4,
		observaciones: inicial?.observaciones ?? ''
	});
	let errores = $state({});
	let enviando = $state(false);

	async function enviar(ev) {
		ev.preventDefault();
		errores = {};
		if (opcionesEgresado && !f.id_egresado) errores.id_egresado = 'Selecciona al egresado.';
		if (!f.esta_empleado) errores.esta_empleado = 'Indica si actualmente estás laborando.';
		if (f.esta_empleado === 'si') {
			if (!f.empresa_actual.trim()) errores.empresa_actual = 'Indica la empresa.';
			if (!f.cargo_actual.trim()) errores.cargo_actual = 'Indica el cargo.';
			if (f.salario !== '' && Number(f.salario) < 0) errores.salario = 'No puede ser negativo.';
		}
		if (Object.keys(errores).length) return;

		const empleado = f.esta_empleado === 'si';
		const cuerpo = {
			id_egresado: Number(f.id_egresado), esta_empleado: empleado, esta_buscando_empleo: !empleado, observaciones: f.observaciones.trim() || null,
			empresa_actual: empleado ? f.empresa_actual.trim() : null, cargo_actual: empleado ? f.cargo_actual.trim() : null,
			area_laboral: empleado ? f.area_laboral : null, tipo_contrato: empleado ? f.tipo_contrato : null, modalidad_trabajo: empleado ? f.modalidad_trabajo : null,
			salario: empleado && f.salario !== '' ? Number(f.salario) : null, relacion_carrera: empleado ? f.relacion_carrera === 'si' : null,
			tiempo_conseguir_empleo: f.tiempo_conseguir_empleo === '' ? null : Number(f.tiempo_conseguir_empleo),
			satisfaccion_laboral: empleado ? Number(f.satisfaccion_laboral) : null
		};
		enviando = true;
		try { await alGuardar(cuerpo); } finally { enviando = false; }
	}
</script>

<form onsubmit={enviar} novalidate>
	<div class="row g-3">
		{#if opcionesEgresado}
			<div class="col-12"><label class="form-label fw-semibold" for="en-eg">Egresado</label>
				<select id="en-eg" class="form-select" class:is-invalid={errores.id_egresado} bind:value={f.id_egresado} disabled={!!inicial}>{#each opcionesEgresado as o}<option value={o.id}>{o.nombre}</option>{/each}</select><div class="invalid-feedback">{errores.id_egresado}</div></div>
		{/if}
		<div class="col-12">
			<p class="fw-semibold mb-1">¿Actualmente te encuentras laborando?</p>
			<div class="form-check form-check-inline"><input class="form-check-input" type="radio" id="en-si" value="si" bind:group={f.esta_empleado} /><label class="form-check-label" for="en-si">Sí</label></div>
			<div class="form-check form-check-inline"><input class="form-check-input" type="radio" id="en-no" value="no" bind:group={f.esta_empleado} /><label class="form-check-label" for="en-no">No, estoy buscando empleo</label></div>
			{#if errores.esta_empleado}<div class="text-danger small">{errores.esta_empleado}</div>{/if}
		</div>

		{#if f.esta_empleado === 'si'}
			<div class="col-md-6"><label class="form-label fw-semibold" for="en-e">Empresa donde trabajas</label><input id="en-e" class="form-control" class:is-invalid={errores.empresa_actual} bind:value={f.empresa_actual} /><div class="invalid-feedback">{errores.empresa_actual}</div></div>
			<div class="col-md-6"><label class="form-label fw-semibold" for="en-c">Cargo</label><input id="en-c" class="form-control" class:is-invalid={errores.cargo_actual} bind:value={f.cargo_actual} /><div class="invalid-feedback">{errores.cargo_actual}</div></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="en-a">Área</label><select id="en-a" class="form-select" bind:value={f.area_laboral}>{#each AREAS as a}<option>{a}</option>{/each}</select></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="en-t">Tipo de contrato</label><select id="en-t" class="form-select" bind:value={f.tipo_contrato}><option>Tiempo completo</option><option>Medio tiempo</option><option>Prácticas</option><option>Por proyecto</option></select></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="en-m">Modalidad</label><select id="en-m" class="form-select" bind:value={f.modalidad_trabajo}><option>Presencial</option><option>Remoto</option><option>Híbrido</option></select></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="en-s">Salario (COP)</label><input id="en-s" type="number" min="0" class="form-control" class:is-invalid={errores.salario} bind:value={f.salario} /><div class="invalid-feedback">{errores.salario}</div></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="en-r">¿Se relaciona con tu carrera?</label><select id="en-r" class="form-select" bind:value={f.relacion_carrera}><option value="si">Sí</option><option value="no">No</option></select></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="en-ti">Meses que tardaste en conseguirlo</label><input id="en-ti" type="number" min="0" class="form-control" bind:value={f.tiempo_conseguir_empleo} /></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="en-sa">Satisfacción (1 a 5): {f.satisfaccion_laboral}</label><input id="en-sa" type="range" min="1" max="5" step="1" class="form-range" bind:value={f.satisfaccion_laboral} /></div>
		{/if}

		{#if f.esta_empleado}
			<div class="col-12"><label class="form-label fw-semibold" for="en-o">Observaciones (opcional)</label><textarea id="en-o" rows="2" class="form-control" bind:value={f.observaciones}></textarea></div>
		{/if}
	</div>
	<div class="mt-3 d-flex gap-2">
		<button class="btn btn-primary" type="submit" disabled={enviando}><i class="bi bi-send-fill me-1"></i> {inicial ? 'Guardar cambios' : 'Enviar respuesta'}</button>
		{#if alCancelar}<button class="btn btn-light" type="button" onclick={alCancelar}>Cancelar</button>{/if}
	</div>
</form>
