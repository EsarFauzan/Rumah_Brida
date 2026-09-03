import { useState } from 'react'
import { newsItems } from '../data/news'

function NewsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeNews = newsItems[activeIndex]
  const moveSlide = (direction) => setActiveIndex((current) => (current + direction + newsItems.length) % newsItems.length)
  const openNews = (event) => {
    event.preventDefault()
    window.history.pushState({}, '', `/berita/${activeNews.slug}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <section id="berita" className="news-section">
      <div className="container">
        <div className="section-heading">
          <h2>Berita Terbaru</h2>
          <p>Kabar terbaru seputar Riset, Inovasi dan Lomba.</p>
        </div>

        <div className="news-stage">
          <button className="slider-button slider-button-left" type="button" aria-label="Berita sebelumnya" onClick={() => moveSlide(-1)}>&lsaquo;</button>
          <article className="news-card">
            <a className="news-visual-link" href={`/berita/${activeNews.slug}`} onClick={openNews} aria-label={`Baca ${activeNews.title}`}>
              {activeNews.image ? (
                <img className="news-visual-image" src={activeNews.image} alt={activeNews.title} />
              ) : (
                <div className={`news-visual visual-${activeIndex + 1}`}><span>{activeNews.category}</span></div>
              )}
            </a>
            <div className="news-card-body">
              <div className="news-icon" aria-hidden="true">&#9670;</div>
              <div>
                <h3><a href={`/berita/${activeNews.slug}`} onClick={openNews}>{activeNews.cardTitle}</a></h3>
                <p>{activeNews.summary}</p>
              </div>
              <a href={`/berita/${activeNews.slug}`} onClick={openNews} aria-label={`Baca ${activeNews.title}`}>
                Baca Selengkapnya <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </article>
          <button className="slider-button slider-button-right" type="button" aria-label="Berita berikutnya" onClick={() => moveSlide(1)}>&rsaquo;</button>
        </div>

        <div className="slider-dots" aria-label="Pilih berita">
          {newsItems.map((news, index) => (
            <button key={news.title} type="button" className={index === activeIndex ? 'is-active' : ''}
              aria-label={`Tampilkan ${news.title}`} onClick={() => setActiveIndex(index)} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default NewsSection
