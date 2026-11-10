# Logística

Quien usa la app ve, bajo el menú Logística, los submenús Pedidos por
empacar, Bultos, Rutas de entrega, Manifiesto de carga, Mapa de rutas,
Reparto (chofer), Cola chofer (carga/entrega) y Devoluciones. Queda probado
que la lista de Pedidos por empacar responde.

## Sub-features

La app hace la acción de `pedidos`. Escribe: no. La ficha no lleva línea
`Subject:` con imagen: el catálogo no da un tag para rellenarla.

- `pedidos` responde `GET /pedidos` con status 200.

### Archivos y contratos

- `src/subject.ts` — `define_subject` de `subject-logistica` y sus
  `dependsOn`: `subject-ventas`, `subject-almacen`, `subject-vehiculos`.
- `src/modules/pedidos/pedidos.routes.ts` — `define_crud` del recurso
  `pedidos`; la lista es `GET /pedidos`, permiso
  `subject.logistica.pedidos.read`.

### Mapa

| id | ruta | rol semilla | pasos | esperado | muta | receta |
| --- | --- | --- | --- | --- | --- | --- |
| `subject-logistica.pedidos` | `GET /pedidos` | sin definir (requiere `subject.logistica.pedidos.read`) | pedir la lista | HTTP 200 | no | sin definir |

## How to get to it (user POV)

- Menú Logística → Pedidos por empacar (página `logistica.pedidos`, ruta
  `pedidos`).

## Driving it with arnes

Preconditions:

- Doctor en 0. Si falta `subject-logistica`, la receta sale `omitida`.
- Base QA y rol semilla sin definir: no corre ninguna receta que mute.

- **Abrir.** `GET /pedidos` responde 200.
- **Proof.** `evidence/pedidos/`.

## Gotchas

- Una receta de lectura que escribe sale en fallo aunque la pantalla se vea bien.
- Mutar solo contra una base QA nombrada en esta ficha; hoy no hay ninguna.
- `omitida` no cuenta como probada.
