<script>
	import { onMount } from 'svelte';
	import { api, pick } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { dinero, fecha, hace, hoy, vacanteCerrada } from '$lib/utils.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const MOD = 'Vacantes';
	const AREAS = ['Tecnología', 'Administración', 'Finanzas', 'Logística', 'Ingeniería', 'Salud', 'Marketing', 'Educación'];
	const COLORES = { Tecnología: '#3a5fb8', Administración: '#7c4fc9', Finanzas: '#2f9e5f', Logística: '#c98a2f', Ingeniería: '#c0554f', Salud: '#128f83', Marketing: '#c94f80', Educación: '#2f8ab0' };
	const CAMPOS = ['id_empresa', 'titulo', 'descripcion', 'requisitos', 'area', 'cargo', 'modalidad', 'tipo_contrato', 'salario', 'ciudad', 'fecha_publicacion', 'fecha_cierre', 'estado', 'cupos'];
	const esEgresado = $derived(auth.rol === 'Egresado');

	let vacantes = $state([]);
	let empresas = $state([]);
	let postulaciones = $state([]);
	let cargando = $state(true);
	let error = $state('');

	const nombreEmpresa = (id) => empresas.find((e) => e.id_empresa === id)?.nombre ?? '—';
	const cuantos = (id) => postulaciones.filter((p) => p.id_vacante === id).length;

	async function cargar() {
		try { [vacantes, empresas, postulaciones] = await Promise.all([api.get('/vacantes/'), api.get('/empresas/'), api.get('/postulaciones/')]); }
		catch (e) { error = e.message; }
		cargando = false;
	}
	onMount(cargar);

	// ---------- Egresado ----------
	let q = $state(''); let fArea = $state('Todas'); let fMod = $state('Todas');
	let misIds = $derived(new Set(postulaciones.filter((p) => p.id_egresado === auth.usuario.id_egresado).map((p) => p.id_vacante)));
	let abiertas = $derived(vacantes.filter((v) => !vacanteCerrada(v)));
	let filtradas = $derived(
		abiertas
			.filter((v) => fArea === 'Todas' || v.area === fArea)
			.filter((v) => fMod === 'Todas' || v.modalidad === fMod)
			.filter((v) => `${v.titulo} ${nombreEmpresa(v.id_empresa)} ${v.descripcion ?? ''}`.toLowerCase().includes(q.toLowerCase()))
	);
	async function postularme(v) {
		try {
			await api.post('/postulaciones/', { id_egresado: auth.usuario.id_egresado, id_vacante: v.id_vacante, estado: 'Pendiente', comentarios: null });
			toast.ok('Postulación enviada'); await cargar();
		} catch (e) { toast.error(e.message); }
	}

	// ---------- Coordinador / Administrador ----------
	let modal = $state(false); let confirmar = $state(false);
	let editando = $state(null); let aBorrar = $state(null);
	let f = $state({}); let errores = $state({});
	let filas = $derived(vacantes.map((v) => ({ ...v, empresa: nombreEmpresa(v.id_empresa), postulados: cuantos(v.id_vacante), salario_texto: dinero(v.salario) })));
	const columnas = [
		{ clave: 'titulo', titulo: 'Vacante' },
		{ clave: 'empresa', titulo: 'Empresa' },
		{ clave: 'area', titulo: 'Área' },
		{ clave: 'ciudad', titulo: 'Ciudad' },
		{ clave: 'modalidad', titulo: 'Modalidad' },
		{ clave: 'salario_texto', titulo: 'Salario', ordenable: false },
		{ clave: 'cupos', titulo: 'Cupos' },
		{ clave: 'postulados', titulo: 'Postulados' },
		{ clave: 'estado', titulo: 'Estado', badge: (v) => (vacanteCerrada(v) ? 'secondary' : 'success') }
	];

	const vacio = () => ({ id_empresa: empresas.find((e) => e.estado)?.id_empresa ?? '', titulo: '', descripcion: '', requisitos: '', area: 'Tecnología', cargo: '', modalidad: 'Remoto', tipo_contrato: 'Tiempo completo', salario: '', ciudad: 'Barranquilla', fecha_cierre: '', cupos: 1, estado: 'Disponible' });
	function nueva() { editando = null; f = vacio(); errores = {}; modal = true; }
	function editar(v) {
		editando = v;
		f = { ...vacio(), ...Object.fromEntries(Object.entries(pick(v, CAMPOS)).map(([k, x]) => [k, x ?? ''])), fecha_cierre: v.fecha_cierre ? String(v.fecha_cierre).slice(0, 10) : '' };
		errores = {}; modal = true;
	}

	async function guardar(ev) {
		ev.preventDefault();
		errores = {};
		if (f.titulo.trim().length < 4) errores.titulo = 'Escribe el título de la vacante.';
		if (!f.id_empresa) errores.id_empresa = 'Selecciona la empresa.';
		if (f.salario !== '' && Number(f.salario) < 0) errores.salario = 'El salario no puede ser negativo.';
		if (Number(f.cupos) < 1) errores.cupos = 'Mínimo 1 cupo.';
		if (f.fecha_cierre && f.fecha_cierre < hoy() && !editando) errores.fecha_cierre = 'La fecha de cierre no puede ser anterior a hoy.';
		if (Object.keys(errores).length) return;

		const cuerpo = {
			...pick(editando ?? {}, CAMPOS),
			id_empresa: Number(f.id_empresa), titulo: f.titulo.trim(), descripcion: f.descripcion || null, requisitos: f.requisitos || null,
			area: f.area, cargo: f.cargo || f.titulo.trim(), modalidad: f.modalidad, tipo_contrato: f.tipo_contrato,
			salario: f.salario === '' ? null : Number(f.salario), ciudad: f.ciudad || null,
			fecha_publicacion: editando?.fecha_publicacion ?? hoy(), fecha_cierre: f.fecha_cierre || null,
			estado: f.estado, cupos: Number(f.cupos)
		};
		try {
			if (editando) { await api.put(`/vacantes/${editando.id_vacante}`, cuerpo); toast.ok('Vacante actualizada'); }
			else { await api.post('/vacantes/', cuerpo); toast.ok('Vacante publicada'); }
			modal = false; await cargar();
		} catch (e) { toast.error(e.message); }
	}
	async function alternar(v) {
		try { await api.put(`/vacantes/${v.id_vacante}`, { ...pick(v, CAMPOS), estado: vacanteCerrada(v) ? 'Disponible' : 'Cerrada' }); toast.ok(vacanteCerrada(v) ? 'Vacante reabierta' : 'Vacante cerrada'); await cargar(); }
		catch (e) { toast.error(e.message); }
	}
	function pedirBorrar(v) { aBorrar = v; confirmar = true; }
	async function borrar() {
		try { await api.del(`/vacantes/${aBorrar.id_vacante}`); toast.ok('Vacante eliminada'); await cargar(); }
		catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo="Vacantes" icono="bi-briefcase-fill" subtitulo={esEgresado ? 'Ofertas de empresas aliadas de la universidad' : 'Publicación y control de ofertas laborales'}>
	{#snippet acciones()}
		{#if !esEgresado && auth.puede(MOD, 'crear')}<button class="btn btn-primary" onclick={nueva}><i class="bi bi-plus-lg"></i> Nueva vacante</button>{/if}
	{/snippet}
</PageHeader>

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else if esEgresado}
	{#if auth.usuario.id_egresado === null}<div class="alert alert-warning">Tu cuenta aún no tiene datos de egresado, por eso no puedes postularte. Comunícate con la Oficina de Egresados.</div>{/if}
	<div class="card p-3 mb-3 shadow-sm">
		<div class="row g-2">
			<div class="col-lg-6"><div class="input-group"><span class="input-group-text"><i class="bi bi-funnel"></i></span><input class="form-control" placeholder="Cargo, empresa o tecnología..." bind:value={q} /></div></div>
			<div class="col-6 col-lg-3"><select class="form-select" bind:value={fArea} aria-label="Área"><option value="Todas">Todas las áreas</option>{#each AREAS as a}<option>{a}</option>{/each}</select></div>
			<div class="col-6 col-lg-3"><select class="form-select" bind:value={fMod} aria-label="Modalidad"><option value="Todas">Toda modalidad</option><option>Remoto</option><option>Híbrido</option><option>Presencial</option></select></div>
		</div>
	</div>
	<p class="text-muted small mb-2">{filtradas.length} vacante(s) disponibles</p>
	<div class="row g-3">
		{#each filtradas as v (v.id_vacante)}
			<div class="col-md-6 col-xl-4">
				<div class="card h-100 shadow-sm vacante-card" style="border-top:4px solid {COLORES[v.area] ?? '#3a5fb8'}">
					<div class="card-body">
						<div class="d-flex align-items-center gap-2 mb-2">
							<div class="avatar" style="background:{COLORES[v.area] ?? '#3a5fb8'}">{nombreEmpresa(v.id_empresa)[0]}</div>
							<div><div class="fw-bold lh-sm">{v.titulo}</div><div class="text-muted small">{nombreEmpresa(v.id_empresa)}</div></div>
						</div>
						<div class="d-flex flex-wrap gap-1 mb-2">
							{#if v.area}<span class="badge" style="background:{COLORES[v.area] ?? '#3a5fb8'}">{v.area}</span>{/if}
							{#if v.modalidad}<span class="badge bg-light text-dark border">{v.modalidad}</span>{/if}
							{#if v.tipo_contrato}<span class="badge bg-light text-dark border">{v.tipo_contrato}</span>{/if}
						</div>
						<p class="small text-secondary mb-2">{v.descripcion ?? ''}</p>
						<div class="small"><i class="bi bi-geo-alt-fill text-danger"></i> {v.ciudad ?? '—'} &nbsp; <i class="bi bi-cash-coin text-success"></i> {dinero(v.salario)}</div>
					</div>
					<div class="card-footer bg-white d-flex justify-content-between align-items-center">
						<small class="text-muted"><i class="bi bi-clock"></i> {hace(v.fecha_publicacion)}</small>
						{#if misIds.has(v.id_vacante)}<button class="btn btn-sm btn-success" disabled><i class="bi bi-check-circle-fill"></i> Postulado</button>
						{:else if auth.puede(MOD, 'ver')}<button class="btn btn-sm btn-primary" disabled={auth.usuario.id_egresado === null} onclick={() => postularme(v)}>Postularme <i class="bi bi-send"></i></button>{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="col-12"><div class="card p-5 text-center text-muted"><i class="bi bi-emoji-frown fs-1"></i><p class="mb-0 mt-2">No hay vacantes con esos filtros.</p></div></div>
		{/each}
	</div>
{:else}
	<DataTable {columnas} {filas} acciones={auth.puede(MOD, 'actualizar') || auth.puede(MOD, 'eliminar') ? filaAcciones : undefined} />
{/if}

{#snippet filaAcciones(v)}
	{#if auth.puede(MOD, 'actualizar')}
		<button class="btn btn-sm btn-outline-primary me-1" title="Editar" aria-label="Editar" onclick={() => editar(v)}><i class="bi bi-pencil"></i></button>
		<button class="btn btn-sm btn-outline-secondary me-1" onclick={() => alternar(v)}>{vacanteCerrada(v) ? 'Reabrir' : 'Cerrar'}</button>
	{/if}
	{#if auth.puede(MOD, 'eliminar')}<button class="btn btn-sm btn-outline-danger" title="Eliminar" aria-label="Eliminar" onclick={() => pedirBorrar(v)}><i class="bi bi-trash"></i></button>{/if}
{/snippet}

<Modal bind:abierto={modal} titulo={editando ? 'Editar vacante' : 'Nueva vacante'} tam="modal-lg">
	<form id="form-vacante" onsubmit={guardar} novalidate>
		<div class="row g-3">
			<div class="col-md-7"><label class="form-label fw-semibold" for="v-t">Título de la vacante</label><input id="v-t" class="form-control" class:is-invalid={errores.titulo} bind:value={f.titulo} /><div class="invalid-feedback">{errores.titulo}</div></div>
			<div class="col-md-5"><label class="form-label fw-semibold" for="v-e">Empresa aliada</label><select id="v-e" class="form-select" class:is-invalid={errores.id_empresa} bind:value={f.id_empresa}>{#each empresas.filter((e) => e.estado || e.id_empresa === f.id_empresa) as e}<option value={e.id_empresa}>{e.nombre}</option>{/each}</select><div class="invalid-feedback">{errores.id_empresa}</div></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-a">Área</label><select id="v-a" class="form-select" bind:value={f.area}>{#each AREAS as a}<option>{a}</option>{/each}</select></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-m">Modalidad</label><select id="v-m" class="form-select" bind:value={f.modalidad}><option>Remoto</option><option>Híbrido</option><option>Presencial</option></select></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-tc">Tipo de contrato</label><select id="v-tc" class="form-select" bind:value={f.tipo_contrato}><option>Tiempo completo</option><option>Medio tiempo</option><option>Prácticas</option><option>Por proyecto</option></select></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-c">Ciudad</label><input id="v-c" class="form-control" bind:value={f.ciudad} /></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-s">Salario (COP)</label><input id="v-s" type="number" min="0" class="form-control" class:is-invalid={errores.salario} bind:value={f.salario} /><div class="invalid-feedback">{errores.salario}</div></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-cu">Cupos</label><input id="v-cu" type="number" min="1" class="form-control" class:is-invalid={errores.cupos} bind:value={f.cupos} /><div class="invalid-feedback">{errores.cupos}</div></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-fc">Fecha de cierre</label><input id="v-fc" type="date" class="form-control" class:is-invalid={errores.fecha_cierre} bind:value={f.fecha_cierre} /><div class="invalid-feedback">{errores.fecha_cierre}</div></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="v-es">Estado</label><select id="v-es" class="form-select" bind:value={f.estado}><option>Disponible</option><option>Cerrada</option></select></div>
			<div class="col-12"><label class="form-label fw-semibold" for="v-d">Descripción</label><textarea id="v-d" rows="2" class="form-control" bind:value={f.descripcion}></textarea></div>
			<div class="col-12"><label class="form-label fw-semibold" for="v-r">Requisitos</label><textarea id="v-r" rows="2" class="form-control" bind:value={f.requisitos}></textarea></div>
		</div>
	</form>
	{#snippet pie()}
		<button class="btn btn-light" onclick={() => (modal = false)}>Cancelar</button>
		<button class="btn btn-primary" type="submit" form="form-vacante">{editando ? 'Guardar cambios' : 'Publicar vacante'}</button>
	{/snippet}
</Modal>

<ConfirmDialog bind:abierto={confirmar} mensaje={aBorrar ? `¿Eliminar la vacante "${aBorrar.titulo}"?` : ''} alConfirmar={borrar} />

<style>
	.avatar { width: 40px; height: 40px; border-radius: 12px; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none; }
	.vacante-card { transition: transform .15s ease, box-shadow .15s ease; }
	.vacante-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(20,30,80,.12) !important; }
</style>
