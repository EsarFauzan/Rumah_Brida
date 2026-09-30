export const countWords = value => value.trim() ? value.trim().split(/\s+/).length : 0

export const innovationRequiredFields = ['title', 'innovator_name', 'reporting_year', 'innovation_type', 'government_affair']
export const researchRequiredFields = ['researcher_name', 'proposal_title', 'institution', 'research_coordinates', 'chapter_one', 'chapter_two', 'chapter_three']

export const hasValue = value => value !== null && value !== undefined && String(value).trim() !== ''

function validatePdf(file, maxMb) {
  if (!file) return ''
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) return 'Pilih berkas PDF.'
  if (file.size > maxMb * 1024 * 1024) return `Ukuran PDF maksimal ${maxMb} MB.`
  return ''
}

export function validateResearch(form, existingPdf = false) {
  const errors = {}
  for (const key of researchRequiredFields) if (!hasValue(form[key])) errors[key] = 'Wajib diisi sebelum mengirim proposal.'
  for (const [key, limit] of Object.entries({ researcher_name: 150, proposal_title: 255, institution: 180, research_coordinates: 100 })) {
    if (form[key]?.length > limit) errors[key] = `Maksimal ${limit} karakter.`
  }
  for (const key of ['chapter_one', 'chapter_two', 'chapter_three']) {
    if (countWords(form[key] || '') > 300) errors[key] = 'Maksimal 300 kata per BAB.'
  }
  const pdfError = validatePdf(form.pdf, 5)
  if (pdfError) errors.pdf = pdfError
  else if (!form.pdf && !existingPdf) errors.pdf = 'Unggah PDF proposal sebelum mengirim.'
  return errors
}

export function validateInnovation(form) {
  const errors = {}
  for (const key of innovationRequiredFields) if (!hasValue(form[key])) errors[key] = 'Wajib diisi.'
  for (const key of ['title', 'innovator_name', 'registration_number', 'government_affair', 'regional_agency']) {
    if (form[key]?.length > 255) errors[key] = 'Maksimal 255 karakter.'
  }
  const year = Number(form.reporting_year)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) errors.reporting_year = 'Tahun harus antara 2000 dan 2100.'
  for (const key of ['profile_pdf', 'report_pdf']) {
    const error = validatePdf(form[key], 10)
    if (error) errors[key] = error
  }
  return errors
}

export function focusFirstError(errors) {
  const name = Object.keys(errors)[0]
  if (!name) return
  requestAnimationFrame(() => {
    const field = document.getElementsByName(name)[0]
    field?.scrollIntoView({ block: 'center', behavior: 'instant' })
    field?.focus({ preventScroll: true })
  })
}
