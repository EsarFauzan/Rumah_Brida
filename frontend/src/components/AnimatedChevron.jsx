import Lottie from 'lottie-react'

import animationData from '../assets/lottie/arrow.json'

/**
 * Chevron animasi untuk item navigasi yang punya submenu.
 *
 * Catatan warna: renderer SVG lottie-web menulis warna sebagai presentation
 * attribute pada <path>, sehingga rule `.chevron-lottie svg path { stroke: currentColor }`
 * di App.css menang dan chevron otomatis mengikuti warna teks nav (termasuk saat hover).
 * Jika suatu saat arrow.json memakai fill (bukan stroke), tambahkan juga
 * `fill: currentColor` pada rule tersebut.
 */

// Hormati preferensi sistem: animasi looping dimatikan bila user meminta reduced motion.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function AnimatedChevron({ size = 14 }) {
  return (
    <span className="chevron-lottie" aria-hidden="true">
      <Lottie
        animationData={animationData}
        loop={!prefersReducedMotion}
        autoplay={!prefersReducedMotion}
        style={{ width: size, height: size }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
    </span>
  )
}

export default AnimatedChevron
