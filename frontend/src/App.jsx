import { useEffect, useState } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import NewsSection from './components/NewsSection'
import NewsDetailPage from './pages/NewsDetailPage'
import LoginPage from './pages/LoginPage'
import ResearchProposalPage from './pages/ResearchProposalPage'
import ResearchResultsPage from './pages/ResearchResultsPage'
import ResearchProposalDetailPage from './pages/ResearchProposalDetailPage'
import Footer from './components/Footer'
import './App.css'

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handleNavigation = () => {
      setPathname(window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  const renderPage = () => {
    if (pathname === '/masuk') {
      return <LoginPage />
    }

    if (pathname.startsWith('/berita/')) {
      return <NewsDetailPage pathname={pathname} />
    }

    const editMatch = pathname.match(/^\/riset\/proposal\/(\d+)\/edit$/)
    if (editMatch) {
      return <ResearchProposalPage proposalId={editMatch[1]} />
    }

    const detailMatch = pathname.match(/^\/riset\/hasil\/(\d+)$/)
    if (detailMatch) {
      return <ResearchProposalDetailPage proposalId={detailMatch[1]} />
    }

    if (pathname === '/riset/proposal') {
      return <ResearchProposalPage />
    }

    if (pathname === '/riset/hasil') {
      return <ResearchResultsPage />
    }

    return (
      <>
        <HeroSection />
        <NewsSection />
      </>
    )
  }

  return (
    <div className="site-shell">
      <Header />
      <main>{renderPage()}</main>
      <Footer />
    </div>
  )
}

export default App
