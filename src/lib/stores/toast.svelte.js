class ToastStore {
	mensaje = $state('');
	tipo = $state('success');
	#t;
	mostrar(mensaje, tipo = 'success') {
		this.mensaje = mensaje;
		this.tipo = tipo;
		clearTimeout(this.#t);
		this.#t = setTimeout(() => (this.mensaje = ''), 3500);
	}
	ok(m) { this.mostrar(m, 'success'); }
	error(m) { this.mostrar(m, 'danger'); }
}
export const toast = new ToastStore();
