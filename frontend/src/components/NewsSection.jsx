import { useEffect, useState } from 'react'
import { ArrowRight, RefreshCw } from 'lucide-react'
import api from '../services/api'

const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

function NewsSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const [failedImages, setFailedImages] = useState(() => new Set())

  useEffect(() => {
    const controller = new AbortController()
    api.get('/news', { params: { limit: 3 }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setItems(data.data) })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])

  return (
    <>
    <section id="berita" className="news-editorial">
      <div className="container">
        <header className="news-editorial-heading">
          <div>
            <span>Publikasi terkini</span>
            <h2>Berita &amp; Kegiatan</h2>
            <p>Perkembangan terbaru riset, inovasi, dan kegiatan BRIDA Sulawesi Tengah.</p>
          </div>
          <a className="news-archive-link" href="/berita">Lihat semua berita <ArrowRight size={17} aria-hidden="true" /></a>
        </header>
        {loading ? <div className="news-editorial-loading" role="status">Memuat berita terbaru...</div>
          : error ? <div className="news-editorial-state" role="status"><p>Berita belum dapat dimuat.</p><button type="button" className="secondary-form-button" onClick={() => { setError(false); setLoading(true); setReload(value => value + 1) }}><RefreshCw size={16} aria-hidden="true" /> Coba lagi</button></div>
            : items.length === 0 ? <p className="news-editorial-state">Belum ada berita yang diterbitkan.</p>
              : <div className={`news-editorial-grid${items.length === 1 ? ' is-single' : ''}`}>
                {items.map((news, index) => {
                  const date = news.published_at ? new Date(news.published_at) : null
                  const cardImageUrl = [news.homepage_thumbnail_url, news.image_url].find((url) => url && !failedImages.has(url))
                  const usesHomepageThumbnail = Boolean(cardImageUrl && cardImageUrl === news.homepage_thumbnail_url)
                  return <article key={news.id} className={`news-story${index === 0 ? ' is-lead' : ''}`}>
                    <a className={`news-story-image${usesHomepageThumbnail ? ' has-homepage-thumbnail' : ''}`} href={`/berita/${news.slug}`} aria-label={news.title}>
                      {cardImageUrl
                        ? <img src={cardImageUrl} alt={news.title} width="1200" height="675" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" onError={() => setFailedImages((current) => new Set(current).add(cardImageUrl))} />
                        : <span className="news-story-placeholder"><span className="news-placeholder-wordmark" aria-hidden="true"><span>Rumah</span><strong>BRIDA</strong></span><span className="news-placeholder-label">Publikasi</span></span>}
                    </a>
                    <div className="news-story-body">
                      <div className="news-story-meta"><span>{news.category || 'Berita'}</span>{date && !Number.isNaN(date.getTime()) && <time dateTime={news.published_at}>{dateFormat.format(date)}</time>}</div>
                      <h3><a href={`/berita/${news.slug}`}>{news.card_title || news.title}</a></h3>
                      <p>{news.summary}</p>
                      <a className="news-story-link" href={`/berita/${news.slug}`} aria-label={`Baca ${news.title}`}>Baca berita <ArrowRight size={16} aria-hidden="true" /></a>
                    </div>
                  </article>
                })}
              </div>}
      </div>
    </section>
    <section className="home-closing-cta" aria-labelledby="home-closing-title">
      <div className="container home-closing-inner">
        <div>
          <p>Layanan aspirasi publik</p>
          <h2 id="home-closing-title">Suara Anda ikut membangun Sulawesi Tengah.</h2>
        </div>
        <a href="https://sp4n.lapor.go.id/" target="_blank" rel="noopener noreferrer">Sampaikan laporan <ArrowRight size={18} aria-hidden="true" /></a>
      </div>
    </section>
    </>
  )
}

export default NewsSection
