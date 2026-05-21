# Bug Tracking Log

Last updated: 2026-05-20

Use the checkboxes to track what is fixed. Keep new findings here so future work can restart quickly.

## Done

- [x] BUG-001: Static lands routes were shadowed by `GET /api/lands/:id`.
  - Impact: requests such as `GET /api/lands/camps`, `GET /api/lands/landmaps`, and `GET /api/lands/mapping` could be parsed as `id = "camps"` / `"landmaps"` / `"mapping"` and fail with `ParseIntPipe` before reaching the intended handler.
  - Evidence: `backend/src/modules/lands/lands.controller.ts` had `@Get(':id')` before static sub-routes.
  - Fix: moved `@Get(':id')`, `@Put(':id')`, and `@Delete(':id')` after all static `/lands/...` routes.
  - Verify: `npm run build --workspace=backend`.

- [x] BUG-008: Weather navigation highlighted two sidebar items.
  - Impact: when visiting `/lands/weather`, both `พื้นที่เพาะปลูก` and `ข้อมูลสภาพอากาศ` appeared active because `/lands/weather` starts with `/lands`.
  - Evidence: `frontend/src/components/layout/Sidebar.tsx` used broad `startsWith(item.path)` matching.
  - Fix: sidebar now chooses the longest matching route, so `/lands/weather` wins over `/lands`. Mobile nav links also use exact matching with `end`.
  - Verify: frontend build still blocked by existing BUG-004 TypeScript errors.

- [x] BUG-010: Geo page did not show the full database reference chain.
  - Impact: the page queried subdistricts but did not render the subdistrict table, and provinces showed raw `geography_id` instead of a geography/region name.
  - Evidence: `frontend/src/features/geo/GeoPage.tsx` had `sLoading` and `subdistrictColumns` unused.
  - Fix: added geography filter from `/api/geo/geographies`, rendered region names in the province table, and added the subdistrict table.
  - Verify: Geo page errors are gone from the latest frontend build output; build is still blocked by other BUG-004 files.

- [x] BUG-011: Geo page hid API/database loading failures.
  - Impact: when PostgreSQL/API calls failed, the Geo page could look like it simply had no province/district/subdistrict data.
  - Evidence: Geo React Query calls did not render their `error` state.
  - Fix: `frontend/src/features/geo/GeoPage.tsx` now shows a visible PostgreSQL/API error banner when any Geo query fails.
  - Verify: Geo page still has no TypeScript errors in the latest frontend build output; build is blocked by other BUG-004 files.

## Open

- [ ] BUG-002: PostgreSQL insert can fail for geo tables because primary keys have no Prisma default.
  - Impact: `POST /api/geo/provinces`, `POST /api/geo/districts`, and `POST /api/geo/subdistricts` create records without sending `provinces_id`, `districts_id`, or `subdistricts_id`, but Prisma schema marks those IDs as required without `@default(autoincrement())`.
  - Evidence: `backend/src/prisma/schema.prisma:20`, `:30`, `:39`; create calls in `backend/src/modules/geo/geo.service.ts:34`, `:46`, `:54`.
  - PostgreSQL check: `information_schema.columns` reports `column_default = null` and `is_identity = NO` for all three ID columns.
  - Next: if these are fixed government codes, require the ID in the DTO/UI before insert. If the app should create arbitrary geo rows, add database sequences/identity defaults first, then update Prisma.

- [ ] BUG-003: API bodies are passed as `any`, so numeric fields from forms may reach Prisma as strings.
  - Impact: PostgreSQL/Prisma inserts can fail with type errors for fields like `factory_id`, `service_area_id`, `land_camp_id`, latitude/longitude, and activity quantities when HTML form values are submitted as strings.
  - Evidence: controllers use `@Body() b: any` across farmers, lands, activities, infra, users, and weather.
  - Next: add DTOs with `class-transformer` conversions or service-side normalizers before Prisma writes.

- [ ] BUG-004: Frontend build currently fails.
  - Impact: production frontend cannot be built.
  - Evidence: `npm run build --workspace=frontend` fails with unused variables/imports and typed action callback mismatches, especially in `Toast.tsx`, `DashboardPage.tsx`, `EmissionFactorsPage.tsx`, `InfraPage.tsx`, and `UsersPage.tsx`.
  - Next: remove unused values, fix `InfraPage` action callback types, then rebuild.

- [ ] BUG-005: Infrastructure delete URLs/IDs are wrong for some resource types.
  - Impact: delete actions can call invalid paths such as `/api/infra/service_areas/:id`; department delete may send an undefined ID because the real key is `departments_id`, not `department_id`.
  - Evidence: `frontend/src/features/infra/InfraPage.tsx:26`, `:48`.
  - Next: map modal targets to explicit endpoint paths and ID fields.

- [ ] BUG-006: Add/edit modal save buttons are visual only in some pages.
  - Impact: user clicks "บันทึก" but no insert/update request is sent, which can look like PostgreSQL cannot insert.
  - Evidence: infrastructure modal save button at `frontend/src/features/infra/InfraPage.tsx:114`; weather manual save button at `frontend/src/features/weather/WeatherPage.tsx:161`.
  - Next: wire forms to `post`/`put` mutations and invalidate the related TanStack Query keys.

- [ ] BUG-007: CO2e calculation result is logged but not persisted.
  - Impact: activity detail insert succeeds, calculation status changes to done/error, but calculated CO2e values are not stored for analytics.
  - Evidence: `backend/src/modules/activities/activities.service.ts` only updates `log_act_detail_calStatus_id`; schema also has no CO2e result columns on `log_activities_detail`.
  - Next: confirm intended schema table/columns for calculation outputs, then persist result or update analytics to calculate on read.

- [ ] BUG-009: Backend cannot authenticate to PostgreSQL with current `.env`.
  - Impact: Geo API endpoints cannot read `geographies`, `provinces`, `districts`, or `subdistricts` until the database credentials are corrected.
  - Evidence: Prisma connection check from `backend` failed with `Authentication failed against database server at localhost`. Re-tested on 2026-05-20 with the same result.
  - Next: update `backend/.env` with a valid PostgreSQL `DATABASE_URL`, then re-run `npm run prisma:generate --workspace=backend` and test `GET /api/geo/provinces`.

## Verification Notes

- `npm run build --workspace=backend`: passed after BUG-001 fix.
- `npm run prisma:generate --workspace=backend`: passed.
- `npm run build --workspace=frontend`: failed; see BUG-004.
- PostgreSQL metadata confirmed BUG-002 for the live database configured by `backend/.env`.
- PostgreSQL authentication currently fails with the current `backend/.env`; see BUG-009.
