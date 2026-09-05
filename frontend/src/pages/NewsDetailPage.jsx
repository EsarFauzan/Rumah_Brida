import { useEffect, useState } from 'react'
import api from '../services/api'

function NewsDetailPage({ pathname }) {
  const slug = pathname.split('/').filter(Boolean).pop()
  const [news, setNews] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api.get(`/news/${slug}`).then((response) => setNews(response.data.data)).catch(() => setError('Berita tidak ditemukan.')) }, [slug])

  if (error) return <section className="article-page"><div className="article-content results-state is-error">{error}</div></section>
  if (!news) return <section className="article-page"><div className="article-content results-state">Memuat berita...</div></section>

  return <div className="article-page"><nav className="breadcrumb"><div className="container"><a href="/#beranda">Home</a><span>/</span><a href="/#berita">Berita</a><span>/</span><span>{news.card_title || news.title}</span></div></nav><article className="article-content"><header className="article-header"><p>{news.category}</p><h1>{news.title}</h1></header><figure className="article-figure">{news.image_url ? <img src={news.image_url} alt={news.title} /> : <div className="article-image-placeholder image-primary"><span>{news.category}</span></div>}</figure><div className="article-body">{news.content.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}{news.secondary_image_url && <figure className="article-figure article-figure-inline"><img src={news.secondary_image_url} alt={`Dokumentasi ${news.title}`} /></figure>}</div></article></div>
}

export default NewsDetailPage
