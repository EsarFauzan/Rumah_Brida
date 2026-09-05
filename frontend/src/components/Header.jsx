import { useEffect, useRef, useState } from 'react'
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
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const headerRef = useRef(null)

  const closeAll = () => {
    setIsOpen(false)
    setOpenMenu(null)
  }

  const toggleSubmenu = (label) => {
    setOpenMenu((current) => (current === label ? null : label))
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
    if (!openMenu) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setOpenMenu(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      headerRef.current?.querySelector('.nav-trigger[aria-expanded="true"]')?.focus()
      setOpenMenu(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenu])

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

        <div className="header-account">
          {isAuthenticated ? (
            <>
              <span title={user?.email ?? ''}>{user?.name ?? 'Akun'}</span>
              <button className="account-button" type="button" disabled={isLoggingOut} onClick={logout}>
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
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
