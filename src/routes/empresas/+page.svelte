<script>
	import { onMount } from 'svelte';
	import { api, pick } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { esCorreo, esCelular, esNit } from '$lib/validar.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const MOD = 'Empresas';
	const SECTORES = ['Tecnología', 'Comercio', 'Servicios', 'Construcción', 'Salud', 'Logística', 'Educación', 'Finanzas', 'Otro'];
	const CAMPOS = ['nombre', 'identificacion_fiscal', 'direccion', 'ciudad', 'telefono', 'correo', 'persona_contacto', 'sector_economico', 'descripcion', 'estado'];

	let empresas = $state([]);
	let cargando = $state(true);
	let error = $state('');
	let modal = $state(false);
	let confirmar = $state(false);
	let editando = $state(null);
	let aBorrar = $state(null);
	let f = $state({});
	let errores = $state({});

	let filas = $derived(empresas.map((e) => ({ ...e, activa: e.estado ? 'Activa' : 'Inactiva' })));
	const columnas = [
		{ clave: 'nombre', titulo: 'Empresa' },
		{ clave: 'identificacion_fiscal', titulo: 'NIT' },
		{ clave: 'sector_economico', titulo: 'Sector' },
		{ clave: 'ciudad', titulo: 'Ciudad' },
		{ clave: 'persona_contacto', titulo: 'Contacto' },
		{ clave: 'telefono', titulo: 'Teléfono' },
		{ clave: 'activa', titulo: 'Estado', badge: (e) => (e.estado ? 'success' : 'secondary') }
	];

	async function cargar() {
		try { empresas = await api.get('/empresas/'); } catch (e) { error = e.message; }
		cargando = false;
	}
	onMount(cargar);

	const vacio = () => ({ nombre: '', identificacion_fiscal: '', direccion: '', ciudad: 'Barranquilla', telefono: '', correo: '', persona_contacto: '', sector_economico: 'Tecnología', descripcion: '' });
	function nueva() { editando = null; f = vacio(); errores = {}; modal = true; }
	function editar(e) { editando = e; f = { ...vacio(), ...Object.fromEntries(Object.entries(pick(e, CAMPOS)).map(([k, v]) => [k, v ?? ''])) }; errores = {}; modal = true; }

	async function guardar(ev) {
		ev.preventDefault();
		errores = {};
		if (f.nombre.trim().length < 3) errores.nombre = 'Ingresa la razón social.';
		if (!esNit(f.identificacion_fiscal)) errores.identificacion_fiscal = 'NIT inválido. Ejemplo: 900.123.456-7';
		if (!esCelular(f.telefono)) errores.telefono = 'Celular de 10 dígitos que empiece por 3.';
		if (f.correo && !esCorreo(f.correo)) errores.correo = 'Correo inválido.';
		const dup = empresas.find((e) => e.id_empresa !== editando?.id_empresa && e.nombre.trim().toLowerCase() === f.nombre.trim().toLowerCase());
		if (dup) errores.nombre = 'Ya existe una empresa con esa razón social.';
		const dupNit = empresas.find((e) => e.id_empresa !== editando?.id_empresa && (e.identificacion_fiscal ?? '').replace(/[.\s-]/g, '') === f.identificacion_fiscal.replace(/[.\s-]/g, ''));
		if (dupNit) errores.identificacion_fiscal = 'Ya existe una empresa con ese NIT.';
		if (Object.keys(errores).length) return;

		const cuerpo = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'string' ? (v.trim() || null) : v]));
		try {
			if (editando) { await api.put(`/empresas/${editando.id_empresa}`, { ...pick(editando, CAMPOS), ...cuerpo }); toast.ok('Empresa actualizada'); }
			else { await api.post('/empresas/', { ...cuerpo, estado: true }); toast.ok('Empresa registrada'); }
			modal = false; await cargar();
		} catch (e) { toast.error(e.message); }
	}

	async function alternar(e) {
		try { await api.put(`/empresas/${e.id_empresa}`, { ...pick(e, CAMPOS), estado: !e.estado }); toast.ok(e.estado ? 'Empresa desactivada' : 'Empresa activada'); await cargar(); }
		catch (err) { toast.error(err.message); }
	}
	function pedirBorrar(e) { aBorrar = e; confirmar = true; }
	async function borrar() {
		try { await api.del(`/empresas/${aBorrar.id_empresa}`); toast.ok('Empresa eliminada'); await cargar(); }
		catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo="Empresas aliadas" icono="bi-building-fill" subtitulo="Empresas con convenio con la universidad y sus datos de contacto">
	{#snippet acciones()}
		{#if auth.puede(MOD, 'crear')}<button class="btn btn-primary" onclick={nueva}><i class="bi bi-plus-lg"></i> Registrar empresa</button>{/if}
	{/snippet}
</PageHeader>

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else}
	<DataTable {columnas} {filas} acciones={auth.puede(MOD, 'actualizar') || auth.puede(MOD, 'eliminar') ? filaAcciones : undefined}>
	</DataTable>
{/if}

{#snippet filaAcciones(e)}
	{#if auth.puede(MOD, 'actualizar')}
		<button class="btn btn-sm btn-outline-primary me-1" title="Editar" aria-label="Editar" onclick={() => editar(e)}><i class="bi bi-pencil"></i></button>
		<button class="btn btn-sm btn-outline-secondary me-1" onclick={() => alternar(e)}>{e.estado ? 'Desactivar' : 'Activar'}</button>
	{/if}
	{#if auth.puede(MOD, 'eliminar')}<button class="btn btn-sm btn-outline-danger" title="Eliminar" aria-label="Eliminar" onclick={() => pedirBorrar(e)}><i class="bi bi-trash"></i></button>{/if}
{/snippet}

<Modal bind:abierto={modal} titulo={editando ? 'Editar empresa' : 'Registrar empresa'} tam="modal-lg">
	<form id="form-empresa" onsubmit={guardar} novalidate>
		<div class="row g-3">
			<div class="col-md-8"><label class="form-label fw-semibold" for="e-n">Razón social</label><input id="e-n" class="form-control" class:is-invalid={errores.nombre} bind:value={f.nombre} /><div class="invalid-feedback">{errores.nombre}</div></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="e-nit">NIT</label><input id="e-nit" class="form-control" class:is-invalid={errores.identificacion_fiscal} placeholder="900.123.456-7" bind:value={f.identificacion_fiscal} /><div class="invalid-feedback">{errores.identificacion_fiscal}</div></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="e-s">Sector</label><select id="e-s" class="form-select" bind:value={f.sector_economico}>{#each SECTORES as s}<option>{s}</option>{/each}</select></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="e-c">Ciudad</label><input id="e-c" class="form-control" bind:value={f.ciudad} /></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="e-d">Dirección</label><input id="e-d" class="form-control" bind:value={f.direccion} /></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="e-p">Persona de contacto</label><input id="e-p" class="form-control" bind:value={f.persona_contacto} /></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="e-t">Celular de contacto</label><input id="e-t" class="form-control" class:is-invalid={errores.telefono} maxlength="10" value={f.telefono} oninput={(ev) => (f.telefono = ev.target.value.replace(/\D/g, ''))} /><div class="invalid-feedback">{errores.telefono}</div></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="e-co">Correo de contacto</label><input id="e-co" class="form-control" class:is-invalid={errores.correo} bind:value={f.correo} /><div class="invalid-feedback">{errores.correo}</div></div>
			<div class="col-12"><label class="form-label fw-semibold" for="e-de">Descripción</label><textarea id="e-de" rows="2" class="form-control" bind:value={f.descripcion}></textarea></div>
		</div>
	</form>
	{#snippet pie()}
		<button class="btn btn-light" onclick={() => (modal = false)}>Cancelar</button>
		<button class="btn btn-primary" type="submit" form="form-empresa">{editando ? 'Guardar cambios' : 'Registrar'}</button>
	{/snippet}
</Modal>

<ConfirmDialog bind:abierto={confirmar} mensaje={aBorrar ? `¿Eliminar la empresa ${aBorrar.nombre}?` : ''} alConfirmar={borrar} />
