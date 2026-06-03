---
name: modern-dashboard-webapps
description: Build, redesign, or refine modern web applications with dashboard, analytics, admin, CRM, SaaS, BI, monitoring, metrics, reporting, data table, charting, filtering, or operational workflow interfaces. Use when Codex needs to create polished dashboard web apps, improve dashboard UX, choose chart/table layouts, implement responsive analytics screens, or verify professional app-like frontend quality.
---

# Modern Dashboard Web Apps

## Overview

Build usable dashboard applications, not marketing pages. Prioritize dense but calm information architecture, fast scanning, reliable interaction states, credible sample data, and visual QA across desktop and mobile.

For detailed patterns, read `references/dashboard-patterns.md` when the task involves chart choice, responsive layout, app shell design, table behavior, or visual polish.

## Workflow

1. Inspect the existing app before designing. Identify framework, routing, styling system, component library, charting library, icon library, data-fetching approach, and test scripts.
2. Define the dashboard job: who uses it, what decisions they make, which metrics matter, what filters or time windows are expected, and what drilldowns are useful.
3. Design the information architecture around work: app shell, primary navigation, current view title, global actions, filter bar, KPI summary, charts, tables, detail panels, and empty/loading/error states.
4. Implement with existing project patterns first. If starting from a blank project, prefer a small React/Vite app, TypeScript when already present, lucide icons, a proven chart library, and CSS that is explicit enough to survive responsive QA.
5. Use realistic domain data. Keep mock data in a separate module or fixture, include trend deltas and timestamps where relevant, and avoid placeholder content that makes the product feel fake.
6. Verify the dashboard in-browser. Run available lint/type/test/build commands, start the dev server when needed, capture desktop and mobile screenshots, and inspect for overlap, clipped text, broken charts, horizontal scrolling, and unreadable density.

## Dashboard Design Rules

- Start on the actual dashboard or operational view. Do not add a landing page unless the user explicitly asks for one.
- Prefer utilitarian app composition: left/sidebar or top navigation, compact header, toolbar filters, KPI row, chart/table workspace, and contextual side panels.
- Keep cards for repeated metrics, table rows, modals, and framed tools. Do not nest cards inside cards.
- Use icons for common tool actions and buttons, with text only where the command needs clarity.
- Make controls complete: date range, segmented views, search, filters, sort, pagination, tabs, toggles, export/settings actions, loading, empty, and error states when they fit the workflow.
- Favor restrained contrast and a multi-hue system. Avoid one-note palettes dominated by a single color family.
- Keep border radius at 8px or less unless the existing design system says otherwise.
- Use stable dimensions for fixed-format UI like KPI tiles, chart panels, nav items, toolbar controls, table rows, and icon buttons so hover and dynamic content do not shift layout.
- Do not scale font sizes with viewport width. Use clear type hierarchy that fits the component scale.

## Implementation Guidance

- Use the existing component and styling architecture. Add new abstractions only when repeated dashboard pieces share behavior or state, such as filters, KPI cards, chart wrappers, or data tables.
- Prefer semantic data structures for metrics, series, filters, and table columns. Avoid hardcoding chart labels and table cells across unrelated JSX.
- Use proven libraries for charts, tables, date handling, maps, or complex widgets when the app already has one or the requirement is non-trivial.
- Make responsive behavior intentional: desktop can be dense; tablet should preserve comparison; mobile should stack sections, keep controls reachable, and avoid tiny charts.
- Include keyboard and accessibility basics: labels for form controls, aria-labels for icon-only buttons, focus states, sufficient contrast, and table headers.
- Treat charts as interface components: title, time scope, unit, axis clarity, legend behavior, tooltip content, and no misleading scales.

## Quality Bar

Before finishing, verify:

- The first viewport clearly looks like the requested dashboard app.
- Primary metrics, charts, filters, and tables render with realistic content.
- Text stays within containers on common desktop and mobile widths.
- No UI elements overlap or rely on decorative filler to look complete.
- Loading, empty, and error states exist where data can be absent or delayed.
- Build/test/lint commands were run when available, or limitations are reported.
- If a dev server is needed, it is started and the URL is provided.
