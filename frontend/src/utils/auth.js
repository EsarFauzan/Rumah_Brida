export const isAdministrator = (user) => ['admin', 'superadmin'].includes(user?.role)

export const isSuperAdmin = (user) => user?.role === 'superadmin'

export const administratorRoleLabel = (user) => (isSuperAdmin(user) ? 'Superadmin' : 'Administrator')
