import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const page = source('../src/pages/InovasiInputPage.jsx')
const css = source('../src/App.css')

test('halaman Input Inovasi memakai wizard empat tahap', () => {
  assert.match(page, /aria-label="Tahapan pengisian"/)
  assert.match(page, /stepIndex === 0 &&/)
  assert.match(page, /stepIndex === 1 &&/)
  assert.match(page, /stepIndex === 2 &&/)
  assert.match(page, /stepIndex === 3 &&/)
  assert.match(page, /aria-current=\{isActive \? 'step' : undefined\}/)
})

test('wizard memetakan Timeline ke tahap 3 dan Berkas Pendukung ke tahap 4', () => {
  const timelineBlock = page.match(/\{stepIndex === 2 && \([\s\S]*?className="inovasi-grid2 wiz-timeline"[\s\S]*?\n\s*\)\}/)?.[0]
  const filesBlock = page.match(/\{stepIndex === 3 && \([\s\S]*?className="inovasi-grid2"[\s\S]*?\n\s*\)\}/)?.[0]

  assert.ok(timelineBlock)
  assert.ok(filesBlock)
  assert.match(timelineBlock, /name="trial_date"/)
  assert.match(timelineBlock, /name="implementation_date"/)
  assert.match(timelineBlock, /name="ratification_date"/)
  assert.doesNotMatch(timelineBlock, /name="profile_pdf"|name="report_pdf"/)
  assert.match(filesBlock, /name="profile_pdf"/)
  assert.match(filesBlock, /name="report_pdf"/)
})

test('Timeline memakai grid dan gaya field yang sama dengan Informasi Utama', () => {
  const gridContainers = page.match(/className="inovasi-grid2[^"]*"/g) ?? []
  assert.equal(gridContainers.length, 4)
  assert.match(page, /{stepIndex === 0 && \([\s\S]*?className="inovasi-grid2"[\s\S]*?\n\s*\)\}/)
  assert.match(page, /{stepIndex === 2 && \([\s\S]*?className="inovasi-grid2 wiz-timeline"[\s\S]*?\n\s*\)\}/)
  assert.doesNotMatch(page, /inovio-timeline-fields/)
  assert.doesNotMatch(css, /inovio-timeline-fields/)
  assert.match(css, /\.wiz-timeline \.inovasi-field input\[type="date"\] \{\s*padding-left: 38px;/)
})

test('wizard tidak lagi memakai sidebar langkah dan panel progress lama', () => {
  assert.doesNotMatch(page, /inovasi-steps|inovasi-layout|inovasi-progress-panel|FormProgress|IntersectionObserver/)
})

test('wizard memvalidasi tahap aktif sebelum lanjut dan melompat ke tahap berisi kesalahan', () => {
  assert.match(page, /advanceStep/)
  assert.match(page, /jumpToErrorStep/)
  assert.match(page, /focusFirstError/)
})

test('wizard menjaga data dan memungkinkan kembali ke tahap sebelumnya', () => {
  assert.match(page, /Kembali/)
  assert.match(page, /goToStep\(stepIndex - 1\)/)
  assert.match(page, /prefers-reduced-motion: reduce/)
  assert.match(css, /@keyframes wiz-panel-in/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.wiz-panel \{ animation: none; \}/)
})

test('wizard tetap mengirim payload dan review yang sama', () => {
  assert.match(page, /SubmissionReview title="Ringkasan Inovasi"/)
  assert.match(page, /payload\.append\('_method', 'PUT'\)/)
  assert.match(page, /validateInnovation\(form\)/)
})

test('header halaman wizard memakai padding padat dan lebar setinggi kolom wizard', () => {
  assert.match(
    css,
    /\.inovasi-wizard-page \.service-page-header \{\s*padding: 18px 20px 20px;\s*\}/
  )
  assert.match(
    css,
    /\.inovasi-wizard-page \.service-page-header \.service-page-header-inner,\s*\n?\.inovasi-wizard-page \.service-page-header\.is-narrow \.service-page-header-inner \{ max-width: 720px; \}/
  )
  assert.doesNotMatch(css, /\.inovasi-wizard-page \.service-page-header-inner \{ max-width: 760px; \}/)
})
