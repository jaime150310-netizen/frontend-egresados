// Inicializa la librería DataTables (datatables.net) sobre una tabla.
// Se usa como acción de Svelte:  <table use:datatable={{ ...opciones }}>
import DataTable from 'datatables.net-bs5';

export const ES = {
	emptyTable: 'No hay registros para mostrar',
	info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
	infoEmpty: 'Mostrando 0 a 0 de 0 registros',
	infoFiltered: '(filtrado de _MAX_ registros)',
	lengthMenu: 'Mostrar _MENU_ registros',
	search: 'Buscar:',
	zeroRecords: 'No se encontraron resultados',
	paginate: { first: 'Primero', last: 'Último', next: 'Siguiente', previous: 'Anterior' }
};

export function datatable(nodo, opciones = {}) {
	let tabla = null;
	try {
		tabla = new DataTable(nodo, { language: ES, autoWidth: false, ...opciones });
	} catch (e) {
		console.error('No se pudo iniciar DataTables', e);
	}
	return {
		destroy() {
			try { tabla?.destroy(); } catch { /* el contenedor ya fue retirado */ }
		}
	};
}

export { DataTable };
