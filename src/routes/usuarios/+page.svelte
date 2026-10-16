<script>
	import { onMount } from 'svelte';
	import { api, pick } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { esCorreo, esCelular, passwordValida } from '$lib/validar.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import InputPassword from '$lib/components/InputPassword.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const MOD = 'Gestión de usuarios';
	const CAMPOS = ['id_rol', 'nombre', 'apellido', 'correo', 'contrasena', 'celular', 'direccion', 'ciudad', 'estado'];
	const PROGRAMAS = ['Ingeniería de Sistemas', 'Ingeniería Industrial', 'Administración de Empresas', 'Contaduría Pública', 'Mercadeo y Publicidad', 'Enfermería', 'Derecho', 'Psicología'];

	let usuarios = $state([]);
	let roles = $state([]);
	let cargando = $state(true);
	let error = $state('');

	let modal = $state(false);
	let confirmar = $state(false);
	let editando = $state(null);
	let aBorrar = $state(null);
	let f = $state({});
	let errores = $state({});

	const nombreRol = (id) => roles.find((r) => r.id_rol === id)?.nombre ?? '—';
	let filas = $derived(usuarios.map((u) => ({ ...u, rol: nombreRol(u.id_rol), nombre_completo: `${u.nombre} ${u.apellido}`, activo: u.estado ? 'Activo' : 'Inactivo' })));
	const esYo = (u) => u.id_usuario === auth.usuario.id_usuario;
	const esEgresadoRol = (id) => nombreRol(id) === 'Egresado';

	const columnas = [
		{ clave: 'nombre_completo', titulo: 'Nombre' },
		{ clave: 'correo', titulo: 'Correo' },
		{ clave: 'celular', titulo: 'Celular' },
		{ clave: 'rol', titulo: 'Rol', badge: (u) => (u.rol === 'Administrador' ? 'primary' : u.rol === 'Coordinador' ? 'warning' : 'success') },
		{ clave: 'activo', titulo: 'Estado', badge: (u) => (u.estado ? 'success' : 'secondary') }
	];

	async function cargar() {
		try {
			[usuarios, roles] = await Promise.all([api.get('/usuarios/'), api.get('/roles/')]);
			roles = roles.filter((r) => ['Administrador', 'Coordinador', 'Egresado'].includes(r.nombre));
		} catch (e) { error = e.message; }
		cargando = false;
	}
	onMount(cargar);

	function nuevo() {
		editando = null;
		f = { nombre: '', apellido: '', correo: '', celular: '', ciudad: '', direccion: '', id_rol: roles.find((r) => r.nombre === 'Egresado')?.id_rol ?? roles[0]?.id_rol, password: '', programa: '', anio: new Date().getFullYear() };
		errores = {}; modal = true;
	}
	function editar(u) {
		editando = u;
		f = { nombre: u.nombre, apellido: u.apellido, correo: u.correo, celular: u.celular ?? '', ciudad: u.ciudad ?? '', direccion: u.direccion ?? '', id_rol: u.id_rol, password: '' };
		errores = {}; modal = true;
	}

	async function guardar(ev) {
		ev.preventDefault();
		errores = {};
		if (f.nombre.trim().length < 2) errores.nombre = 'Ingresa el nombre.';
		if (f.apellido.trim().length < 2) errores.apellido = 'Ingresa el apellido.';
		if (!esCorreo(f.correo)) errores.correo = 'Correo inválido.';
		if (!esCelular(f.celular)) errores.celular = 'Celular de 10 dígitos que empiece por 3.';
		if (!editando && !passwordValida(f.password)) errores.password = 'Mínimo 8 caracteres, con letras y números.';
		if (editando && f.password && !passwordValida(f.password)) errores.password = 'Mínimo 8 caracteres, con letras y números.';
		if (!editando && esEgresadoRol(f.id_rol) && !f.programa) errores.programa = 'Selecciona el programa.';
		const repetido = usuarios.find((u) => u.id_usuario !== editando?.id_usuario && u.correo?.toLowerCase() === f.correo.trim().toLowerCase());
		if (repetido) errores.correo = 'Este correo ya está registrado.';
		const celRep = usuarios.find((u) => u.id_usuario !== editando?.id_usuario && u.celular === f.celular.trim());
		if (celRep) errores.celular = 'Este celular ya pertenece a otra cuenta.';
		if (Object.keys(errores).length) return;

		const cuerpo = { nombre: f.nombre.trim(), apellido: f.apellido.trim(), correo: f.correo.trim(), celular: f.celular.trim(), ciudad: f.ciudad || null, direccion: f.direccion || null, id_rol: Number(f.id_rol) };
		try {
			if (editando) {
				await api.put(`/usuarios/${editando.id_usuario}`, { ...pick(editando, CAMPOS), ...cuerpo, contrasena: f.password || editando.contrasena });
				toast.ok('Usuario actualizado');
			} else {
				const r = await api.post('/usuarios/', { ...cuerpo, contrasena: f.password, estado: true });
				if (esEgresadoRol(cuerpo.id_rol)) {
					await api.post('/egresados/', { id_usuario: r.id, codigo_estudiante: null, programa_academico: f.programa, facultad: null, fecha_graduacion: `${f.anio}-12-15`, nivel_formacion: 'Profesional', anio_graduacion: Number(f.anio), estado: true });
				}
				toast.ok('Usuario creado');
			}
			modal = false;
			await cargar();
		} catch (e) { toast.error(e.message); }
	}

	async function alternar(u) {
		try {
			await api.put(`/usuarios/${u.id_usuario}`, { ...pick(u, CAMPOS), estado: !u.estado });
			toast.ok(u.estado ? 'Cuenta bloqueada' : 'Cuenta activada');
			await cargar();
		} catch (e) { toast.error(e.message); }
	}
	function pedirBorrar(u) { aBorrar = u; confirmar = true; }
	async function borrar() {
		try { await api.del(`/usuarios/${aBorrar.id_usuario}`); toast.ok('Usuario eliminado'); await cargar(); }
		catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo="Usuarios" icono="bi-person-badge-fill" subtitulo="Cuentas de acceso, rol asignado y bloqueo de cuentas">
	{#snippet acciones()}
		{#if auth.puede(MOD, 'crear')}<button class="btn btn-primary" onclick={nuevo}><i class="bi bi-person-plus-fill"></i> Nuevo usuario</button>{/if}
	{/snippet}
</PageHeader>

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else}
	<DataTable {columnas} {filas}>
		{#snippet acciones(u)}
			{#if auth.puede(MOD, 'actualizar')}
				<button class="btn btn-sm btn-outline-primary me-1" title="Editar" aria-label="Editar" onclick={() => editar(u)}><i class="bi bi-pencil"></i></button>
				<button class="btn btn-sm btn-outline-secondary me-1" disabled={esYo(u)} onclick={() => alternar(u)}>{u.estado ? 'Bloquear' : 'Activar'}</button>
			{/if}
			{#if auth.puede(MOD, 'eliminar')}<button class="btn btn-sm btn-outline-danger" title="Eliminar" aria-label="Eliminar" disabled={esYo(u)} onclick={() => pedirBorrar(u)}><i class="bi bi-trash"></i></button>{/if}
		{/snippet}
	</DataTable>
{/if}

<Modal bind:abierto={modal} titulo={editando ? 'Editar usuario' : 'Nuevo usuario'} tam="modal-lg">
	<form id="form-usuario" onsubmit={guardar} novalidate>
		<div class="row g-3">
			<div class="col-md-6"><label class="form-label fw-semibold" for="u-n">Nombres</label><input id="u-n" class="form-control" class:is-invalid={errores.nombre} bind:value={f.nombre} /><div class="invalid-feedback">{errores.nombre}</div></div>
			<div class="col-md-6"><label class="form-label fw-semibold" for="u-a">Apellidos</label><input id="u-a" class="form-control" class:is-invalid={errores.apellido} bind:value={f.apellido} /><div class="invalid-feedback">{errores.apellido}</div></div>
			<div class="col-md-6"><label class="form-label fw-semibold" for="u-c">Correo</label><input id="u-c" class="form-control" class:is-invalid={errores.correo} bind:value={f.correo} /><div class="invalid-feedback">{errores.correo}</div></div>
			<div class="col-md-6"><label class="form-label fw-semibold" for="u-t">Celular</label><input id="u-t" class="form-control" class:is-invalid={errores.celular} maxlength="10" value={f.celular} oninput={(e) => (f.celular = e.target.value.replace(/\D/g, ''))} /><div class="invalid-feedback">{errores.celular}</div></div>
			<div class="col-md-6"><label class="form-label fw-semibold" for="u-r">Rol</label><select id="u-r" class="form-select" bind:value={f.id_rol} disabled={editando && esYo(editando)}>{#each roles as r}<option value={r.id_rol}>{r.nombre}</option>{/each}</select></div>
			<div class="col-md-6"><label class="form-label fw-semibold" for="u-ci">Ciudad</label><input id="u-ci" class="form-control" bind:value={f.ciudad} /></div>
			{#if !editando && esEgresadoRol(Number(f.id_rol))}
				<div class="col-md-8"><label class="form-label fw-semibold" for="u-p">Programa académico</label><select id="u-p" class="form-select" class:is-invalid={errores.programa} bind:value={f.programa}><option value="">Selecciona...</option>{#each PROGRAMAS as p}<option>{p}</option>{/each}</select><div class="invalid-feedback">{errores.programa}</div></div>
				<div class="col-md-4"><label class="form-label fw-semibold" for="u-an">Año de grado</label><input id="u-an" type="number" class="form-control" bind:value={f.anio} /></div>
			{/if}
			<div class="col-12"><InputPassword id="u-pw" label={editando ? 'Nueva contraseña (déjala vacía para no cambiarla)' : 'Contraseña'} bind:value={f.password} error={errores.password} autocomplete="new-password" /></div>
		</div>
	</form>
	{#snippet pie()}
		<button class="btn btn-light" onclick={() => (modal = false)}>Cancelar</button>
		<button class="btn btn-primary" type="submit" form="form-usuario">{editando ? 'Guardar cambios' : 'Crear usuario'}</button>
	{/snippet}
</Modal>

<ConfirmDialog bind:abierto={confirmar} mensaje={aBorrar ? `¿Eliminar a ${aBorrar.nombre} ${aBorrar.apellido}? Esta acción no se puede deshacer.` : ''} alConfirmar={borrar} />
