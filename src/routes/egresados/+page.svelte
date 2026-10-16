<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	let egresados = $state([]); let usuarios = $state([]); let perfiles = $state([]); let encuestas = $state([]);
	let cargando = $state(true); let error = $state('');

	onMount(async () => {
		try { [egresados, usuarios, perfiles, encuestas] = await Promise.all([api.get('/egresados/'), api.get('/usuarios/'), api.get('/perfiles_profesionales/'), api.get('/encuestas_empleabilidad/')]); }
		catch (e) { error = e.message; }
		cargando = false;
	});

	let filas = $derived(
		egresados.map((e) => {
			const u = usuarios.find((x) => x.id_usuario === e.id_usuario);
			const p = perfiles.find((x) => x.id_egresado === e.id_egresado);
			const ultima = [...encuestas].reverse().find((x) => x.id_egresado === e.id_egresado);
			return {
				...e, nombre: u ? `${u.nombre} ${u.apellido}` : '—', correo: u?.correo ?? '—', celular: u?.celular ?? '—', ciudad: u?.ciudad ?? '—',
				cargo: p?.cargo_deseado ?? '—', situacion: ultima ? (ultima.esta_empleado ? 'Empleado' : 'Buscando empleo') : 'Sin reportar'
			};
		})
	);
	const columnas = [
		{ clave: 'nombre', titulo: 'Egresado' },
		{ clave: 'programa_academico', titulo: 'Programa' },
		{ clave: 'anio_graduacion', titulo: 'Año de grado' },
		{ clave: 'ciudad', titulo: 'Ciudad' },
		{ clave: 'cargo', titulo: 'Cargo deseado' },
		{ clave: 'correo', titulo: 'Correo' },
		{ clave: 'celular', titulo: 'Celular' },
		{ clave: 'situacion', titulo: 'Situación laboral', badge: (e) => (e.situacion === 'Empleado' ? 'success' : e.situacion === 'Buscando empleo' ? 'warning' : 'secondary') }
	];
</script>

<PageHeader titulo="Directorio de egresados" icono="bi-people-fill" subtitulo="Perfiles de los egresados registrados y su situación laboral" />

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else}
	<DataTable {columnas} {filas} />
{/if}
