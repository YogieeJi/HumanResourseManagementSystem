import { useState, useEffect, useCallback } from 'react'
import { Plus, Check, X, Calendar } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, Modal, StatusBadge, LoadingScreen, EmptyState, ConfirmDialog } from '../components/UI'

const LEAVE_TYPES = {
  casual:     { label:'Casual Leave (CL)',         badge:'badge-blue'   },
  sick:       { label:'Sick Leave (SL)',            badge:'badge-red'    },
  earned:     { label:'Earned Leave (EL/PL)',       badge:'badge-green'  },
  maternity:  { label:'Maternity Leave',            badge:'badge-purple' },
  paternity:  { label:'Paternity Leave',            badge:'badge-blue'   },
  conference: { label:'CME / Conference Leave',     badge:'badge-yellow' },
  other:      { label:'Other Leave',               badge:'badge-gray'   },
}

export default function Leave() {
  const { user, canManage } = useAuth()
  const { show } = useToast()
  const [leaves, setLeaves]   = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter]     = useState(String(new Date().getFullYear()))
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, id:null })
  const [form, setForm]       = useState({ leave_type:'casual', start_date:'', end_date:'', reason:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (yearFilter) params.year = yearFilter
      const [lRes, bRes] = await Promise.all([api.get('/leave', { params }), api.get(`/leave/balance/${user.id}`)])
      setLeaves(lRes.data.data)
      setBalance(bRes.data.data)
    } finally { setLoading(false) }
  }, [statusFilter, yearFilter, user.id])

  useEffect(() => { load() }, [load])

  const handleApply = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/leave', form)
      show('Leave request submitted', 'success')
      setModal(false)
      setForm({ leave_type:'casual', start_date:'', end_date:'', reason:'' })
      load()
    } catch (err) { show(err.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const handleAction = async (id, status) => {
    try { await api.put(`/leave/${id}/approve`, { status }); show(`Leave ${status}`, status==='approved'?'success':'info'); load() }
    catch { show('Error', 'error') }
  }

  const handleCancel = async id => {
    try { await api.delete(`/leave/${id}`); show('Leave request cancelled', 'info'); load() }
    catch (err) { show(err.response?.data?.message||'Error', 'error') }
  }

  const balanceTypes = ['casual','sick','earned','conference']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Apply and track leave requests</p>
        </div>
        <button onClick={() => setModal(true)} className="btn btn-primary"><Plus size={16}/> Apply Leave</button>
      </div>

      {/* Leave balance */}
      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {balanceTypes.map(type => {
            const b = balance[type]; if (!b) return null
            const pct = Math.max(0, (b.available / b.entitled) * 100)
            return (
              <div key={type} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">{LEAVE_TYPES[type]?.label || type}</p>
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-3xl font-bold text-slate-900">{b.available}</span>
                  <span className="text-slate-400 text-sm mb-1">/{b.entitled}d</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width:`${pct}%` }}/>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{b.used} used this year</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="form-select w-36" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="form-select w-28" value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>
          {['2024','2025','2026'].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-slate-500 ml-auto self-center">{leaves.length} requests</span>
      </div>

      {/* Leave list */}
      <div className="card overflow-hidden">
        {loading ? <LoadingScreen/> : leaves.length===0 ? (
          <EmptyState icon={Calendar} title="No leave requests"
            subtitle="No requests for the selected filters"
            action={<button onClick={()=>setModal(true)} className="btn btn-primary mt-2"><Plus size={14}/> Apply Leave</button>}/>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map(l => (
              <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  {canManage && <Avatar name={`${l.first_name} ${l.last_name}`} color={l.avatar_color} size="sm"/>}
                  <div className="flex-1">
                    {canManage && (
                      <p className="text-sm font-semibold text-slate-800">{l.first_name} {l.last_name}
                        <span className="ml-2 font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{l.emp_code}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 items-center mt-0.5">
                      <span className={`badge ${LEAVE_TYPES[l.leave_type]?.badge||'badge-gray'} capitalize text-xs`}>
                        {LEAVE_TYPES[l.leave_type]?.label || l.leave_type}
                      </span>
                      <span className="text-sm text-slate-600">
                        {new Date(l.start_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        {l.start_date!==l.end_date && ` – ${new Date(l.end_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`}
                      </span>
                      <span className="text-xs text-slate-400">· {l.days} day{l.days>1?'s':''}</span>
                    </div>
                    {l.reason && <p className="text-xs text-slate-400 mt-1 italic">"{l.reason}"</p>}
                    {l.department_name && <p className="text-xs text-slate-400">{l.department_name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={l.status}/>
                  {canManage && l.status==='pending' && (
                    <>
                      <button onClick={()=>handleAction(l.id,'approved')}
                        className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-700" title="Approve">
                        <Check size={14}/>
                      </button>
                      <button onClick={()=>handleAction(l.id,'rejected')}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-700" title="Reject">
                        <X size={14}/>
                      </button>
                    </>
                  )}
                  {!canManage && l.status==='pending' && l.employee_id===user.id && (
                    <button onClick={()=>setConfirm({open:true,id:l.id})} className="btn btn-secondary text-xs py-1 px-3">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-4">
          <div><label className="form-label">Leave Type*</label>
            <select className="form-select" value={form.leave_type} onChange={e=>setForm(f=>({...f,leave_type:e.target.value}))} required>
              {Object.entries(LEAVE_TYPES).map(([v,{label}])=><option key={v} value={v}>{label}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">From Date*</label>
              <input type="date" className="form-input" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} required/></div>
            <div><label className="form-label">To Date*</label>
              <input type="date" className="form-input" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} required/></div>
          </div>
          <div><label className="form-label">Reason / Remarks</label>
            <textarea className="form-input h-24 resize-none" placeholder="Brief reason for leave..."
              value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/></div>
          <p className="text-xs text-slate-400">Note: For sick leave exceeding 3 days, please submit a medical certificate to the Nursing Administration office.</p>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={()=>setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving?'Submitting...':'Submit Request'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={()=>setConfirm({open:false,id:null})}
        onConfirm={()=>handleCancel(confirm.id)}
        title="Cancel Leave Request" message="Are you sure you want to cancel this leave request?"
        confirmText="Yes, Cancel"/>
    </div>
  )
}
