<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { PAGINAS } from '$lib/modulos.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const MOD = 'Configuración';
	let modulos = $state([]); let roles = $state([]); let permisos = $state([]); let usuarios = $state([]);
	let cargando = $state(true); let error = $state('');
	let modal = $state(false); let editando = $state(null); let descripcion = $state('');

	async function cargar() {
		try { [modulos, roles, permisos, usuarios] = await Promise.all([api.get('/modulos/'), api.get('/roles/'), api.get('/modulos_x_roles/'), api.get('/usuarios/')]); 
			roles = roles.filter((r) => ['Administrador', 'Coordinador', 'Egresado'].includes(r.nombre)); }
		catch (e) { error = e.message; }
		cargando = false;
	}
	onMount(cargar);

	let filas = $derived(modulos.filter((m) => PAGINAS[m.nombre]).map((m) => ({ ...m, pantalla: PAGINAS[m.nombre].etiqueta, roles_con_acceso: roles.filter((r) => permisos.some((p) => p.id_rol === r.id_rol && p.id_modulo === m.id_modulo && p.puede_ver)).map((r) => r.nombre).join(', ') || 'Ninguno' })));
	const columnas = [
		{ clave: 'nombre', titulo: 'Módulo' },
		{ clave: 'pantalla', titulo: 'Pantalla en el menú' },
		{ clave: 'descripcion', titulo: 'Descripción' },
		{ clave: 'roles_con_acceso', titulo: 'Roles con acceso' }
	];

	function editar(m) { editando = m; descripcion = m.descripcion ?? ''; modal = true; }
	async function guardar(ev) {
		ev.preventDefault();
		if (descripcion.trim().length < 5) { toast.error('Escribe una descripción de al menos 5 caracteres.'); return; }
		try {
			await api.put(`/modulos/${editando.id_modulo}`, { nombre: editando.nombre, descripcion: descripcion.trim() });
			toast.ok('Módulo actualizado'); modal = false; await cargar();
			await auth.refrescarModulos();
		} catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo="Configuración del sistema" icono="bi-gear-fill" subtitulo="Módulos de la plataforma y los roles que tienen acceso a cada uno" />

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else}
	<div class="row g-3 mb-3">
		<div class="col-6 col-md-4"><StatCard icono="bi-grid-fill" valor={filas.length} titulo="Módulos activos" color="blue" /></div>
		<div class="col-6 col-md-4"><StatCard icono="bi-shield-check" valor={roles.length} titulo="Roles del sistema" color="amber" /></div>
		<div class="col-12 col-md-4"><StatCard icono="bi-people-fill" valor={usuarios.filter((u) => u.estado).length} titulo="Usuarios activos" color="green" /></div>
	</div>
	<DataTable {columnas} {filas} acciones={auth.puede(MOD, 'actualizar') ? filaAcciones : undefined} />
{/if}

{#snippet filaAcciones(m)}
	<button class="btn btn-sm btn-outline-primary" onclick={() => editar(m)}><i class="bi bi-pencil"></i> Editar descripción</button>
{/snippet}

<Modal bind:abierto={modal} titulo="Editar módulo">
	<form id="form-modulo" onsubmit={guardar}>
		<div class="mb-3"><label class="form-label fw-semibold" for="m-n">Módulo</label><input id="m-n" class="form-control" value={editando?.nombre ?? ''} disabled /></div>
		<div><label class="form-label fw-semibold" for="m-d">Descripción</label><textarea id="m-d" rows="3" class="form-control" bind:value={descripcion}></textarea></div>
	</form>
	{#snippet pie()}
		<button class="btn btn-light" onclick={() => (modal = false)}>Cancelar</button>
		<button class="btn btn-primary" type="submit" form="form-modulo">Guardar</button>
	{/snippet}
</Modal>
