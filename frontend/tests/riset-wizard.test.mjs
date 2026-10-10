import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const page = source('../src/pages/ResearchProposalPage.jsx')
const css = source('../src/App.css')

test('halaman Proposal Riset memakai wizard empat tahap', () => {
  assert.match(page, /aria-label="Tahapan pengisian"/)
  assert.match(page, /stepIndex === 0 &&/)
  assert.match(page, /stepIndex === 1 &&/)
  assert.match(page, /stepIndex === 2 &&/)
  assert.match(page, /stepIndex === 3 &&/)
  assert.match(page, /aria-current=\{isActive \? 'step' : undefined\}/)
})

test('wizard Proposal Riset tidak lagi memakai sidebar dan panel progress lama', () => {
  assert.doesNotMatch(page, /FormProgress|IntersectionObserver|riset-sidebar|riset-steps/)
})

test('wizard Proposal Riset memakai grid kontrol yang sama dengan Input Inovasi', () => {
  const gridContainers = page.match(/className="inovasi-grid2"/g) ?? []
  assert.equal(gridContainers.length, 2)
  assert.match(page, /{stepIndex === 0 && \([\s\S]*?className="inovasi-grid2"[\s\S]*?\n\s*\)\}/)
  assert.match(page, /{stepIndex === 1 && \([\s\S]*?className="inovasi-grid2"[\s\S]*?\n\s*\)\}/)
  assert.match(page, /className="inovasi-chevron"/)
  assert.doesNotMatch(page, /inovasi-select-chevron/)
})

test('tahap Isi Proposal memakai kelas partitur bersama dan textarea bergrid sama', () => {
  assert.match(page, /className="wiz-chapters"/)
  assert.match(page, /className="wiz-chapter-head"/)
  assert.match(page, /const chapters = \[/)
  assert.match(page, /name: 'chapter_one'/)
  assert.match(page, /name: 'chapter_two'/)
  assert.match(page, /name: 'chapter_three'/)
  assert.match(page, /chapters\.map\(\(chapter\)/)
  assert.match(css, /\.wiz-chapters \{ display: flex; flex-direction: column;/)
  assert.match(css, /\.wiz-chapter-head \{ display: flex;/)
  assert.match(css, /\.inovasi-field textarea \{/)
})

test('tahap Berkas memakai label berkas bersama dan field unggah PDF', () => {
  assert.match(page, /className="wiz-file"[\s\S]*?className="wiz-file-label"/)
  assert.match(page, /inputId="proposal-pdf"/)
  assert.match(page, /maxMb=\{5\}/)
})

test('wizard Proposal Riset memvalidasi tahap aktif sebelum lanjut', () => {
  assert.match(page, /const advanceStep = \(\) => \{/)
  assert.match(page, /validateResearch\(form, Boolean\(existingPdfName\)\)/)
  assert.match(page, /focusFirstError/)
  assert.match(page, /goToStep\(stepIndex - 1\)/)
})

test('wizard Proposal Riset tetap mengirim payload draft dan submit yang sama', () => {
  assert.match(page, /payload\.append\('action', action\)/)
  assert.match(page, /payload\.append\('_method', 'PUT'\)/)
  assert.match(page, /SubmissionReview title="Ringkasan Proposal"/)
})

test('tombol Simpan Draft berada di baris wizard aktif dan dihilangkan di tahap akhir', () => {
  assert.match(page, /submitProposal\('draft'\)/)
  assert.match(page, /className="secondary-form-button wiz-draft"/)
  assert.doesNotMatch(page, /wiz-draft-bar|wiz-draft-hint/)
})

test('wizard Proposal Riset menghormati prefers-reduced-motion', () => {
  assert.match(page, /prefers-reduced-motion/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.wiz-panel \{ animation: none; \}/)
})