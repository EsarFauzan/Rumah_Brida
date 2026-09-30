import test from 'node:test'
import assert from 'node:assert/strict'
import { validateResearch, validateInnovation, countWords, hasValue } from '../src/utils/submission.js'

const research = {
  researcher_name: 'Peneliti', proposal_title: 'Riset Daerah',
  institution: 'Universitas Tadulako', research_coordinates: '-0.8, 119.8',
  chapter_one: 'Pendahuluan.', chapter_two: 'Rancang bangun.', chapter_three: 'Hasil.',
  pdf: { name: 'proposal.pdf', type: 'application/pdf', size: 1024 },
}
const innovation = {
  title: 'Layanan Daerah', innovator_name: 'Peneliti', reporting_year: 2026,
  innovation_type: 'Inovasi Pelayanan Publik', government_affair: 'Pendidikan',
}
test('proposal lengkap dan PDF lama valid tanpa unggah ulang', () => {
  assert.deepEqual(validateResearch(research), {})
  assert.deepEqual(validateResearch({ ...research, pdf: null }, true), {})
  assert.ok(validateResearch({ ...research, pdf: null }).pdf)
})
test('kolom wajib, batas backend, dan batas kata ditolak sebelum review', () => {
  assert.equal(hasValue('  '), false)
  assert.equal(countWords(' satu\n dua '), 2)
  assert.ok(validateResearch({ ...research, researcher_name: ' ' }).researcher_name)
  assert.ok(validateResearch({ ...research, researcher_name: 'a'.repeat(151) }).researcher_name)
  assert.ok(validateResearch({ ...research, institution: 'a'.repeat(181) }).institution)
  assert.ok(validateResearch({ ...research, research_coordinates: 'a'.repeat(101) }).research_coordinates)
  assert.ok(validateResearch({ ...research, chapter_one: 'kata '.repeat(301) }).chapter_one)
})
test('batas dan format unggahan PDF sesuai jenis form', () => {
  assert.ok(validateResearch({ ...research, pdf: { name: 'x.png', type: 'image/png', size: 100 } }).pdf)
  assert.ok(validateResearch({ ...research, pdf: { ...research.pdf, size: 5 * 1024 * 1024 + 1 } }).pdf)
  assert.ok(validateInnovation({ ...innovation, profile_pdf: { ...research.pdf, size: 10 * 1024 * 1024 + 1 } }).profile_pdf)
  assert.deepEqual(validateInnovation({ ...innovation, profile_pdf: { ...research.pdf, size: 10 * 1024 * 1024 } }), {})
})
test('inovasi tidak mewajibkan tanggal, OPD, nomor registrasi atau berkas', () => {
  assert.deepEqual(validateInnovation(innovation), {})
  assert.ok(validateInnovation({ ...innovation, title: ' ' }).title)
  for (const reporting_year of [1999, 2101, 2026.5, '', 'abc']) {
    assert.ok(validateInnovation({ ...innovation, reporting_year }).reporting_year)
  }
})
test('urusan pemerintahan menerima teks bebas maksimal 255 karakter', () => {
  assert.deepEqual(validateInnovation({ ...innovation, government_affair: 'Komunikasi dan Informatika' }), {})
  assert.ok(validateInnovation({ ...innovation, government_affair: 'x'.repeat(256) }).government_affair)
})
