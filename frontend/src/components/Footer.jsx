import logoRumahBrida from '../assets/image/logo-rumah-brida.webp'
import { Mail, MapPin, Phone } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6'

function Footer() {
  return (
    <footer className="site-footer footer-modern" id="lapor">
      <div className="container footer-grid">
        <div className="footer-about">
          <div className="footer-brand"><img src={logoRumahBrida} alt="Rumah BRIDA Sulawesi Tengah" /></div>
          <p>Pusat informasi dan layanan Badan Riset dan Inovasi Daerah.</p>
        </div>
        <div>
          <h2>Layanan</h2>
          <nav className="footer-services" aria-label="Layanan di footer">
            <a href="/info-publik/hasil-riset">Hasil Riset</a>
            <a href="/info-publik/peneliti">Dokumen Inovasi</a>
            <a href="/lomba/pendaftaran">Pendaftaran Lomba</a>
            <a href="/berita">Berita &amp; Kegiatan</a>
            <a href="https://sp4n.lapor.go.id/" target="_blank" rel="noopener noreferrer">Lapor!</a>
          </nav>
        </div>
        <div>
          <h2>Kontak</h2>
          <p className="footer-contact-item footer-address"><MapPin className="footer-contact-icon" size={16} strokeWidth={2.25} aria-hidden="true" /><span>Jl. Garuda No. 30 A, Tanamodindi,<br />Kec. Mantikulore, Kota Palu, Sulawesi Tengah</span></p>
          <a className="footer-contact-item" href="tel:+624518446226"><Phone className="footer-contact-icon" size={16} strokeWidth={2.25} aria-hidden="true" /><span>(0451) 8446226</span></a>
          <a className="footer-contact-item" href="mailto:brida@sultengprov.go.id"><Mail className="footer-contact-icon" size={16} strokeWidth={2.25} aria-hidden="true" /><span>brida@sultengprov.go.id</span></a>
          <div className="social-links" aria-label="Media sosial BRIDA">
            <a href="https://youtube.com/@bridasulteng?si=yLs4H7PHbeSS09B1" target="_blank" rel="noreferrer" aria-label="YouTube BRIDA Sulawesi Tengah"><FaYoutube aria-hidden="true" /></a>
            <a href="https://www.facebook.com/share/1DQPhgrkv8/" target="_blank" rel="noreferrer" aria-label="Facebook BRIDA Sulawesi Tengah"><FaFacebookF aria-hidden="true" /></a>
            <a href="https://www.instagram.com/brida.sulteng?igsi=MXNmZ3Fyb2owbWdiag==" target="_blank" rel="noreferrer" aria-label="Instagram BRIDA Sulawesi Tengah"><FaInstagram aria-hidden="true" /></a>
            <a href="https://www.tiktok.com/@brida_prov.sulteng?_r=1&_t=ZS-99Pc7dYte4r" target="_blank" rel="noreferrer" aria-label="TikTok BRIDA Sulawesi Tengah"><FaTiktok aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom"><div className="container footer-bottom-inner"><span>&copy; 2026 BRIDA Provinsi Sulawesi Tengah</span><a href="/admin/login">Login Admin</a></div></div>
    </footer>
  )
}

export default Footer
