export const dinero = (n) =>
	n === null || n === undefined || n === '' ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export function fecha(s) {
	if (!s) return '—';
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
	return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}
export const hoy = () => new Date().toISOString().slice(0, 10);
export const nombreCompleto = (u) => (u ? `${u.nombre} ${u.apellido ?? ''}`.trim() : '—');
export const iniciales = (texto = '') => texto.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const slugRol = (rol) => ({ Administrador: 'admin', Coordinador: 'coordinador', Egresado: 'egresado' })[rol] ?? 'egresado';

export function hace(f) {
	if (!f) return '';
	const d = Math.floor((Date.now() - new Date(f).getTime()) / 86400000);
	return d <= 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`;
}

// Colores de estado (vacantes, postulaciones...)
export function colorEstado(estado = '') {
	const e = estado.toLowerCase();
	if (/contrat|acept|dispon|abiert|activ/.test(e)) return 'success';
	if (/rechaz|cerrad|inactiv|finaliz/.test(e)) return 'danger';
	if (/preselec|entrevist/.test(e)) return 'info';
	return 'warning';
}
export const vacanteCerrada = (v) => /cerrad|finaliz|inactiv/i.test(v.estado ?? '');
