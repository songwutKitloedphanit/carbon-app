import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable, Column } from '@/components/ui/DataTable'
import { CsvMappingWizard, TargetColumn, ColumnMapping } from '@/components/ui/CsvMappingWizard'
import { get, post } from '@/lib/api'
import { ActivitySquare, Upload, Plus, Calculator, Zap, Leaf } from 'lucide-react'

interface ActivityHeader {
  activities_header_id: number
  land_id: number
  farmer_id: number
  activities_header_idCode: string
  activities_header_startDate: string
  act_header_type_id: number
  act_header_typeLand_id: number
  act_header_typeSugarCane_id: number
}
interface LogDetail {
  log_act_detail_id: number
  activities_header_id: number
  act_header_type_id: number
  resource_used_type_id: number
  log_act_detail_quatity: number
  log_act_detail_volumePerUnit: number
  log_act_detail_volumeAll: number
  log_act_detail_areawork: number
  log_act_detail_calStatus_id: number
}
interface Land       { land_id: number; land_code: string; name: string }
interface LandCamp   { land_camp_id: number; land_camp_name: string }
interface HeaderType { act_header_type_id: number; act_header_type_name_th: string }
interface ResourceType { resource_used_type_id: number; resc_used_type_name: string }

type CalcMode = 'standard' | 'tver'

// Columns matching actual xlsx: กิจกรรม | ไร่(camp) | แปลง | รายการปัจจัย | ปริมาณ | math | ปริมาณใช้ | ไร่(area) | รวมเป็นเงิน | ประเภทปัจจัย | หน่วยนับ Farmpro | ประเภทใหม่
const ACTIVITY_TARGET_COLUMNS: TargetColumn[] = [
  { key: 'act_header_type',         label: 'กิจกรรม (activity type)',     required: true,  type: 'fk', fkTable: 'activities_header_type' },
  { key: 'land_camp_name',          label: 'ไร่ / แคมป์',                 required: true,  type: 'fk', fkTable: 'lands_camps' },
  { key: 'land_code',               label: 'แปลง (land code)',            required: true,  type: 'fk', fkTable: 'lands' },
  { key: 'resource_item_name',      label: 'รายการปัจจัยการผลิต',         required: true,  type: 'fk', fkTable: 'activities_fertilizers / equipments' },
  { key: 'log_act_detail_quatity',  label: 'ปริมาณ (จำนวน)',             required: false, type: 'number' },
  { key: 'log_act_detail_volumePerUnit', label: 'ปริมาณ/หน่วย',          required: false, type: 'number' },
  { key: 'log_act_detail_volumeAll',label: 'ปริมาณใช้รวม',               required: true,  type: 'number' },
  { key: 'log_act_detail_areawork', label: 'พื้นที่ทำงาน (ไร่)',          required: false, type: 'number' },
  { key: 'resource_used_type',      label: 'ประเภทปัจจัย',               required: true,  type: 'fk', fkTable: 'resource_used_type' },
  { key: 'unit_name',               label: 'หน่วยนับ (Farmpro)',         required: false, type: 'fk', fkTable: 'units' },
  { key: 'sugarcane_type',          label: 'ประเภทอ้อย (typeSugarCane)',  required: false, type: 'fk', fkTable: 'activities_header_typeSugarCane' },
]

export function ActivitiesPage() {
  const qc = useQueryClient()
  const [showWizard, setShowWizard]     = useState(false)
  const [showForm, setShowForm]         = useState(false)
  const [calcMode, setCalcMode]         = useState<CalcMode>('standard')
  const [formPanelOpen, setFormPanelOpen] = useState(false)
  const [selectedHeader, setSelectedHeader] = useState<ActivityHeader | null>(null)
  const [trackMethod, setTrackMethod]   = useState<'direct' | 'cascade'>('cascade')

  const { data: headers  = [], isLoading: hLoad }  = useQuery({ queryKey: ['activity-headers'],  queryFn: () => get<ActivityHeader[]>('/activities/headers') })
  const { data: details  = [], isLoading: dLoad }  = useQuery({ queryKey: ['activity-details'],  queryFn: () => get<LogDetail[]>('/activities/details') })
  const { data: lands    = [] }                    = useQuery({ queryKey: ['lands'],              queryFn: () => get<Land[]>('/lands') })
  const { data: camps    = [] }                    = useQuery({ queryKey: ['camps'],              queryFn: () => get<LandCamp[]>('/lands/camps') })
  const { data: hdrTypes = [] }                    = useQuery({ queryKey: ['header-types'],       queryFn: () => get<HeaderType[]>('/activities/header-types') })
  const { data: resTypes = [] }                    = useQuery({ queryKey: ['resource-types'],     queryFn: () => get<ResourceType[]>('/activities/resource-types') })

  const importMut = useMutation({
    mutationFn: (payload: { mappings: ColumnMapping[]; rows: Record<string, string>[] }) =>
      post('/activities/import', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-headers'] }); setShowWizard(false) },
  })

  const landMap    = Object.fromEntries(lands.map(l => [l.land_id, l.land_code]))
  const hdrTypeMap = Object.fromEntries(hdrTypes.map(t => [t.act_header_type_id, t.act_header_type_name_th]))

  const calStatusBadge = (id: number) => {
    if (id === 1) return <span className="badge-amber">รอคำนวณ</span>
    if (id === 2) return <span className="badge-green">คำนวณแล้ว</span>
    return <span className="badge-red">ผิดพลาด</span>
  }

  const headerCols: Column<ActivityHeader>[] = [
    { key: 'activities_header_id',     header: 'ID', width: '60px' },
    { key: 'activities_header_idCode', header: 'รหัสกิจกรรม' },
    { key: 'land_id',                  header: 'แปลง', render: (r) => <span className="badge-green">{landMap[r.land_id] ?? r.land_id}</span> },
    { key: 'act_header_type_id',       header: 'ประเภทกิจกรรม', render: (r) => hdrTypeMap[r.act_header_type_id] ?? '—' },
    { key: 'activities_header_startDate', header: 'วันที่', render: (r) => r.activities_header_startDate ? new Date(r.activities_header_startDate).toLocaleDateString('th-TH') : '—' },
  ]
  const detailCols: Column<LogDetail>[] = [
    { key: 'log_act_detail_id',         header: 'ID', width: '60px' },
    { key: 'activities_header_id',      header: 'Header', width: '80px' },
    { key: 'log_act_detail_quatity',    header: 'จำนวน', render: (r) => r.log_act_detail_quatity ?? '—' },
    { key: 'log_act_detail_volumePerUnit', header: 'ปริมาณ/หน่วย', render: (r) => r.log_act_detail_volumePerUnit?.toFixed(3) ?? '—' },
    { key: 'log_act_detail_volumeAll',  header: 'ปริมาณรวม', render: (r) => <span className="font-mono">{r.log_act_detail_volumeAll?.toFixed(3)}</span> },
    { key: 'log_act_detail_areawork',   header: 'พื้นที่ (ไร่)', render: (r) => r.log_act_detail_areawork?.toFixed(2) ?? '—' },
    { key: 'log_act_detail_calStatus_id', header: 'สถานะ CO₂e', render: (r) => calStatusBadge(r.log_act_detail_calStatus_id) },
  ]

  // Summary stats
  const doneCount    = details.filter(d => d.log_act_detail_calStatus_id === 2).length
  const pendingCount = details.filter(d => d.log_act_detail_calStatus_id === 1).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><ActivitySquare size={20} className="text-primary-600" /> บันทึกกิจกรรม</h1>
          <p className="page-subtitle">activities_header + log_activities_detail + CO₂e Engine</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowForm(true)}><Plus size={14} /> เพิ่มรายการ</button>
          <button className="btn-primary"   onClick={() => setShowWizard(true)}><Upload size={14} /> นำเข้า xlsx/CSV</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2"><ActivitySquare size={14} className="text-primary-500" /><span className="stat-label">กิจกรรมทั้งหมด</span></div>
          <p className="stat-value">{headers.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2"><Leaf size={14} className="text-primary-500" /><span className="stat-label">รายการ log</span></div>
          <p className="stat-value">{details.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2"><Zap size={14} className="text-primary-500" /><span className="stat-label">คำนวณแล้ว</span></div>
          <p className="stat-value text-primary-700">{doneCount}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2"><Calculator size={14} className="text-accent-500" /><span className="stat-label">รอคำนวณ</span></div>
          <p className="stat-value text-accent-600">{pendingCount}</p>
        </div>
      </div>

      {/* Split panel: table left, detail right when selected */}
      <div className={`flex gap-5 transition-all duration-300 ${formPanelOpen ? 'flex-row' : 'flex-col'}`}>
        <div className={`${formPanelOpen ? 'flex-1 min-w-0' : 'w-full'} card`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Activities Header</h2>
            {selectedHeader && !formPanelOpen && (
              <button className="btn-secondary btn-sm" onClick={() => setFormPanelOpen(true)}>
                <Calculator size={13} /> ดูรายละเอียด CO₂e
              </button>
            )}
          </div>
          <DataTable
            data={headers} columns={headerCols} isLoading={hLoad}
            rowKey={(r) => r.activities_header_id}
            onRowClick={(r) => { setSelectedHeader(r); setFormPanelOpen(true) }}
            searchPlaceholder="ค้นหากิจกรรม..."
          />
        </div>

        {/* Right panel — detail + CO₂e */}
        {formPanelOpen && selectedHeader && (
          <div className="w-full md:w-96 shrink-0 card animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Log Detail — Header #{selectedHeader.activities_header_id}</h3>
              <button className="btn-ghost btn-sm" onClick={() => setFormPanelOpen(false)}>✕</button>
            </div>
            {/* Calc Mode selector */}
            <div className="mb-4">
              <label className="label">โหมดการคำนวณ CO₂e</label>
              <div className="flex gap-2">
                {(['standard', 'tver'] as CalcMode[]).map(m => (
                  <button key={m} onClick={() => setCalcMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${calcMode === m ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-600 border-surface-200'}`}>
                    {m === 'standard' ? 'Standard' : 'T-VER'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-surface-50 rounded-lg p-3">
                <p className="font-medium text-surface-700 mb-1">สูตรคำนวณ ({calcMode.toUpperCase()})</p>
                <p className="font-mono text-[11px] text-primary-700">CO₂e = ปริมาณ × EF × GWP</p>
                {calcMode === 'tver' && <p className="text-surface-500 mt-1">+ T-VER baseline adjustment</p>}
              </div>
              <DataTable
                data={details.filter(d => d.activities_header_id === selectedHeader.activities_header_id)}
                columns={detailCols.slice(2)} isLoading={dLoad}
                rowKey={(r) => r.log_act_detail_id}
                defaultPageSize={10} searchable={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Manual entry modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-card-lg p-6 w-full max-w-xl animate-slide-up">
            <h3 className="font-semibold mb-2">เพิ่มบันทึกกิจกรรม</h3>
            <p className="text-xs text-surface-500 mb-5">กรอกข้อมูลและระบบจะคำนวณ CO₂e โดยอัตโนมัติ</p>

            {/* Track method selector */}
            <div className="mb-4">
              <label className="label">วิธีเลือกแปลง</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setTrackMethod('direct')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${trackMethod === 'direct' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-600 border-surface-200'}`}>
                  ระบุ Land ID โดยตรง
                </button>
                <button onClick={() => setTrackMethod('cascade')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${trackMethod === 'cascade' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-600 border-surface-200'}`}>
                  เลือกจากแคมป์ → แปลง
                </button>
              </div>

              {trackMethod === 'direct' ? (
                <select className="select"><option value="">— เลือกแปลง (land_id) —</option>{lands.map(l => <option key={l.land_id} value={l.land_id}>{l.land_code} — {l.name}</option>)}</select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <select className="select"><option value="">— แคมป์ —</option>{camps.map(c => <option key={c.land_camp_id} value={c.land_camp_id}>{c.land_camp_name}</option>)}</select>
                  <select className="select"><option value="">— แปลง —</option>{lands.map(l => <option key={l.land_id} value={l.land_id}>{l.land_code}</option>)}</select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ประเภทกิจกรรม *</label>
                <select className="select">{hdrTypes.map(t => <option key={t.act_header_type_id} value={t.act_header_type_id}>{t.act_header_type_name_th}</option>)}</select>
              </div>
              <div>
                <label className="label">ประเภทปัจจัย *</label>
                <select className="select">{resTypes.map(t => <option key={t.resource_used_type_id} value={t.resource_used_type_id}>{t.resc_used_type_name}</option>)}</select>
              </div>
              <div><label className="label">ปริมาณ (จำนวน)</label><input type="number" className="input" /></div>
              <div><label className="label">ปริมาณ/หน่วย</label><input type="number" step="0.001" className="input" /></div>
              <div><label className="label">ปริมาณรวม *</label><input type="number" step="0.001" className="input" /></div>
              <div><label className="label">พื้นที่ทำงาน (ไร่)</label><input type="number" step="0.01" className="input" /></div>
              <div className="col-span-2">
                <label className="label">โหมดคำนวณ CO₂e</label>
                <div className="flex gap-2">
                  {(['standard', 'tver'] as CalcMode[]).map(m => (
                    <button key={m} onClick={() => setCalcMode(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${calcMode === m ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-surface-200 text-surface-600'}`}>
                      {m === 'standard' ? '📊 Standard' : '🌿 T-VER'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="btn-primary flex-1">บันทึก + คำนวณ CO₂e</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Wizard — using actual xlsx columns */}
      {showWizard && (
        <CsvMappingWizard
          title="นำเข้ากิจกรรมจาก xlsx / CSV"
          subtitle="รองรับ format: กิจกรรม · ไร่ · แปลง · รายการปัจจัย · ปริมาณ · ประเภทปัจจัย · หน่วยนับ"
          targetColumns={ACTIVITY_TARGET_COLUMNS}
          onComplete={async (mappings, rows) => { await importMut.mutateAsync({ mappings, rows }) }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}
