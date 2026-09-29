import { ArrowUpRight, Lightbulb, Newspaper, ShieldCheck, Trophy } from 'lucide-react'
import useAuth from '../hooks/useAuth'

const modules = [
  {
    title: 'Kelola Berita',
    description: 'Tulis, sunting, terbitkan, dan arsipkan berita Rumah BRIDA.',
    href: '/admin/berita',
    icon: Newspaper,
  },
  {
    title: 'Kelola Inovasi',
    description: 'Buka daftar inovasi untuk menambah atau memperbarui data milik admin.',
    href: '/inovasi/info',
    icon: Lightbulb,
  },
  {
    title: 'Kelola Lomba',
    description: 'Buka workspace informasi dan periode pendaftaran lomba.',
    href: '/admin/lomba',
    icon: Trophy,
  },
]

function AdminDashboardPage() {
  const { isSuperAdmin } = useAuth()
  const visibleModules = isSuperAdmin
    ? [...modules, {
        title: 'Kelola Administrator',
        description: 'Buat, perbarui, dan atur akses akun administrator.',
        href: '/admin/administrators',
        icon: ShieldCheck,
      }]
    : modules

  return (
    <section className="admin-dashboard-page">
      <div className="container admin-dashboard-shell">
        <header className="admin-dashboard-heading">
          <span>Panel Admin</span>
          <h1>Workspace Rumah BRIDA</h1>
          <p>Pilih modul operasional yang akan dikelola.</p>
        </header>

        <div className="admin-module-grid">
          {visibleModules.map(({ title, description, href, icon: Icon }) => (
            <a className="admin-module-link" href={href} key={href}>
              <span className="admin-module-icon"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="admin-module-copy"><strong>{title}</strong><small>{description}</small></span>
              <ArrowUpRight className="admin-module-arrow" size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AdminDashboardPage
