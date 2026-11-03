import { useEffect, useState, type FormEvent } from 'react';
import type { Habito, HabitoInput } from '../domain/Habito';
import { habitos, login, register, session } from '../infrastructure/ritmoApi';

const empty: HabitoInput = { nombre: '', descripcion: '', estado: 'ACTIVO', frecuencia: 'DIARIA' };
const message = (e: unknown) => e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
export function RitmoApp() {
 const [authenticated, setAuthenticated] = useState(!!session.token());
 const [signup, setSignup] = useState(false);
 const [items, setItems] = useState<Habito[]>([]);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [busy, setBusy] = useState(false);
 const [loading, setLoading] = useState(false);
 const [admin, setAdmin] = useState(false);
 const [query, setQuery] = useState('');
 const [filter, setFilter] = useState('TODOS');
 const [editor, setEditor] = useState<HabitoInput | null>(null);
 const [editingId, setEditingId] = useState<number>();
 const [deleting, setDeleting] = useState<Habito | null>(null);
 const [revision, setRevision] = useState(0);
 const modalOpen = !!editor || !!deleting;
 useEffect(() => {
  if (!modalOpen) return;
  const previous = document.activeElement;
  const handle = (event: KeyboardEvent) => {
   if (event.key === 'Escape' && !busy) { setEditor(null); setDeleting(null); }
   if (event.key !== 'Tab') return;
   const nodes = document.querySelectorAll<HTMLElement>('.modal button:not(:disabled), .modal input, .modal textarea, .modal select');
   const first = nodes[0]; const last = nodes[nodes.length - 1];
   if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
   else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  document.addEventListener('keydown', handle);
  return () => { document.removeEventListener('keydown', handle); if (previous instanceof HTMLElement) previous.focus(); };
 }, [modalOpen, busy]);
 useEffect(() => {
  const expire = () => { setAuthenticated(false); setItems([]); setEditor(null); setDeleting(null); setError('Tu sesión terminó. Inicia sesión de nuevo.'); };
  window.addEventListener('ritmo:expired', expire);
  return () => window.removeEventListener('ritmo:expired', expire);
 }, []);
 useEffect(() => {
  if (!authenticated) return;
  let active = true;
  setLoading(true); setError(''); setItems([]);
  habitos.listar(admin).then(data => { if (active) setItems(data); }).catch(e => { if (active) setError(message(e)); }).finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [authenticated, admin, revision]);
 async function authenticate(e: FormEvent<HTMLFormElement>) {
  e.preventDefault(); setBusy(true); setError(''); setNotice('');
  const data = new FormData(e.currentTarget);
  try {
   if (signup) { await register(String(data.get('nombre')).trim(), String(data.get('email')).trim(), String(data.get('password'))); setSignup(false); setNotice('Tu cuenta está lista. Inicia sesión para comenzar.'); }
   else { await login(String(data.get('email')).trim(), String(data.get('password'))); setAuthenticated(true); }
  } catch (e) { setError(message(e)); } finally { setBusy(false); }
 }
 async function save(e: FormEvent) {
  e.preventDefault(); if (!editor) return; setBusy(true); setError('');
  try { await habitos.guardar({ ...editor, nombre: editor.nombre.trim() }, editingId); setEditor(null); setNotice('Hábito guardado. Cada pequeño paso cuenta.'); setRevision(v => v + 1); }
  catch (e) { setError(message(e)); } finally { setBusy(false); }
 }
 async function edit(id: number) {
  setBusy(true); setError('');
  try { const item = await habitos.obtener(id); setEditingId(id); setEditor({ nombre: item.nombre, descripcion: item.descripcion || '', estado: item.estado, frecuencia: item.frecuencia }); }
  catch (e) { setError(message(e)); } finally { setBusy(false); }
 }
 async function remove() {
  if (!deleting) return; setBusy(true); setError('');
  try { await habitos.eliminar(deleting.id); setDeleting(null); setNotice('Hábito eliminado. Siempre puedes empezar de nuevo.'); setRevision(v => v + 1); }
  catch (e) { setError(message(e)); } finally { setBusy(false); }
 }
 const alerts = <>{error && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert" role="status">{notice}</div>}</>;
 const brand = <a className="brand" href="/"><span className="brand-icon">◒</span> ritmo claro<span className="brand-dot">.</span></a>;
 if (!authenticated) return <div className="auth-layout"><section className="auth-story">{brand}<div><span className="eyebrow">UN POCO CADA DÍA</span><h1>Encuentra tu ritmo.<br /><em>Cuida de ti.</em></h1><p>Los grandes cambios empiezan con pequeños hábitos. Dale espacio a lo que te hace bien.</p><div className="orbit"><span>respira</span><i>crece</i><b>florece ✳</b></div></div><small>A tu paso. Sin prisa. Con intención.</small></section><main className="auth-form"><span className="eyebrow">TU BIENESTAR EMPIEZA AQUÍ</span><h2>{signup ? 'Un nuevo comienzo' : 'Qué bueno verte'}</h2><p>{signup ? 'Crea tu espacio para cultivar hábitos.' : 'Vuelve a conectar con tus pequeños propósitos.'}</p>{alerts}<form onSubmit={authenticate}>{signup && <label>Tu nombre<input name="nombre" autoComplete="name" required placeholder="¿Cómo te llamas?" /></label>}<label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="hola@ejemplo.com" /></label><label>Contraseña<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required placeholder="Tu contraseña" /></label><button className="primary" disabled={busy}>{busy ? 'Un momento…' : signup ? 'Crear mi cuenta →' : 'Entrar a mi espacio →'}</button></form><p className="switch">{signup ? '¿Ya tienes cuenta?' : '¿Primera vez por aquí?'} <button disabled={busy} className="text-button" onClick={() => { setSignup(!signup); setError(''); setNotice(''); }}>{signup ? 'Inicia sesión' : 'Crea tu cuenta'}</button></p></main></div>;
 const visible = items.filter(i => (filter === 'TODOS' || i.estado === filter) && (i.nombre + ' ' + (i.descripcion || '')).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 return <div className="app"><aside>{brand}<div className="nav-label">MI ESPACIO</div><nav><button className={!admin ? 'selected' : ''} onClick={() => setAdmin(false)}>▦ <span>Mis hábitos</span></button>{session.isAdmin() && <button className={admin ? 'selected' : ''} onClick={() => setAdmin(true)}>◎ <span>Administración</span></button>}</nav><div className="sidebar-note">✳<h3>Pequeños pasos,<br />grandes cambios.</h3><p>No necesitas hacerlo perfecto. Solo encontrar tu ritmo.</p></div><button className="logout" onClick={() => { session.clear(); setAuthenticated(false); setItems([]); setAdmin(false); setNotice(''); setError(''); }}>↗ Cerrar sesión</button></aside><main className="workspace"><header><span>Tu espacio de bienestar</span><span className="avatar">RC</span></header><section className="page-heading"><div><span className="eyebrow">CULTIVA LO QUE TE HACE BIEN</span><h1>{admin ? 'Una mirada a todos' : 'A tu propio ritmo'}<span className="accent">.</span></h1><p>{admin ? 'Consulta los hábitos globales. Requiere permisos de administrador.' : 'Cada hábito es una pequeña promesa contigo. Vamos paso a paso.'}</p></div>{!admin && <button className="primary" onClick={() => { setEditingId(undefined); setEditor({ ...empty }); setError(''); }}>＋ Nuevo hábito</button>}</section><section className="welcome"><div><span className="eyebrow">MENOS PRESIÓN, MÁS INTENCIÓN</span><h2>Hoy es un buen día<br />para cuidarte.</h2><p>Haz espacio para las cosas que te llenan de energía.</p></div><div className="flower" aria-hidden="true">✳</div></section><section className="stats"><div><span>Hábitos en tu espacio</span><strong>{items.length.toString().padStart(2, '0')}</strong></div><div><span>En movimiento <i className="green-dot" /></span><strong>{items.filter(i => i.estado === 'ACTIVO').length.toString().padStart(2, '0')}</strong></div><div><span>En pausa</span><strong>{items.filter(i => i.estado === 'PAUSADO').length.toString().padStart(2, '0')}</strong></div></section>{!editor && !deleting && alerts}<section className="habits"><div className="list-heading"><h2>{admin ? 'Todos los hábitos' : 'Mis hábitos'} <small>{items.length}</small></h2><button className="text-button" disabled={loading} onClick={() => setRevision(v => v + 1)}>↻ Actualizar</button></div><div className="toolbar"><div className="tabs">{['TODOS', 'ACTIVO', 'PAUSADO'].map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f === 'TODOS' ? 'Todos' : f === 'ACTIVO' ? 'Activos' : 'En pausa'}</button>)}</div><input aria-label="Buscar hábitos" placeholder="⌕  Buscar un hábito…" value={query} onChange={e => setQuery(e.target.value)} /></div>{loading ? <div className="empty" role="status">Conectando con tu espacio…</div> : error && !items.length ? <div className="empty">No pudimos cargar los hábitos. Puedes volver a intentarlo con Actualizar.</div> : visible.length ? <div className="cards">{visible.map((item, index) => <article key={item.id} className="habit-card"><div className="card-top"><span className={'habit-icon color-' + index % 3}>{['◉', '✳', '☀'][index % 3]}</span><span className={'badge ' + (item.estado === 'ACTIVO' ? 'active-badge' : '')}>{item.estado === 'ACTIVO' ? 'Activo' : item.estado === 'PAUSADO' ? 'En pausa' : item.estado}</span></div><h3>{item.nombre}</h3><p>{item.descripcion || 'Un pequeño paso para tu bienestar.'}</p><footer><span>↻ {item.frecuencia === 'DIARIA' ? 'Cada día' : item.frecuencia === 'SEMANAL' ? 'Cada semana' : item.frecuencia}</span>{!admin && <div><button disabled={busy} onClick={() => void edit(item.id)}>Editar</button><button disabled={busy} aria-label={'Eliminar ' + item.nombre} onClick={() => { setDeleting(item); setError(''); }}>Eliminar</button></div>}</footer></article>)}</div> : <div className="empty"><span>✳</span><h3>{items.length ? 'No encontramos ese hábito' : 'Todo empieza con un pequeño paso'}</h3><p>{items.length ? 'Prueba otra búsqueda o cambia el filtro.' : 'Crea tu primer hábito y empieza a construir tu propio ritmo.'}</p></div>}</section><div className="bottom-note">Hecho para avanzar a tu manera. <span>ritmo claro.</span></div></main>{editor && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><h2 id="editor-title">{editingId === undefined ? 'Un pequeño comienzo' : 'Dale forma a tu hábito'}</h2><p>Elige algo que te haga bien.</p>{alerts}<form onSubmit={save}><label>Nombre del hábito<input autoFocus required value={editor.nombre} onChange={e => setEditor({ ...editor, nombre: e.target.value })} placeholder="Leer 30 minutos" /></label><label>Descripción<textarea value={editor.descripcion} onChange={e => setEditor({ ...editor, descripcion: e.target.value })} placeholder="Un momento para mí antes de dormir" /></label><div className="form-row"><label>Frecuencia<select value={editor.frecuencia} onChange={e => setEditor({ ...editor, frecuencia: e.target.value })}><option value="DIARIA">Diaria</option><option value="SEMANAL">Semanal</option>{!['DIARIA','SEMANAL'].includes(editor.frecuencia) && <option>{editor.frecuencia}</option>}</select></label><label>Estado<select value={editor.estado} onChange={e => setEditor({ ...editor, estado: e.target.value })}><option value="ACTIVO">Activo</option><option value="PAUSADO">En pausa</option>{!['ACTIVO','PAUSADO'].includes(editor.estado) && <option>{editor.estado}</option>}</select></label></div><div className="modal-actions"><button type="button" disabled={busy} onClick={() => setEditor(null)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar hábito'}</button></div></form></section></div>}{deleting && <div className="modal-backdrop"><section className="modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">¿Eliminar este hábito?</h2><p>“{deleting.nombre}” se eliminará permanentemente.</p>{alerts}<div className="modal-actions"><button autoFocus disabled={busy} onClick={() => setDeleting(null)}>Conservar hábito</button><button className="danger" disabled={busy} onClick={() => void remove()}>{busy ? 'Eliminando…' : 'Eliminar hábito'}</button></div></section></div>}</div>;
}


