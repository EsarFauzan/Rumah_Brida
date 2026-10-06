import { CalendarDays, ClipboardCheck, FileText, Megaphone, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import FieldRequirement from '../components/FieldRequirement'
import Pagination from '../components/Pagination'
import ServicePageHeader from '../components/ServicePageHeader'
import api from '../services/api'

const competitionTypeFallback = ['Lomba untuk ASN', 'Lomba untuk OPD', 'Lomba untuk Masyarakat']
const emptyPagination = { current_page: 1, last_page: 1, per_page: 9, total: 0 }
const emptyRegistration = { type: '', competition_id: '', name: '', nik: '', address: '', product_name: '' }
const formatDate = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
  : '-'

function CompetitionRegistrationPage() {
  const formRef = useRef(null)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [options, setOptions] = useState([])
  const [types, setTypes] = useState(competitionTypeFallback)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [registration, setRegistration] = useState(emptyRegistration)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const availableCompetitions = useMemo(
    () => options.filter((competition) => competition.type === registration.type),
    [options, registration.type],
  )
  const selectedCompetition = options.find((competition) => String(competition.id) === String(registration.competition_id))

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      api.get('/competitions', { params: { page, per_page: 9 }, signal: controller.signal })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          setItems(data.data)
          setPagination(data.pagination)
        })
        .catch(() => { if (!controller.signal.aborted) setError('Informasi lomba belum dapat dimuat.') })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [page])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setOptionsLoading(true)
      api.get('/competitions/options', { signal: controller.signal })
        .then(({ data }) => {
          if (controller.signal.aborted) return
          setOptions(data.data)
          setTypes(data.types?.length ? data.types : competitionTypeFallback)
        })
        .catch(() => {
          if (!controller.signal.aborted) setFeedback({ type: 'error', text: 'Pilihan lomba belum dapat dimuat.' })
        })
        .finally(() => { if (!controller.signal.aborted) setOptionsLoading(false) })
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  const updateRegistration = (event) => {
    const { name, value } = event.target
    if (name === 'type') {
      setRegistration((current) => ({ ...current, type: value, competition_id: '' }))
    } else if (name === 'nik') {
      setRegistration((current) => ({ ...current, nik: value.replace(/\D/g, '').slice(0, 16) }))
    } else {
      setRegistration((current) => ({ ...current, [name]: value }))
    }
    setFeedback(null)
  }

  const chooseCompetition = (competition) => {
    if (!competition.is_registration_open) return
    setRegistration((current) => ({ ...current, type: competition.type, competition_id: String(competition.id) }))
    setFeedback(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitRegistration = async (event) => {
    event.preventDefault()
    if (submitting || !registration.competition_id) return
    setSubmitting(true)
    setFeedback(null)

    try {
      const { data } = await api.post(`/competitions/${registration.competition_id}/registrations`, {
        name: registration.name,
        nik: registration.nik,
        address: registration.address,
        product_name: registration.product_name,
      })
      setFeedback({ type: 'success', text: data.message })
      setRegistration((current) => ({ ...current, name: '', nik: '', address: '', product_name: '' }))
    } catch (requestError) {
      const errors = requestError.response?.data?.errors
      setFeedback({
        type: 'error',
        text: (errors ? Object.values(errors).flat()[0] : null) ?? requestError.response?.data?.message ?? 'Pendaftaran lomba gagal dikirim.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="competition-page">
    <ServicePageHeader
      section="Lomba"
      title="Pendaftaran Lomba"
      description="Pilih lomba yang sesuai dan kirim data pendaftaran Anda."
      total={pagination.total}
      totalLabel="lomba"
    />
    <div className="competition-container">
      <div className="competition-intro">
        <div>
          <span className="competition-kicker">Pendaftaran publik</span>
          <h2>Kesempatan berinovasi untuk Sulawesi Tengah.</h2>
        </div>
        <p>Periksa jenis peserta, periode, dan Juknis sebelum mengirim data pendaftaran.</p>
      </div>
      <ol className="competition-steps" aria-label="Tahapan pendaftaran lomba">
        <li><Megaphone size={20} aria-hidden="true" /><span><strong>Pilih lomba</strong><small>Sesuaikan kategori dengan peserta.</small></span></li>
        <li><ClipboardCheck size={20} aria-hidden="true" /><span><strong>Baca Juknis</strong><small>Periksa ketentuan dan periode lomba.</small></span></li>
        <li><CalendarDays size={20} aria-hidden="true" /><span><strong>Kirim pendaftaran</strong><small>Lengkapi identitas dan nama produk.</small></span></li>
      </ol>

      <section className="competition-registration-panel" ref={formRef} aria-labelledby="competition-registration-title">
        <header>
          <span>Formulir publik</span>
          <h2 id="competition-registration-title">Daftar sebagai peserta</h2>
          <p>Lengkapi data pendaftaran dengan benar sebelum mengirim.</p>
        </header>
        <form onSubmit={submitRegistration}>
          <fieldset>
            <legend>Pilihan Lomba</legend>
            <div className="competition-registration-fields">
              <label>
                <span>Jenis lomba<FieldRequirement /></span>
                <select name="type" value={registration.type} onChange={updateRegistration} required disabled={optionsLoading}>
                  <option value="">Pilih jenis lomba</option>
                  {types.map((type) => <option value={type} key={type}>{type}</option>)}
                </select>
              </label>
              <label>
                <span>Nama lomba<FieldRequirement /></span>
                <select name="competition_id" value={registration.competition_id} onChange={updateRegistration} required disabled={!registration.type || optionsLoading}>
                  <option value="">{registration.type ? 'Pilih nama lomba' : 'Pilih jenis lomba terlebih dahulu'}</option>
                  {availableCompetitions.map((competition) => <option value={competition.id} key={competition.id}>{competition.name}</option>)}
                </select>
              </label>
            </div>
            {registration.type && !optionsLoading && availableCompetitions.length === 0 && <p className="competition-registration-note">Belum ada lomba aktif untuk jenis ini.</p>}
          </fieldset>

          <fieldset>
            <legend>Pendaftaran</legend>
            <div className="competition-registration-fields">
              <label>
                <span>Nama<FieldRequirement /></span>
                <input name="name" value={registration.name} onChange={updateRegistration} maxLength="255" autoComplete="name" placeholder="Nama lengkap peserta" required />
              </label>
              <label>
                <span>NIK<FieldRequirement /></span>
                <input name="nik" value={registration.nik} onChange={updateRegistration} inputMode="numeric" pattern="[0-9]{16}" minLength="16" maxLength="16" autoComplete="off" placeholder="16 digit NIK" required />
              </label>
              <label className="is-wide">
                <span>Alamat<FieldRequirement /></span>
                <textarea name="address" value={registration.address} onChange={updateRegistration} maxLength="1000" autoComplete="street-address" placeholder="Alamat lengkap peserta" required />
              </label>
              <label className="is-wide">
                <span>Nama produk<FieldRequirement /></span>
                <input name="product_name" value={registration.product_name} onChange={updateRegistration} maxLength="255" placeholder="Nama produk atau karya yang didaftarkan" required />
              </label>
            </div>
          </fieldset>

          <footer>
            <span>{selectedCompetition ? `${selectedCompetition.code} | ${selectedCompetition.name}` : 'Pilih lomba sebelum mengirim'}</span>
            <button className="primary-form-button" type="submit" disabled={submitting || optionsLoading || !registration.competition_id}>
              <Send size={16} aria-hidden="true" /> {submitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </footer>
        </form>
        {feedback && <p className={`form-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
      </section>

      <div className="competition-list-heading">
        <span>Informasi lomba</span>
        <h2>Daftar lomba tersedia</h2>
      </div>
      {error ? <div className="competition-empty" role="alert"><strong>Informasi belum tersedia</strong><p>{error}</p></div>
        : loading ? <div className="competition-public-loading" aria-label="Memuat lomba"><span /><span /><span /></div>
          : items.length === 0 ? <div className="competition-empty" role="status"><strong>Belum ada pendaftaran yang dipublikasikan</strong><p>Informasi lomba akan muncul di halaman ini setelah ditambahkan admin.</p></div>
            : <div className="competition-public-grid">{items.map((item) => <article key={item.id}>
              <header><span className={`competition-status is-${item.is_registration_open ? 'open' : 'closed'}`}>{item.is_registration_open ? 'Pendaftaran Buka' : 'Pendaftaran Tutup'}</span><small>{item.code}</small></header>
              <div><span className="competition-type">{item.type}</span><h3>{item.name}</h3><p>{item.description}</p></div>
              <footer>
                <span><CalendarDays size={16} aria-hidden="true" /><span><small>Periode</small><strong>{formatDate(item.opening_date)} - {formatDate(item.closing_date)}</strong></span></span>
                <div className="competition-card-actions"><a href={item.guideline_url} target="_blank" rel="noreferrer"><FileText size={16} aria-hidden="true" /> Juknis</a>{item.is_registration_open && <button type="button" onClick={() => chooseCompetition(item)}>Daftar</button>}</div>
              </footer>
            </article>)}</div>}
      {!loading && !error && <Pagination pagination={pagination} onPageChange={setPage} />}
    </div>
  </section>
}

export default CompetitionRegistrationPage
