# Ritmo Claro API
Base: https://ritmo-api-ksbf.onrender.com (VITE_API_URL). Sin prefijo /api.

Contrato de entrada proporcionado por el usuario: POST /auth/register {nombre,email,password}; POST /auth/login {email,password}; GET y POST /habitos; GET /habitos/admin/todos; GET, PATCH y DELETE /habitos/{id} numérico. Crear/editar: nombre, descripcion, estado, frecuencia. Valores conocidos: ACTIVO/PAUSADO y DIARIA/SEMANAL. DELETE admite 204 sin body.

[PENDIENTE] Verificar respuestas reales, enums completos, restricciones de contraseña, CORS y roles. La consulta pública falló por conexión. Adaptador provisional admite respuestas directas o {data}, login con access_token o token; hábitos con id numérico y campos en español. Se usa Bearer; 401 protegido elimina sesión. Administración es consulta y el servidor decide permisos (403 se muestra). No hay endpoint de seguimiento diario, rachas, recuperación o refresh; no se inventan.


