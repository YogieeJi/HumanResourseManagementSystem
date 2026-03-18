import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Cross, Eye, EyeOff, Loader2 } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@cityhospital.in',        password: 'admin123',    color: '#6366f1', desc: 'Suresh Nair' },
  { role: 'CNO / Manager', email: 'meena.krishnan@cityhospital.in', password: 'manager123', color: '#ec4899', desc: 'Meena Krishnan' },
  { role: 'Doctor / Staff', email: 'neha.gupta@cityhospital.in',  password: 'emp123',       color: '#10b981', desc: 'Dr. Neha Gupta' },
]

export default function Login() {
  const { login } = useAuth()
  const { show }  = useToast()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      show('Welcome back!', 'success')
      navigate('/dashboard')
    } catch (err) {
      show(err.response?.data?.message || 'Invalid credentials', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Hospital Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9">
              <rect x="9" y="2" width="6" height="20" rx="1" fill="white" opacity="0.9"/>
              <rect x="2" y="9" width="20" height="6" rx="1" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">City Hospital</h1>
          <p className="text-sm text-blue-600 font-medium mt-0.5">HRMS — Staff Portal</p>
          <p className="text-xs text-slate-400 mt-1">Powered by HMS · Human Resource Management</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Staff Email / Username</label>
              <input type="email" className="form-input" placeholder="you@cityhospital.in"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="form-input pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5 text-base bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 size={18} className="spinner" /> : 'Sign In to Portal'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-6">
          <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wide font-medium">Quick Demo Login</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.role} onClick={() => setForm({ email: acc.email, password: acc.password })}
                className="bg-white border border-slate-200 rounded-xl p-3 text-center hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: acc.color }}>
                  {acc.role[0]}
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-tight">{acc.role}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{acc.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          For IT support, contact <span className="text-blue-600">it@cityhospital.in</span>
        </p>
      </div>
    </div>
  )
}
