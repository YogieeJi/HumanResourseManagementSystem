import { useState } from 'react'
import { User, Lock, Save } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, StatusBadge } from '../components/UI'

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316']

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const { show } = useToast()
  const [tab, setTab]     = useState('profile')
  const [form, setForm]   = useState({ first_name: user?.first_name||'', last_name: user?.last_name||'', phone: user?.phone||'', address: user?.address||'', avatar_color: user?.avatar_color||COLORS[0] })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving]   = useState(false)

  const handleProfile = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/employees/${user.id}`, form)
      await refreshUser()
      show('Profile updated', 'success')
    } catch (err) { show(err.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const handlePassword = async e => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword)
      return show('Passwords do not match', 'error')
    if (pwdForm.newPassword.length < 6)
      return show('Password must be at least 6 characters', 'error')
    setSaving(true)
    try {
      await api.put('/auth/change-password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      show('Password changed successfully', 'success')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { show(err.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <Avatar name={`${user?.first_name} ${user?.last_name}`} color={form.avatar_color} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.first_name} {user?.last_name}</h2>
            <p className="text-sm text-slate-500">{user?.designation}</p>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={user?.role} />
              <span className="badge badge-blue">{user?.department_name || 'No Department'}</span>
            </div>
          </div>
          <div className="ml-auto text-right text-sm text-slate-500">
            <p className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{user?.emp_code}</p>
            <p className="mt-1 text-xs">Joined {user?.join_date || '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[['profile', 'Personal Info'], ['password', 'Change Password']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={handleProfile} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">First Name</label>
                <input className="form-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div><label className="form-label">Last Name</label>
                <input className="form-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div><label className="form-label">Email</label>
              <input className="form-input" value={user?.email} disabled className="form-input bg-slate-50 text-slate-400 cursor-not-allowed" /></div>
            <div><label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number" /></div>
            <div><label className="form-label">Address</label>
              <textarea className="form-input h-20 resize-none" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Your address" /></div>
            <div>
              <label className="form-label">Avatar Color</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.avatar_color === c ? 'border-slate-800 scale-110' : 'border-transparent hover:border-slate-400'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card p-6">
          <form onSubmit={handlePassword} className="space-y-4">
            <div><label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={pwdForm.currentPassword}
                onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} required /></div>
            <div><label className="form-label">New Password</label>
              <input type="password" className="form-input" value={pwdForm.newPassword}
                onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} /></div>
            <div><label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={pwdForm.confirmPassword}
                onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Lock size={15} /> {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
