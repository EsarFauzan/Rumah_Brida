import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isAdministrator, isSuperAdmin } from '../src/utils/auth.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const app = source('../src/App.jsx')
const header = source('../src/components/Header.jsx')
const footer = source('../src/components/Footer.jsx')
const login = source('../src/pages/LoginPage.jsx')
const dashboard = source('../src/pages/AdminDashboardPage.jsx')
const administrators = source('../src/pages/AdminAdministratorsPage.jsx')
const researchResults = source('../src/pages/ResearchResultsPage.jsx')
const researchProposal = source('../src/pages/ResearchProposalPage.jsx')

test('semua route admin melewati guard role terpusat', () => {
  assert.match(app, /pathname === '\/admin' \|\| pathname\.startsWith\('\/admin\/'\)/)
  assert.match(app, /if \(!isAdministrator\) return <Redirect to="\/admin\/login"/)
  assert.match(app, /pathname === '\/admin\/login'/)
  assert.match(app, /pathname === '\/admin\/administrators' && !isSuperAdmin/)
})

test('fitur verifikasi proposal sudah dihapus', () => {
  assert.doesNotMatch(app, /AdminResearchProposalsPage|\/admin\/proposal/)
  assert.doesNotMatch(dashboard, /Verifikasi Proposal|\/admin\/proposal/)
})

test('navbar publik tidak menampilkan login atau modul operasional', () => {
  assert.doesNotMatch(header, /href="\/masuk"/)
  assert.match(header, /label: 'Riset',[\s\S]*?adminOnly: true/)
  assert.match(header, /label: 'Inovasi',[\s\S]*?adminOnly: true/)
  assert.match(header, /menuItems\.filter\(\(item\) => !item\.adminOnly \|\| isAdministrator\)/)
  assert.match(header, /Buka Panel Admin/)
})

test('submenu daftar lomba hanya tersedia untuk administrator', () => {
  assert.match(header, /label: 'Daftar Lomba', href: '\/admin\/lomba'[^\n]*adminOnly: true/)
  assert.match(header, /item\.submenu\?\.filter\(\(subitem\) => !subitem\.adminOnly \|\| isAdministrator\)/)
})

test('hasil riset menggabungkan tabel proposal terkirim dan draft', () => {
  assert.match(header, /label: 'Hasil Riset', href: '\/riset\/hasil'[^\n]*Kelola proposal terkirim dan draft/)
  assert.match(app, /pathname === '\/riset\/draft'[\s\S]*?Redirect to="\/riset\/hasil#draft"/)
  assert.match(researchResults, /status: 'submitted'/)
  assert.match(researchResults, /status: 'draft'/)
  assert.match(researchResults, /id="draft"/)
  assert.match(researchResults, /id="submitted"/)
})

test('mengirim draft kembali ke hasil riset dengan notifikasi sukses', () => {
  assert.match(researchProposal, /proposalStatus === 'draft' && action === 'submit'[\s\S]*?navigateTo\('\/riset\/hasil', \{ researchSuccess: response\.data\.message \}\)/)
  assert.match(researchResults, /window\.history\.state\?\.researchSuccess/)
  assert.match(researchResults, /className="research-success-toast" role="status"/)
})

test('admin dan superadmin berbagi akses operasional', () => {
  assert.equal(isAdministrator({ role: 'admin' }), true)
  assert.equal(isAdministrator({ role: 'superadmin' }), true)
  assert.equal(isAdministrator({ role: 'researcher' }), false)
  assert.equal(isSuperAdmin({ role: 'admin' }), false)
  assert.equal(isSuperAdmin({ role: 'superadmin' }), true)
})

test('kelola administrator hanya dipublikasikan kepada superadmin', () => {
  assert.match(dashboard, /isSuperAdmin[\s\S]*Kelola Administrator/)
  assert.match(administrators, /\/admin\/administrators/)
  assert.doesNotMatch(administrators, /name="role"|role.*<select/)
})

test('halaman autentikasi hanya menyediakan login administrator', () => {
  assert.match(login, /Masuk ke akun/)
  assert.doesNotMatch(login, /auth\/register|Daftar Akun|password_confirmation/)
})

test('footer menyediakan jalur login admin yang tidak dominan', () => {
  assert.match(footer, /href="\/admin\/login">Login Admin/)
})
