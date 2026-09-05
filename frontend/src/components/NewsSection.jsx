import { useEffect, useState } from 'react'
import api from '../services/api'

function NewsSection() {
  const [newsItems, setNewsItems] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    api.get('/news').then((response) => setNewsItems(response.data.data)).catch(() => setNewsItems([]))
  }, [])

  if (newsItems.length === 0) return <section id="berita" className="news-section"><div className="container"><div className="section-heading"><h2>Berita Terbaru</h2><p>Belum ada berita yang diterbitkan.</p></div></div></section>

  const moveSlide = (direction) => setActiveIndex((current) => (current + direction + newsItems.length) % newsItems.length)
  const openNews = (event, news) => { event.preventDefault(); window.history.pushState({}, '', `/berita/${news.slug}`); window.dispatchEvent(new PopStateEvent('popstate')) }
  const position = (index) => { const offset = (index - activeIndex + newsItems.length) % newsItems.length; return offset === 0 ? 'is-active' : offset === 1 ? 'is-next' : offset === newsItems.length - 1 ? 'is-previous' : 'is-hidden' }

  return <section id="berita" className="news-section"><div className="container"><div className="section-heading"><h2>Berita Terbaru</h2><p>Kabar terbaru seputar Riset, Inovasi dan Lomba.</p></div><div className="news-stage"><button className="slider-button slider-button-left" type="button" aria-label="Berita sebelumnya" onClick={() => moveSlide(-1)}><span className="slider-chevron slider-chevron-left" /></button><div className="news-carousel" aria-live="polite">{newsItems.map((news, index) => { const slidePosition = position(index); const isActive = slidePosition === 'is-active'; return <article className={`news-card ${slidePosition}`} key={news.id} aria-hidden={!isActive}><a className="news-visual-link" href={`/berita/${news.slug}`} onClick={(event) => openNews(event, news)} tabIndex={isActive ? undefined : -1}>{news.image_url ? <img className="news-visual-image" src={news.image_url} alt={news.title} /> : <div className="news-visual"><span>{news.category}</span></div>}</a><div className="news-card-body"><div className="news-icon" aria-hidden="true">&#9670;</div><div><h3><a href={`/berita/${news.slug}`} onClick={(event) => openNews(event, news)} tabIndex={isActive ? undefined : -1}>{news.card_title || news.title}</a></h3><p>{news.summary}</p></div><a href={`/berita/${news.slug}`} onClick={(event) => openNews(event, news)} tabIndex={isActive ? undefined : -1}>Baca Selengkapnya <span>&rarr;</span></a></div></article> })}</div><button className="slider-button slider-button-right" type="button" aria-label="Berita berikutnya" onClick={() => moveSlide(1)}><span className="slider-chevron slider-chevron-right" /></button></div><div className="slider-dots">{newsItems.map((news, index) => <button key={news.id} type="button" className={index === activeIndex ? 'is-active' : ''} aria-label={`Tampilkan ${news.title}`} onClick={() => setActiveIndex(index)} />)}</div></div></section>
}

export default NewsSection
