<script>
	import { auth } from '$lib/stores/auth.svelte.js';
	import { nombreCompleto } from '$lib/utils.js';

	const info = {
		Egresado: { icono: 'bi-mortarboard-fill', texto: 'Encuentra tu próxima oportunidad profesional.' },
		Coordinador: { icono: 'bi-diagram-3-fill', texto: 'Conecta a los egresados con las empresas aliadas y haz seguimiento a su empleabilidad.' },
		Administrador: { icono: 'bi-shield-check', texto: 'Administra usuarios, roles y permisos, y supervisa el sistema.' }
	};
	const i = $derived(info[auth.rol] ?? info.Egresado);
</script>

<div class="hero-bienvenida mb-4">
	<div style="position:relative; z-index:1;">
		<span class="hero-chip"><i class="bi bi-stars"></i> Bienvenido</span>
		<h2>¡Hola, {auth.usuario?.nombre}!</h2>
		<p>{i.texto}</p>
	</div>
	<i class="bi {i.icono} hero-icono"></i>
</div>
