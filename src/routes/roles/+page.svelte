<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { PAGINAS } from '$lib/modulos.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Cargando from '$lib/components/Cargando.svelte';
	import { datatable } from '$lib/datatable.js';

	const MOD = 'Gestión de roles';
	const ACCIONES = [['ver', 'Ver'], ['crear', 'Crear'], ['actualizar', 'Actualizar'], ['eliminar', 'Eliminar']];
	const info = {
		Administrador: { icono: 'bi-shield-lock-fill', color: '#223462', texto: 'Gestiona usuarios, roles y permisos, y la configuración del sistema.' },
		Coordinador: { icono: 'bi-diagram-3-fill', color: '#d98a25', texto: 'Oficina de Egresados: empresas, vacantes, postulaciones y seguimiento.' },
		Egresado: { icono: 'bi-mortarboard-fill', color: '#128f83', texto: 'Perfil profesional, vacantes, postulaciones y encuesta de empleabilidad.' }
	};

	let roles = $state([]);
	let modulos = $state([]);
	let permisos = $state([]);
	let rolId = $state(null);
	let cargando = $state(true);
	let error = $state('');

	async function cargar() {
		try {
			const [r, m, p] = await Promise.all([api.get('/roles/'), api.get('/modulos/'), api.get('/modulos_x_roles/')]);
			roles = r.filter((x) => info[x.nombre]);
			modulos = m.filter((x) => PAGINAS[x.nombre]);
			permisos = p;
			if (rolId === null) rolId = roles.find((x) => x.nombre === 'Coordinador')?.id_rol ?? roles[0]?.id_rol;
		} catch (e) { error = e.message; }
		cargando = false;
	}
	onMount(cargar);

	let rolActual = $derived(roles.find((r) => r.id_rol === rolId));
	const permisoDe = (idModulo) => permisos.find((p) => p.id_rol === rolId && p.id_modulo === idModulo);
	const bloqueado = (m, accion) => rolActual?.nombre === 'Administrador' && m.nombre === 'Gestión de roles' && (accion === 'ver' || accion === 'actualizar');

	async function alternar(m, accion) {
		const p = permisoDe(m.id_modulo);
		const flags = { ver: !!p?.puede_ver, crear: !!p?.puede_crear, actualizar: !!p?.puede_actualizar, eliminar: !!p?.puede_eliminar };
		flags[accion] = !flags[accion];
		if (accion === 'ver' && !flags.ver) { flags.crear = false; flags.actualizar = false; flags.eliminar = false; }
		if (accion !== 'ver' && flags[accion]) flags.ver = true;
		const cuerpo = { id_rol: rolId, id_modulo: m.id_modulo, puede_ver: flags.ver, puede_crear: flags.crear, puede_actualizar: flags.actualizar, puede_eliminar: flags.eliminar };
		try {
			if (p) await api.put(`/modulos_x_roles/${p.id_modulo_rol}`, cuerpo);
			else await api.post('/modulos_x_roles/', cuerpo);
			permisos = await api.get('/modulos_x_roles/');
			if (rolId === auth.usuario.id_rol) await auth.refrescarModulos();
			toast.ok('Permiso actualizado');
		} catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo="Roles y permisos" icono="bi-shield-check" subtitulo="Define qué puede ver, crear, actualizar o eliminar cada rol. Los cambios se guardan en la base de datos y se aplican al menú de ese rol." />

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else}
	<div class="row g-3 mb-3">
		{#each roles as r}
			<div class="col-md-4">
				<button type="button" class="card p-3 shadow-sm w-100 text-start rol-card" class:sel={rolId === r.id_rol} style="--c:{info[r.nombre].color}" onclick={() => (rolId = r.id_rol)}>
					<div class="d-flex align-items-center gap-2"><i class="bi {info[r.nombre].icono} fs-4" style="color:{info[r.nombre].color}"></i><h6 class="fw-bold m-0">{r.nombre}</h6></div>
					<p class="text-muted small mb-0 mt-1">{info[r.nombre].texto}</p>
				</button>
			</div>
		{/each}
	</div>

	<div class="card shadow-sm">
		<div class="table-responsive p-3">
			<table class="table align-middle w-100" use:datatable={{ paging: false, ordering: false, info: false, searching: true }}>
				<thead class="table-light"><tr><th>Módulo</th>{#each ACCIONES as [, etiqueta]}<th class="text-center">{etiqueta}</th>{/each}</tr></thead>
				<tbody>
					{#each modulos as m (m.id_modulo)}
						{@const p = permisoDe(m.id_modulo)}
						<tr>
							<td><i class="bi {PAGINAS[m.nombre].icono} me-2 text-muted"></i><strong>{PAGINAS[m.nombre].etiqueta}</strong><div class="text-muted small">{m.descripcion ?? ''}</div></td>
							{#each ACCIONES as [accion]}
								<td class="text-center">
									<div class="form-check form-switch d-flex justify-content-center">
										<input class="form-check-input" type="checkbox" aria-label="{accion} {m.nombre}" checked={!!p?.[`puede_${accion}`]}
											disabled={!auth.puede(MOD, 'actualizar') || bloqueado(m, accion)} onchange={() => alternar(m, accion)} />
									</div>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	<p class="text-muted small mt-3"><i class="bi bi-info-circle"></i> El Administrador siempre conserva acceso a esta pantalla para no bloquear el sistema.</p>
{/if}

<style>
	.rol-card { border: 2px solid transparent; transition: all .15s ease; background: #fff; }
	.rol-card:hover { border-color: var(--c); }
	.rol-card.sel { border-color: var(--c); background: color-mix(in srgb, var(--c) 8%, white); }
</style>
