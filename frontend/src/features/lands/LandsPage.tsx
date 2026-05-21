import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable, Column } from '@/components/ui/DataTable'
import { get } from '@/lib/api'
import { Layers, Plus, Map, Tent } from 'lucide-react'

interface Land {
  land_id: number; farmer_id: number; land_code: string; name: string
  area_size: number; land_size: number; land_camp_id: number
  village: string; zip_code: string; latitude: number; longitude: number
}
interface LandCamp {
  land_camp_id: number; land_camp_idCode: string; land_camp_name: string
  land_camp_latitude: number; land_camp_longitude: number
}
interface Landmap {
  landmap_id: number; landmap_idCode: string; landmap_area_size: number
  landmap_latitude: number; landmap_longitude: number
}
interface Farmer { farmer_id: number; first_name: string; last_name: string }

type TabKey = 'lands' | 'camps' | 'landmaps'

export function LandsPage() {
  const [tab, setTab]   = useState<TabKey>('lands')
  const [selectedCamp, setSelectedCamp] = useState<number | null>(null)

  const { data: lands    = [], isLoading: lLoad } = useQuery({ queryKey: ['lands'],     queryFn: () => get<Land[]>('/lands') })
  const { data: camps    = [], isLoading: cLoad } = useQuery({ queryKey: ['camps'],     queryFn: () => get<LandCamp[]>('/lands/camps') })
  const { data: landmaps = [], isLoading: mLoad } = useQuery({ queryKey: ['landmaps'],  queryFn: () => get<Landmap[]>('/lands/landmaps') })
  const { data: farmers  = [] }                   = useQuery({ queryKey: ['farmers'],   queryFn: () => get<Farmer[]>('/farmers') })

  const farmerMap = Object.fromEntries(farmers.map(f => [f.farmer_id, `${f.first_name} ${f.last_name}`]))
  const campMap   = Object.fromEntries(camps.map(c => [c.land_camp_id, c.land_camp_name]))

  const filteredLands = selectedCamp ? lands.filter(l => l.land_camp_id === selectedCamp) : lands

  const landColumns: Column<Land>[] = [
    { key: 'land_id',      header: 'ID', width: '60px' },
    { key: 'land_code',    header: 'รหัสแปลง' },
    { key: 'name',         header: 'ชื่อแปลง' },
    { key: 'farmer_id',    header: 'เกษตรกร', render: (r) => farmerMap[r.farmer_id] ?? '—' },
    { key: 'land_camp_id', header: 'แคมป์', render: (r) => <span className="badge-green">{campMap[r.land_camp_id] ?? '—'}</span> },
    { key: 'area_size',    header: 'เนื้อที่ (ไร่)', render: (r) => r.area_size?.toFixed(2) ?? '—' },
    { key: 'village',      header: 'หมู่บ้าน' },
  ]
  const campColumns: Column<LandCamp>[] = [
    { key: 'land_camp_id',     header: 'ID', width: '60px' },
    { key: 'land_camp_idCode', header: 'รหัสแคมป์' },
    { key: 'land_camp_name',   header: 'ชื่อแคมป์' },
    { key: 'land_camp_latitude',  header: 'Lat',  render: (r) => r.land_camp_latitude?.toFixed(6) ?? '—' },
    { key: 'land_camp_longitude', header: 'Lng',  render: (r) => r.land_camp_longitude?.toFixed(6) ?? '—' },
  ]
  const landmapColumns: Column<Landmap>[] = [
    { key: 'landmap_id',       header: 'ID', width: '60px' },
    { key: 'landmap_idCode',   header: 'รหัสโฉนด' },
    { key: 'landmap_area_size',header: 'เนื้อที่', render: (r) => r.landmap_area_size?.toFixed(2) ?? '—' },
    { key: 'landmap_latitude', header: 'Lat', render: (r) => r.landmap_latitude?.toFixed(6) ?? '—' },
  ]

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'lands',    label: `แปลงที่ดิน (${filteredLands.length})`,  icon: <Layers size={14} /> },
    { key: 'camps',    label: `แคมป์ (${camps.length})`,              icon: <Tent size={14} /> },
    { key: 'landmaps', label: `โฉนด (${landmaps.length})`,            icon: <Map size={14} /> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Layers size={20} className="text-primary-600" /> จัดการพื้นที่เพาะปลูก</h1>
          <p className="page-subtitle">แปลงที่ดิน แคมป์เกษตร และโฉนดที่ดิน</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm"><Plus size={13} /> เพิ่มแปลง</button>
        </div>
      </div>

      {/* Camp quick filter */}
      {tab === 'lands' && camps.length > 0 && (
        <div className="card mb-5">
          <p className="text-xs font-medium text-surface-600 mb-2">กรองตามแคมป์</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedCamp(null)} className={`btn btn-sm rounded-full ${!selectedCamp ? 'btn-primary' : 'btn-secondary'}`}>
              ทั้งหมด ({lands.length})
            </button>
            {camps.map(c => (
              <button key={c.land_camp_id} onClick={() => setSelectedCamp(c.land_camp_id)}
                className={`btn btn-sm rounded-full ${selectedCamp === c.land_camp_id ? 'btn-primary' : 'btn-secondary'}`}>
                {c.land_camp_name} ({lands.filter(l => l.land_camp_id === c.land_camp_id).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-card text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'lands' && (
          <DataTable data={filteredLands} columns={landColumns} isLoading={lLoad}
            rowKey={(r) => r.land_id} searchPlaceholder="ค้นหารหัสแปลง, ชื่อ..." />
        )}
        {tab === 'camps' && (
          <DataTable data={camps} columns={campColumns} isLoading={cLoad}
            rowKey={(r) => r.land_camp_id} />
        )}
        {tab === 'landmaps' && (
          <DataTable data={landmaps} columns={landmapColumns} isLoading={mLoad}
            rowKey={(r) => r.landmap_id} />
        )}
      </div>
    </div>
  )
}
