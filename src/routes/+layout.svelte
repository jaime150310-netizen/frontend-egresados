<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { menuDe, accesoRuta, PUBLICAS } from '$lib/modulos.js';
	import { slugRol } from '$lib/utils.js';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();
	let menuAbierto = $state(false);
	let menu = $derived(menuDe(auth.modulos));
	let publica = $derived(PUBLICAS.includes($page.url.pathname));

	// Guard único: las páginas privadas exigen sesión y que el rol tenga permiso de "ver"
	// sobre el módulo (según modulos_x_roles en la base de datos).
	$effect(() => {
		const ruta = $page.url.pathname;
		if (PUBLICAS.includes(ruta)) {
			if (auth.autenticado && ruta !== '/') goto('/panel');
			return;
		}
		if (!auth.autenticado) { goto('/login'); return; }
		if (!accesoRuta(auth.modulos, ruta)) goto('/panel');
	});

	// Al abrir la app se piden de nuevo los módulos del rol a la base de datos.
	onMount(() => { if (auth.autenticado) auth.refrescarModulos().catch(() => {}); });

	function salir() {
		auth.logout();
		goto('/');
	}
</script>

<Toast />

{#if publica || !auth.autenticado}
	{@render children()}
{:else}
	<div class="rol-{slugRol(auth.rol)}">
		<nav class="navbar navbar-dark navbar-rol px-3 shadow-sm sticky-top">
			<div class="d-flex align-items-center gap-2">
				<button class="btn btn-sm btn-outline-light d-md-none" aria-label="Menú" onclick={() => (menuAbierto = !menuAbierto)}><i class="bi bi-list"></i></button>
				<a href="/panel" class="navbar-brand fs-6 mb-0 d-flex align-items-center gap-2 text-decoration-none">
					<i class="bi bi-mortarboard-fill"></i> <span class="d-none d-sm-inline">Empleabilidad y Red de Egresados</span>
				</a>
			</div>
			<div class="d-flex align-items-center gap-3">
				<span class="chip-rol text-white">{auth.rol}</span>
				<span class="text-white-50 small d-none d-md-inline">{auth.usuario.nombre}</span>
				<button class="btn btn-outline-light btn-sm" onclick={salir}><i class="bi bi-box-arrow-right"></i> Salir</button>
			</div>
		</nav>

		<div class="d-flex">
			<nav class="sidebar-nav p-3 border-end bg-white" class:abierto={menuAbierto}>
				{#each menu as item}
					<a class="sidebar-link d-flex align-items-center gap-2 py-2 px-2 rounded text-decoration-none mb-1"
						class:active={$page.url.pathname === item.href} href={item.href} onclick={() => (menuAbierto = false)}>
						<i class="bi {item.icon}"></i> {item.label}
					</a>
				{/each}
			</nav>
			<main class="p-3 p-md-4 flex-grow-1" style="min-width:0;">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
