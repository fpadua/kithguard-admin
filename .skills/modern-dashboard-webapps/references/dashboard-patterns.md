# Dashboard Patterns Reference

Read this when building or polishing dashboard-heavy web apps.

## Information Architecture

Use an app-first structure:

- App shell: sidebar or top nav, product/workspace switcher when relevant, compact account/actions area.
- View header: title, concise status context, primary action, last updated timestamp when useful.
- Filter bar: date range, segment, status, owner/team, search, and reset/apply behavior.
- KPI strip: 3 to 6 metrics with value, unit, comparison delta, sparkline or trend marker, and clear good/bad direction.
- Analysis region: 1 to 3 high-value charts rather than many small decorative charts.
- Operations region: table, queue, list, kanban, map, or detail panel tied to the user's next action.
- Drilldown: side panel or route for entity details, history, notes, alerts, and related metrics.

## Chart Selection

- Time series: line or area charts for trends; grouped bars for period comparisons.
- Composition: stacked bars for comparable totals; donut charts only for very small category counts.
- Ranking: horizontal bars for top/bottom lists.
- Distribution: histogram or box-like summaries when spread matters.
- Relationship: scatter plots for correlation, with tooltips and obvious axes.
- Status overview: compact KPI cards, progress bars, badges, and alert lists.

Avoid charts that do not support the task. A good table with sorting and filters is often better than an ornamental chart.

## Tables

Tables in dashboards should be action-oriented:

- Include search, sort, filtering, pagination or virtual scrolling, row actions, and selected/bulk state when useful.
- Make the first column identify the entity clearly. Use secondary text for IDs, owner, or timestamp.
- Use badges for status and severity, but avoid turning every cell into a badge.
- Align numbers right and keep units consistent.
- Add empty state copy that tells the user what happened and what action is available.
- Preserve columns on desktop; collapse to stacked rows or priority columns on mobile.

## Visual Style

- Use neutral surfaces with controlled accent colors for states and highlights.
- Reserve saturated color for status, selected state, chart series, and primary actions.
- Combine at least one neutral, one accent, and semantic colors for success/warning/danger.
- Keep spacing compact: dashboards should feel organized and scannable, not like marketing sections.
- Use hairline borders, subtle shadows only when elevation matters, and consistent panel padding.
- Avoid large decorative hero areas, floating page-section cards, gradient blobs, and filler illustrations.

## Interaction States

Model the states that real dashboards need:

- Loading: skeletons or stable placeholders that do not shift layout.
- Empty: useful next action, not just "No data".
- Error: retry or diagnostic detail appropriate to the app.
- Stale data: last synced timestamp or refresh affordance.
- Filtered no-results: clear filters action.
- Permission-limited data: explain unavailable regions without breaking layout.

## Responsive QA

Check at least one wide desktop and one mobile viewport:

- Navigation remains reachable and does not cover content.
- Toolbar controls wrap or collapse without clipped labels.
- KPI cards keep values legible.
- Charts have fixed minimum heights and do not become unreadable slivers.
- Tables avoid page-level horizontal scroll unless intentionally using a contained table scroller.
- Modals, side panels, popovers, and menus stay within the viewport.

## Implementation Checklist

- Keep dashboard data definitions close to the feature: metrics, chart series, table columns, filter options, and status mappings.
- Derive formatted display values from typed raw values where possible.
- Centralize color/status mappings so charts, badges, and legends agree.
- Use reusable components for KPI cards, chart panels, toolbar controls, table shells, and empty states when repeated.
- Prefer CSS grid for dashboard regions and flexbox for toolbars.
- Give charts explicit container sizes and test them after data changes.
- Use stable keys, memoization only where useful, and avoid premature state libraries for static mock dashboards.
