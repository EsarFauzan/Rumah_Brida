import { useState } from 'react'
import { newsItems } from '../data/news'

function NewsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const moveSlide = (direction) => setActiveIndex((current) => (current + direction + newsItems.length) % newsItems.length)
  const openNews = (event, news) => {
    event.preventDefault()
    window.history.pushState({}, '', `/berita/${news.slug}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  const getSlidePosition = (index) => {
    const offset = (index - activeIndex + newsItems.length) % newsItems.length

    if (offset === 0) return 'is-active'
    if (offset === 1) return 'is-next'
    if (offset === newsItems.length - 1) return 'is-previous'
    return 'is-hidden'
  }

  return (
    <section id="berita" className="news-section">
      <div className="container">
        <div className="section-heading">
          <h2>Berita Terbaru</h2>
          <p>Kabar terbaru seputar Riset, Inovasi dan Lomba.</p>
        </div>

        <div className="news-stage">
          <button className="slider-button slider-button-left" type="button" aria-label="Berita sebelumnya" onClick={() => moveSlide(-1)}><span className="slider-chevron slider-chevron-left" aria-hidden="true" /></button>
          <div className="news-carousel" aria-live="polite">
            {newsItems.map((news, index) => {
              const slidePosition = getSlidePosition(index)
              const isActive = slidePosition === 'is-active'

              return (
                <article className={`news-card ${slidePosition}`} key={news.slug} aria-hidden={!isActive}>
                  <a className="news-visual-link" href={`/berita/${news.slug}`} onClick={(event) => openNews(event, news)} aria-label={`Baca ${news.title}`} tabIndex={isActive ? undefined : -1}>
                    {news.image ? (
                      <img className="news-visual-image" src={news.image} alt={news.title} />
                    ) : (
                      <div className={`news-visual visual-${index + 1}`}><span>{news.category}</span></div>
                    )}
                  </a>
                  <div className="news-card-body">
                    <div className="news-icon" aria-hidden="true">&#9670;</div>
                    <div>
                      <h3><a href={`/berita/${news.slug}`} onClick={(event) => openNews(event, news)} tabIndex={isActive ? undefined : -1}>{news.cardTitle}</a></h3>
                      <p>{news.summary}</p>
                    </div>
                    <a href={`/berita/${news.slug}`} onClick={(event) => openNews(event, news)} aria-label={`Baca ${news.title}`} tabIndex={isActive ? undefined : -1}>
                      Baca Selengkapnya <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
          <button className="slider-button slider-button-right" type="button" aria-label="Berita berikutnya" onClick={() => moveSlide(1)}><span className="slider-chevron slider-chevron-right" aria-hidden="true" /></button>
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
