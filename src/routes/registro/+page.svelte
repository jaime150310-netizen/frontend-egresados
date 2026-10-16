<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { esCorreo, esCelular, reglasPassword, passwordValida } from '$lib/validar.js';
	import InputPassword from '$lib/components/InputPassword.svelte';

	const PROGRAMAS = ['Ingeniería de Sistemas', 'Ingeniería Industrial', 'Administración de Empresas', 'Contaduría Pública', 'Mercadeo y Publicidad', 'Enfermería', 'Derecho', 'Psicología'];
	const anioActual = new Date().getFullYear();

	let f = $state({ nombre: '', apellido: '', correo: '', celular: '', ciudad: '', programa: '', anio: anioActual, password: '', confirmar: '', terminos: false });
	let errores = $state({});
	let errorGeneral = $state('');
	let enviando = $state(false);
	let rolEgresado = $state(null);

	onMount(async () => {
		try {
			const roles = await api.get('/roles/');
			rolEgresado = roles.find((r) => r.nombre === 'Egresado') ?? null;
		} catch (e) { errorGeneral = e.message; }
	});

	function validar() {
		const e = {};
		if (f.nombre.trim().length < 2) e.nombre = 'Ingresa tu nombre.';
		if (f.apellido.trim().length < 2) e.apellido = 'Ingresa tu apellido.';
		if (!esCorreo(f.correo)) e.correo = 'Ingresa un correo válido, por ejemplo nombre@correo.com';
		if (!esCelular(f.celular)) e.celular = 'Celular de 10 dígitos que empiece por 3.';
		if (f.ciudad.trim().length < 2) e.ciudad = 'Ingresa tu ciudad.';
		if (!f.programa) e.programa = 'Selecciona tu programa académico.';
		if (!(Number(f.anio) >= 1990 && Number(f.anio) <= anioActual)) e.anio = `Un año entre 1990 y ${anioActual}.`;
		if (!passwordValida(f.password)) e.password = 'La contraseña no cumple los requisitos.';
		if (f.password !== f.confirmar) e.confirmar = 'Las contraseñas no coinciden.';
		if (!f.terminos) e.terminos = 'Debes aceptar los términos y el tratamiento de datos.';
		return e;
	}

	async function registrar(ev) {
		ev.preventDefault();
		errorGeneral = '';
		errores = validar();
		if (Object.keys(errores).length) return;
		if (!rolEgresado) { errorGeneral = 'No se pudo cargar el rol de egresado. Intenta de nuevo.'; return; }

		enviando = true;
		let idUsuario = null;
		try {
			// ¿Ya existe una cuenta con ese correo o celular?
			const usuarios = await api.get('/usuarios/');
			if (usuarios.some((u) => u.correo?.toLowerCase() === f.correo.trim().toLowerCase())) {
				errores = { correo: 'Este correo ya está registrado. Inicia sesión o usa otro.' };
				errorGeneral = errores.correo; return;
			}
			if (usuarios.some((u) => u.celular === f.celular.trim())) {
				errores = { celular: 'Este número de celular ya pertenece a otra cuenta.' };
				errorGeneral = errores.celular; return;
			}

			const u = await api.post('/usuarios/', {
				id_rol: rolEgresado.id_rol, nombre: f.nombre.trim(), apellido: f.apellido.trim(), correo: f.correo.trim(),
				contrasena: f.password, celular: f.celular.trim(), ciudad: f.ciudad.trim(), direccion: null, estado: true
			});
			idUsuario = u.id;
			await api.post('/egresados/', {
				id_usuario: idUsuario, codigo_estudiante: null, programa_academico: f.programa, facultad: null,
				fecha_graduacion: `${f.anio}-12-15`, nivel_formacion: 'Profesional', anio_graduacion: Number(f.anio), estado: true
			});
			await auth.login(f.correo.trim(), f.password, rolEgresado.id_rol);
			goto('/panel');
		} catch (e) {
			if (idUsuario) await api.del(`/usuarios/${idUsuario}`).catch(() => {});
			errorGeneral = e.message;
		} finally {
			enviando = false;
		}
	}
</script>

<div class="fondo">
	<div class="card shadow-lg p-4 p-md-5 contenedor">
		<a href="/" class="text-decoration-none small"><i class="bi bi-arrow-left"></i> Volver al inicio</a>
		<div class="d-flex align-items-center gap-3 mt-2 mb-1">
			<div class="ico"><i class="bi bi-mortarboard-fill"></i></div>
			<div><h2 class="fw-bold m-0">Registro de egresados</h2><p class="text-muted m-0">Crea tu cuenta y postúlate a vacantes de empresas aliadas</p></div>
		</div>
		<hr />

		{#if errorGeneral}
			<div class="alert alert-danger d-flex gap-2 align-items-start py-2"><i class="bi bi-exclamation-octagon-fill mt-1"></i><div>{errorGeneral}</div></div>
		{/if}

		<form onsubmit={registrar} novalidate>
			<div class="row g-3">
				<div class="col-md-6"><label class="form-label fw-semibold" for="nombre">Nombres</label><input id="nombre" class="form-control" class:is-invalid={errores.nombre} bind:value={f.nombre} /><div class="invalid-feedback">{errores.nombre}</div></div>
				<div class="col-md-6"><label class="form-label fw-semibold" for="apellido">Apellidos</label><input id="apellido" class="form-control" class:is-invalid={errores.apellido} bind:value={f.apellido} /><div class="invalid-feedback">{errores.apellido}</div></div>
				<div class="col-md-6"><label class="form-label fw-semibold" for="correo">Correo electrónico</label>
					<div class="input-group has-validation"><span class="input-group-text"><i class="bi bi-envelope-fill"></i></span><input id="correo" type="email" class="form-control" class:is-invalid={errores.correo} placeholder="correo@ejemplo.com" bind:value={f.correo} /><div class="invalid-feedback">{errores.correo}</div></div></div>
				<div class="col-md-6"><label class="form-label fw-semibold" for="celular">Celular</label>
					<div class="input-group has-validation"><span class="input-group-text"><i class="bi bi-phone-fill"></i> +57</span><input id="celular" class="form-control" class:is-invalid={errores.celular} inputmode="numeric" maxlength="10" placeholder="3001234567" value={f.celular} oninput={(e) => (f.celular = e.target.value.replace(/\D/g, ''))} /><div class="invalid-feedback">{errores.celular}</div></div></div>
				<div class="col-md-6"><label class="form-label fw-semibold" for="programa">Programa académico</label><select id="programa" class="form-select" class:is-invalid={errores.programa} bind:value={f.programa}><option value="">Selecciona...</option>{#each PROGRAMAS as p}<option>{p}</option>{/each}</select><div class="invalid-feedback">{errores.programa}</div></div>
				<div class="col-md-3"><label class="form-label fw-semibold" for="anio">Año de grado</label><input id="anio" type="number" class="form-control" class:is-invalid={errores.anio} bind:value={f.anio} /><div class="invalid-feedback">{errores.anio}</div></div>
				<div class="col-md-3"><label class="form-label fw-semibold" for="ciudad">Ciudad</label><input id="ciudad" class="form-control" class:is-invalid={errores.ciudad} bind:value={f.ciudad} /><div class="invalid-feedback">{errores.ciudad}</div></div>
				<div class="col-md-6"><InputPassword id="password" label="Contraseña" bind:value={f.password} error={errores.password} autocomplete="new-password" /></div>
				<div class="col-md-6"><InputPassword id="confirmar" label="Confirmar contraseña" bind:value={f.confirmar} error={errores.confirmar} autocomplete="new-password" /></div>
				<div class="col-12"><ul class="list-inline small mb-0">{#each reglasPassword(f.password) as r}<li class="list-inline-item {r.ok ? 'text-success' : 'text-muted'}"><i class="bi {r.ok ? 'bi-check-circle-fill' : 'bi-circle'}"></i> {r.texto}</li>{/each}</ul></div>
				<div class="col-12"><div class="form-check"><input class="form-check-input" class:is-invalid={errores.terminos} type="checkbox" id="terminos" bind:checked={f.terminos} /><label class="form-check-label small" for="terminos">Acepto los términos de uso y la política de tratamiento de datos personales.</label>{#if errores.terminos}<div class="text-danger small">{errores.terminos}</div>{/if}</div></div>
			</div>
			<button class="btn btn-lg btn-primary w-100 fw-bold mt-4" type="submit" disabled={enviando}>
				{#if enviando}<span class="spinner-border spinner-border-sm me-2"></span>Creando cuenta...{:else}Crear cuenta{/if}
			</button>
			<p class="text-center mt-3 mb-0">¿Ya tienes cuenta? <a href="/login" class="fw-semibold">Inicia sesión</a></p>
		</form>
	</div>
</div>

<style>
	.fondo { min-height: 100vh; padding: 40px 16px; display: flex; justify-content: center; align-items: flex-start; background: linear-gradient(135deg, #1b2a52 0%, #3a5fb8 55%, #3fb3a3 130%); }
	.contenedor { width: 100%; max-width: 760px; border-radius: 22px; border: 0; }
	.ico { width: 56px; height: 56px; border-radius: 16px; background: #128f83; color: #fff; font-size: 28px; display: flex; align-items: center; justify-content: center; }
</style>
