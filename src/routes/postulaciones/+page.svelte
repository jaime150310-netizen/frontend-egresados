<script>
	import { onMount } from 'svelte';
	import { api, pick } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { colorEstado, fecha } from '$lib/utils.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const MOD = 'Postulaciones';
	const ESTADOS = ['Pendiente', 'En revisión', 'Preseleccionado', 'Contratado', 'Rechazado'];
	const esEgresado = $derived(auth.rol === 'Egresado');

	let postulaciones = $state([]); let vacantes = $state([]); let empresas = $state([]); let egresados = $state([]); let usuarios = $state([]);
	let cargando = $state(true); let error = $state('');
	let confirmar = $state(false); let aBorrar = $state(null);

	async function cargar() {
		try { [postulaciones, vacantes, empresas, egresados, usuarios] = await Promise.all([api.get('/postulaciones/'), api.get('/vacantes/'), api.get('/empresas/'), api.get('/egresados/'), api.get('/usuarios/')]); }
		catch (e) { error = e.message; }
		cargando = false;
	}
	onMount(cargar);

	const vac = (id) => vacantes.find((v) => v.id_vacante === id);
	const emp = (id) => empresas.find((e) => e.id_empresa === vac(id)?.id_empresa);
	const nombreEgresado = (id) => { const u = usuarios.find((x) => x.id_usuario === egresados.find((e) => e.id_egresado === id)?.id_usuario); return u ? `${u.nombre} ${u.apellido}` : '—'; };

	let filas = $derived(
		postulaciones
			.filter((p) => !esEgresado || p.id_egresado === auth.usuario.id_egresado)
			.map((p) => ({ ...p, vacante: vac(p.id_vacante)?.titulo ?? '(eliminada)', empresa: emp(p.id_vacante)?.nombre ?? '—', egresado: nombreEgresado(p.id_egresado), fecha_texto: fecha(p.fecha_creacion) }))
	);
	const columnas = $derived([
		...(esEgresado ? [] : [{ clave: 'egresado', titulo: 'Egresado' }]),
		{ clave: 'vacante', titulo: 'Vacante' },
		{ clave: 'empresa', titulo: 'Empresa' },
		{ clave: 'fecha_texto', titulo: 'Fecha' },
		{ clave: 'estado', titulo: 'Estado', badge: (p) => colorEstado(p.estado) }
	]);

	async function cambiarEstado(p, estado) {
		try { await api.put(`/postulaciones/${p.id_postulacion}`, { ...pick(p, ['id_egresado', 'id_vacante', 'comentarios']), estado }); toast.ok(`Postulación: ${estado}`); await cargar(); }
		catch (e) { toast.error(e.message); }
	}
	function pedirBorrar(p) { aBorrar = p; confirmar = true; }
	async function borrar() {
		try { await api.del(`/postulaciones/${aBorrar.id_postulacion}`); toast.ok(esEgresado ? 'Postulación retirada' : 'Postulación eliminada'); await cargar(); }
		catch (e) { toast.error(e.message); }
	}
	const puedeRetirar = (p) => auth.puede(MOD, 'eliminar') && (!esEgresado || /pendiente|revisi/i.test(p.estado));
</script>

<PageHeader titulo={esEgresado ? 'Mis postulaciones' : 'Postulaciones'} icono="bi-send-check-fill" subtitulo={esEgresado ? 'Seguimiento de las vacantes a las que aplicaste' : 'Revisa y cambia el estado de las postulaciones de los egresados'} />

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else}
	<DataTable {columnas} {filas} vacio={esEgresado ? 'Aún no te has postulado a ninguna vacante.' : 'No hay postulaciones.'} acciones={filaAcciones} />
{/if}

{#snippet filaAcciones(p)}
	{#if !esEgresado && auth.puede(MOD, 'actualizar')}
		<select class="form-select form-select-sm d-inline-block me-1" style="width:auto" value={p.estado} aria-label="Estado" onchange={(ev) => cambiarEstado(p, ev.target.value)}>
			{#each ESTADOS as e}<option>{e}</option>{/each}
			{#if !ESTADOS.includes(p.estado)}<option>{p.estado}</option>{/if}
		</select>
	{/if}
	{#if puedeRetirar(p)}<button class="btn btn-sm btn-outline-danger" onclick={() => pedirBorrar(p)}>{esEgresado ? 'Retirar' : 'Eliminar'}</button>{/if}
{/snippet}

<ConfirmDialog bind:abierto={confirmar} textoConfirmar={esEgresado ? 'Retirar' : 'Eliminar'} mensaje={aBorrar ? `¿${esEgresado ? 'Retirar' : 'Eliminar'} la postulación a "${aBorrar.vacante}"?` : ''} alConfirmar={borrar} />
