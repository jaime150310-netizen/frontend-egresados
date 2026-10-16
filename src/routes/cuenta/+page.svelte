<script>
	import { onMount } from 'svelte';
	import { api, pick } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { esCelular, reglasPassword, passwordValida } from '$lib/validar.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import InputPassword from '$lib/components/InputPassword.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const CAMPOS = ['id_rol', 'nombre', 'apellido', 'correo', 'contrasena', 'celular', 'direccion', 'ciudad', 'estado'];
	let u = $state(null);
	let f = $state({ nombre: '', apellido: '', celular: '', ciudad: '', direccion: '' });
	let errores = $state({});
	let pw = $state({ actual: '', nueva: '', confirmar: '' });
	let pwErrores = $state({});
	let error = $state('');

	onMount(async () => {
		try {
			u = await api.get(`/usuarios/${auth.usuario.id_usuario}`);
			f = { nombre: u.nombre ?? '', apellido: u.apellido ?? '', celular: u.celular ?? '', ciudad: u.ciudad ?? '', direccion: u.direccion ?? '' };
		} catch (e) { error = e.message; }
	});

	async function guardar(ev) {
		ev.preventDefault();
		errores = {};
		if (f.nombre.trim().length < 2) errores.nombre = 'Ingresa tu nombre.';
		if (f.apellido.trim().length < 2) errores.apellido = 'Ingresa tu apellido.';
		if (!esCelular(f.celular)) errores.celular = 'Celular de 10 dígitos que empiece por 3.';
		if (Object.keys(errores).length) return;
		try {
			const otros = await api.get('/usuarios/');
			if (otros.some((x) => x.id_usuario !== u.id_usuario && x.celular === f.celular.trim())) { errores.celular = 'Ese celular ya pertenece a otra cuenta.'; return; }
			await api.put(`/usuarios/${u.id_usuario}`, { ...pick(u, CAMPOS), ...f, nombre: f.nombre.trim(), apellido: f.apellido.trim(), celular: f.celular.trim() });
			u = { ...u, ...f };
			auth.usuario = { ...auth.usuario, nombre: f.nombre.trim() }; auth.guardar();
			toast.ok('Datos actualizados');
		} catch (e) { toast.error(e.message); }
	}

	async function cambiarPassword(ev) {
		ev.preventDefault();
		pwErrores = {};
		if (pw.actual !== u.contrasena) pwErrores.actual = 'La contraseña actual es incorrecta.';
		if (!passwordValida(pw.nueva)) pwErrores.nueva = 'La nueva contraseña no cumple los requisitos.';
		else if (pw.nueva === pw.actual) pwErrores.nueva = 'Debe ser distinta a la actual.';
		if (pw.nueva !== pw.confirmar) pwErrores.confirmar = 'Las contraseñas no coinciden.';
		if (Object.keys(pwErrores).length) return;
		try {
			await api.put(`/usuarios/${u.id_usuario}`, { ...pick(u, CAMPOS), contrasena: pw.nueva });
			u = { ...u, contrasena: pw.nueva };
			pw = { actual: '', nueva: '', confirmar: '' };
			toast.ok('Contraseña actualizada');
		} catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo="Mi cuenta" icono="bi-person-gear" subtitulo="Tus datos de contacto y tu contraseña" />

{#if error}<div class="alert alert-danger">{error}</div>{:else if !u}<Cargando />{:else}
	<div class="row g-3">
		<div class="col-lg-6">
			<form class="card p-4 shadow-sm h-100" onsubmit={guardar} novalidate>
				<h6 class="fw-bold mb-3">Datos personales</h6>
				<div class="row g-3">
					<div class="col-md-6"><label class="form-label fw-semibold" for="n">Nombres</label><input id="n" class="form-control" class:is-invalid={errores.nombre} bind:value={f.nombre} /><div class="invalid-feedback">{errores.nombre}</div></div>
					<div class="col-md-6"><label class="form-label fw-semibold" for="a">Apellidos</label><input id="a" class="form-control" class:is-invalid={errores.apellido} bind:value={f.apellido} /><div class="invalid-feedback">{errores.apellido}</div></div>
					<div class="col-12"><label class="form-label fw-semibold" for="c">Correo (no editable)</label><input id="c" class="form-control" value={u.correo} disabled /></div>
					<div class="col-md-6"><label class="form-label fw-semibold" for="t">Celular</label><div class="input-group has-validation"><span class="input-group-text">+57</span><input id="t" class="form-control" class:is-invalid={errores.celular} maxlength="10" value={f.celular} oninput={(e) => (f.celular = e.target.value.replace(/\D/g, ''))} /><div class="invalid-feedback">{errores.celular}</div></div></div>
					<div class="col-md-6"><label class="form-label fw-semibold" for="ci">Ciudad</label><input id="ci" class="form-control" bind:value={f.ciudad} /></div>
					<div class="col-12"><label class="form-label fw-semibold" for="d">Dirección</label><input id="d" class="form-control" bind:value={f.direccion} /></div>
				</div>
				<div class="mt-3"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i> Guardar cambios</button></div>
			</form>
		</div>
		<div class="col-lg-6">
			<form class="card p-4 shadow-sm h-100" onsubmit={cambiarPassword} novalidate>
				<h6 class="fw-bold mb-3"><i class="bi bi-shield-lock-fill me-1"></i> Cambiar contraseña</h6>
				<div class="mb-3"><InputPassword id="pw1" label="Contraseña actual" bind:value={pw.actual} error={pwErrores.actual} /></div>
				<div class="mb-2"><InputPassword id="pw2" label="Nueva contraseña" bind:value={pw.nueva} error={pwErrores.nueva} autocomplete="new-password" /></div>
				<ul class="list-unstyled small mb-3">{#each reglasPassword(pw.nueva) as r}<li class={r.ok ? 'text-success' : 'text-muted'}><i class="bi {r.ok ? 'bi-check-circle-fill' : 'bi-circle'}"></i> {r.texto}</li>{/each}</ul>
				<div class="mb-3"><InputPassword id="pw3" label="Confirmar nueva contraseña" bind:value={pw.confirmar} error={pwErrores.confirmar} autocomplete="new-password" /></div>
				<div><button class="btn btn-primary" type="submit">Actualizar contraseña</button></div>
			</form>
		</div>
	</div>
{/if}
