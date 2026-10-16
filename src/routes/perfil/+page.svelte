<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { iniciales } from '$lib/utils.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const MOD = 'Perfiles profesionales';
	const AREAS = ['Tecnología', 'Administración', 'Finanzas', 'Logística', 'Ingeniería', 'Salud', 'Marketing', 'Educación'];
	let perfil = $state(null);
	let egresado = $state(null);
	let f = $state({});
	let errores = $state({});
	let cargando = $state(true);
	const esEgresado = auth.rol === 'Egresado';
	let error = $state('');

	onMount(async () => {
		if (!esEgresado) { cargando = false; return; }
		try {
			if (auth.usuario.id_egresado === null) throw new Error('Tu cuenta aún no tiene datos de egresado. Comunícate con la Oficina de Egresados.');
			const [perfiles, eg] = await Promise.all([api.get('/perfiles_profesionales/'), api.get(`/egresados/${auth.usuario.id_egresado}`)]);
			egresado = eg;
			perfil = perfiles.find((p) => p.id_egresado === auth.usuario.id_egresado) ?? null;
			f = {
				perfil_profesional: perfil?.perfil_profesional ?? '', cargo_deseado: perfil?.cargo_deseado ?? '', area_interes: perfil?.area_interes ?? 'Tecnología',
				experiencia_anios: perfil?.experiencia_anios ?? '', habilidades: perfil?.habilidades ?? '', idiomas: perfil?.idiomas ?? '',
				hoja_vida_url: perfil?.hoja_vida_url ?? '', linkedin_url: perfil?.linkedin_url ?? '', portafolio_url: perfil?.portafolio_url ?? '', disponibilidad: perfil?.disponibilidad ?? 'Inmediata'
			};
		} catch (e) { error = e.message; }
		cargando = false;
	});

	const esUrl = (v) => !v || /^https?:\/\/\S+\.\S+/.test(v.trim());
	let completitud = $derived(Math.round((['perfil_profesional', 'cargo_deseado', 'experiencia_anios', 'habilidades', 'idiomas', 'hoja_vida_url', 'linkedin_url'].filter((k) => String(f[k] ?? '').trim()).length / 7) * 100));

	async function guardar(ev) {
		ev.preventDefault();
		errores = {};
		if (f.experiencia_anios !== '' && Number(f.experiencia_anios) < 0) errores.experiencia_anios = 'No puede ser negativa.';
		for (const k of ['hoja_vida_url', 'linkedin_url', 'portafolio_url']) if (!esUrl(f[k])) errores[k] = 'Ingresa un enlace válido que empiece por http:// o https://';
		if (Object.keys(errores).length) return;
		const cuerpo = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'string' ? (v.trim() || null) : v]));
		cuerpo.experiencia_anios = f.experiencia_anios === '' ? null : Number(f.experiencia_anios);
		cuerpo.id_egresado = auth.usuario.id_egresado;
		try {
			if (perfil) await api.put(`/perfiles_profesionales/${perfil.id_perfil}`, cuerpo);
			else { const r = await api.post('/perfiles_profesionales/', cuerpo); perfil = { id_perfil: r.id }; }
			toast.ok('Perfil profesional guardado');
		} catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo={esEgresado ? 'Mi perfil profesional' : 'Mi perfil'} icono="bi-person-circle" subtitulo={esEgresado ? 'Esta información la consulta la Oficina de Egresados' : 'Tus datos en el sistema'} />

{#if !esEgresado}
	<div class="card p-4 shadow-sm d-flex flex-row align-items-center gap-3 flex-wrap">
		<div class="avatar">{iniciales(auth.usuario.nombre)}</div>
		<div class="flex-grow-1">
			<h5 class="fw-bold m-0">{auth.usuario.nombre}</h5>
			<div class="text-muted small">{auth.usuario.correo} · {auth.rol}</div>
		</div>
		<a href="/cuenta" class="btn btn-outline-primary"><i class="bi bi-person-gear me-1"></i> Editar mis datos</a>
	</div>
{:else if error}<div class="alert alert-warning">{error}</div>{:else if cargando}<Cargando />{:else}
	<div class="card p-4 shadow-sm mb-3 d-flex flex-row align-items-center gap-3 flex-wrap">
		<div class="avatar">{iniciales(auth.usuario.nombre)}</div>
		<div class="flex-grow-1">
			<h5 class="fw-bold m-0">{auth.usuario.nombre}</h5>
			<div class="text-muted small">{egresado?.programa_academico} · Promoción {egresado?.anio_graduacion}</div>
		</div>
		<div style="min-width:220px;">
			<div class="d-flex justify-content-between small"><span>Perfil completo</span><strong>{completitud}%</strong></div>
			<div class="progress" style="height:10px;"><div class="progress-bar {completitud === 100 ? 'bg-success' : 'bg-warning'}" style="width:{completitud}%"></div></div>
		</div>
	</div>

	<form class="card p-4 shadow-sm" onsubmit={guardar} novalidate>
		<div class="row g-3">
			<div class="col-md-6"><label class="form-label fw-semibold" for="p-c">Cargo deseado</label><input id="p-c" class="form-control" placeholder="Ej: Analista de datos" bind:value={f.cargo_deseado} /></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="p-a">Área de interés</label><select id="p-a" class="form-select" bind:value={f.area_interes}>{#each AREAS as a}<option>{a}</option>{/each}</select></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="p-e">Años de experiencia</label><input id="p-e" type="number" step="0.5" min="0" class="form-control" class:is-invalid={errores.experiencia_anios} bind:value={f.experiencia_anios} /><div class="invalid-feedback">{errores.experiencia_anios}</div></div>
			<div class="col-md-6"><label class="form-label fw-semibold" for="p-h">Habilidades</label><input id="p-h" class="form-control" placeholder="Ej: SQL, Power BI, trabajo en equipo" bind:value={f.habilidades} /></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="p-i">Idiomas</label><input id="p-i" class="form-control" placeholder="Ej: Inglés B2" bind:value={f.idiomas} /></div>
			<div class="col-md-3"><label class="form-label fw-semibold" for="p-d">Disponibilidad</label><select id="p-d" class="form-select" bind:value={f.disponibilidad}><option>Inmediata</option><option>En 15 días</option><option>En 1 mes</option></select></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="p-hv">Enlace a tu hoja de vida</label><input id="p-hv" class="form-control" class:is-invalid={errores.hoja_vida_url} placeholder="https://..." bind:value={f.hoja_vida_url} /><div class="invalid-feedback">{errores.hoja_vida_url}</div></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="p-l">LinkedIn</label><input id="p-l" class="form-control" class:is-invalid={errores.linkedin_url} placeholder="https://linkedin.com/in/..." bind:value={f.linkedin_url} /><div class="invalid-feedback">{errores.linkedin_url}</div></div>
			<div class="col-md-4"><label class="form-label fw-semibold" for="p-po">Portafolio</label><input id="p-po" class="form-control" class:is-invalid={errores.portafolio_url} placeholder="https://..." bind:value={f.portafolio_url} /><div class="invalid-feedback">{errores.portafolio_url}</div></div>
			<div class="col-12"><label class="form-label fw-semibold" for="p-r">Resumen profesional</label><textarea id="p-r" rows="3" class="form-control" bind:value={f.perfil_profesional}></textarea></div>
		</div>
		{#if auth.puede(MOD, 'actualizar') || auth.puede(MOD, 'crear')}<div class="mt-3"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i> Guardar perfil</button></div>{/if}
	</form>
{/if}

<style>
	.avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #1a7a70, #3fb3a3); color: #fff; font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center; }
</style>
