// Sesión del usuario. El login y los módulos del rol vienen de la API (base de datos).
import { api } from '$lib/api.js';

function leer() {
	if (typeof localStorage === 'undefined') return null;
	try { return JSON.parse(localStorage.getItem('sesion')); } catch { return null; }
}

class AuthStore {
	usuario = $state(leer());

	get autenticado() { return this.usuario !== null; }
	get rol() { return this.usuario?.rol ?? null; }
	get modulos() { return this.usuario?.modulos ?? []; }

	// ¿El rol de esta sesión puede hacer esta acción en este módulo? (según la base de datos)
	puede(modulo, accion) {
		return !!this.modulos.find((m) => m.nombre === modulo)?.[`puede_${accion}`];
	}

	guardar() { localStorage.setItem('sesion', JSON.stringify(this.usuario)); }

	async login(correo, contrasena, id_rol) {
		const d = await api.post('/auth/login', { correo, contrasena, id_rol });
		let id_egresado = null;
		if (d.rol === 'Egresado') {
			const egresados = await api.get('/egresados/');
			id_egresado = egresados.find((e) => e.id_usuario === d.id_usuario)?.id_egresado ?? null;
		}
		this.usuario = { ...d, id_egresado };
		this.guardar();
	}

	// Vuelve a pedir a la base de datos los módulos del rol (por si el administrador cambió permisos).
	async refrescarModulos() {
		if (!this.usuario) return;
		const modulos = await api.get(`/auth/modulos/${this.usuario.id_rol}`);
		this.usuario = { ...this.usuario, modulos };
		this.guardar();
	}

	logout() {
		this.usuario = null;
		localStorage.removeItem('sesion');
	}
}

export const auth = new AuthStore();
