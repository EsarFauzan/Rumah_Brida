import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Lightbulb, Microscope, Newspaper, Trophy } from 'lucide-react'
import api from '../services/api'

function AnimatedStat({ value }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (value === null) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || value === 0) {
      const frameId = window.requestAnimationFrame(() => setDisplayValue(value))
      return () => window.cancelAnimationFrame(frameId)
    }

    let frameId
    const startedAt = performance.now()
    const duration = 800
    const updateCount = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const easedProgress = 1 - ((1 - progress) ** 3)
      setDisplayValue(Math.round(value * easedProgress))
      if (progress < 1) frameId = window.requestAnimationFrame(updateCount)
    }

    frameId = window.requestAnimationFrame(updateCount)
    return () => window.cancelAnimationFrame(frameId)
  }, [value])

  if (value === null) return <span aria-label="Data sedang dimuat">—</span>

  return displayValue.toLocaleString('id-ID')
}

function HeroSection() {
  const [stats, setStats] = useState({ research: null, innovation: null })

  useEffect(() => {
    const controller = new AbortController()

    Promise.allSettled([
      api.get('/research-proposals', { params: { status: 'submitted', per_page: 1 }, signal: controller.signal }),
      api.get('/innovations', { params: { page: 1 }, signal: controller.signal }),
    ]).then(([researchResult, innovationResult]) => {
      if (controller.signal.aborted) return

      setStats({
        research: researchResult.status === 'fulfilled' ? researchResult.value.data.pagination?.total ?? 0 : null,
        innovation: innovationResult.status === 'fulfilled' ? innovationResult.value.data.total ?? 0 : null,
      })
    })

    return () => controller.abort()
  }, [])

  return (
    <>
    <section id="beranda" className="hero-section">
      <div className="container hero-content">
        <div className="hero-copy">
          <p className="section-kicker">Portal Resmi</p>
          <h1>Selamat Datang<br /><span>di Rumah BRIDA</span></h1>
          <p className="hero-tagline">Rumah Berani Riset dan Inovasi Daerah</p>
          <div className="hero-actions">
            <a className="primary-button hero-primary-action" href="#layanan-publik">Jelajahi Rumah BRIDA <ArrowDown size={17} aria-hidden="true" /></a>
            <a className="hero-secondary-action" href="#berita">Berita terbaru <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
        </div>
        <aside className="hero-data" aria-label="Ringkasan data Rumah BRIDA">
          <p>Data portal</p>
          <div>
            <strong><AnimatedStat value={stats.research} /></strong>
            <span>Hasil riset</span>
          </div>
          <div>
            <strong><AnimatedStat value={stats.innovation} /></strong>
            <span>Inovasi daerah</span>
          </div>
        </aside>
      </div>
    </section>
    <section id="layanan-publik" className="service-access" aria-labelledby="service-access-title">
      <div className="container service-access-shell">
        <header className="service-access-heading">
          <p>Akses Cepat</p>
          <h2 id="service-access-title">Temukan informasi yang Anda perlukan</h2>
        </header>
        <nav className="service-access-inner" aria-label="Layanan informasi publik">
          <a href="/info-publik/hasil-riset"><span className="service-access-icon"><Microscope size={20} aria-hidden="true" /></span><span><strong>Hasil Riset</strong><small>Akses hasil dan berkas pelaporan riset</small></span><ArrowUpRight className="service-arrow" size={17} aria-hidden="true" /></a>
          <a href="/info-publik/peneliti"><span className="service-access-icon"><Lightbulb size={20} aria-hidden="true" /></span><span><strong>Dokumen Inovasi</strong><small>Lihat profil dan laporan inovasi daerah</small></span><ArrowUpRight className="service-arrow" size={17} aria-hidden="true" /></a>
          <a href="/lomba/pendaftaran"><span className="service-access-icon"><Trophy size={20} aria-hidden="true" /></span><span><strong>Pendaftaran Lomba</strong><small>Periksa informasi dan periode pendaftaran</small></span><ArrowUpRight className="service-arrow" size={17} aria-hidden="true" /></a>
          <a href="/berita"><span className="service-access-icon"><Newspaper size={20} aria-hidden="true" /></span><span><strong>Berita &amp; Kegiatan</strong><small>Ikuti kabar terbaru Rumah BRIDA</small></span><ArrowUpRight className="service-arrow" size={17} aria-hidden="true" /></a>
        </nav>
      </div>
    </section>
    <section className="home-introduction" aria-labelledby="home-introduction-title">
      <div className="container home-introduction-grid">
        <header>
          <p className="home-section-label">Rumah BRIDA</p>
          <h2 id="home-introduction-title">Pengetahuan yang bergerak menjadi dampak.</h2>
        </header>
        <div className="home-introduction-copy">
          <p>Rumah BRIDA mempertemukan penelitian, kebutuhan daerah, dan inovasi agar pengetahuan dapat diterapkan untuk kemajuan Sulawesi Tengah.</p>
          <p>Setiap proses dirancang sebagai jalur yang terbuka: dari gagasan, kolaborasi, hingga hasil yang dapat diakses publik.</p>
        </div>
      </div>
      <ol className="container research-path" aria-label="Alur kerja Rumah BRIDA">
        <li><span>01</span><div><strong>Riset</strong><p>Menghimpun kajian dan bukti untuk menjawab kebutuhan strategis daerah.</p></div></li>
        <li><span>02</span><div><strong>Kolaborasi</strong><p>Menghubungkan peneliti, pemerintah daerah, dan para pemangku kepentingan.</p></div></li>
        <li><span>03</span><div><strong>Implementasi</strong><p>Mendorong hasil riset menjadi kebijakan dan inovasi yang dapat diterapkan.</p></div></li>
      </ol>
    </section>
    </>
  )
}

export default HeroSection
