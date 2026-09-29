import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const adminPage = source('../src/pages/AdminCompetitionsPage.jsx')
const publicPage = source('../src/pages/CompetitionRegistrationPage.jsx')

test('form daftar lomba memuat seluruh field operasional', () => {
  for (const field of ['code', 'name', 'description', 'opening_date', 'closing_date', 'status', 'type', 'guideline']) {
    assert.match(adminPage, new RegExp(`name="${field}"`))
  }

  assert.match(adminPage, /<option value="open">Buka<\/option>/)
  assert.match(adminPage, /<option value="closed">Tutup<\/option>/)
  assert.match(adminPage, /Lomba untuk ASN/)
  assert.match(adminPage, /Lomba untuk OPD/)
  assert.match(adminPage, /Lomba untuk Masyarakat/)
  assert.match(adminPage, /accept="application\/pdf,\.pdf"/)
})

test('kelola lomba memakai endpoint admin dan mendukung edit serta hapus', () => {
  assert.match(adminPage, /api\.get\('\/admin\/competitions'/)
  assert.match(adminPage, /api\.post\('\/admin\/competitions'/)
  assert.match(adminPage, /api\.post\(`\/admin\/competitions\/\$\{editingId\}`/)
  assert.match(adminPage, /api\.delete\(`\/admin\/competitions\/\$\{toDelete\.id\}`/)
  assert.match(adminPage, /data\.append\('_method', 'PUT'\)/)
})

test('halaman pendaftaran publik membaca data dan menautkan Juknis', () => {
  assert.match(publicPage, /api\.get\('\/competitions'/)
  assert.match(publicPage, /api\.get\('\/competitions\/options'/)
  assert.match(publicPage, /href=\{item\.guideline_url\}/)
  assert.match(publicPage, /Pendaftaran Buka/)
  assert.match(publicPage, /Pendaftaran Tutup/)
})

test('form publik mengirim seluruh data pendaftaran peserta', () => {
  for (const field of ['type', 'competition_id', 'name', 'nik', 'address', 'product_name']) {
    assert.match(publicPage, new RegExp(`name="${field}"`))
  }

  assert.match(publicPage, /pattern="\[0-9\]\{16\}"/)
  assert.match(publicPage, /api\.post\(`\/competitions\/\$\{registration\.competition_id\}\/registrations`/)
  assert.match(publicPage, /Lomba untuk ASN/)
  assert.match(publicPage, /Lomba untuk OPD/)
  assert.match(publicPage, /Lomba untuk Masyarakat/)
})
