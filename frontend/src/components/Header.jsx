import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Newspaper,
  UserRound,
  ClipboardList,
  Info,
  Microscope,
  FileCheck2,
} from 'lucide-react'
import logoRumahBrida from '../assets/image/logo-fix.webp'
import logoRumahBridaDark from '../assets/image/logo-fix-dark.png'
import useTheme from '../hooks/useTheme'
import AnimatedChevron from './AnimatedChevron'
import ThemeToggle from './ThemeToggle'
import useAuth from '../hooks/useAuth'
import api from '../services/api'
import { clearSession } from '../services/authStore'

const menuItems = [
  { label: 'Beranda', href: '/#beranda' },
  {
    label: 'Riset',
    href: '/riset/proposal',
    submenu: [
      { label: 'Proposal Riset', href: '/riset/proposal', desc: 'Ajukan proposal riset baru', icon: FileCheck2 },
      { label: 'Hasil Riset', href: '/riset/hasil', desc: 'Lihat publikasi hasil riset', icon: Microscope },
    ],
  },
  {
    label: 'Inovasi',
    href: '/inovasi/input',
    submenu: [
      { label: 'Input Inovasi', href: '/inovasi/input', desc: 'Daftarkan inovasi daerah', icon: ClipboardList },
      { label: 'Info', href: '/inovasi/info', desc: 'Jelajahi data inovasi', icon: Info },
    ],
  },
  { label: 'Info Publik', href: '/info-publik' },
  { label: 'Lomba', href: '#lomba', submenu: [] },
  { label: 'Lapor!', href: 'https://sp4n.lapor.go.id/', external: true },
]

const submenuId = (label) => `submenu-${label.toLowerCase().replace(/\s+/g, '-')}`

const getInitials = (name) => {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'A'
}

const getActiveMenu = () => {
  const { hash, pathname } = window.location

  if (pathname === '/riset' || pathname.startsWith('/riset/')) {
    return 'Riset'
  }

  if (pathname === '/inovasi' || pathname.startsWith('/inovasi/')) {
    return 'Inovasi'
  }

  if (pathname === '/info-publik' || pathname.startsWith('/info-publik/')) {
    return 'Info Publik'
  }

  if (pathname === '/') {
    if (hash === '#inovasi') {
      return 'Inovasi'
    }

    if (hash === '#lomba') {
      return 'Lomba'
    }

    if (hash === '#lapor') {
      return 'Lapor!'
    }

    return 'Beranda'
  }

  return null
}

function Header() {
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 80)
  const [isOpen, setIsOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [activeMenu, setActiveMenu] = useState(getActiveMenu)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const theme = useTheme()
  const headerRef = useRef(null)
  const accountRef = useRef(null)
  const accountButtonRef = useRef(null)

  const closeAll = () => {
    setIsOpen(false)
    setOpenMenu(null)
    setIsAccountMenuOpen(false)
  }

  const toggleSubmenu = (label) => {
    setOpenMenu((current) => (current === label ? null : label))
    setIsAccountMenuOpen(false)
  }

  const logout = async () => {
    setIsLoggingOut(true)

    try {
      await api.post('/auth/logout')
    } catch {
      // Token bisa saja sudah tidak valid di server; sesi lokal tetap dibersihkan.
    } finally {
      clearSession()
      setIsLoggingOut(false)
      closeAll()
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  useEffect(() => {
    if (!openMenu && !isAccountMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setIsOpen(false)
        setOpenMenu(null)
        setIsAccountMenuOpen(false)
        return
      }

      if (isAccountMenuOpen && !accountRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      if (isAccountMenuOpen) {
        accountButtonRef.current?.focus()
      } else {
        headerRef.current?.querySelector('.nav-trigger[aria-expanded="true"]')?.focus()
      }

      setIsOpen(false)
      setOpenMenu(null)
      setIsAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAccountMenuOpen, openMenu])

  useEffect(() => {
    const syncActiveMenu = () => {
      setActiveMenu(getActiveMenu())
      setIsScrolled(window.scrollY > 80)
    }

    window.addEventListener('popstate', syncActiveMenu)
    window.addEventListener('hashchange', syncActiveMenu)

    return () => {
      window.removeEventListener('popstate', syncActiveMenu)
      window.removeEventListener('hashchange', syncActiveMenu)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const headerClassName = `site-header${isScrolled ? ' is-scrolled' : ''}`

  return (
    <header className={headerClassName} ref={headerRef}>
      <style>{submenuStyles}</style>
      <div className="container header-inner">
        <a className="brand" href="/#beranda" aria-label="Rumah Brida - Beranda">
          <img src={theme === 'dark' ? logoRumahBridaDark : logoRumahBrida} alt="Rumah BRIDA Sulawesi Tengah" />
        </a>

        <button className="menu-toggle" type="button" aria-label="Buka menu navigasi"
          aria-expanded={isOpen} onClick={() => {
            setIsOpen((current) => !current)
            setOpenMenu(null)
            setIsAccountMenuOpen(false)
          }}>
          <span /><span /><span />
        </button>

        <nav className={`main-nav ${isOpen ? 'is-open' : ''}`} aria-label="Navigasi utama">
          <ul>
            {menuItems.map((item) => {
              const hasSubmenu = item.submenu?.length > 0
              const isSubmenuOpen = hasSubmenu && openMenu === item.label
              const isActive = activeMenu === item.label
              const panelId = submenuId(item.label)

              return (
                <li
                  key={item.label}
                  className={`${hasSubmenu ? 'has-submenu' : ''}${isSubmenuOpen ? ' is-open' : ''}`}
                >
                  {hasSubmenu ? (
                    <button
                      type="button"
                      className={`nav-trigger${isActive ? ' is-active' : ''}`}
                      aria-expanded={isSubmenuOpen}
                      aria-controls={panelId}
                      onClick={() => toggleSubmenu(item.label)}
                    >
                      {item.label}
                      <AnimatedChevron open={isSubmenuOpen} />
                    </button>
                  ) : (
                    <a
                      
  className={isActive ? 'is-active' : ''}
  href={item.href}
  target={item.external ? '_blank' : undefined}
  rel={item.external ? 'noopener noreferrer' : undefined}
  onClick={() => {
    if (!item.external) {
      closeAll()
      setActiveMenu(item.label)
    }
  }}
>
  {item.label}
</a>
                  )}
                  {hasSubmenu && (
                    <div className="submenu subm-rich" id={panelId}>
                      {item.submenu.map((subitem) => {
                        const SubIcon = subitem.icon
                        return (
                          <a
                            key={subitem.label}
                            className="subm-item"
                            href={subitem.href}
                            onClick={() => {
                              closeAll()
                              setActiveMenu(item.label)
                            }}
                          >
                            {SubIcon && (
                              <span className="subm-icon">
                                <SubIcon size={17} strokeWidth={2} aria-hidden="true" />
                              </span>
                            )}
                            <span className="subm-text">
                              <span className="subm-title">{subitem.label}</span>
                              {subitem.desc && <span className="subm-desc">{subitem.desc}</span>}
                            </span>
                          </a>
                        )
                      })}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="mobile-account-actions">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <a href="/admin/proposal" onClick={closeAll}>
                    <LayoutDashboard size={16} strokeWidth={2.25} aria-hidden="true" />
                    Dashboard Admin
                  </a>
                )}
                <a href="/riset/draft" onClick={closeAll}>
                  <FileText size={16} strokeWidth={2.25} aria-hidden="true" />
                  Draft Saya
                </a>
                <button type="button" disabled={isLoggingOut} onClick={logout}>
                  <LogOut size={16} strokeWidth={2.25} aria-hidden="true" />
                  {isLoggingOut ? 'Keluar...' : 'Keluar'}
                </button>
              </>
            ) : (
              <a href="/masuk" onClick={closeAll}>
                <UserRound size={16} strokeWidth={1.9} aria-hidden="true" />
                Masuk
              </a>
            )}
          </div>
        </nav>

        <div className={`header-account${isAccountMenuOpen ? ' is-open' : ''}`} ref={accountRef}>
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <button
                className="profile-button"
                type="button"
                aria-label="Buka menu akun"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu"
                ref={accountButtonRef}
                onClick={() => {
                  setIsAccountMenuOpen((current) => !current)
                  setIsOpen(false)
                  setOpenMenu(null)
                }}
              >
                <span className="account-avatar" aria-hidden="true">{getInitials(user?.name)}</span>
                <ChevronDown className="account-chevron" size={16} strokeWidth={2.5} aria-hidden="true" />
              </button>
              <div className="account-menu" id="account-menu" aria-hidden={!isAccountMenuOpen}>
                <div className="account-menu-info">
                  <strong>{user?.name ?? 'Akun BRIDA'}</strong>
                  <span>{user?.email ?? user?.role ?? 'Peneliti'}</span>
                </div>
                <div className="account-menu-divider" />
                {user?.role === 'admin' && (
                  <>
                    <a className="account-menu-link" href="/admin/proposal" onClick={closeAll}>
                      <LayoutDashboard size={16} strokeWidth={2.25} aria-hidden="true" />
                      Dashboard Admin
                    </a>
                    <a className="account-menu-link" href="/admin/berita" onClick={closeAll}><Newspaper size={16} aria-hidden="true" />Kelola Berita</a>
                  </>
                )}
                <a className="account-menu-link" href="/riset/draft" onClick={closeAll}>
                  <FileText size={16} strokeWidth={2.25} aria-hidden="true" />
                  Draft Saya
                </a>
                <button className="account-menu-logout" type="button" disabled={isLoggingOut} onClick={logout}>
                  <LogOut size={16} strokeWidth={2.25} aria-hidden="true" />
                  {isLoggingOut ? 'Keluar...' : 'Keluar'}
                </button>
              </div>
            </>
          ) : (
            <a className="account-button" href="/masuk" onClick={closeAll}>
              <UserRound size={16} strokeWidth={1.9} aria-hidden="true" />
              <span>Masuk</span>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

const submenuStyles = `
.subm-rich {
  width: 280px;
  padding: 12px;
  text-align: left;
}

.subm-item {
  display: flex !important;
  align-items: flex-start;
  gap: 13px;
  padding: 13px !important;
  border-radius: 13px !important;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.subm-item + .subm-item {
  margin-top: 5px;
}

.subm-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--yellow), var(--navy));
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 220ms cubic-bezier(.4,0,.2,1);
}

.subm-item:hover,
.subm-item:focus-visible {
  background: var(--surface-hover) !important;
  transform: translateX(4px);
  box-shadow: 0 6px 16px rgba(16, 42, 78, .08);
}

[data-theme='dark'] .subm-item:hover,
[data-theme='dark'] .subm-item:focus-visible {
  box-shadow: 0 6px 16px rgba(0, 0, 0, .35);
}

.subm-item:hover::before,
.subm-item:focus-visible::before {
  transform: scaleY(1);
}

.subm-icon {
  flex: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--bg-soft);
  color: var(--navy);
  transition: background-color 200ms ease, color 200ms ease, transform 220ms cubic-bezier(.34, 1.56, .64, 1);
}

.subm-item:hover .subm-icon,
.subm-item:focus-visible .subm-icon {
  background: linear-gradient(135deg, var(--navy-deep), var(--navy));
  color: var(--yellow);
  transform: scale(1.08) rotate(-4deg);
}

.subm-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding-top: 1px;
}

.subm-title {
  color: var(--text-primary) !important;
  font-size: 14px !important;
  font-weight: 750 !important;
}

.subm-desc {
  color: var(--text-faint);
  font-size: 11.5px;
  font-weight: 400;
  line-height: 1.45;
}

@media (max-width: 760px) {
  .subm-rich {
    width: auto;
  }
  .subm-item {
    padding: 11px 12px !important;
  }
  .subm-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }
}
`

export default Header