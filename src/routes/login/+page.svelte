<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { esCorreo } from '$lib/validar.js';
	import InputPassword from '$lib/components/InputPassword.svelte';

	const iconos = { Administrador: 'bi-shield-lock-fill', Coordinador: 'bi-diagram-3-fill', Egresado: 'bi-mortarboard-fill' };
	const colores = { Administrador: '#223462', Coordinador: '#d98a25', Egresado: '#128f83' };

	let roles = $state([]);
	let idRol = $state('');
	let correo = $state('');
	let password = $state('');
	let errores = $state({});
	let errorGeneral = $state('');
	let cargando = $state(false);
	let intentos = $state(0);
	let bloqueadoHasta = $state(0);

	let estadoApi = $state('conectando');
	let detalleApi = $state('');
	async function comprobarApi() {
		estadoApi = 'conectando'; detalleApi = '';
		try {
			const r = await api.get('/salud');
			estadoApi = 'ok'; detalleApi = `Base de datos: ${r.nombre_bd}`;
			roles = (await api.get('/roles/')).filter((r) => ['Administrador', 'Coordinador', 'Egresado'].includes(r.nombre));
			idRol = idRol || (roles[0]?.id_rol ?? '');
		} catch (e) { estadoApi = 'error'; detalleApi = e.message; }
	}

	let rolActual = $derived(roles.find((r) => r.id_rol === idRol));

	onMount(async () => {
		correo = localStorage.getItem('correo_recordado') ?? '';
		await comprobarApi();
	});

	async function entrar(ev) {
		ev.preventDefault();
		errores = {}; errorGeneral = '';
		if (Date.now() < bloqueadoHasta) { errorGeneral = 'Demasiados intentos fallidos. Espera 30 segundos.'; return; }
		if (!idRol) errores.rol = 'Selecciona un rol.';
		if (!esCorreo(correo)) errores.correo = 'Ingresa un correo válido.';
		if (!password) errores.password = 'Ingresa tu contraseña.';
		if (Object.keys(errores).length) return;

		cargando = true;
		try {
			await auth.login(correo.trim(), password, idRol);
			localStorage.setItem('correo_recordado', correo.trim());
			goto('/panel');
		} catch (e) {
			intentos += 1;
			if (intentos >= 5) { bloqueadoHasta = Date.now() + 30000; intentos = 0; }
			errorGeneral = e.message;
		} finally {
			cargando = false;
		}
	}
</script>

<div class="login-wrap">
	<div class="panel-bienvenida">
		<span class="circulo c1"></span><span class="circulo c2"></span><span class="circulo c3"></span>
		<div class="contenido">
			<a href="/" class="volver"><i class="bi bi-arrow-left"></i> Volver al inicio</a>
			<div class="logo"><i class="bi bi-mortarboard-fill"></i></div>
			<h1>¡Bienvenido!</h1>
			<p class="lead">Bolsa de empleo institucional que conecta a egresados, empresas aliadas y la universidad.</p>
			<ul class="beneficios">
				<li><i class="bi bi-briefcase-fill"></i> Vacantes verificadas</li>
				<li><i class="bi bi-people-fill"></i> Red de egresados</li>
				<li><i class="bi bi-graph-up-arrow"></i> Seguimiento de empleabilidad</li>
			</ul>
		</div>
	</div>

	<div class="panel-form">
		<form class="w-100" style="max-width:420px;" onsubmit={entrar} novalidate>
			<h2 class="fw-bold mb-1">Iniciar sesión</h2>
			<p class="text-muted mb-4">Elige tu rol e ingresa tus datos</p>

			<div class="small mb-3 d-flex align-items-center gap-2 flex-wrap">
				{#if estadoApi === 'conectando'}<span class="badge bg-warning text-dark"><span class="spinner-border spinner-border-sm me-1"></span>Conectando con la API (puede tardar hasta un minuto)...</span>
				{:else if estadoApi === 'ok'}
				{:else}<span class="badge bg-danger"><i class="bi bi-x-circle-fill"></i> API sin conexión</span><span class="text-danger">{detalleApi}</span><button type="button" class="btn btn-sm btn-outline-secondary" onclick={comprobarApi}>Reintentar</button>{/if}
			</div>

			{#if errorGeneral}
				<div class="alert alert-danger d-flex align-items-start gap-2 py-2"><i class="bi bi-exclamation-triangle-fill mt-1"></i><div>{errorGeneral}</div></div>
			{/if}

			<div class="mb-3">
				<label class="form-label fw-semibold" for="rol">Rol</label>
				<div class="input-group has-validation">
					<span class="input-group-text"><i class="bi {iconos[rolActual?.nombre] ?? 'bi-person-badge'}" style="color:{colores[rolActual?.nombre] ?? '#555'}"></i></span>
					<select id="rol" class="form-select" class:is-invalid={errores.rol} bind:value={idRol}>
						{#each roles as r}<option value={r.id_rol}>{r.nombre}</option>{/each}
					</select>
					{#if errores.rol}<div class="invalid-feedback">{errores.rol}</div>{/if}
				</div>
			</div>

			<div class="mb-3">
				<label class="form-label fw-semibold" for="correo">Correo electrónico</label>
				<div class="input-group has-validation">
					<span class="input-group-text"><i class="bi bi-envelope-fill"></i></span>
					<input id="correo" type="email" class="form-control" class:is-invalid={errores.correo} placeholder="tucorreo@ejemplo.com" autocomplete="email" bind:value={correo} />
					{#if errores.correo}<div class="invalid-feedback">{errores.correo}</div>{/if}
				</div>
			</div>
			<div class="mb-4"><InputPassword id="password" label="Contraseña" bind:value={password} error={errores.password} placeholder="Tu contraseña" /></div>

			<button class="btn btn-lg btn-primary w-100 fw-bold" type="submit" disabled={cargando}>
				{#if cargando}<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...{:else}Entrar <i class="bi bi-arrow-right-circle-fill ms-1"></i>{/if}
			</button>
			<p class="text-center mt-4 mb-0">¿Eres egresado y no tienes cuenta? <a href="/registro" class="fw-semibold">Regístrate aquí</a></p>
		</form>
	</div>
</div>

<style>
	.login-wrap { display: flex; min-height: 100vh; }
	.panel-bienvenida { flex: 1.1; position: relative; overflow: hidden; color: #fff; display: flex; align-items: center; padding: 60px; background: linear-gradient(135deg, #1b2a52 0%, #3a5fb8 55%, #3fb3a3 120%); }
	.circulo { position: absolute; border-radius: 50%; background: rgba(255,255,255,.09); }
	.c1 { width: 380px; height: 380px; top: -120px; right: -100px; }
	.c2 { width: 220px; height: 220px; bottom: -70px; left: 8%; }
	.c3 { width: 120px; height: 120px; top: 55%; right: 12%; background: rgba(217,138,37,.35); }
	.contenido { position: relative; z-index: 1; max-width: 460px; }
	.volver { color: #fff; text-decoration: none; opacity: .85; display: inline-block; margin-bottom: 24px; }
	.logo { width: 72px; height: 72px; border-radius: 20px; background: #d98a25; color: #241a00; display: flex; align-items: center; justify-content: center; font-size: 38px; margin-bottom: 22px; box-shadow: 0 10px 24px rgba(0,0,0,.25); }
	h1 { font-size: 3rem; font-weight: 800; }
	.lead { font-size: 1.1rem; opacity: .9; margin-bottom: 26px; }
	.beneficios { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
	.beneficios li { background: rgba(255,255,255,.14); padding: 12px 16px; border-radius: 12px; font-weight: 600; }
	.beneficios i { margin-right: 10px; color: #ffd27a; }
	.panel-form { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: #fff; }
	@media (max-width: 800px) { .login-wrap { flex-direction: column; } .panel-bienvenida { padding: 36px 24px; } h1 { font-size: 2.2rem; } }
</style>
