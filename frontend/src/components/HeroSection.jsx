function HeroSection() {
  return (
    <section id="beranda" className="hero-section">
      <div className="container hero-content">
        <p className="section-kicker">Portal Resmi</p>
        <h1>Selamat Datang<br />di Rumah Brida</h1>
        <div className="hero-divider">
          <span className="hero-divider-line" aria-hidden="true"></span>
          <span className="hero-divider-text">Rumah Berani Riset dan Inovasi Daerah</span>
        </div>
        <a className="primary-button" href="#berita">Mulai Jelajahi <span aria-hidden="true">→</span></a>
      </div>
    </section>
  )
}

export default HeroSection