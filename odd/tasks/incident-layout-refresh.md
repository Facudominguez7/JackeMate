# Incident layout refresh

Objective: Reorganize the incident listing around the supplied mobile reference while preserving existing badge color semantics. Scope: `/reportes` presentation, shared top header, bottom navigation, and incident cards; no data, filtering, auth, or badge palette changes. Verification: lint, TypeScript/build checks, and a focused browser/UI smoke check when available.

## Specs

- S1. User request (verbatim): "C:\\Users\\octid\\AppData\\Local\\Temp\\gpFmei8D\\pi-clipboard-6b80abcc-cdec-4768-8a76-f78de87d0fb3.png fijate esta imagen, necesito hacer algo mas parecido a esto, osea el layout ahi, fijate, despues todo en una caja circular, junto con su titulo, despues abajo todos los incidentes, despues tambien cambia el navbar, etc mejoralo. Tenes skills de diseño y demas, revisa bg y todo eso para que quede bien. Tema de colores de badges no cambies, esos mantene los q venimos usando nomas, solo fijate la estructura de como organiza todo en la imagen, el header finito arriba con el logo etc."
- S2. The incident page should have a thin branded header, a rounded elevated content surface, a prominent circular location icon beside the title, status tabs below the intro, and the incident list beneath those controls.
- S3. Existing badge color variants and their meaning remain unchanged.
- S4. The redesign must remain responsive and preserve existing links, filtering behavior, pagination, auth-aware navigation, and accessibility labels.
- S5. Keep the change visual-only: do not change database queries, report data mapping, or auth/security behavior.
- S6. User follow-up (verbatim): "Al lado del logo de reporty, en la esquina arriba derecha, un boton que diga algo de como usar? y que al presionarla se habra un modal que explique facil de entender el uso, fijate el modal ese que aparece solo una vez al primer inicio de la web, por sobre el mapa, ese estilo, explicando la idea del sitio"
- S7. User follow-up (verbatim): "El listado que se muestra en cuenta del usuario, osea cada card de los reportes, deben ser mismo estilo de los que se ven en reportes, no son componentes reutilizables?"
- S8. User follow-up (verbatim): "Al navbar de abajo, hacelo mas finito, breve, osea en altura me refiero"
- S9. User follow-up (verbatim): "Hya un problema, al desplegar algun filtro ya sea en reportes por ejemplo, el navbar de abajo, se posiciona por encima tambien y el boton de confirmar filtros no puedo apretarlo, revisa eso"
- S10. User follow-up (verbatim): "ahora si. En la pantalla de crear, osea reportes/nuevo, el fondo ese de mapa minimalista sigue mal en pc, pasa que en esa pantalla el contenedor de crear reporte no esta pegado al borde por eso creo"
- S11. User follow-up (verbatim): "En pc me gustaria que los contenedores principales de cada page, se vean asi como se veian en crear en pc, solo que el bg del mapa minimalista en ese caso habria que arreglarlo, ya que solo ocupa ese ancho chico del layout/header, Solo en pc estoy diciendo, osea en pc cada contenedor principal no ocupa full todo el ancho, por eso se logra ver parte del bg atras, en el caso del bg del mapa, habria q hacer q ocupe toda la pantalla o nose"
- S12. User follow-up (verbatim): "Al entrar a la vista de un reporte, el boton ese de back, osea que vuelve atras me gustaria que pase a la izquierda del logo ese del header de reporty, misma altura q el de como usar pero a la izquierda"
- S13. User follow-up (verbatim): "los bordes que te dije tanto arriba y abajo para iphone esos que te habia dicho, ceo mejor conviene dejarlos blanco, o si es posible el de abajo del buscador de ios en negro y el de arriba, donde sta la camara frontal blanco"

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1-S5 | inline | done | Added atmospheric background, rounded report shell, intro hierarchy, and incident list container |
| T2 | S1-S4 | inline | done | Refined thin branded header and rounded fixed navigation; route behavior preserved |
| T3 | S1-S4 | inline | done | Restyled compact incident rows; existing badge variants/colors preserved |
| T4 | S1-S5 | inline | done | Focused ESLint, TypeScript, production build, and diff checks passed |
| T5 | S6 | inline | done | Added persistent header trigger and onboarding-style explanatory dialog; focused ESLint and diff checks passed |
| T6 | S7 | inline | done | Reused `incident-list`, `ReportCompactCard`, and category data in the account report list |
| T7 | S8 | inline | done | Reduced navbar height to 4rem and synchronized reserved content space; focused checks passed |
| T8 | S9 | inline | done | Uses explicit drawer z-[70] plus Vaul visibility-based navbar hiding; focused checks passed |
| T9 | S10 | inline | done | Removed the create-report-only max width from page and loading skeleton so the shared container reaches desktop edges |
| T10 | S11 | inline | dropped | User withdrew the desktop-wide container/background adjustment; reverted without changing prior layout behavior |
| T11 | S12 | inline | done | Added the report-detail back action to the shared header and removed the duplicate title-level action; focused checks passed |
| T12 | S13 | inline | done | Set the mobile safe-area top to white and bottom indicator area to black; diff check passed |

## Log

- L1 (2026-10-20, user): "C:\\Users\\octid\\AppData\\Local\\Temp\\gpFmei8D\\pi-clipboard-6b80abcc-cdec-4768-8a76-f78de87d0fb3.png fijate esta imagen, necesito hacer algo mas parecido a esto, osea el layout ahi, fijate, despues todo en una caja circular, junto con su titulo, despues abajo todos los incidentes, despues tambien cambia el navbar, etc mejoralo. Tenes skills de diseño y demas, revisa bg y todo eso para que quede bien. Tema de colores de badges no cambies, esos mantene los q venimos usando nomas, solo fijate la estructura de como organiza todo en la imagen, el header finito arriba con el logo etc."
- L2: Reference inspected. Direction: soft civic-app shell with atmospheric city header, compact dark/green brand accents, a rounded white report surface, and stacked report rows. Badge color tokens stay as-is.
- L3: Implemented the visual-only refresh across the report shell, compact cards, and shared header/nav. The first parallel tsc attempt raced with Next build generation and failed on missing `.next/types`; rerunning after the successful build passed.
- L4: User requested a persistent header “Cómo usar” action that opens the same clear step-based modal style as the first-visit onboarding, without changing the one-time onboarding behavior.
- L5: Added `components/how-to-use-dialog.tsx` and mounted it beside the logo in the shared header.
- L6: The account report list already reused `ReportCompactCard`; aligned its grid to `incident-list` and passed the existing category field so the rendered cards match `/reportes`.
- L7: User requested a shorter bottom navbar; reduced its visual height and matching reserved layout space while preserving its five actions.
- L8: Filter drawers use explicit z-[70] layers, and the fixed navbar is hidden while Vaul reports a visible drawer so it cannot cover or intercept any filter footer.
- L9: The create-report page and its loading skeleton had an extra `max-w-5xl` constraint unlike the shared pages; removing it lets the rounded container reach the desktop edges and keeps the map background from showing as side gutters.
- L10: Desktop now restores a shared 64rem page-container width and moves the pastel map to a fixed body background, while mobile/tablet behavior remains unchanged.
- L11: User withdrew S11; removed the desktop-only width and body-background overrides.
- L12: Report detail now detects `/reportes/<id>` in the shared header, rendering the existing BackButton left of the logo; the duplicate PageTitleBar control was removed.
- L13: Set the safe-area top inset to white and added a black bottom inset pseudo-element to the fixed navigation; zero-height safe areas remain unchanged.
