import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FileText, LayoutDashboard, Newspaper, LogOut } from 'lucide-react'
import logoRumahBrida from '../assets/image/logo_fix.png'
import AnimatedChevron from './AnimatedChevron'
import useAuth from '../hooks/useAuth'
import api from '../services/api'
import { clearSession } from '../services/authStore'

const menuItems = [
  { label: 'Beranda', href: '/#beranda' },
  {
    label: 'Riset',
    href: '/riset/proposal',
    submenu: [
      { label: 'Proposal Riset', href: '/riset/proposal' },
      { label: 'Hasil Riset', href: '/riset/hasil' },
    ],
  },
  { label: 'Inovasi', href: '#inovasi', submenu: [] },
  { label: 'Lomba', href: '#lomba', submenu: [] },
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

  if (pathname === '/') {
    if (hash === '#inovasi') {
      return 'Inovasi'
    }

    if (hash === '#lomba') {
      return 'Lomba'
    }

    return 'Beranda'
  }

  return null
}

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [activeMenu, setActiveMenu] = useState(getActiveMenu)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { isAuthenticated, user } = useAuth()
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
    const syncActiveMenu = () => setActiveMenu(getActiveMenu())

    window.addEventListener('popstate', syncActiveMenu)
    window.addEventListener('hashchange', syncActiveMenu)

    return () => {
      window.removeEventListener('popstate', syncActiveMenu)
      window.removeEventListener('hashchange', syncActiveMenu)
    }
  }, [])

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container header-inner">
        <a className="brand" href="/#beranda" aria-label="Rumah Brida - Beranda">
          <img src={logoRumahBrida} alt="Rumah BRIDA Sulawesi Tengah" />
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
                      onClick={() => {
                        closeAll()
                        setActiveMenu(item.label)
                      }}
                    >
                      {item.label}
                    </a>
                  )}
                  {hasSubmenu && (
                    <div className="submenu" id={panelId}>
                      {item.submenu.map((subitem) => (
                        <a
                          key={subitem.label}
                          href={subitem.href}
                          onClick={() => {
                            closeAll()
                            setActiveMenu(item.label)
                          }}
                        >
                          {subitem.label}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <a className="report-button" href="#lapor">Lapor</a>

        <div className={`header-account${isAccountMenuOpen ? ' is-open' : ''}`} ref={accountRef}>
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
            <a className="account-button" href="/masuk" onClick={closeAll}>Masuk</a>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
