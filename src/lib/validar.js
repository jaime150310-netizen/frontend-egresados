// Validaciones reutilizables para formularios (login, registro, perfil...)

export const esCorreo = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v ?? '').trim());
// Celular colombiano: 10 dígitos y empieza por 3
export const esCelular = (v) => /^3\d{9}$/.test((v ?? '').trim());
// NIT: 9 dígitos + dígito de verificación (acepta puntos y guion)
export const esNit = (v) => /^\d{9}-?\d$/.test((v ?? '').replace(/\./g, '').trim());
export const esUrl = (v) => !v || /^https?:\/\/\S+\.\S+/.test(v.trim());
export const nombreCompleto = (v) => (v ?? '').trim().split(/\s+/).filter(Boolean).length >= 2 && v.trim().length >= 5;

export function reglasPassword(p = '') {
	return [
		{ ok: p.length >= 8, texto: 'Mínimo 8 caracteres' },
		{ ok: /[A-Za-z]/.test(p), texto: 'Al menos una letra' },
		{ ok: /\d/.test(p), texto: 'Al menos un número' }
	];
}
export const passwordValida = (p) => reglasPassword(p).every((r) => r.ok);
