# PosaCalles — Guía para correr en local y flujo de desarrollo

Proyecto Next.js (App Router) con React 19, Tailwind CSS 4, shadcn/ui (Radix) y Leaflet.

## Requisitos

- Node.js 20 LTS recomendado (mínimo 18.18+)
- pnpm 9+ (via Corepack) — opcional

Nota: este repositorio puede tener dependencias con peerDependencies que causen problemas con pnpm en algunas máquinas. Si `pnpm install` no funciona correctamente, usar la alternativa con npm mostrada más abajo.

## Instalación y ejecución en local

1) Instalar dependencias

Opción A — pnpm (recomendado si funciona en tu entorno):

```powershell
pnpm install
```

Opción B — npm (alternativa cuando pnpm falla):

```powershell
npm install --legacy-peer-deps
```

2) Levantar el servidor de desarrollo

Con pnpm:

```powershell
pnpm dev
```

Con npm:

```powershell
npm run dev
```

- URL: http://localhost:3000
- Puerto alternativo: `npm run dev -- -p 3001` (o `pnpm dev -- -p 3001` si usas pnpm)

3) Build y modo producción (opcional)

Con pnpm:

```powershell
pnpm build
pnpm start
```

Con npm:

```powershell
npm run build
npm run start
```

Scripts disponibles (package.json):
- `dev` — desarrollo (`pnpm dev` o `npm run dev`)
- `build` — compilación (`pnpm build` o `npm run build`)
- `start` — producción (`pnpm start` o `npm run start`)
- `lint` — lint de Next (los errores están ignorados en build por configuración)

## Estructura de carpetas

- `app/` — Router de Next.js (RSC)
  - `globals.css` — estilos globales y tema (Tailwind v4)
  - `layout.tsx` — layout raíz
  - `page.tsx` — home
  - `auth/`, `dashboard/`, `mapa/`, `reportes/` — páginas/segmentos de ruta
    - `reportes/[id]/page.tsx` — ruta dinámica de detalle
    - `reportes/nuevo/page.tsx` — creación de reporte
  - `loading.tsx` — pantallas de carga de secciones
- `components/` — componentes de UI y dominio
  - `ui/` — biblioteca shadcn/ui (Radix) ya generada
  - `leaflet-map.tsx`, `map-container.tsx` — mapas con React Leaflet
  - `report-card.tsx`, `activity-item.tsx`, `timeline-item.tsx`, etc. — piezas de interfaz
  - `theme-provider.tsx` — tema/tema oscuro
- `hooks/` — hooks reutilizables (`use-mobile`, `use-toast`)
- `lib/` — utilidades (`utils.ts` con helpers de clases, etc.)
- `public/` — assets estáticos (imágenes usadas en cards y páginas)
- `styles/` — estilos adicionales (`globals.css` opcional/legacy). El proyecto usa `app/globals.css`.
- Archivos de configuración
  - `next.config.mjs` — configuración Next (imágenes sin optimizar, ignora errores de lint/TS en build)
  - `tsconfig.json` — TypeScript (paths con alias `@/*`)
  - `postcss.config.mjs` — PostCSS para Tailwind v4
  - `components.json` — configuración de shadcn/ui

### Alias de importación

- `@/*` apunta a la raíz del repo
- También: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`

## Tecnologías principales

- Next.js 15 (App Router, RSC)
- React 19
- Tailwind CSS 4 (+ `@tailwindcss/postcss`)
- shadcn/ui + Radix
- Leaflet / React Leaflet
- react-hook-form + zod (validación de formularios)

## Flujo de desarrollo recomendado

1) Crear rama de feature
- Ej.: `feat/nueva-pagina-reportes`

2) Correr en local
- `pnpm dev` y abrir http://localhost:3000

3) Agregar páginas y rutas
- Crear un segmento en `app/<ruta>/page.tsx` (usa Server Components por defecto)
- Para rutas dinámicas, usar `[param]` (ver `app/reportes/[id]/page.tsx`)

4) Crear/usar componentes
- Preferir componentes en `components/` y UI en `components/ui/`
- Reutilizar `report-card`, `leaflet-map`, etc. cuando aplique

5) Estilos
- Usar utilidades de Tailwind. Variables de tema ya definidas en `app/globals.css`

6) Formularios y validación
- `react-hook-form` + `@hookform/resolvers/zod` + `zod`

7) Mapas
- Basarse en `components/leaflet-map.tsx`/`map-container.tsx` para integrar mapas (CSR si hace falta)

8) Calidad
- Lint: `pnpm lint`
- Tipado: la build ignora errores por configuración, pero el editor reportará problemas TS

9) Build local
- `pnpm build` para validar que compila

10) Push y PR
- Subir rama y abrir Pull Request

## Rutas principales incluidas

- `/` — landing
- `/auth` — acceso/registro (UI)
- `/dashboard` — panel
- `/mapa` — mapa con Leaflet
- `/reportes` — listado
- `/reportes/nuevo` — alta de reporte
- `/reportes/[id]` — detalle

## Notas y solución de problemas

- pnpm no reconocido: ejecutar `corepack enable; corepack prepare pnpm@latest --activate`
- pnpm falla por peerDependencies: usar `npm install --legacy-peer-deps` como alternativa
- Puerto ocupado: `pnpm dev -- -p 3001` o `npm run dev -- -p 3001`
- Imágenes: `images.unoptimized = true` en `next.config.mjs`, no requiere loader externo en desarrollo
- Windows/PowerShell: los comandos de arriba están pensados para PowerShell 5.1+

---
Hecho con Next.js + Tailwind. Cualquier duda, abrir un issue o comentar en el PR.
