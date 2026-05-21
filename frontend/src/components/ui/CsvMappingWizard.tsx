import { useState } from 'react'
import { Upload, ArrowRight, CheckCircle, ChevronRight } from 'lucide-react'

export interface TargetColumn {
  key: string
  label: string
  required: boolean
  type: 'string' | 'number' | 'date' | 'fk'
  fkTable?: string
}

export interface ColumnMapping {
  targetKey: string
  sourceKey: string | null
}

interface CsvMappingWizardProps {
  title: string
  subtitle?: string
  targetColumns: TargetColumn[]
  onComplete: (mappings: ColumnMapping[], rows: Record<string, string>[]) => Promise<void>
  onCancel: () => void
}

type Step = 'upload' | 'preview' | 'map' | 'validate' | 'done'

export function CsvMappingWizard({ title, subtitle, targetColumns, onComplete, onCancel }: CsvMappingWizardProps) {
  const [step, setStep] = useState<Step>('upload')
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows]     = useState<Record<string, string>[]>([])
  const [allRows, setAllRows]             = useState<Record<string, string>[]>([])
  const [mappings, setMappings]           = useState<ColumnMapping[]>(
    targetColumns.map((c) => ({ targetKey: c.key, sourceKey: null })),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileName, setFileName]         = useState('')

  const STEPS: Step[] = ['upload', 'preview', 'map', 'validate', 'done']
  const stepLabels: Record<Step, string> = {
    upload:   'อัพโหลดไฟล์',
    preview:  'ตรวจสอบ headers',
    map:      'จับคู่ column',
    validate: 'ตรวจสอบข้อมูล',
    done:     'เสร็จสิ้น',
  }

  function handleFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n').filter(Boolean)
      if (lines.length < 2) return
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
      })
      setSourceHeaders(headers)
      setPreviewRows(rows.slice(0, 5))
      setAllRows(rows)
      // Auto-map by similarity
      setMappings(
        targetColumns.map((tc) => {
          const auto = headers.find(
            (h) => h.toLowerCase().includes(tc.key.toLowerCase()) ||
                   tc.key.toLowerCase().includes(h.toLowerCase()),
          )
          return { targetKey: tc.key, sourceKey: auto ?? null }
        }),
      )
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function setMapping(targetKey: string, sourceKey: string | null) {
    setMappings((prev) =>
      prev.map((m) => (m.targetKey === targetKey ? { ...m, sourceKey } : m)),
    )
  }

  const requiredMapped = targetColumns
    .filter((c) => c.required)
    .every((c) => mappings.find((m) => m.targetKey === c.key)?.sourceKey)

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      await onComplete(mappings, allRows)
      setStep('done')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStepIdx = STEPS.indexOf(step)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-card-lg w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-100">
          <h2 className="font-semibold text-surface-900">{title}</h2>
          {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`wizard-step-dot ${
                  i < currentStepIdx ? 'done' : i === currentStepIdx ? 'active' : 'pending'
                }`}>
                  {i < currentStepIdx ? <CheckCircle size={12} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === currentStepIdx ? 'text-primary-700 font-medium' : 'text-surface-400'}`}>
                  {stepLabels[s]}
                </span>
                {i < STEPS.length - 1 && <ChevronRight size={12} className="text-surface-300 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step: upload */}
          {step === 'upload' && (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors group">
              <Upload size={28} className="text-surface-300 group-hover:text-primary-500 mb-3" />
              <p className="text-sm font-medium text-surface-600">คลิกหรือลากไฟล์ CSV มาที่นี่</p>
              <p className="text-xs text-surface-400 mt-1">รองรับ .csv เท่านั้น</p>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          )}

          {/* Step: preview */}
          {step === 'preview' && (
            <div>
              <p className="text-sm text-surface-600 mb-3">พบ <strong>{sourceHeaders.length} column</strong>, <strong>{allRows.length} แถว</strong> จากไฟล์ <em>{fileName}</em></p>
              <div className="table-wrapper overflow-auto max-h-48">
                <table className="table text-xs">
                  <thead><tr>{sourceHeaders.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>{sourceHeaders.map((h) => <td key={h}>{row[h]}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-secondary flex-1" onClick={() => setStep('upload')}>กลับ</button>
                <button className="btn-primary flex-1" onClick={() => setStep('map')}>ต่อไป <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {/* Step: map */}
          {step === 'map' && (
            <div>
              <p className="text-sm text-surface-500 mb-4">จับคู่ column จากไฟล์ CSV กับ field ในฐานข้อมูล</p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {targetColumns.map((tc) => {
                  const mapping = mappings.find((m) => m.targetKey === tc.key)
                  return (
                    <div key={tc.key} className="flex items-center gap-3 bg-surface-50 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-surface-700 truncate">
                          {tc.label}
                          {tc.required && <span className="text-red-500 ml-0.5">*</span>}
                        </p>
                        <p className="text-[10px] text-surface-400">{tc.key} · {tc.type}{tc.fkTable ? ` → ${tc.fkTable}` : ''}</p>
                      </div>
                      <ArrowRight size={14} className="text-surface-300 shrink-0" />
                      <select
                        value={mapping?.sourceKey ?? ''}
                        onChange={(e) => setMapping(tc.key, e.target.value || null)}
                        className="select text-xs w-44 shrink-0"
                      >
                        <option value="">— ไม่จับคู่ —</option>
                        {sourceHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
              {!requiredMapped && (
                <p className="text-xs text-red-500 mt-3">* กรุณาจับคู่ field ที่จำเป็นให้ครบถ้วน</p>
              )}
              <div className="flex gap-3 mt-5">
                <button className="btn-secondary flex-1" onClick={() => setStep('preview')}>กลับ</button>
                <button className="btn-primary flex-1" onClick={() => setStep('validate')} disabled={!requiredMapped}>
                  ตรวจสอบ <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step: validate */}
          {step === 'validate' && (
            <div>
              <div className="alert-success mb-4">
                <CheckCircle size={16} className="text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">พร้อมนำเข้าข้อมูล</p>
                  <p className="text-xs mt-0.5">พบ {allRows.length} แถว · {mappings.filter((m) => m.sourceKey).length} column ที่จับคู่แล้ว</p>
                </div>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {mappings.filter((m) => m.sourceKey).map((m) => {
                  const tc = targetColumns.find((c) => c.key === m.targetKey)!
                  return (
                    <div key={m.targetKey} className="flex items-center justify-between text-xs px-3 py-1.5 bg-surface-50 rounded-lg">
                      <span className="text-surface-600">{m.sourceKey}</span>
                      <ArrowRight size={12} className="text-surface-300" />
                      <span className="font-medium text-surface-800">{tc.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-secondary flex-1" onClick={() => setStep('map')}>กลับ</button>
                <button className="btn-primary flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
                </button>
              </div>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-surface-900 mb-1">นำเข้าสำเร็จ!</h3>
              <p className="text-sm text-surface-500 mb-6">นำเข้าข้อมูล {allRows.length} แถวเรียบร้อยแล้ว</p>
              <button className="btn-primary" onClick={onCancel}>เสร็จสิ้น</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
