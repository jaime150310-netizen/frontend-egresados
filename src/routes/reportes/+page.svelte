<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { vacanteCerrada } from '$lib/utils.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	let d = $state(null);
	let error = $state('');
	onMount(async () => {
		try {
			const [vacantes, empresas, egresados, postulaciones, encuestas] = await Promise.all([api.get('/vacantes/'), api.get('/empresas/'), api.get('/egresados/'), api.get('/postulaciones/'), api.get('/encuestas_empleabilidad/')]);
			d = { vacantes, empresas, egresados, postulaciones, encuestas };
		} catch (e) { error = e.message; }
	});

	const contar = (lista, clave) => Object.entries(lista.reduce((acc, x) => { const k = clave(x) || 'Sin definir'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);

	let abiertas = $derived(d ? d.vacantes.filter((v) => !vacanteCerrada(v)) : []);
	let ultimas = $derived.by(() => { const u = new Map(); if (d) for (const e of d.encuestas) u.set(e.id_egresado, e.esta_empleado); return u; });
	let empleados = $derived([...ultimas.values()].filter(Boolean).length);
	let tasa = $derived(ultimas.size ? Math.round((empleados / ultimas.size) * 100) : 0);
	let contratados = $derived(d ? d.postulaciones.filter((p) => /contrat/i.test(p.estado)).length : 0);

	let porArea = $derived(d ? contar(abiertas, (v) => v.area) : []);
	let porEstado = $derived(d ? contar(d.postulaciones, (p) => p.estado) : []);
	let porSector = $derived(d ? contar(d.empresas, (e) => e.sector_economico) : []);
	let porPrograma = $derived(d ? contar(d.egresados, (e) => e.programa_academico) : []);
	const maximo = (l) => Math.max(1, ...l.map((x) => x[1]));
</script>

{#snippet barras(titulo, lista, color)}
	<div class="card p-4 shadow-sm h-100">
		<h6 class="fw-bold mb-3">{titulo}</h6>
		{#each lista as [nombre, n]}
			<div class="mb-2"><div class="d-flex justify-content-between small"><span>{nombre}</span><strong>{n}</strong></div>
			<div class="progress" style="height:10px"><div class="progress-bar bg-{color}" style="width:{(n / maximo(lista)) * 100}%"></div></div></div>
		{:else}<p class="text-muted small mb-0">Sin datos para mostrar.</p>{/each}
	</div>
{/snippet}

<PageHeader titulo="Reportes y analítica" icono="bi-bar-chart-fill" subtitulo="Indicadores de empleabilidad calculados con los datos del sistema" />

{#if error}<div class="alert alert-danger">{error}</div>{:else if !d}<Cargando />{:else}
	<div class="row g-3 mb-3">
		<div class="col-6 col-md-3"><StatCard icono="bi-graph-up-arrow" valor="{tasa}%" titulo="Tasa de empleabilidad" color="green" /></div>
		<div class="col-6 col-md-3"><StatCard icono="bi-people-fill" valor={d.egresados.length} titulo="Egresados" color="blue" /></div>
		<div class="col-6 col-md-3"><StatCard icono="bi-building-fill" valor={d.empresas.filter((e) => e.estado).length} titulo="Empresas aliadas activas" color="amber" /></div>
		<div class="col-6 col-md-3"><StatCard icono="bi-person-check-fill" valor={contratados} titulo="Egresados contratados" color="purple" /></div>
	</div>
	<div class="row g-3">
		<div class="col-lg-6">{@render barras('Vacantes abiertas por área', porArea, 'primary')}</div>
		<div class="col-lg-6">{@render barras('Postulaciones por estado', porEstado, 'warning')}</div>
		<div class="col-lg-6">{@render barras('Empresas aliadas por sector', porSector, 'info')}</div>
		<div class="col-lg-6">{@render barras('Egresados por programa', porPrograma, 'success')}</div>
		<div class="col-12">
			<div class="card p-4 shadow-sm">
				<h6 class="fw-bold mb-3">Situación laboral según la última encuesta de cada egresado</h6>
				<div class="d-flex justify-content-between small"><span>Empleados</span><strong>{empleados}</strong></div>
				<div class="progress mb-3" style="height:14px"><div class="progress-bar bg-success" style="width:{tasa}%"></div></div>
				<div class="d-flex justify-content-between small"><span>Buscando empleo</span><strong>{ultimas.size - empleados}</strong></div>
				<div class="progress" style="height:14px"><div class="progress-bar bg-warning" style="width:{ultimas.size ? 100 - tasa : 0}%"></div></div>
			</div>
		</div>
	</div>
{/if}
