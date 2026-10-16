<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toast } from '$lib/stores/toast.svelte.js';
	import { dinero, fecha } from '$lib/utils.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import EncuestaForm from '$lib/components/EncuestaForm.svelte';
	import Cargando from '$lib/components/Cargando.svelte';

	const MOD = 'Encuestas';
	const esEgresado = $derived(auth.rol === 'Egresado');

	let encuestas = $state([]); let egresados = $state([]); let usuarios = $state([]);
	let cargando = $state(true); let error = $state('');
	let modal = $state(false); let confirmar = $state(false);
	let editando = $state(null); let aBorrar = $state(null);

	async function cargar() {
		try { [encuestas, egresados, usuarios] = await Promise.all([api.get('/encuestas_empleabilidad/'), api.get('/egresados/'), api.get('/usuarios/')]); }
		catch (e) { error = e.message; }
		cargando = false;
	}
	onMount(cargar);

	const nombreEgresado = (id) => { const u = usuarios.find((x) => x.id_usuario === egresados.find((e) => e.id_egresado === id)?.id_usuario); return u ? `${u.nombre} ${u.apellido}` : '—'; };
	let opcionesEgresado = $derived(egresados.map((e) => ({ id: e.id_egresado, nombre: nombreEgresado(e.id_egresado) })));

	let visibles = $derived(esEgresado ? encuestas.filter((e) => e.id_egresado === auth.usuario.id_egresado) : encuestas);
	let filas = $derived(visibles.map((e) => ({ ...e, egresado: nombreEgresado(e.id_egresado), situacion: e.esta_empleado ? 'Empleado' : 'Buscando empleo', fecha_texto: fecha(e.fecha_respuesta ?? e.fecha_creacion), salario_texto: e.esta_empleado ? dinero(e.salario) : '—', empresa: e.empresa_actual ?? '—', cargo: e.cargo_actual ?? '—' })));
	const columnas = $derived([
		...(esEgresado ? [] : [{ clave: 'egresado', titulo: 'Egresado' }]),
		{ clave: 'fecha_texto', titulo: 'Fecha' },
		{ clave: 'situacion', titulo: 'Situación', badge: (e) => (e.esta_empleado ? 'success' : 'warning') },
		{ clave: 'empresa', titulo: 'Empresa' },
		{ clave: 'cargo', titulo: 'Cargo' },
		{ clave: 'salario_texto', titulo: 'Salario', ordenable: false }
	]);

	let tasa = $derived.by(() => { const u = new Map(); for (const e of encuestas) u.set(e.id_egresado, e.esta_empleado); return u.size ? Math.round(([...u.values()].filter(Boolean).length / u.size) * 100) : 0; });
	let satisf = $derived.by(() => { const v = encuestas.map((e) => e.satisfaccion_laboral).filter((x) => x !== null && x !== undefined); return v.length ? (v.reduce((a, b) => a + Number(b), 0) / v.length).toFixed(1) : '—'; });

	function nueva() { editando = null; modal = true; }
	function editar(e) { editando = e; modal = true; }
	async function guardar(cuerpo) {
		try {
			if (editando) { await api.put(`/encuestas_empleabilidad/${editando.id_encuesta}`, cuerpo); toast.ok('Encuesta actualizada'); }
			else { await api.post('/encuestas_empleabilidad/', cuerpo); toast.ok(esEgresado ? 'Gracias por responder la encuesta' : 'Encuesta registrada'); }
			modal = false; await cargar();
		} catch (e) { toast.error(e.message); }
	}
	function pedirBorrar(e) { aBorrar = e; confirmar = true; }
	async function borrar() {
		try { await api.del(`/encuestas_empleabilidad/${aBorrar.id_encuesta}`); toast.ok('Encuesta eliminada'); await cargar(); }
		catch (e) { toast.error(e.message); }
	}
</script>

<PageHeader titulo={esEgresado ? 'Mi encuesta de empleabilidad' : 'Encuestas de empleabilidad'} icono="bi-clipboard-data-fill" subtitulo={esEgresado ? 'Cuéntanos tu situación laboral actual: la universidad la usa para medir la empleabilidad' : 'Respuestas de seguimiento laboral de los egresados'}>
	{#snippet acciones()}
		{#if auth.puede(MOD, 'crear') && (!esEgresado || auth.usuario.id_egresado !== null)}<button class="btn btn-primary" onclick={nueva}><i class="bi bi-plus-lg"></i> {esEgresado ? 'Responder encuesta' : 'Registrar encuesta'}</button>{/if}
	{/snippet}
</PageHeader>

{#if error}<div class="alert alert-danger">{error}</div>{:else if cargando}<Cargando />{:else}
	{#if !esEgresado}
		<div class="row g-3 mb-3">
			<div class="col-6 col-md-3"><StatCard icono="bi-clipboard-check-fill" valor={encuestas.length} titulo="Respuestas" color="blue" /></div>
			<div class="col-6 col-md-3"><StatCard icono="bi-graph-up-arrow" valor="{tasa}%" titulo="Tasa de empleabilidad" color="green" /></div>
			<div class="col-6 col-md-3"><StatCard icono="bi-people-fill" valor={new Set(encuestas.map((e) => e.id_egresado)).size} titulo="Egresados que respondieron" color="purple" /></div>
			<div class="col-6 col-md-3"><StatCard icono="bi-emoji-smile-fill" valor={satisf} titulo="Satisfacción promedio" color="amber" /></div>
		</div>
	{:else if visibles.length === 0}
		<div class="alert alert-warning d-flex align-items-center gap-2"><i class="bi bi-clipboard-check-fill"></i> Aún no has respondido la encuesta de seguimiento laboral.</div>
	{/if}
	<DataTable {columnas} {filas} vacio="Aún no hay respuestas registradas." acciones={auth.puede(MOD, 'actualizar') || auth.puede(MOD, 'eliminar') ? filaAcciones : undefined} />
{/if}

{#snippet filaAcciones(e)}
	{#if auth.puede(MOD, 'actualizar')}<button class="btn btn-sm btn-outline-primary me-1" title="Editar" aria-label="Editar" onclick={() => editar(e)}><i class="bi bi-pencil"></i></button>{/if}
	{#if auth.puede(MOD, 'eliminar')}<button class="btn btn-sm btn-outline-danger" title="Eliminar" aria-label="Eliminar" onclick={() => pedirBorrar(e)}><i class="bi bi-trash"></i></button>{/if}
{/snippet}

<Modal bind:abierto={modal} titulo={editando ? 'Editar encuesta' : esEgresado ? 'Encuesta de seguimiento laboral' : 'Registrar encuesta'} tam="modal-lg">
	{#key editando?.id_encuesta ?? 'nueva'}
		<EncuestaForm inicial={editando} opcionesEgresado={esEgresado ? null : opcionesEgresado} alGuardar={(c) => guardar(esEgresado ? { ...c, id_egresado: auth.usuario.id_egresado } : c)} alCancelar={() => (modal = false)} />
	{/key}
</Modal>

<ConfirmDialog bind:abierto={confirmar} mensaje="¿Eliminar esta respuesta de encuesta?" alConfirmar={borrar} />
