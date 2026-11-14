# Auditoría inicial de recursos, peticiones y seguridad

Seguimiento: [mejoras web aplicadas el 11 de noviembre, preservando la integración móvil](../2026-11-11/README.md). Este documento conserva los resultados de la línea base.

Fecha: 10 de noviembre de 2026 (America/Bogota). Base: `origin/main`, commit `2fbef506167a6fb82efe4bc0accb0ba5b45216bf` (PR #28).
Rama de trabajo: `codex/auditoria-recursos-peticiones-seguridad`.

Se descargaron las referencias con `git fetch --prune origin`. El checkout original de `develop` estaba limpio y coincidía con `origin/develop`, pero era ancestro de `origin/main` y le faltaban 24 commits de esta última. La rama nueva parte directamente del último `origin/main`; las ramas locales anteriores se conservaron. La rama de auditoría no tiene upstream para evitar confundirla con `main` al publicar.

Esta entrega reúne evidencia y propone correcciones. No modifica el código de la aplicación, imágenes, configuración de seguridad ni datos de Firebase. Se añadieron este informe, inventarios, resultados de dependencias y pruebas aisladas de diagnóstico.

## Alcance y lectura de prioridades

- Etapa 1: inventario completo de `public` y revisión de sus referencias en `src`, imágenes usadas, video, fuentes y política de caché.
- Etapa 2: revisión estática de consultas de cursos, matrículas, dashboard y limitador de peticiones; sin medir costos ni latencias de producción.
- Etapa 3: revisión dirigida de autenticación, permisos, mantenimiento, compras, dependencias y reglas locales de Firebase. Se localizaron 48 archivos de rutas API; esto no equivale a una prueba exhaustiva de todos sus métodos.
- Validación: suite existente, pruebas aisladas con mocks, lint y compilación local.

P1 = corregir con prioridad alta; P2 = mejora planificable. La severidad de un aviso de dependencia pertenece al paquete y no demuestra explotación en esta aplicación. Los hallazgos sobre reglas locales son condicionales: no se consultaron las reglas desplegadas ni se ejecutó el emulador de reglas.

## Etapa 1. Recursos

Medición de disco: **118 archivos, 108.853.289 bytes (103,81 MiB)**; **14 archivos superan 1 MiB**. No es el peso de una página: el navegador descarga los recursos que solicita y puede usar caché o compresión HTTP.

El inventario marca 88.841.981 bytes sin referencia textual de ruta en `src`. Esto es una lista de candidatos para revisar, no una autorización de borrado: pueden existir referencias dinámicas, código externo, aplicaciones móviles o enlaces directos.

| Recurso en `public` | MiB | Dimensiones | Uso localizado |
| --- | ---: | --- | --- |
| `assets/images/background.png` | 25,96 | 7360 × 4912 | Sin referencia textual |
| `assets/RCP_Hero.original.webm` | 17,63 | — | Sin referencia textual |
| `assets/Animation/intro.mov` | 14,06 | — | Sin referencia textual |
| `assets/Animation/SICAP_LOGO.mov` | 13,21 | — | Sin referencia textual |
| `assets/images/SICAP/webp/contacto.webp` | 7,02 | 3936 × 2624 | `/contacto`, imagen visible |
| `assets/images/SICAP/webp/software_sicap.webp` | 6,48 | 4159 × 3978 | `/acerca`, imagen visible |
| `assets/images/background-mid.png` | 3,47 | 6144 × 3456 | Sin referencia textual |
| `assets/RCP_Hero.mp4` | 2,14 | — | Video alternativo de portada |
| `assets/RCP_Hero.webm` | 1,29 | — | Primer formato del video de portada |
| `assets/images/login.png` | 0,94 | 1000 × 1500 | Fondo del formulario de acceso |

### R-01 · P1 · Dos imágenes públicas excesivamente grandes y sin adaptación

Evidencia: [contacto/page.tsx:78](../../../src/app/contacto/page.tsx#L78) y [acerca/page.tsx:146](../../../src/app/acerca/page.tsx#L146). Ambas usan `<img>` con la URL original, sin `srcset`, tamaños intrínsecos ni selección por viewport. Estar en WebP no garantiza un archivo pequeño. Cada página solicita su propia imagen, no ambas necesariamente.

Impacto: transferencia y decodificación innecesarias, especialmente en móviles; posible efecto sobre LCP y estabilidad visual, todavía sin medir en navegador.

Propuesta: exportar variantes según el ancho realmente mostrado; probar calidad visual y usar `next/image` con `sizes` o un `picture/srcset`. Definir dimensiones y carga diferida solo si la imagen queda fuera de la primera pantalla. Objetivo inicial revisable: 200–400 KiB por imagen de contenido, sujeto a calidad; no es un ahorro ya obtenido. Actualizar primero Next/Sharp por S-04 antes de ampliar el uso del optimizador.

Cierre: capturas comparables en móvil/escritorio, archivo servido adecuado al viewport, peso y LCP medidos antes/después.

### R-02 · P2 · Originales de producción alojados como recursos públicos

Los tres videos `RCP_Hero.original.webm`, `intro.mov` y `SICAP_LOGO.mov` suman **44,90 MiB** sin referencia textual. Los dos fondos PNG suman otros **29,43 MiB**. Aumentan el checkout y el contenido publicado; no se puede atribuir ese peso a la carga inicial del sitio. Hay además cuatro copias idénticas de `sicap_border_white` bajo extensiones distintas: detalle en el resumen JSON.

Propuesta: verificar consumidores y enlaces externos; conservar originales en almacenamiento de diseño y publicar solo derivados utilizados. No eliminar todavía. La portada ya usa derivados WebM/MP4 de menor tamaño ([Hero.tsx:106](../../../src/components/page/Hero.tsx#L106)); normalmente el navegador elige un formato. `autoPlay` puede descargar el video pese a `preload="metadata"`; evaluar poster/modo de ahorro de datos según mediciones móviles.

Cierre: mapa de consumidores, conservación de originales y navegación sin recursos rotos.

### R-03 · P2 · Un año de caché inmutable para nombres sin versión

Evidencia: [next.config.mjs:117](../../../next.config.mjs#L117) aplica `max-age=31536000, immutable` a `/assets/*`, incluyendo nombres estables de imágenes y JSON de animaciones. Si se reemplaza contenido bajo la misma URL, visitantes con caché pueden conservar la versión anterior.

Propuesta: nombres con hash/versión para recursos inmutables; política de revalidación para nombres estables. Verificar las cabeceras reales del hosting, que podrían modificar las declaradas aquí.

Cierre: actualización de un recurso visible sin depender de borrar caché manualmente.

### R-04 · P2 · Fuentes con dos mecanismos de carga

Evidencia: [layout.tsx:2](../../../src/app/layout.tsx#L2) usa `next/font/google` para Inter y [landing.css:1](../../../src/app/landing.css#L1) importa Inter y Outfit desde Google Fonts. El CSS de landing y Bootstrap/Iconos se importan globalmente.

Propuesta: unificar las fuentes, limitar familias/pesos usados y medir cobertura de CSS antes de retirar estilos compartidos. El doble mecanismo está confirmado; la cantidad efectiva de descargas depende de las reglas CSS aplicadas.

Cierre: una estrategia de fuentes y comparación de solicitudes, CSS transferido y capturas de las pantallas afectadas.

## Etapa 2. Peticiones y consultas

### Q-01 · P1 · La portada del estudiante consulta todos los cursos activos

Evidencia: [student-enrollment.service.ts:44](../../../src/shared/lib/student-enrollment.service.ts#L44) obtiene todos los cursos activos y después consulta `courses/{curso}/enrollments/{usuario}` por cada curso. Lo invoca `getStudentCourses` desde `/student/home` y `/student/courses`.

Para C cursos activos son **1 + C operaciones de consulta/lectura**, además de las matrículas de plataforma; el número de documentos transferidos y facturados es otra medida. Crece con el catálogo completo aunque el estudiante tenga una sola matrícula. `Promise.all` reduce parte de la espera pero no las operaciones ni su concurrencia.

Propuesta: consultar matrículas del usuario mediante índice/colección de relación, paginar y deduplicar por usuario. Reutilizar `platform_enrollments` donde corresponda y diseñar la compatibilidad con cursos legacy antes de migrarlos.

Cierre: con 100 cursos y 1 matrícula, la carga deja de hacer una búsqueda por cada curso ajeno; comprobar aislamiento y equivalencia de resultados.

### Q-02 · P2 · Catálogo público con consultas repetidas y sin caché

Evidencia: [api/courses/route.ts:33](../../../src/app/api/courses/route.ts#L33): una consulta de plantillas, una de grupos por plantilla y una lectura de institución por plantilla. Con T plantillas que tienen institución, son **1 + 2T operaciones**; se vuelve a leer una misma institución varias veces. No hay límite/paginación. [proxy.ts:104](../../../src/proxy.ts#L104) fuerza `no-store` en APIs, también en este catálogo público.

Propuesta: deduplicar instituciones por ID, agrupar lecturas de grupos, paginar y definir caché breve solo para el catálogo público. Precio, cupo y autorización deben revalidarse al comprar. No aplicar caché pública a rutas de usuario. En esta revisión no se encontró un consumidor activo del hook `useCatalog` fuera de su propia definición: medir el tráfico real del endpoint antes de priorizarlo sobre Q-01.

Cierre: solicitudes acotadas por página e instituciones únicas, invalidación al editar catálogo y precios/cupos verificados en servidor.

### Q-03 · P2 · El dashboard recalcula aunque exista el documento agregado

Evidencia: [super-admin-analytics.service.ts:188](../../../src/features/analytics/services/super-admin-analytics.service.ts#L188) lee `stats/global` y siempre ejecuta 12 agregaciones más 4 consultas de listas. Los totales calculados después sobrescriben los agregados en el retorno. Son **17 operaciones** por ejecución normal, sin contar reintentos. Las agregaciones no equivalen a descargar todos los documentos, pero también tienen costo y latencia.

Propuesta: fijar una política de frescura para agregados y consultas de actividad; reutilizar métricas válidas y ofrecer actualización explícita. Revisar compatibilidad con los agregados de `lib/platform-metrics.ts` antes de cambiar la fuente.

Cierre: un dashboard con agregados vigentes evita los 12 conteos redundantes y muestra su fecha de actualización.

### Q-04 · P2 · Listados administrativos sin paginación y conteos por curso

Evidencia: [admin/courses/route.ts:144](../../../src/app/api/admin/courses/route.ts#L144) descarga todos los cursos de la institución y hace `count()` por cada uno; [instructor/courses/route.ts:76](../../../src/app/api/instructor/courses/route.ts#L76) repite el conteo por curso. Pedidos y grupos también tienen listados completos. Los comentarios explican que el contador `studentCount` se desfasa por inscripciones desde Flutter: sustituir el conteo por el campo actual sin resolver esa causa perdería exactitud.

Propuesta: cursor/paginación, concurrencia limitada y contador mantenido por todos los productores (web, móvil, QR), con reconciliación. Mientras se asegura consistencia, contar solo los cursos de la página visible.

Cierre: costo acotado al tamaño de página y conteos correctos después de inscribir desde cada cliente.

### Q-05 · P2 · La protección contra abuso también consume Firestore

Evidencia: [rate-limiter.ts:78](../../../src/lib/rate-limiter.ts#L78): en producción, cada intento admitido por el limitador ejecuta una transacción con lectura y escritura. Algunas rutas lo consultan antes de autenticar, como la sesión y auditoría. Las peticiones ya bloqueadas hacen lectura, sin incrementar. El fallback en memoria no es distribuido y su Map no elimina claves expiradas que no se reutilizan. La limpieza TTL se menciona como configuración manual; no se comprobó que esté activa.

Propuesta: medir consumo y TTL, limitar abuso antes de llegar a Firestore cuando el hosting lo permita, acotar el Map y unificar la extracción de IP según el proxy realmente confiable. No confiar en `cf-connecting-ip` de un cliente si la infraestructura no lo elimina/sobrescribe. Ese bypass depende del hosting y no está reproducido aquí.

Cierre: prueba de carga controlada fuera de producción con conteos de lecturas/escrituras, limpieza comprobada y límites efectivos entre varias instancias.

## Etapa 3. Seguridad

### S-01 · Alta / P1 · Cron abierto cuando falta el secreto — reproducido con mocks

Evidencia: [cron/check-cohorts/route.ts:27](../../../src/app/api/cron/check-cohorts/route.ts#L27): `if (cronSecret && authHeader !== ...)`. Si no existe `CRON_SECRET`, no rechaza al visitante. El GET delega en POST y llega a `processExpiredCohorts`, que puede abrir/cerrar grupos y generar sucesores. El proxy solo bloquea `/api/debug`, no esta ruta. `reset-usage` y `seed/jomar` sí rechazan cuando no existe el secreto: hay implementaciones inconsistentes.

Prueba aislada: GET sin credenciales y sin secreto devuelve 200 y llama al motor simulado; al configurar el secreto, el mismo GET devuelve 401. No se invocó el motor real. No se comprobó si falta la variable en producción.

Propuesta: reutilizar `checkCronSecret`, rechazar cuando falta la configuración y revisar el método admitido con el scheduler. Cierre: 401/503 sin secreto, 401 con secreto incorrecto y ejecución únicamente con credencial válida, tanto para GET como para POST si se mantienen ambos.

### S-02 · Alta / P1 · Desactivación y revocación aplicadas de forma desigual — reproducido parcialmente

Evidencia: [withAuth.ts:52](../../../src/lib/withAuth.ts#L52) no pide comprobación de revocación y el atajo del claim `isSuperAdmin` evita leer el perfil actual, incluido `isActive`. Por otro lado, los helpers propios de `api/admin/courses`, `cohorts`, `instructors` y `purchase-orders` verifican rol pero no `isActive`. El cierre de sesión del frontend no protege contra una llamada directa con un token aún vigente. Las rutas de cookie examinadas sí usan `verifySessionCookie(..., true)`.

Pruebas aisladas: un token simulado con claim de superadmin obtiene autorización sin consultar Firestore; un perfil ADMIN con `isActive: false` obtiene 200 en el listado de cursos. No se probó contra un usuario real revocado. Firebase documenta que [la detección de revocación requiere `checkRevoked`](https://firebase.google.com/docs/auth/admin/manage-sessions#detect_id_token_revocation_in_the_sdk).

Propuesta: centralizar el contrato de autorización (estado activo, rol actual y ámbito), definir la invalidación de privilegios y verificar revocación según el riesgo del endpoint. Considerar el costo adicional de esa comprobación al diseñar caché; no resolver rendimiento manteniendo privilegios obsoletos.

Cierre: un usuario desactivado o con token revocado no opera por ningún helper; cubrir el caso del claim antiguo de superadmin y conservar el aislamiento por institución.

### S-03 · Alta / P1 · La suscripción acepta una membership sin comprobar su vigencia

Evidencia estática: [checkout/plan-subscription/route.ts:40](../../../src/app/api/checkout/plan-subscription/route.ts#L40) busca `userId`, `institutionId` y `role: ADMIN`, pero no exige `isActive: true` ni `status: approved`; tampoco comprueba `user.isActive`. Una membership desactivada o pendiente que conserve ese rol pasa el filtro y puede iniciar un enlace de pago de la institución. No demuestra activación gratuita: el webhook valida el pago.

Propuesta: autorización vigente y explícita por institución; limitador por usuario e idempotencia/reutilización de compra pendiente para esta ruta, que actualmente crea un enlace nuevo por llamada. Cierre: memberships pendientes/rechazadas/inactivas reciben 403 y repetir una compra vigente no multiplica enlaces innecesariamente.

### S-04 · Crítica según npm / P1 · Dependencias con avisos publicados

Resultados preservados en [npm-audit.json](npm-audit.json) y [npm-audit-produccion.json](npm-audit-produccion.json):

| Ámbito | Críticas | Altas | Moderadas | Total de paquetes afectados |
| --- | ---: | ---: | ---: | ---: |
| Árbol completo | 2 | 13 | 14 | 29 |
| `--omit=dev` | 2 | 12 | 11 | 25 |

Las cifras cuentan entradas de paquetes afectadas, incluidas consecuencias transitivas; no son 29 ataques independientes ni 29 explotaciones confirmadas. `--omit=dev` sigue incluyendo herramientas declaradas en `dependencies`, como PostCSS; no prueba que todo ese código se ejecute en cada solicitud.

Versiones del lockfile: Next **16.2.4**, Sharp **0.34.5**, Firebase Admin **13.9.0**, Zod **4.4.3**, websocket-driver **0.7.4**, Vitest **4.1.7**. Las dos entradas críticas son Next y websocket-driver. La cadena exacta y todos los avisos están en el JSON.

Se contrastaron avisos de Next con el repositorio del mantenedor: [DoS en Server Components](https://github.com/vercel/next.js/security/advisories/GHSA-8h8q-6873-q5fj) y [RCE en optimización de SVG](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw). Este último depende de la biblioteca de imágenes y de ejecutar en Linux con glibc; el mantenedor indica Sharp >= 0.35.5 como mitigación. No se estableció la explotabilidad concreta del despliegue. Otros avisos requieren Windows, `next/og`, Server Actions u opciones que podrían no usarse.

Propuesta: actualizar Next y sus transitivas a versiones fuera de **todos** los rangos afectados del informe vigente, revisar Zod y Firebase/Admin, y separar actualizaciones compatibles de cambios mayores. El arreglo sugerido por npm para parte de la cadena de Firebase Admin implica **14.5.0, cambio mayor**: requiere revisión de compatibilidad. No ejecutar `npm audit fix --force` sin esa revisión. Volver a consultar avisos al implementar; las versiones mínimas de un único aviso pueden quedar cortas frente a otros.

Cierre: auditoría nueva, árbol resuelto revisado, compilación y pruebas de acceso, pagos, webhook, PDF y datos Firebase. No se actualizaron dependencias en esta entrega.

### S-05 · Alta, condicional / P1 · Reglas locales con acceso entre instituciones

`firestore.rules` y `database.rules.json` existen localmente, pero están ignorados por Git. No se subieron al informe ni se desplegaron. La copia local de Firestore permite a roles globales ADMIN/INSTRUCTOR leer perfiles sin vínculo institucional (`firestore.rules:300`); el bloque ADMIN de actualización de usuarios tampoco exige misma institución (`:346`). Hay permisos globales similares en sesiones (`:642`/`:670`), transacciones (`:1264`) y grupos (`:1179`). RTDB permite leer cualquier `telemetria/{mac}` a cualquier usuario autenticado (`database.rules.json:5`).

Impacto si están desplegadas: exposición de datos entre clientes y operaciones fuera de la institución autorizada. Las validaciones de APIs no sustituyen las reglas para llamadas directas del SDK.

Propuesta: obtener y comparar la versión realmente publicada, versionarla desde su repositorio propietario y probar con emuladores usuarios de dos instituciones, usuario independiente, instructor, administrador y superadmin.

Cierre: toda operación fuera de ámbito se rechaza tanto por API como por SDK directo, salvo acceso global explícitamente autorizado.

### S-06 · Crítica, condicional / P1 · Las reglas locales permiten autoasignación de ADMIN

Evidencia estática local: `institutions` permite crear una institución con `primaryAdminId` propio y `status: active` o `pending` (`firestore.rules:383`). El caso de actualización de perfil de usuario permite cambiarse a ADMIN si esa institución tiene su UID como dueño (`:336`), sin verificar pago ni aprobación del servidor. Combinado con S-05, el alcance va más allá de su propia institución. Contradice el flujo actual de compra, donde el servidor concede ADMIN después del pago aprobado.

Propuesta: reservar rol e identidad institucional privilegiada a operaciones confiables del servidor; retirar fallbacks anteriores de autopromoción una vez comprobados los clientes móviles/web. Cierre: un usuario recién registrado no obtiene ADMIN creando documentos directamente, y el flujo de compra aprobado conserva su funcionamiento. Requiere reproducir con emulador y contrastar reglas desplegadas; no se afirma que esté ocurriendo en producción.

### S-07 · Alta, condicional / P1 · Campos de integridad y pedidos escribibles desde cliente en reglas locales

Evidencia: actualización propia de `sessions` solo protege `studentId`, `institutionId` y `createdAt` (`firestore.rules:670`); no protege `officialGrade` ni `statsProcessed`. La actualización propia de `users` no reserva `stats`, que usa `updateSessionStats` para ranking/XP. También se permite crear `orders` con solo `userId` propio (`:1300`), sin estado/monto autorizado, mientras el flujo nuevo documenta creación de pedidos después de confirmación del webhook.

Impacto potencial: alterar estadísticas o pedidos visibles; reiniciar la marca de procesamiento permitiría solicitar de nuevo procesamiento si las reglas publicadas también lo admiten. No se demostró un certificado falso ni entrega real de productos. El servidor recalcula notas desde señal, lo cual es positivo, pero eso no vuelve inmutables los documentos directamente editables.

Propuesta: reservar campos y documentos autoritativos a servidor; validar estrictamente los campos de captura permitidos y la procedencia de telemetría. Cierre: intentos de editar nota oficial, marca de procesamiento, XP y crear pedidos aprobados son denegados por reglas, sin bloquear la captura legítima desde el dispositivo.

## Calidad de la línea base y comprobaciones

| Comprobación | Resultado |
| --- | --- |
| Instalación desde lockfile | `npm ci --ignore-scripts --no-audit --no-fund`: correcta, 532 paquetes; no se ejecutaron scripts de instalación |
| Suite de aplicación | `npm test`: **12 archivos / 81 pruebas aprobadas** |
| Pruebas aisladas de auditoría | **4 aprobadas**: reproducen defectos actuales y un control de rechazo |
| Inventario | 118 recursos, dimensiones disponibles mediante Sharp y hashes SHA-256 |
| Dependencias | Reportes completo y sin dependencias de desarrollo preservados |
| Lint | **Falla**: el script usa `next lint`, eliminado en Next.js 16; no existe la carpeta `lint` que el CLI interpreta como proyecto |
| Build | `npm run build`: **correcto**, incluyendo TypeScript y generación de 86 páginas estáticas; avisos de Browserslist desactualizado y de gráfico con ancho/alto `-1` durante prerenderizado |

Las cuatro pruebas de auditoría están deliberadamente fuera de la suite normal. Pasan cuando reproducen el comportamiento defectuoso de esta base; al corregirlo deberán sustituirse por pruebas que exijan el rechazo. Todos los accesos Firebase y el motor de mantenimiento están simulados.

El retiro de `next lint` está documentado en la [guía oficial de Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16). Se propone configurar ESLint CLI en una corrección separada; no se interpreta este fallo como un análisis limpio de lint.

El aviso de dimensiones del gráfico no impide compilar. Queda pendiente identificar la pantalla en navegador y comprobar el tamaño del contenedor al montar; no se atribuye todavía a un gráfico específico ni se afirma un fallo visual reproducido.

Como controles positivos, el código de compra examinado resuelve precios en servidor y condiciona la entrega al webhook firmado; existen pruebas de pagos, idempotencia, privacidad y calificación. El layout de superadmin verifica la cookie y su revocación en servidor. Esos controles no eliminan los hallazgos anteriores.

## Reproducir sin servicios reales

Desde la raíz del repositorio:

```powershell
node scripts/audit-assets.mjs
npm test
npx --no-install vitest run --config docs/auditoria/2026-11-10/vitest.config.mjs
npm audit --json
npm audit --omit=dev --json
npm run lint
npm run build
```

El inventario solo lee `public`/`src` y escribe sus reportes; no transforma recursos. Sharp es opcional y solo se usa para metadatos. Las auditorías npm consultan el registro y pueden cambiar al publicarse avisos; su código de salida distinto de cero es esperable cuando encuentran vulnerabilidades. El build usa el entorno local de la aplicación; la suite aislada no requiere credenciales reales.

Para identificar la copia de reglas examinada, sin revelar credenciales:

- SHA-256 de `firestore.rules`: `2a43c79e8c500b81423f39c85d8c5a96eec88b8bacb0fdee034270c3ee521d65`.
- SHA-256 de `database.rules.json`: `2b6a2f7175c2d8f71466d24b4224c090e5904d921224d3f3eaf2226299fb55d1`.

## Orden propuesto para las siguientes entregas

1. Contener S-01 y S-02; contrastar reglas desplegadas y contener S-05/S-06/S-07 si coinciden; revisar S-03. Pruebas negativas de permisos antes de publicar.
2. Actualizar dependencias vulnerables, corregir lint y recuperar las puertas de calidad de la línea base. Verificar compatibilidad con Firebase y pagos.
3. Optimizar las imágenes efectivamente servidas, unificar fuentes y corregir estrategia de caché. Después, revisar originales sin consumidores.
4. Resolver Q-01 y paginar listados; luego optimizar catálogo y métricas según tráfico medido. Mantener compatibilidad con Flutter/ESP32.
5. Validación dinámica en entorno de pruebas: mediciones de red/LCP/CLS/INP en móvil, caché fría/caliente, consultas por flujo y pruebas con dos instituciones. Comparar con producción mediante lecturas autorizadas.

La auditoría estática inicial queda documentada. Quedan pendientes la verificación del despliegue, reglas publicadas, IAM/Storage/App Check/TTL, mediciones de navegador y costos reales. No se inspeccionaron valores de `.env.local`, no se hicieron compras, escrituras remotas, despliegues, push ni merge.
