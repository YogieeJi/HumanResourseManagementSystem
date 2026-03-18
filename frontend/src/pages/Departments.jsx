import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Building2, Users, Stethoscope } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, Modal, LoadingScreen, EmptyState, ConfirmDialog } from '../components/UI'

const DEPT_ICONS = { 'Emergency & Trauma':'🚨', 'General Medicine':'🩺', 'Surgery':'🔪', 'Obstetrics & Gynaecology':'👶', 'Paediatrics':'🧒', 'Orthopaedics':'🦴', 'Cardiology':'❤️', 'Radiology & Imaging':'🔬', 'Pathology & Laboratory':'🧪', 'Pharmacy':'💊', 'Nursing Administration':'👩‍⚕️', 'Hospital Administration':'🏥' }
const DEPT_COLORS = ['bg-red-100 text-red-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-pink-100 text-pink-700','bg-yellow-100 text-yellow-700','bg-indigo-100 text-indigo-700','bg-rose-100 text-rose-700','bg-purple-100 text-purple-700','bg-teal-100 text-teal-700','bg-orange-100 text-orange-700','bg-cyan-100 text-cyan-700','bg-violet-100 text-violet-700']

export default function Departments() {
  const { isAdmin, canManage } = useAuth()
  const { show } = useToast()
  const [depts, setDepts]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState({ open:false, mode:'add', dept:null })
  const [form, setForm]       = useState({ name:'', description:'', manager_id:'' })
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, id:null })
  const [detailModal, setDetailModal] = useState({ open:false, dept:null })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, eRes] = await Promise.all([api.get('/departments'), api.get('/employees', { params:{ role:'manager' } })])
      setDepts(dRes.data.data); setEmployees(eRes.data.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setForm({ name:'', description:'', manager_id:'' }); setModal({ open:true, mode:'add', dept:null }) }
  const openEdit = d  => { setForm({ name:d.name, description:d.description||'', manager_id:d.manager_id||'' }); setModal({ open:true, mode:'edit', dept:d }) }
  const openDetail = async id => { const r = await api.get(`/departments/${id}`); setDetailModal({ open:true, dept:r.data.data }) }

  const handleSave = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal.mode === 'add') { await api.post('/departments', form); show('Department created', 'success') }
      else { await api.put(`/departments/${modal.dept.id}`, form); show('Department updated', 'success') }
      setModal({ open:false, mode:'add', dept:null }); load()
    } catch (err) { show(err.response?.data?.message||'Error', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    try { await api.delete(`/departments/${id}`); show('Department deleted', 'info'); load() }
    catch (err) { show(err.response?.data?.message||'Cannot delete', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Hospital Departments</h1>
          <p className="page-subtitle">{depts.length} clinical & administrative units</p>
        </div>
        {isAdmin && <button onClick={openAdd} className="btn btn-primary"><Plus size={16}/> Add Department</button>}
      </div>

      {loading ? <LoadingScreen/> : depts.length===0 ? (
        <EmptyState icon={Building2} title="No departments" subtitle="Add your first department"/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {depts.map((d,i) => (
            <div key={d.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(d.id)}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${DEPT_COLORS[i%DEPT_COLORS.length]}`}>
                    {DEPT_ICONS[d.name] || d.name[0]}
                  </div>
                  {canManage && (
                    <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>openEdit(d)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Edit2 size={13}/></button>
                      {isAdmin && <button onClick={()=>setConfirm({open:true,id:d.id})} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={13}/></button>}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 leading-tight">{d.name}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{d.description||'No description'}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users size={12}/><span>{d.employee_count} staff</span>
                  </div>
                  {d.manager_name && <span className="text-slate-400 truncate max-w-[120px]">HOD: {d.manager_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit */}
      <Modal open={modal.open} onClose={()=>setModal({open:false,mode:'add',dept:null})}
        title={modal.mode==='add'?'Add Department':'Edit Department'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="form-label">Department Name*</label>
            <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="e.g. Neurology"/></div>
          <div><label className="form-label">Description</label>
            <textarea className="form-input h-20 resize-none" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description of the department..."/></div>
          <div><label className="form-label">HOD / Manager</label>
            <select className="form-select" value={form.manager_id} onChange={e=>setForm(f=>({...f,manager_id:e.target.value}))}>
              <option value="">Not assigned</option>
              {employees.map(e=><option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.designation}</option>)}
            </select></div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={()=>setModal({open:false,mode:'add',dept:null})} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving?'Saving...':modal.mode==='add'?'Create':'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail */}
      <Modal open={detailModal.open} onClose={()=>setDetailModal({open:false,dept:null})} title={detailModal.dept?.name||''} size="md">
        {detailModal.dept && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{detailModal.dept.description||'No description provided.'}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Total Staff</p>
                <p className="font-semibold">{detailModal.dept.employee_count}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">HOD / Manager</p>
                <p className="font-semibold text-xs">{detailModal.dept.manager_name||'Not assigned'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Department Staff ({detailModal.dept.members?.length||0})</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {(detailModal.dept.members||[]).map(m=>(
                  <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                    <Avatar name={`${m.first_name} ${m.last_name}`} color={m.avatar_color} size="sm"/>
                    <div>
                      <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
                      <p className="text-xs text-slate-400">{m.designation} · {m.shift||'General'} shift</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={()=>setConfirm({open:false,id:null})}
        onConfirm={()=>handleDelete(confirm.id)}
        title="Delete Department" message="Cannot delete if active staff are assigned. Confirm delete?"
        confirmText="Delete"/>
    </div>
  )
}
