import logoRumahBrida from '../assets/image/logo_rumah brida.png'

function Footer() {
  return (
    <footer className="site-footer" id="lapor">
      <div className="container footer-grid">
        <div className="footer-about">
          <div className="footer-brand"><img src={logoRumahBrida} alt="Rumah BRIDA Sulawesi Tengah" /></div>
          <p>Pusat informasi dan layanan Badan Riset dan Inovasi Daerah.</p>
        </div>
        <div><h2>Alamat</h2><p>Jl. Garuda No. 30 A, Tanamodindi,<br />Kec. Mantikulore, Kota Palu, Sulawesi Tengah</p></div>
        <div><h2>Kontak</h2><p>(0451) 8446226</p><a href="mailto:brida@sultengprov.go.id">brida@sultengprov.go.id</a></div>
        <div><h2>Media Sosial</h2><div className="social-links">
          <a href="#youtube" aria-label="YouTube">YT</a><a href="#facebook" aria-label="Facebook">FB</a>
          <a href="#instagram" aria-label="Instagram">IG</a><a href="#tiktok" aria-label="TikTok">TT</a>
        </div></div>
      </div>
      <div className="footer-bottom"><div className="container">&copy; 2026 Rumah Brida. All Rights Reserved.</div></div>
    </footer>
  )
}

export default Footer
