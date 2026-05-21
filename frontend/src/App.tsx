import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { GeoPage }              from '@/features/geo/GeoPage'
import { InfraPage }            from '@/features/infra/InfraPage'
import { UsersPage }            from '@/features/users/UsersPage'
import { FarmersPage }          from '@/features/farmers/FarmersPage'
import { LandsPage }            from '@/features/lands/LandsPage'
import { WeatherPage }          from '@/features/weather/WeatherPage'
import { EmissionFactorsPage }  from '@/features/emission-factors/EmissionFactorsPage'
import { ActivitiesPage }       from '@/features/activities/ActivitiesPage'
import { DashboardPage }        from '@/features/dashboard/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"         element={<DashboardPage />} />
        <Route path="geo"               element={<GeoPage />} />
        <Route path="infra"             element={<InfraPage />} />
        <Route path="users"             element={<UsersPage />} />
        <Route path="farmers"           element={<FarmersPage />} />
        <Route path="lands"             element={<LandsPage />} />
        <Route path="lands/weather"     element={<WeatherPage />} />
        <Route path="emission-factors"  element={<EmissionFactorsPage />} />
        <Route path="activities"        element={<ActivitiesPage />} />
        <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
