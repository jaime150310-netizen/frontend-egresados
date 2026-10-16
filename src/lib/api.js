// Cliente único para hablar con la API (FastAPI). Todas las pantallas lo usan.
const BASE = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
export const API_URL = BASE;

function mensajeDeError(data, status) {
	if (data && typeof data.detail === 'string') return data.detail;
	if (data && Array.isArray(data.detail)) return 'Revisa los datos del formulario: faltan o son inválidos algunos campos.';
	return `Error ${status}`;
}

async function pedir(metodo, ruta, cuerpo) {
	let resp;
	try {
		resp = await fetch(BASE + ruta, {
			method: metodo,
			headers: { 'Content-Type': 'application/json' },
			body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
		});
	} catch {
		throw new Error('No se pudo conectar con el servidor. Verifica que la API esté en línea.');
	}
	let data = null;
	try { data = await resp.json(); } catch { /* sin cuerpo */ }
	if (!resp.ok) {
		if (data && typeof data.detail === 'string') throw new Error(data.detail);
		if (resp.status >= 500) throw new Error('El servidor tuvo un problema al procesar la solicitud. Inténtalo de nuevo.');
		throw new Error(mensajeDeError(data, resp.status));
	}
	return data;
}

// Importante: las colecciones llevan "/" al final (ej. /usuarios/) para evitar redirecciones.
export const api = {
	get: (ruta) => pedir('GET', ruta),
	post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
	put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
	del: (ruta) => pedir('DELETE', ruta)
};

// Deja solo los campos que el modelo de la API acepta (así no se mandan campos de más).
export const pick = (obj, claves) => Object.fromEntries(claves.map((k) => [k, obj[k] ?? null]));
