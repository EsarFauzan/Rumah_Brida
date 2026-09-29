import { useEffect, useState } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import NewsSection from './components/NewsSection'
import NewsDetailPage from './pages/NewsDetailPage'
import NewsArchivePage from './pages/NewsArchivePage'
import LoginPage from './pages/LoginPage'
import ResearchProposalPage from './pages/ResearchProposalPage'
import ResearchDraftsPage from './pages/ResearchDraftsPage'
import ResearchResultsPage from './pages/ResearchResultsPage'
import ResearchProposalDetailPage from './pages/ResearchProposalDetailPage'
import AdminNewsPage from './pages/AdminNewsPage'
import Footer from './components/Footer'
import InovasiInputPage from './pages/InovasiInputPage'
import InovasiInfoPage from './pages/InovasiInfoPage'
import PublicInformationPage from './pages/PublicInformationPage'
import PublicResearchResultsPage from './pages/PublicResearchResultsPage'
import CompetitionRegistrationPage from './pages/CompetitionRegistrationPage'
import AdminCompetitionsPage from './pages/AdminCompetitionsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminAdministratorsPage from './pages/AdminAdministratorsPage'
import useAuth from './hooks/useAuth'
import './App.css'
import './ServiceDesign.css'

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)
  const { isAdministrator, isSuperAdmin } = useAuth()
  const isAdminWorkspace = /^\/(riset\/(proposal|draft|hasil)|inovasi\/(input|info|edit))(\/|$)/.test(pathname)

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
      return <Redirect to="/admin/login" />
    }

    if (pathname === '/admin/login') {
      if (isAdministrator) return <Redirect to="/admin" />
      return <LoginPage />
    }

    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      if (!isAdministrator) return <Redirect to="/admin/login" />
      if (pathname === '/admin/administrators' && !isSuperAdmin) return <Redirect to="/admin" />
      if (pathname === '/admin') return <AdminDashboardPage />
      if (pathname === '/admin/administrators') return <AdminAdministratorsPage />
      if (pathname === '/admin/berita') return <AdminNewsPage />
      if (pathname === '/admin/lomba') return <AdminCompetitionsPage />

      return <Redirect to="/admin" />
    }

    if (isAdminWorkspace && !isAdministrator) {
      return <Redirect to="/admin/login" />
    }

    if (pathname === '/berita') {
      return <NewsArchivePage />
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

    if (pathname === '/riset/draft') {
      return <ResearchDraftsPage />
    }

    if (pathname === '/riset/hasil') {
      return <ResearchResultsPage />
    }

    const inovasiEditMatch = pathname.match(/^\/inovasi\/edit\/(\d+)$/)
    if (inovasiEditMatch) {
      return <InovasiInputPage innovationId={inovasiEditMatch[1]} />
    }

    if (pathname === '/inovasi/input') {
      return <InovasiInputPage />
    }

    if (pathname === '/inovasi/info') {
      return <InovasiInfoPage />
    }

    if (pathname === '/info-publik' || pathname === '/info-publik/peneliti') {
      return <PublicInformationPage />
    }

    if (pathname === '/info-publik/hasil-riset') {
      return <PublicResearchResultsPage />
    }

    if (pathname === '/lomba' || pathname === '/lomba/pendaftaran') {
      return <CompetitionRegistrationPage />
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

function Redirect({ to }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.history.replaceState({}, '', to)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [to])

  return <div className="route-guard-state" role="status">Mengalihkan...</div>
}

export default App
