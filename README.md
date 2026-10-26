# Frontend - Plataforma Analítica de Calidad y Satisfacción

## Descripción del Proyecto

Este es el repositorio del **Frontend** de la plataforma de Inteligencia de Negocios (BI). Su función es consumir la API del backend (FastAPI) para mostrar de forma visual e interactiva los resultados del proceso ETL, el perfilado de datos, los reportes de calidad, los KPIs gerenciales y los análisis predictivos de Machine Learning.

La interfaz está diseñada para que el usuario pueda cargar los datos, ejecutar el pipeline y explorar los resultados a través de 6 módulos principales, sin necesidad de escribir código.

## Tecnologías Utilizadas

* **React (v18+)**: librería principal para la construcción de la interfaz de usuario.
* **Vite**: herramienta de compilación y servidor de desarrollo (más rápido que Create React App).
* **Recharts**: librería para la creación de gráficos interactivos (barras, donas, líneas).
* **Axios**: cliente HTTP para realizar las peticiones a la API del backend.
* **CSS Puro / Módulos**: estilos personalizados para cada componente.

## Estructura del Proyecto

* `src/components/`: contiene los componentes de las 6 ventanas principales de la aplicación.
  * `CargaEtl.jsx`: subida de archivos CSV y ejecución del ETL.
  * `Perfilado.jsx`: diagnóstico visual de los datos crudos.
  * `ResultadoEtl.jsx`: comparador de tickets y tabla de cuarentena.
  * `QualityReport.jsx`: gráficos de calidad antes vs. después.
  * `Dashboard.jsx`: dashboard de KPIs y análisis visual.
  * `MlAnalysis.jsx`: análisis de factores predictivos (Odds Ratios).
* `src/styles/`: archivos CSS para dar formato a cada componente.
* `src/api.js`: configuración de la URL base para las peticiones al backend.
* `src/App.jsx`: componente principal que maneja la navegación por pestañas y el estado global.

## Requisitos Previos

* Tener instalado **Node.js** (v18 o superior).
* Tener el **Backend** corriendo (localmente en `http://localhost:8010` o en el servidor de producción).

## Instalación y Ejecución (Local)

1. Clona este repositorio:

   ```bash
   git clone https://github.com/klever1995/titulacion_frontend.git
   cd titulacion_frontend
   ```

2. Instala las dependencias necesarias:

   ```bash
   npm install
   ```

3. Configura la URL del backend (si es necesario):

   Revisa el archivo `src/api.js`. Por defecto, apunta a la API local (`http://localhost:8010/api/v1`) o a la IP de producción (`http://167.172.159.222/api/v1`).

4. Ejecuta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre tu navegador en la dirección que indique la terminal (normalmente `http://localhost:5173`).

## Módulos de la Interfaz

1. **Carga ETL:** permite subir los 3 archivos CSV (CRM, Tickets y Encuestas) o ejecutar el ETL con los datos de ejemplo. Muestra el progreso del procesamiento.
2. **Perfilado:** muestra tablas y gráficos con los problemas de calidad de los datos crudos (nulos, duplicados, formatos).
3. **Resultado ETL:** presenta el embudo de volumen (crudos vs. limpios), el emparejamiento de clientes, las incidencias en cuarentena y un comparador de tickets (Antes vs. Después).
4. **Calidad:** gráficos comparativos de las 4 dimensiones de calidad (Completitud, Unicidad, Consistencia, Validez) evaluadas antes y después del ETL.
5. **KPIs:** dashboard con 7 indicadores clave (SLA, Tiempo Promedio, Satisfacción, etc.) y 5 gráficos interactivos filtrables por categoría, canal, agente, segmento y fecha.
6. **Factores ML:** visualización de los resultados de la regresión logística (Odds Ratios) para identificar qué factores aumentan o reducen el riesgo de incumplir el SLA.

## Despliegue en Producción

El frontend está preparado para ser compilado y servido como archivos estáticos.

Para generar la versión de producción:

```bash
npm run build
```

Esto generará una carpeta `dist` que contiene el HTML, CSS y JS minificados, listos para ser desplegados en cualquier servidor web o mediante Docker.

## Autor

**Klever Sandro Robalino Guamán**<br>
**Carrera de Ingeniería en Sistemas de Información**<br>
**Universidad Central del Ecuador**
