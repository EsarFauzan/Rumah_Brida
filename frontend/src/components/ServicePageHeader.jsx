import { ChevronRight } from 'lucide-react'

export default function ServicePageHeader({ section, title, description, total, totalLabel, action, narrow = false }) {
  return <header className={`service-page-header${narrow ? ' is-narrow' : ''}`}>
    <div className="service-page-header-inner">
      <nav className="service-breadcrumb" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={13} aria-hidden="true" /><span>{section}</span></nav>
      <div className="service-page-heading">
        <div><div className="service-page-title"><h1>{title}</h1>{total !== undefined && <span className="service-page-total">{total ?? '-'} {totalLabel}</span>}</div><p>{description}</p></div>
        {action && <div className="service-page-action">{action}</div>}
      </div>
    </div>
  </header>
}
