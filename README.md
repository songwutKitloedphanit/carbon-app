# 🌿 Carbon Footprint Management & Traceability System
### อุตสาหกรรมอ้อย — Schema v1.3

Full-stack web application สำหรับจัดการและตรวจสอบย้อนกลับ Carbon Footprint  
รองรับ Desktop (sidebar) และ Mobile (bottom nav)

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS + Shadcn UI |
| State    | TanStack Query v5 |
| Backend  | NestJS -> is api + TypeScript |
| ORM      | Prisma 5 |
| Database | PostgreSQL |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

### 2. Clone & Install
```bash
git clone <repo>
cd carbon-app

# Install all workspaces
cd nameProject (folder)
npm install --workspaces
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb managementDataSystem_forCalculate

# Run the original SQL schema (do NOT modify)
psql -d managementDataSystem_forCalculate -f path/to/managementDataSystem_forCalculate_1.3_05192026_postgres.sql
```

#### Aiven PostgreSQL Setup
1. Go to https://console.aiven.io and create a PostgreSQL service.
2. Open the service overview and copy the **Service URI**.
3. In `backend/.env`, set `DATABASE_URL` to the Aiven URI with `schema=public` added:
```bash
DATABASE_URL="postgresql://avnadmin:<password>@<host>:<port>/defaultdb?sslmode=require&schema=public"
```
4. Import the original SQL schema into Aiven:
```bash
psql "postgresql://avnadmin:<password>@<host>:<port>/defaultdb?sslmode=require" -f managementDataSystem_forCalculate_1.3_05192026_postgres.sql
```
5. Share the same Aiven `DATABASE_URL` privately with your teammate. Do not commit `backend/.env`.



### 4. Backend Config
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection
```

### 5. Prisma Sync
```bash
cd backend
npm run prisma:generate     # generate Prisma client from schema
# OR if you want Prisma to introspect the existing DB:
npm run prisma:introspect   # pulls schema from live DB
```

### 6. Run Development Servers
```bash
# From root — runs both frontend and backend
npm run dev

# OR separately:
cd backend  && npm run start:dev   # http://localhost:3000
cd frontend && npm run dev          # http://localhost:5173
```

### 7. API Docs (Swagger)
```
http://localhost:3000/api/docs
```

---

## 📁 Project Structure

```
carbon-app/
├── frontend/                  # Vite + React + TypeScript
│   └── src/
│       ├── features/          # Feature-by-folder
│       │   ├── geo/           # M2.1 Geography
│       │   ├── infra/         # M2.2 Factories / Service Areas
│       │   ├── users/         # M2.3 Users
│       │   ├── farmers/       # M2.4 Farmers
│       │   ├── lands/         # M2.5 Lands, Camps, Landmaps
│       │   ├── weather/       # M2.5 Weather Station + CSV Import
│       │   ├── emission-factors/ # M2.6 EF / GWP / Units
│       │   ├── activities/    # M2.7 Activity Logging + CO2e Engine
│       │   └── dashboard/     # GHG Analytics Dashboard
│       ├── components/
│       │   ├── layout/        # Sidebar, Topbar, MobileNav
│       │   └── ui/            # DataTable, ConfirmDialog, CsvMappingWizard, Toast
│       └── lib/               # API client (axios), queryClient
│
├── backend/                   # NestJS + Prisma
│   └── src/
│       ├── modules/
│       │   ├── prisma/        # PrismaService (global)
│       │   ├── geo/           # provinces, districts, subdistricts
│       │   ├── infra/         # factories, service_areas, departments
│       │   ├── users/         # users, roles
│       │   ├── farmers/       # farmers
│       │   ├── lands/         # lands, camps, landmaps, mapping
│       │   ├── weather/       # lands_weatherStationRec + CSV import
│       │   ├── emission-factors/ # EF, GWP, CF types, units
│       │   ├── activities/    # headers, log details, CO2e engine, CSV import
│       │   └── analytics/     # GHG aggregations by camp/activity/land
│       └── prisma/
│           └── schema.prisma  # Full Prisma schema (v1.3)
│
└── shared/                    # Shared TypeScript types / DTOs
```

---

## 🧮 CO2e Calculation Formula

```
CO₂e = volumeAll × EF_CO₂ × GWP_CO₂
     + volumeAll × EF_CH₄ × GWP_CH₄
     + volumeAll × EF_N₂O × GWP_N₂O
```

- **Standard mode**: ใช้ค่าเต็ม
- **T-VER mode**: ปรับด้วย baseline deduction factor (-15% placeholder)

---

## 📊 CSV/Excel Import Format

### Activity Import (ตาม xlsx จริง)
| Column | Maps to |
|--------|---------|
| กิจกรรม | activities_header_type.name_th |
| ไร่ (camp) | lands_camps.land_camp_name |
| แปลง | lands.land_code |
| รายการปัจจัยการผลิต | activities_fertilizers / equipments / chemiscals |
| ปริมาณ | log_act_detail_quatity |
| ปริมาณ/หน่วย | log_act_detail_volumePerUnit |
| ปริมาณใช้รวม | log_act_detail_volumeAll |
| ประเภทปัจจัย | resource_used_type |
| หน่วยนับ Farmpro | units |
| ประเภทอ้อย | activities_header_typeSugarCane |

### Weather Import
| Column | Maps to |
|--------|---------|
| Station/Camp | land_camp_id (resolve by name) |
| Temperature | land_weatherStationRec_airTemperature |
| Humidity | land_weatherStationRec_relativeHumidity |
| Rainfall | land_weatherStationRec_rainfall |
| Wind Speed | land_weatherStationRec_windSP |
| Solar/UV | land_weatherStationRec_solarRadiation_UV |
| Soil | land_weatherStationRec_soilMoisture_soilTemp |
| Dew Point | land_weatherStationRec_dewPoint |
| ET | land_weatherStationRec_evapotranspiration |

---

## 📡 API Endpoints

| Module | Base Path |
|--------|-----------|
| Geography | `GET/POST/PUT/DELETE /api/geo/provinces` |
| Infra | `/api/infra/factories`, `/api/infra/service-areas` |
| Users | `/api/users`, `/api/users/roles` |
| Farmers | `/api/farmers` |
| Lands | `/api/lands`, `/api/lands/camps`, `/api/lands/landmaps` |
| Weather | `/api/lands/weather`, `POST /api/lands/weather/import` |
| EF / GWP | `/api/emission-factors/coefficients`, `/api/emission-factors/gwp` |
| Activities | `/api/activities/headers`, `/api/activities/details` |
| Import | `POST /api/activities/import` |
| CO2e Preview | `POST /api/activities/calculate` |
| Analytics | `/api/analytics/by-camp`, `/api/analytics/by-activity` |
| Docs | `GET /api/docs` |

---

## ⚠️ Important Notes

1. **ห้ามแก้ไข SQL schema** — `managementDataSystem_forCalculate_1.3_05192026_postgres.sql` ใช้เป็น source of truth
2. Prisma schema ใน `/backend/src/prisma/schema.prisma` สะท้อน SQL schema ทุก table / FK ครบถ้วน
3. `lands_weatherStationRec_create_at` — ตาราง weather ไม่มี field นี้ใน schema v1.3 ดังนั้น import ไม่ set timestamp ให้ row นั้น
4. CO2e engine ต้องการข้อมูลใน `coefficients_emissions_factors` และ `coefficients_emissions_factors_gwp` ก่อนจึงจะคำนวณได้

---

*Built for research-grade sugarcane carbon footprint management — v1.3.0*
