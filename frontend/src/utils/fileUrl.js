const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

/**
 * Bangun URL absolut ke file yang disimpan di storage backend (mis. hasil `php artisan storage:link`).
 * Selalu mengarah ke origin backend, bukan origin frontend Vite,
 * supaya tidak salah ditangkap oleh SPA fallback routing frontend.
 *
 * @param {string} path - path relatif yang disimpan di database, mis. "profiles/abc.pdf"
 * @returns {string|null}
 */
export function storageUrl(path) {
  if (!path) return null
  const cleanPath = String(path).replace(/^\/+/, '')
  return `${BACKEND_ORIGIN}/storage/${cleanPath}`
}

export default storageUrl