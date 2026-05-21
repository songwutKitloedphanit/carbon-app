import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  pageSizeOptions?: number[]
  defaultPageSize?: number
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  emptyMessage?: string
}

const PAGE_SIZES = [10, 25, 50, 100]

export function DataTable<T>({
  data,
  columns,
  isLoading,
  searchable = true,
  searchPlaceholder = 'ค้นหา...',
  pageSizeOptions = PAGE_SIZES,
  defaultPageSize = 25,
  rowKey,
  onRowClick,
  actions,
  emptyMessage = 'ไม่พบข้อมูล',
}: DataTableProps<T>) {
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? '').toLowerCase().includes(q),
      ),
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const slice      = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

  const getValue = (row: T, key: string): unknown => {
    return key.split('.').reduce((obj, k) => (obj as Record<string, unknown>)?.[k], row as unknown)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      {searchable && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="text-surface-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm outline-none placeholder:text-surface-400 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-surface-500 ml-auto">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="select-sm border border-surface-200 rounded-lg px-2 py-1.5 text-xs bg-white"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>รายการ</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="w-24 text-right">การดำเนินการ</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      <div className="h-4 bg-surface-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                  {actions && <td />}
                </tr>
              ))
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-surface-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      {col.render
                        ? col.render(row)
                        : String(getValue(row, String(col.key)) ?? '-')}
                    </td>
                  ))}
                  {actions && (
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-surface-500">
        <span>
          {filtered.length === 0 ? 'ไม่มีข้อมูล' : `แสดง ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} จาก ${filtered.length} รายการ`}
        </span>
        <div className="pagination">
          <button className="pagination-btn" onClick={() => goTo(1)} disabled={safePage === 1}>
            <ChevronsLeft size={13} />
          </button>
          <button className="pagination-btn" onClick={() => goTo(safePage - 1)} disabled={safePage === 1}>
            <ChevronLeft size={13} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
            const p = start + i
            return (
              <button key={p} onClick={() => goTo(p)} className={`pagination-btn w-7 h-7 ${p === safePage ? 'active' : ''}`}>
                {p}
              </button>
            )
          })}
          <button className="pagination-btn" onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages}>
            <ChevronRight size={13} />
          </button>
          <button className="pagination-btn" onClick={() => goTo(totalPages)} disabled={safePage === totalPages}>
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
