import { X, Loader2 } from 'lucide-react'

// Avatar with initials
export function Avatar({ name = '', color = '#6366f1', size = 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  )
}

// Modal wrapper
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const maxWidths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${maxWidths[size]} animate-fadeInUp`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Spinner
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="spinner text-indigo-600" />
}

// Loading screen
export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}

// Status badge
export function StatusBadge({ status }) {
  const map = {
    active:    ['badge-green', 'Active'],
    inactive:  ['badge-gray',  'Inactive'],
    present:   ['badge-green', 'Present'],
    absent:    ['badge-red',   'Absent'],
    half_day:  ['badge-yellow','Half Day'],
    pending:   ['badge-yellow','Pending'],
    approved:  ['badge-green', 'Approved'],
    rejected:  ['badge-red',   'Rejected'],
    admin:     ['badge-purple','Admin'],
    manager:   ['badge-blue',  'Manager'],
    employee:  ['badge-gray',  'Employee'],
  }
  const [cls, label] = map[status] || ['badge-gray', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

// Empty state
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        {Icon && <Icon size={28} className="text-slate-400" />}
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mb-4 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  )
}

// Confirm dialog
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-sm animate-fadeInUp">
        <div className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={() => { onConfirm(); onClose(); }}
              className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pagination
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
      <div className="flex gap-1">
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>{p}</button>
        ))}
      </div>
    </div>
  )
}

// Stats card
export function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-indigo-100', iconColor = 'text-indigo-600' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
