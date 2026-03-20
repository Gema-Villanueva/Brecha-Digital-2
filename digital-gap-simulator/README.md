# Digital Gap Simulator

Juego web de simulación por turnos: cargas las comunidades autónomas desde **`public/dataset_maestro_limpio.csv`** (mismas columnas que el dataset del repositorio), repartes un presupuesto en cuatro tipos de política y comparas tu trayectoria con un escenario **sin intervención**.

## Requisitos

- **Node.js** 20+ (recomendado; Vite 8 funciona bien con versiones recientes LTS)
- Dependencias de visualización: **Leaflet** + **react-leaflet** (mapa coroplético), **recharts** (gráfico compacto bajo el mapa).

## Cómo ejecutar en local

```bash
cd digital-gap-simulator
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`).

## Build de producción

```bash
npm run build
npm run preview
```

## Cómo se usan los datos

- El CSV se obtiene con `fetch` y se parsea con **PapaParse** (`src/data/loadRegions.ts`).
- `banda_ancha_pct` → acceso a internet; `renta_media` y `ordenadores_unidad` → niveles normalizados (renta y educación digital); se deriva un acceso a dispositivos y un **índice de pobreza digital** compuesto (heurística del juego, no el modelo ML del notebook).
- La simulación pura vive en `src/game/simulation.ts` (sin React).

## Mapa (GeoJSON)

- Archivo: **`public/geo/ccaa.geojson`** — límites de comunidades autónomas (export GeoJSON del conjunto *georef-spain-comunidad-autonoma* en [OpenDataSoft](https://public.opendatasoft.com/), dominio público / abierto según su catálogo).
- El juego enlaza cada fila del CSV con un polígono mediante códigos INE `acom_code` en [`src/data/ccaaGeoMapping.ts`](src/data/ccaaGeoMapping.ts).
- Ceuta, Melilla y el polígono “Territorio no asociado…” aparecen en el GeoJSON pero **no** tienen fila en el CSV: se muestran en gris neutro.
- El mapa usa **Leaflet** (`src/components/SpainMap.tsx`): capa base CARTO “light” + `GeoJSON` con estilos que se **vuelven a montar** cuando cambian los índices o el borrador, para que los colores siempre coincidan con la simulación.

## Sustituir el dataset

Reemplaza `public/dataset_maestro_limpio.csv` manteniendo las cabeceras:

`comunidad`, `anio`, `banda_ancha_pct`, `renta_media`, `arope_pct`, `paro_pct`, `ordenadores_unidad`

Guarda el archivo en **UTF-8** para que los nombres de comunidades se vean bien.

## Estructura

| Ruta | Rol |
|------|-----|
| `src/data/` | Carga CSV, tipos, normalización |
| `src/game/` | Constantes y motor de simulación |
| `src/components/` | UI (tarjetas, mapa, gráfico, HUD) |
| `src/App.tsx` | Estado de partida y flujo por rondas |
