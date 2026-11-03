import { z } from 'zod';
import type { HabitoInput, HabitoRepository } from '../domain/Habito';
import { GestionarHabitos } from '../application/GestionarHabitos';
const base = import.meta.env.DEV
 ? '/api'
 : (import.meta.env.VITE_API_URL || 'https://ritmo-api-ksbf.onrender.com').replace(/\/$/, '');
export const session = {
 token: () => sessionStorage.getItem('ritmo.token'),
 save: (token: string) => sessionStorage.setItem('ritmo.token', token),
 clear: () => sessionStorage.removeItem('ritmo.token'),
 // Solo controla la interfaz; el servidor debe verificar firma y permisos.
 isAdmin: (): boolean => {
  try {
   const encoded = sessionStorage.getItem('ritmo.token')?.split('.')[1];
   if (!encoded) return false;
   const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
   const claims: unknown = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
   const parsed = z.object({ role: z.string().optional(), rol: z.string().optional(), exp: z.number().optional() }).safeParse(claims);
   if (!parsed.success || (parsed.data.exp !== undefined && parsed.data.exp * 1000 <= Date.now())) return false;
   return (parsed.data.role ?? parsed.data.rol) === 'ADMIN';
  } catch { return false; }
 },
};
export function unwrap(value: unknown): unknown { return value && typeof value === 'object' && 'data' in value ? value.data : value; }
export class UncertainMutationError extends Error {
 constructor() { super('Se perdió la conexión y no pudimos confirmar el resultado. Revisa la lista con Actualizar antes de volver a guardar o eliminar para evitar repetir la operación.'); }
}
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
export async function request(path: string, method = 'GET', body?: unknown): Promise<unknown> {
 const token = session.token();
 const readOnly = method === 'GET';
 const attempts = readOnly ? 3 : 1;
 for (let attempt = 0; attempt < attempts; attempt++) {
 if (attempt > 0) {
  await wait(1000 * 2 ** (attempt - 1) + Math.random() * 250);
  if (!path.startsWith('/auth/') && session.token() !== token) throw new Error('La sesión cambió. Vuelve a iniciar la consulta.');
 }
 let response: Response;
 try { response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token && !path.startsWith('/auth/') ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) }); }
 catch {
  if (!readOnly) throw new UncertainMutationError();
  if (attempt < attempts - 1) continue;
  throw new Error('No pudimos conectar después de 3 intentos. Espera un momento y pulsa Actualizar.');
 }
 if ([502, 503, 504].includes(response.status)) {
  if (!readOnly) throw new UncertainMutationError();
  if (attempt < attempts - 1) continue;
 }
 if (response.status === 204) return undefined;
 const payload: unknown = await response.json().catch(() => null);
 if (!response.ok) {
 if (response.status === 401 && !path.startsWith('/auth/')) { session.clear(); window.dispatchEvent(new Event('ritmo:expired')); }
 const message = payload && typeof payload === 'object' && 'message' in payload ? payload.message : null;
 throw new Error(Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : 'No se pudo completar la solicitud (' + response.status + ').');
 }
 return unwrap(payload);
 }
 throw new Error('No se pudo completar la consulta.');
}
export const habitoSchema = z.object({ id: z.number(), nombre: z.string(), descripcion: z.string().nullish(), estado: z.string(), frecuencia: z.string() });
class ApiHabitoRepository implements HabitoRepository {
 async listar(admin = false) {
  if (admin && !session.isAdmin()) throw new Error('Tu sesión no indica permisos de administrador.');
  return z.array(habitoSchema).parse(await request(admin ? '/habitos/admin/todos' : '/habitos'));
 }
 async obtener(id: number) { return habitoSchema.parse(await request('/habitos/' + id)); }
 async crear(input: HabitoInput) { await request('/habitos', 'POST', input); }
 async actualizar(id: number, input: HabitoInput) { await request('/habitos/' + id, 'PATCH', input); }
 async eliminar(id: number) { await request('/habitos/' + id, 'DELETE'); }
}
export const habitos = new GestionarHabitos(new ApiHabitoRepository());
export async function login(email: string, password: string) {
 const result = z.object({ access_token: z.string().optional(), token: z.string().optional() }).parse(await request('/auth/login', 'POST', { email, password }));
 const token = result.access_token || result.token;
 if (!token) throw new Error('La API no devolvió un token de sesión compatible.');
 session.save(token);
}
export async function register(nombre: string, email: string, password: string) { await request('/auth/register', 'POST', { nombre, email, password }); }

