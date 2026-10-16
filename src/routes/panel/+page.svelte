<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { menuDe } from '$lib/modulos.js';
	import { vacanteCerrada, hace } from '$lib/utils.js';
	import Bienvenida from '$lib/components/Bienvenida.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const COLORES = ['blue', 'green', 'amber', 'purple', 'teal', 'red'];
	let datos = $state(null);
	let error = $state('');

	onMount(async () => {
		try {
			const [vacantes, empresas, egresados, postulaciones, encuestas, perfiles] = await Promise.all([
				api.get('/vacantes/'), api.get('/empresas/'), api.get('/egresados/'), api.get('/postulaciones/'), api.get('/encuestas_empleabilidad/'), api.get('/perfiles_profesionales/')
			]);
			datos = { vacantes, empresas, egresados, postulaciones, encuestas, perfiles };
		} catch (e) { error = e.message; }
	});

	let accesos = $derived(menuDe(auth.modulos).filter((m) => m.href !== '/panel' && m.href !== '/cuenta'));
	let abiertas = $derived(datos ? datos.vacantes.filter((v) => !vacanteCerrada(v)) : []);
	let tasa = $derived.by(() => {
		if (!datos) return 0;
		const u = new Map();
		for (const e of datos.encuestas) u.set(e.id_egresado, e.esta_empleado);
		return u.size ? Math.round(([...u.values()].filter(Boolean).length / u.size) * 100) : 0;
	});
	let porRevisar = $derived(datos ? datos.postulaciones.filter((p) => /pendiente|revisi/i.test(p.estado)).length : 0);
	let mias = $derived(datos ? datos.postulaciones.filter((p) => p.id_egresado === auth.usuario.id_egresado) : []);
	let perfil = $derived(datos ? datos.perfiles.find((p) => p.id_egresado === auth.usuario.id_egresado) : null);
	let completitud = $derived(perfil ? Math.round((['perfil_profesional', 'cargo_deseado', 'area_interes', 'experiencia_anios', 'habilidades', 'idiomas', 'hoja_vida_url', 'linkedin_url'].filter((k) => perfil[k] !== null && perfil[k] !== '' && perfil[k] !== undefined).length / 8) * 100) : 0);
	let recientes = $derived([...abiertas].sort((a, b) => String(b.fecha_publicacion).localeCompare(String(a.fecha_publicacion))).slice(0, 3));
	const nombreEmpresa = (id) => datos?.empresas.find((e) => e.id_empresa === id)?.nombre ?? '';
</script>

<Bienvenida />

{#if error}<div class="alert alert-danger">{error}</div>{:else if !datos}<Cargando />{:else if auth.rol === 'Egresado'}
	<div class="row g-3 mb-4">
		<div class="col-md-4"><StatCard icono="bi-person-check-fill" valor="{completitud}%" titulo="Perfil profesional completo" color="teal" href="/perfil" /></div>
		<div class="col-md-4"><StatCard icono="bi-send-fill" valor={mias.length} titulo="Mis postulaciones" color="blue" href="/postulaciones" /></div>
		<div class="col-md-4"><StatCard icono="bi-briefcase-fill" valor={abiertas.length} titulo="Vacantes disponibles" color="amber" href="/vacantes" /></div>
	</div>
	{#if auth.usuario.id_egresado === null}<div class="alert alert-warning">Tu cuenta aún no tiene datos de egresado. Comunícate con la Oficina de Egresados.</div>{/if}
	<h5 class="fw-bold mb-3">Vacantes recientes</h5>
	<div class="row g-3">
		{#each recientes as v (v.id_vacante)}
			<div class="col-md-4"><div class="card p-3 shadow-sm h-100"><div class="fw-bold">{v.titulo}</div><div class="text-muted small mb-1">{nombreEmpresa(v.id_empresa)} · {v.ciudad ?? ''}</div><div class="small text-muted mb-2">{hace(v.fecha_publicacion)}</div><a href="/vacantes" class="btn btn-sm btn-outline-primary mt-auto">Ver vacantes</a></div></div>
		{/each}
	</div>
{:else}
	<div class="row g-3 mb-4">
		<div class="col-6 col-lg-3"><StatCard icono="bi-briefcase-fill" valor={abiertas.length} titulo="Vacantes abiertas" color="blue" /></div>
		<div class="col-6 col-lg-3"><StatCard icono="bi-hourglass-split" valor={porRevisar} titulo="Postulaciones por revisar" color="amber" /></div>
		<div class="col-6 col-lg-3"><StatCard icono="bi-people-fill" valor={datos.egresados.length} titulo="Egresados registrados" color="green" /></div>
		<div class="col-6 col-lg-3"><StatCard icono="bi-graph-up-arrow" valor="{tasa}%" titulo="Tasa de empleabilidad" color="purple" /></div>
	</div>
	<h5 class="fw-bold mb-3">Tus módulos</h5>
	<div class="row g-3">
		{#each accesos as m, i}
			<div class="col-md-6 col-xl-4"><a href={m.href} class="acceso-card bg-g-{COLORES[i % COLORES.length]}"><i class="bi {m.icon}"></i><div class="fw-bold mt-1">{m.label}</div><div class="small opacity-75">{m.desc ?? ''}</div></a></div>
		{/each}
	</div>
{/if}
