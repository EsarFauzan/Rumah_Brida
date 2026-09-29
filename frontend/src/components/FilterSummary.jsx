import { RotateCcw, X } from 'lucide-react'

export default function FilterSummary({ count, noun, loading, error, search, year = 'all', filterLabel = 'Tahun', filterValueLabel, onSearchClear, onYearClear, onReset }) {
  const active = Boolean(search.trim()) || year !== 'all'
  return <div className="filter-summary">
    <span role="status" aria-live="polite">{loading ? 'Memuat hasil...' : error ? 'Hasil belum tersedia' : `${count ?? 0} ${noun}${active ? ' ditemukan' : ' tersedia'}`}</span>
    {active && <div className="filter-active">
      {search.trim() && <button type="button" onClick={onSearchClear} aria-label={`Hapus pencarian ${search}`}><span>{search}</span><X size={14} aria-hidden="true" /></button>}
      {year !== 'all' && <button type="button" onClick={onYearClear} aria-label={`Hapus filter ${filterLabel.toLowerCase()} ${filterValueLabel ?? year}`}><span>{filterLabel} {filterValueLabel ?? year}</span><X size={14} aria-hidden="true" /></button>}
      <button className="filter-reset" type="button" onClick={onReset}><RotateCcw size={14} aria-hidden="true" /> Reset filter</button>
    </div>}
  </div>
}
