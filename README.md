# Ritmo Claro

Las consultas GET reintentan hasta tres veces ante cortes de conexión o HTTP 502/503/504, con esperas progresivas. Las mutaciones no se reenvían automáticamente: si se pierde la respuesta, revisa la lista antes de repetirlas. Reintentar creaciones con garantía contra duplicados requiere soporte de idempotencia en el backend. Estos reintentos mitigan fallos transitorios, pero no reparan la causa de ECONNRESET; para diagnosticarla se necesitan logs del servidor y de su red.
Aplicación React responsive para hábitos de bienestar, adaptada desde el template con separación domain/application/infrastructure/presentation.

## Desarrollo
```sh
pnpm install
pnpm dev
```
La URL de producción se usa por defecto. Opcionalmente copia .env.example a .env y configura VITE_API_URL.

En desarrollo, el navegador solicita /api al servidor Vite, que reenvía las peticiones a VITE_API_URL quitando ese prefijo. Reinicia pnpm dev después de cambiar la configuración. Esto evita el bloqueo CORS local. En producción (incluido pnpm preview), el navegador llama directamente a la API: el backend debe permitir el origen real del frontend, los métodos GET/POST/PATCH/DELETE/OPTIONS y los encabezados Content-Type y Authorization. El proxy de desarrollo no configura CORS en Render.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Incluye registro, login, listado, búsqueda, filtros, creación, detalle para edición, actualización, eliminación y consulta administrativa. No incluye seguimiento diario ni rachas porque no aparecen en el API suministrado.

Consulta docs/frontend/backend-contract.md para las suposiciones pendientes de verificar. Si el backend devuelve otro formato de login o hábitos, ajustar el adaptador infrastructure/ritmoApi.ts. El servidor debe permitir CORS desde el dominio donde se publique este frontend. Las rutas de administrador siguen protegidas por el backend.

