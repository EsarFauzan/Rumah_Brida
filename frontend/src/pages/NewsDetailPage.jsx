import { getNewsByPath } from '../data/news'

const winners = [
  ['Juara I', 'UIN Datokarama', 'Digitalisasi pembayaran pada UMKM IPUL BUAH Kota Palu'],
  ['Juara II', 'STMIK Bina Mulia', 'Digitalisasi pembayaran pada UMKM Bungan Telang Palu'],
  ['Juara III', 'UIN Datokarama', 'Digitalisasi pembayaran pada UMKM BarberDoor'],
  ['Juara Harapan I', 'Universitas Tadulako dan UIN Datokarama', 'Fotocopy Cakrawala, Safira Laundry, dan Warung Lalapan Perempatan'],
  ['Juara Harapan II', 'UIN Datokarama', 'Meubel Padaidi dan Wakai Heaven'],
  ['Juara Harapan III', 'UIN Datokarama dan STMIK Adhi Guna', 'Apreska Kos dan Penginapan serta Nina Salon'],
]

function NewsDetailPage({ pathname }) {
  const news = getNewsByPath(pathname)

  return (
    <div className="article-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <div className="container">
          <a href="/#beranda">Home</a><span>/</span><a href="/#berita">Berita</a><span>/</span>
          <span aria-current="page">{news.cardTitle}</span>
        </div>
      </nav>

      <article className="article-content">
        <header className="article-header">
          <p>{news.category}</p>
          <h1>{news.title}</h1>
        </header>

        <figure className="article-figure">
          {news.detailImage ? (
            <img src={news.detailImage} alt={news.title} />
          ) : (
            <div className="article-image-placeholder image-primary"><span>{news.category}</span></div>
          )}
          <figcaption>Dokumentasi kegiatan Lomba Inovasi Daerah Masyarakat.</figcaption>
        </figure>

        <div className="article-body">
          <p><strong>Badan Riset dan Inovasi Daerah Provinsi Sulawesi Tengah (Brida)</strong> bersama Kantor Perwakilan Bank Indonesia Sulawesi Tengah memberikan penghargaan kepada peserta lomba inovasi daerah masyarakat Teknologi Tepat Guna Berbasis Digitalisasi Pembayaran.</p>
          <p>Penyerahan penghargaan ini dirangkaikan pada acara Posalia Sulteng Digifest yang bertempat pada acara Pekan Qris Nasional di atrium Palu Grand Mall. Pemberian penghargaan tersebut menjadi bentuk apresiasi atas kreativitas, inovasi, dan kontribusi masyarakat, khususnya generasi muda dan mahasiswa.</p>

          <figure className="article-figure article-figure-inline">
            {news.secondaryImage ? (
              <img src={news.secondaryImage} alt={`Dokumentasi ${news.title}`} />
            ) : (
              <div className="article-image-placeholder image-secondary"><span>Dokumentasi</span></div>
            )}
            <figcaption>Inovasi digitalisasi pembayaran oleh para pemenang lomba.</figcaption>
          </figure>

          <p>Penghargaan diberikan langsung oleh Kepala Bidang Riset, Inovasi, dan Teknologi Brida Provinsi Sulawesi Tengah dan Kepala Perwakilan Kantor BI Sulteng.</p>
          <p>Lomba Inovasi Daerah Masyarakat merupakan bagian dari upaya mendorong terciptanya ekosistem inovasi di Sulawesi Tengah. Melalui pemanfaatan teknologi tepat guna dan digitalisasi pembayaran, masyarakat didorong menghasilkan inovasi yang tidak hanya kreatif, tetapi juga memiliki nilai manfaat dan potensi untuk dikembangkan secara berkelanjutan.</p>

          <section className="winner-section">
            <h2>Daftar Pemenang Lomba</h2>
            <div className="winner-list">
              {winners.map(([position, institution, project]) => (
                <div className="winner-row" key={position}>
                  <strong>{position}</strong><span>{institution}</span><p>{project}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="article-notice">
            <span aria-hidden="true">i</span>
            <p>Para pemenang lomba memperoleh hadiah berupa piagam penghargaan, plakat, uang pembinaan, dan layanan Hak Kekayaan Intelektual (HKI) secara gratis.</p>
          </aside>

          <footer className="article-meta">
            <div><span>Tags:</span><a href="#inovasi">Inovasi</a><a href="#kompetisi">Kompetisi 2026</a><a href="#digitalisasi">Digitalisasi</a></div>
            <div><span>Bagikan:</span><button type="button" aria-label="Bagikan berita">&#8599;</button><button type="button" aria-label="Salin tautan">&#128279;</button></div>
          </footer>
        </div>
      </article>
    </div>
  )
}

export default NewsDetailPage
