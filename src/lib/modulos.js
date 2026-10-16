// Une los módulos que vienen de la base de datos (tabla modulos / modulos_x_roles)
// con la pantalla que los muestra. El menú y los permisos salen SOLO de la base de datos:
// si un módulo no está autorizado para el rol, no aparece ni se puede abrir.
export const PUBLICAS = ['/', '/login', '/registro'];

export const PAGINAS = {
	'Gestión de usuarios': { ruta: '/usuarios', icono: 'bi-person-badge-fill', etiqueta: 'Usuarios' },
	'Gestión de roles': { ruta: '/roles', icono: 'bi-shield-check', etiqueta: 'Roles y permisos' },
	'Gestión de egresados': { ruta: '/egresados', icono: 'bi-people-fill', etiqueta: 'Directorio de egresados' },
	'Perfiles profesionales': { ruta: '/perfil', icono: 'bi-person-circle', etiqueta: 'Mi perfil' },
	Empresas: { ruta: '/empresas', icono: 'bi-building-fill', etiqueta: 'Empresas aliadas' },
	Vacantes: { ruta: '/vacantes', icono: 'bi-briefcase-fill', etiqueta: 'Vacantes' },
	Postulaciones: { ruta: '/postulaciones', icono: 'bi-send-check-fill', etiqueta: 'Postulaciones' },
	Encuestas: { ruta: '/encuestas', icono: 'bi-clipboard-data-fill', etiqueta: 'Encuestas' },
	Reportes: { ruta: '/reportes', icono: 'bi-bar-chart-fill', etiqueta: 'Reportes' },
	Configuración: { ruta: '/configuracion', icono: 'bi-gear-fill', etiqueta: 'Configuración' }
};

export function menuDe(modulos = []) {
	const items = modulos
		.filter((m) => m.puede_ver && PAGINAS[m.nombre])
		.map((m) => ({ href: PAGINAS[m.nombre].ruta, label: PAGINAS[m.nombre].etiqueta, icon: PAGINAS[m.nombre].icono, desc: m.descripcion }));
	return [
		{ href: '/panel', label: 'Panel principal', icon: 'bi-speedometer2', desc: '' },
		...items,
		{ href: '/cuenta', label: 'Mi cuenta', icon: 'bi-person-gear', desc: 'Datos de contacto y contraseña' }
	];
}

export function accesoRuta(modulos, ruta) {
	const seg = '/' + (ruta.split('/')[1] ?? '');
	return menuDe(modulos).some((i) => i.href === seg);
}
