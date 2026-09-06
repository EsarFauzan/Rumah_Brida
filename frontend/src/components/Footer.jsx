import logoRumahBrida from '../assets/image/logo-rumah-brida.webp'
import { Mail, MapPin, Phone } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6'

function Footer() {
  return (
    <footer className="site-footer" id="lapor">
      <div className="container footer-grid">
        <div className="footer-about">
          <div className="footer-brand"><img src={logoRumahBrida} alt="Rumah BRIDA Sulawesi Tengah" /></div>
          <p>Pusat informasi dan layanan Badan Riset dan Inovasi Daerah.</p>
        </div>
        <div>
          <h2>Alamat</h2>
          <p className="footer-contact-item footer-address"><MapPin className="footer-contact-icon" size={16} strokeWidth={2.25} aria-hidden="true" /><span>Jl. Garuda No. 30 A, Tanamodindi,<br />Kec. Mantikulore, Kota Palu, Sulawesi Tengah</span></p>
        </div>
        <div>
          <h2>Kontak</h2>
          <a className="footer-contact-item" href="tel:+624518446226"><Phone className="footer-contact-icon" size={16} strokeWidth={2.25} aria-hidden="true" /><span>(0451) 8446226</span></a>
          <a className="footer-contact-item" href="mailto:brida@sultengprov.go.id"><Mail className="footer-contact-icon" size={16} strokeWidth={2.25} aria-hidden="true" /><span>brida@sultengprov.go.id</span></a>
        </div>
        <div>
          <h2>Media Sosial</h2>
          <div className="social-links">
            <a href="https://youtube.com/@bridasulteng?si=yLs4H7PHbeSS09B1" target="_blank" rel="noreferrer" aria-label="YouTube BRIDA Sulawesi Tengah"><FaYoutube aria-hidden="true" /></a>
            <a href="https://www.facebook.com/share/1DQPhgrkv8/" target="_blank" rel="noreferrer" aria-label="Facebook BRIDA Sulawesi Tengah"><FaFacebookF aria-hidden="true" /></a>
            <a href="https://www.instagram.com/brida.sulteng?igsi=MXNmZ3Fyb2owbWdiag==" target="_blank" rel="noreferrer" aria-label="Instagram BRIDA Sulawesi Tengah"><FaInstagram aria-hidden="true" /></a>
            <a href="https://www.tiktok.com/@brida_prov.sulteng?_r=1&_t=ZS-99Pc7dYte4r" target="_blank" rel="noreferrer" aria-label="TikTok BRIDA Sulawesi Tengah"><FaTiktok aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom"><div className="container">&copy; 2026 Rumah Brida. All Rights Reserved.</div></div>
    </footer>
  )
}

export default Footer
