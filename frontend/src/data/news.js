import lombaInovasiImage from '../assets/image/berita 1.jpeg'
import lombaInovasiArticleImage from '../assets/image/berita 2.jpeg'

export const newsItems = [
  {
    slug: 'uin-datokarama-palu-raih-juara',
    category: 'Inovasi',
    title: 'UIN Datokarama Palu Raih Juara Umum Pada Lomba Inovasi Daerah Masyarakat 2026',
    cardTitle: 'Lomba Inovasi Daerah',
    summary: 'UIN Datokarama Palu meraih juara umum pada Lomba Inovasi Daerah Masyarakat 2026.',
    image: lombaInovasiImage,
    detailImage: lombaInovasiArticleImage,
    secondaryImage: lombaInovasiImage,
  },
  {
    slug: 'agenda-riset-daerah',
    category: 'Riset',
    title: 'Agenda Riset Daerah',
    cardTitle: 'Agenda Riset Daerah',
    summary: 'Kabar terbaru mengenai kegiatan dan kolaborasi riset daerah.',
  },
  {
    slug: 'informasi-pelayanan-brida',
    category: 'BRIDA',
    title: 'Informasi Pelayanan BRIDA',
    cardTitle: 'Informasi Pelayanan BRIDA',
    summary: 'Pembaruan layanan dan program Badan Riset dan Inovasi Daerah.',
  },
]

export function getNewsByPath(pathname) {
  const slug = pathname.split('/').filter(Boolean).pop()
  return newsItems.find((item) => item.slug === slug) ?? newsItems[0]
}
