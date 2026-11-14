# Mejoras web con preservación de la integración móvil

Fecha: 11 de noviembre de 2026 (America/Bogota). Rama: `codex/auditoria-recursos-peticiones-seguridad`. Base de comparación: `2fbef506167a6fb82efe4bc0accb0ba5b45216bf`.

Se implementó la parte de la [auditoría inicial](../2026-11-10/README.md) que puede resolverse en presentación, recursos estáticos y herramientas de la web. Se conservaron las consultas, rutas API y sus payloads, modelos, servicios de datos, autenticación, SDKs de Firebase y reglas locales. No se hicieron compras, escrituras remotas, despliegues, push ni merge.

## Cambios aplicados

### Imágenes: menos transferencia conservando originales

Se generaron variantes WebP de contacto y software a 480, 768, 1280 y 1600 píxeles, y un derivado del fondo de acceso. Las páginas usan `srcSet` y `sizes`, dimensiones explícitas y decodificación asíncrona; no necesitan transformar imágenes en cada solicitud. El fondo conserva su encuadre y superposición existentes.

| Imagen | Original, bytes | Variante mayor, bytes | Reducción |
| --- | ---: | ---: | ---: |
| Contacto | 7.359.136 | 58.234 | 99,21 % |
| Software | 6.794.924 | 90.062 | 98,67 % |
| Fondo de acceso | 987.357 | 84.388 | 91,45 % |

Los porcentajes comparan archivos de imagen, no tiempos de carga de páginas completas. En Chrome a 390 px y DPR 1 se eligieron las variantes de 480 px; a 1440 px, las de 768 px. La elección puede cambiar con la densidad de pantalla. El detalle está en [imagenes.json](imagenes.json) y [navegador.json](navegador.json).

Los **118 archivos originales** conservan ruta y hash SHA-256. No se borraron videos originales, fondos ni recursos sin referencia, porque podrían tener consumidores móviles o enlaces externos. Al mantener los originales y añadir 9 derivados, `public` pasa a 127 archivos y 109.280.973 bytes: esta entrega reduce lo que solicita la web, no el tamaño del checkout. Los derivados nuevos suman 427.684 bytes.

Generación reproducible: `npm run assets:optimize`. Se usa Sharp **0.35.5**, fijado como herramienta de desarrollo. El manifiesto se guarda en [web-assets.ts](../../../src/generated/web-assets.ts); los nombres incluyen un hash de su contenido. Al regenerar, los archivos anteriores se conservan para no romper URLs en caché.

### Fuentes y caché

- Se retiró el `@import` de Google Fonts de `landing.css`. Inter y Outfit se cargan mediante `next/font`, conservando las familias y pesos variables. El navegador recibe las fuentes desde el propio sitio; Outfit no añade un preload global. Este comportamiento coincide con la [documentación de Next](https://nextjs.org/docs/app/api-reference/components/font).
- Las URLs estables de `/assets/*` ahora usan `public, max-age=0, must-revalidate`.
- Los derivados con hash de `/assets/optimized/*` usan `public, max-age=31536000, immutable`.
- Se comprobaron ambas cabeceras por HTTP en el servidor local de producción. La política de APIs se conservó. El hosting puede añadir sus propias cabeceras; la comprobación del despliegue queda pendiente. Cambiar la política no elimina entradas que visitantes ya hayan guardado con la política antigua.

### Corrección de presentación en móvil

La verificación a 390 px detectó 12 px de desbordamiento horizontal por gutters de Bootstrap mayores al padding del contenedor. Se ajustaron únicamente clases de espaciado en contacto, acerca y el pie de página: gutters menores antes de `lg`, conservando los de escritorio. Las seis verificaciones finales tienen **0 px de desbordamiento horizontal**, sin imágenes fuera del viewport. No se cambiaron campos, eventos ni envíos de formularios.

### Framework y herramientas de calidad

- Next: **16.2.4 → 16.4.6**; Sharp: **0.34.5 → 0.35.5**. Next y Sharp ya no aparecen afectados en la auditoría npm final. Next regeneró `next-env.d.ts` con su referencia a tipos de parámetros raíz.
- `npm run lint` ejecuta ESLint en lugar del comando retirado `next lint`, siguiendo la [configuración oficial de Next](https://nextjs.org/docs/app/api-reference/config/eslint).
- La configuración nueva detectó **97 errores previos** en archivos que eran idénticos a la base. Se registraron mediante las [supresiones por archivo/regla de ESLint](https://eslint.org/docs/latest/use/suppressions), sin desactivar esas reglas globalmente ni corregir lógica fuera de alcance. Evidencia: [lint-linea-base.json](lint-linea-base.json) y [eslint-suppressions.json](../../../eslint-suppressions.json). Una nueva infracción por encima de esos conteos vuelve a fallar. Estos errores siguen pendientes: no se presentan como corregidos.
- Resultado de lint: **0 errores nuevos y 37 advertencias**. Las advertencias incluyen uso de imágenes nativas; en las dos imágenes intervenidas se eligieron variantes estáticas ya optimizadas con `srcSet`.
- Se usa ESLint 9 por los peer dependencies de los plugins actuales de Next/React. npm advierte que esa rama ya no tiene soporte; la migración de herramientas a ESLint 10 queda pendiente de compatibilidad de dichos plugins. No afecta a la ejecución de producción.
- El override de Minimatch 11 queda limitado a `@typescript-eslint/typescript-estree` para evitar introducir el aviso de su versión 10. Se comprobó la ejecución de lint con esa resolución.

## Preservación de la integración móvil

`npm run check:compatibility` compara esta entrega con la base de la auditoría. Comprueba:

1. Ausencia de cambios en rutas API, librerías/servicios de datos, hooks de datos, modelos, tipos compartidos, stores, features y proxy.
2. Versiones e integridad de **221 paquetes de la cadena Firebase/Firebase Admin**, incluyendo transitivas. Para conservar las dependencias compartidas anteriores, las herramientas web resuelven por separado sus versiones más nuevas cuando las necesitan. El lockfile final se validó con `npm ci`.
3. Los **118 recursos públicos originales** y sus hashes.
4. Los rangos de dependencias de producción anteriores, salvo Next, que se actualizó explícitamente.

Resultado: [compatibilidad.json](compatibilidad.json). Esto demuestra preservación de código y dependencias; no sustituye una prueba end-to-end desde una instalación real de la app móvil.

## Verificación realizada

| Comprobación | Resultado |
| --- | --- |
| Instalación limpia del lockfile | `npm ci --ignore-scripts --no-audit --no-fund`: correcta |
| Pruebas existentes | **12 archivos, 81 pruebas aprobadas**, antes y después de los cambios |
| Compilación de producción | Correcta, incluyendo TypeScript y prerenderizado |
| ESLint | 0 errores nuevos, 37 advertencias; 97 errores heredados registrados |
| Preservación | 221 paquetes Firebase y 118 archivos originales preservados; ningún cambio en los límites de datos protegidos |
| Navegador | Chrome: `/contacto`, `/acerca` y `/login`, en 390 × 844 y 1440 × 1000 |
| Recursos y fuentes | Imágenes decodificadas; selección de variante comprobada; fuentes locales; sin errores de JavaScript en las seis visitas |
| Layout | 0 px de desbordamiento horizontal en las seis visitas |
| Caché HTTP local | Revalidación de URL estable y caché anual de derivado con hash comprobadas |

Las sesiones del navegador eran nuevas y las llamadas externas estaban bloqueadas, sin enviar formularios ni autenticar usuarios. Se revisaron visualmente imágenes optimizadas y capturas. Evidencia y límites en [navegador.json](navegador.json). No se midieron LCP, CLS o INP de producción ni se probaron pantallas privadas con datos reales.

El build conserva los avisos de Browserslist desactualizado y de dimensiones de un gráfico durante prerenderizado que ya aparecían en la base; no impiden compilar.

Capturas de ejemplo: [contacto móvil](contacto-390.png), [software móvil](acerca-390.png), [acceso de escritorio](login-1440.png).

## Seguridad pendiente por el alcance acordado

El reporte actual completo tiene **26 paquetes afectados**: 1 crítico, 10 altos, 14 moderados y 1 bajo. Con `--omit=dev` son **22**: 1 crítico, 9 altos, 11 moderados y 1 bajo. Evidencia: [npm-audit.json](npm-audit.json) y [npm-audit-produccion.json](npm-audit-produccion.json). Los avisos cambian con el registro; no son conteos de explotaciones confirmadas. Next y Sharp ya no figuran; permanece, entre otros, la entrada crítica transitiva de websocket-driver.

Se conservaron Firebase y su cadena, Zod y las reglas de seguridad. Por ello siguen pendientes las consultas N+1, paginación, métricas agregadas, rate limiting, autorización de cron, desactivación/revocación, memberships y permisos/integridad en reglas. Resolver esos puntos requiere revisar los flujos compartidos con móvil, no solo la presentación web. No se afirma que la auditoría de seguridad esté completamente resuelta.

## Repetir las comprobaciones

Desde la raíz:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run assets:optimize
npm run check:compatibility
npm test
npm run lint
npm run build
```

Para verificar el despliegue, contrastar las cabeceras y variantes de imágenes con la evidencia local y ejecutar las pruebas de integración móvil en un entorno de pruebas antes de publicar cambios relacionados con datos.
