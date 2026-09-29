import { useEffect, useState } from 'react'
import { ArrowRight, Newspaper, Search, X } from 'lucide-react'
import FilterSummary from '../components/FilterSummary'
import Pagination from '../components/Pagination'
import ServicePageHeader from '../components/ServicePageHeader'
import api from '../services/api'

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function NewsArchivePage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      api.get('/news', {
        params: { page, per_page: 9, search: searchTerm.trim() || undefined },
        signal: controller.signal,
      })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          if (page > data.pagination.last_page) {
            setPage(Math.max(data.pagination.last_page, 1))
            return
          }
          setItems(data.data)
          setPagination(data.pagination)
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setItems([])
          setPagination(null)
          setError('Daftar berita belum dapat dimuat.')
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [page, searchTerm])

  const clearSearch = () => {
    setSearchTerm('')
    setPage(1)
  }

  return (
    <section className="news-archive-page">
      <ServicePageHeader
        section="Berita"
        title="Berita & Kegiatan"
        description="Informasi terbaru mengenai riset, inovasi, dan kegiatan Rumah BRIDA Sulawesi Tengah."
        total={pagination?.total}
        totalLabel="berita"
      />

      <div className="news-archive-container">
        <div className="news-archive-toolbar">
          <label className="research-results-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Cari judul, kategori, atau ringkasan berita..."
              aria-label="Cari berita"
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setPage(1)
              }}
            />
            {searchTerm && <button type="button" aria-label="Hapus pencarian" onClick={clearSearch}><X size={15} aria-hidden="true" /></button>}
          </label>
        </div>

        <FilterSummary
          count={pagination?.total}
          noun="berita"
          loading={isLoading}
          error={error}
          search={searchTerm}
          onSearchClear={clearSearch}
          onReset={clearSearch}
        />

        {error ? <div className="news-archive-state" role="alert">{error}</div>
          : isLoading ? <div className="news-archive-grid" aria-label="Memuat berita">{[1, 2, 3, 4, 5, 6].map((item) => <div className="news-archive-skeleton" key={item}><span /><span /><span /></div>)}</div>
            : items.length === 0 ? <div className="news-archive-state"><strong>{searchTerm.trim() ? 'Berita tidak ditemukan' : 'Belum ada berita'}</strong><span>{searchTerm.trim() ? 'Coba gunakan kata pencarian yang berbeda.' : 'Berita yang diterbitkan admin akan tampil di halaman ini.'}</span></div>
              : <div className="news-archive-grid">
                {items.map((news) => {
                  const date = news.published_at ? new Date(news.published_at) : null
                  return <article className="news-archive-card" key={news.id}>
                    <a className="news-archive-image" href={`/berita/${news.slug}`} aria-label={news.title}>
                      {news.image_url ? <img src={news.image_url} alt="" loading="lazy" /> : <span><Newspaper size={34} aria-hidden="true" />{news.category || 'Berita BRIDA'}</span>}
                    </a>
                    <div className="news-archive-card-body">
                      <div className="news-story-meta"><span>{news.category || 'Berita'}</span>{date && !Number.isNaN(date.getTime()) && <time dateTime={news.published_at}>{dateFormat.format(date)}</time>}</div>
                      <h2><a href={`/berita/${news.slug}`}>{news.card_title || news.title}</a></h2>
                      <p>{news.summary}</p>
                      <a className="news-story-link" href={`/berita/${news.slug}`}>Baca berita <ArrowRight size={16} aria-hidden="true" /></a>
                    </div>
                  </article>
                })}
              </div>}

        {!isLoading && !error && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </section>
  )
}

export default NewsArchivePage
