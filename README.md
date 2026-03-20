# Brecha Digital

Proyecto de investigación sobre la **brecha digital** en las comunidades autónomas de España: recopilación y limpieza de estadísticas oficiales, un dataset unificado a nivel regional y análisis de la relación entre el acceso a internet, indicadores socioeconómicos y modelos de aprendizaje automático.

En la línea del programa **Brecha-Digital**, la idea es apoyar decisiones que optimicen la **entrega de ayudas públicas**: a escala territorial se estima el riesgo de **exclusión digital** y se puede derivar una **prioridad de intervención**. Aquí el territorio de trabajo son las **comunidades autónomas** y los datos son **oficiales (INE y Ministerio de Educación)**, no un entorno de simulación web.

**Idea central:** *territorio → se estima el nivel de riesgo de exclusión digital (p. ej. acceso a internet frente a contexto socioeconómico) → se asigna prioridad de ayuda*.
---

## Contenido del repositorio

| Archivo | Descripción |
|---------|-------------|
| `ultimasmodificaciones_brechasDigitales.ipynb` | Pipeline completo: descarga desde el INE y el Ministerio de Educación, limpieza, visualizaciones, correlaciones, regresión y red neuronal |
| `dataset_maestro_limpio.csv` | Tabla resultante tras unir las fuentes (17 comunidades autónomas, 2021) |
| `digital-gap-simulator/` | **Digital Gap Simulator**: app React + Vite que simula políticas con el CSV (ver su `README.md`) |
| `requirements.txt` | Lista de dependencias de Python para instalación reproducible (`pip install -r requirements.txt`) |
| `mapa_brecha_digital.html` | Mapa coroplético interactivo (Folium → Leaflet + D3): comunidades coloreadas según la brecha digital; **GeoJSON y estilos embebidos** en el HTML; capas y leyenda; requiere **conexión a internet** (CDN y mapas base Carto) |

**Este repositorio incluye `mapa_brecha_digital.html`**, exportado con Folium: visualización en el navegador sin servidor propio, con datos geográficos incrustados en el archivo.

En el **ecosistema completo Brecha-Digital** (otros repositorios o entregas del mismo proyecto) suelen aparecer además, a modo de referencia: un notebook con **datos sintéticos** y coeficientes exportables para un simulador; una app **React + Vite** («Digital Poverty Simulator») con sliders (ingreso, educación, desempleo), nivel de internet, riesgo y prioridad, y sección tipo «Mejora el distrito»; un **`simulator.html`** con mapa de España (p. ej. Leaflet + GeoJSON), regiones coloreadas y nombres visibles, panel con sliders, cartas y progreso global (p. ej. «X de 19 regiones con riesgo bajo»); una **API opcional** (Node.js, Express, CORS) con `POST /predict` y cuerpo `{ income, unemployment, education }` devolviendo `{ internet_access, priority }`; y otros **mapas o scripts Python** asociados a datos del INE. En ese diseño, el front puede calcular la predicción **en el navegador** con la misma fórmula de regresión que el notebook, **sin depender del backend**. En este repositorio están el cuaderno principal, el CSV, el mapa HTML indicado arriba y la carpeta **`digital-gap-simulator/`**. El resto de piezas del ecosistema (otros simuladores, API, etc.) pueden no estar presentes: el núcleo aquí es el análisis con datos reales y el cuaderno indicado en la tabla.

---

## Stack tecnológico

| Parte | Tecnologías (este repositorio) |
|--------|----------------------------------|
| Análisis ML (Jupyter / Colab) | Python 3, **pandas**, **NumPy**, **matplotlib**, **scikit-learn** (`LinearRegression`, `RandomForestRegressor`, `MLPRegressor`, `DecisionTreeClassifier`, `MinMaxScaler`, `train_test_split`, métricas), **joblib** |

| Parte | Tecnologías (referencia, resto del ecosistema Brecha-Digital) |
|--------|----------------------------------------------------------------|
| Simulador web | React 18, Vite 5, CSS sin framework UI; alternativa: un solo HTML + CSS + JS |
| API | Node.js, Express 4, CORS; lógica de predicción en JS alineada con el notebook |
| Otro notebook ML | Datos sintéticos, regresión, árbol de prioridad, red neuronal (p. ej. TensorFlow/Keras en ese cuaderno concreto), visualización y coeficientes para el simulador |

---

## Fuentes de datos

En el cuaderno los datos se obtienen directamente desde las URL oficiales:

- **INE** — acceso a banda ancha en hogares, renta media, indicador AROPE (riesgo de pobreza y exclusión social), tasa de paro.
- **Ministerio de Educación de España** — indicadores de **ordenadores en centros no universitarios** (curso 2020–2021).

El cuaderno documenta el proceso: normalización de nombres de comunidades autónomas, conversión de números en formato español (coma como separador decimal) y fusión de tablas en un solo dataset.

---

## Campos de `dataset_maestro_limpio.csv`

| Columna | Significado |
|---------|-------------|
| `comunidad` | Comunidad autónoma |
| `anio` | Año (en la exportación — 2021) |
| `banda_ancha_pct` | Porcentaje de hogares con conexión de banda ancha |
| `renta_media` | Renta media |
| `arope_pct` | Riesgo de pobreza y exclusión social (%) |
| `paro_pct` | Tasa de paro (%) |
| `ordenadores_unidad` | Indicador de ordenadores en centros (agregado a partir de datos del Ministerio) |

**17** filas (las comunidades autónomas definidas en el código). En el análisis original, algunas comunidades pueden tener valores ausentes (`NaN`) en `ordenadores_unidad` según la fuente educativa.

---

## Metodología (resumen)

1. **Correlaciones** con la variable objetivo — porcentaje de acceso a internet; en el texto del cuaderno se señala que las asociaciones lineales más marcadas corresponden al AROPE (negativa) y a la renta media (positiva); el resto son más débiles.
2. **Normalización** de variables (incluido `MinMaxScaler` para ciertos modelos).
3. **Regresión**: regresión lineal, bosque aleatorio (`RandomForestRegressor`), perceptrón multicapa (`MLPRegressor`) — predicción del acceso a internet a partir de variables socioeconómicas; métricas tipo MAE, MSE, R².
4. **Clasificación** — `DecisionTreeClassifier` para priorizar comunidades (según el planteamiento del cuaderno).

---

## Cómo ejecutarlo

### Google Colab

En la primera celda del cuaderno aparece la insignia **Open in Colab**: permite ejecutar todo el código sin instalación local (se requiere conexión a internet para descargar los CSV del INE y del Ministerio).

### Entorno local

1. Clona o descarga el repositorio e instala **Python 3.10+** (recomendado).
2. **Instala las dependencias** desde la raíz del proyecto:

   ```bash
   pip install -r requirements.txt
   ```

   Equivale a instalar: `pandas`, `numpy`, `matplotlib`, `scikit-learn`, `joblib` y `jupyter` para abrir el cuaderno.

3. **Ejecuta el proyecto:** inicia Jupyter y abre el notebook, o desde la raíz:

   ```bash
   jupyter notebook ultimasmodificaciones_brechasDigitales.ipynb
   ```

   También puedes abrir el archivo `.ipynb` en **VS Code** (extensión Jupyter) y ejecutar las celdas **en orden de arriba abajo**.

4. La primera celda de código instala paquetes con `pip` solo en **Google Colab**; en local suele bastar con el paso 2.

Para trabajar **sin volver a descargar** desde la web, puedes usar la ruta local a `dataset_maestro_limpio.csv` en lugar de reconstruir `df` desde las URL en bruto; si hace falta, añade una celda `pd.read_csv("dataset_maestro_limpio.csv")`.

### Mapa coroplético (`mapa_brecha_digital.html`)

Abre el archivo desde la **raíz del repositorio** en tu navegador (doble clic en el archivo o arrastrarlo a una ventana). Hace falta **conexión a internet** para los CDN (Leaflet, Bootstrap, D3, etc.) y la capa base Carto. Si en GitHub activas **GitHub Pages** (rama `main`, carpeta del sitio en la raíz del repo o en `/docs`), podrás compartir una URL estable al HTML una vez publicado.

### Digital Gap Simulator (React)

En la carpeta [`digital-gap-simulator/`](digital-gap-simulator/README.md): `npm install` y `npm run dev` (Node.js 20+ recomendado). Usa una copia del CSV en `public/` para inicializar la partida.

Desde la **raíz del repositorio** también puedes ejecutar `npm run install:simulator` (primera vez) y luego `npm run dev`: el `package.json` de la raíz reenvía los scripts a `digital-gap-simulator/`.

### Simulador y API (proyecto Brecha-Digital completo)

Si en tu copia del ecosistema existen esas piezas, suelen ejecutarse así:

- **Simulador React:** `cd simulator && npm install && npm run dev`
- **Simulador en un solo HTML:** abrir `simulator.html` en el navegador
- **API Express:** `cd api && npm install && npm start` (puerto **3001** por defecto)

---

## Dependencias

Definidas en **`requirements.txt`**. Resumen:

- `pandas`, `numpy`, `matplotlib`
- `scikit-learn` (regresión, árboles, MLP, métricas, preprocesado)
- `joblib` (serialización de modelos, si se usa en el cuaderno)
- `jupyter` (entorno para ejecutar el `.ipynb` localmente)

---

## Nota sobre la codificación del CSV

Si en el visor o en Excel los nombres de las regiones aparecen como `AndalucÃ­a` en lugar de `Andalucía`, abre el archivo como **UTF-8**. Al guardar nuevas exportaciones conviene indicar explícitamente `encoding="utf-8"`.

---

## Próximos pasos de trabajo

1. **Publicación en dominio:** desplegar el proyecto (por ejemplo el simulador **Digital Gap Simulator** y, si aplica, la documentación o vistas estáticas) en un **dominio propio** o en un servicio de hosting (Vercel, Netlify, GitHub Pages, etc.) para que sea accesible de forma estable y compartible.
2. **Análisis temporal ampliado:** repetir el pipeline del cuaderno con **datos de años posteriores** (actualizando descargas desde el INE y el Ministerio de Educación), regenerar el dataset maestro y comparar evolución de la brecha digital entre ejercicios.

---

## Licencia

Este repositorio no incluye un archivo de licencia; si publicas o reutilizas el trabajo, confirma las condiciones con la persona titular del repositorio.
