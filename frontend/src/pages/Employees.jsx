import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Eye, UserX, Stethoscope } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, Modal, StatusBadge, LoadingScreen, EmptyState, ConfirmDialog, Pagination } from '../components/UI'

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316']
const EMP_TYPES = ['Doctor','Nursing','Paramedical','Non-Clinical','Technical','Administrative']
const SHIFTS    = ['General','Morning','Evening','Night','Rotating']
const BLANK     = { first_name:'', last_name:'', email:'', password:'', phone:'', department_id:'', role:'employee', designation:'', join_date:'', salary:'', address:'', avatar_color:COLORS[0], employee_type:'Non-Clinical', shift:'General' }

const TYPE_BADGE = { Doctor:'badge-blue', Nursing:'badge-purple', Paramedical:'badge-green', 'Non-Clinical':'badge-gray', Technical:'badge-yellow', Administrative:'badge-blue' }

export default function Employees() {
  const { user, isAdmin, canManage } = useAuth()
  const { show } = useToast()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage]       = useState(1)
  const [modal, setModal]     = useState({ open:false, mode:'view', emp:null })
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, id:null })

  const PER_PAGE = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (deptFilter) params.department = deptFilter
      const [eRes, dRes] = await Promise.all([api.get('/employees', { params }), api.get('/departments')])
      let emps = eRes.data.data
      if (typeFilter) emps = emps.filter(e => e.employee_type === typeFilter)
      setEmployees(emps)
      setDepartments(dRes.data.data)
    } finally { setLoading(false) }
  }, [search, deptFilter, typeFilter])

  useEffect(() => { load() }, [load])

  const paginated = employees.slice((page-1)*PER_PAGE, page*PER_PAGE)
  const totalPages = Math.ceil(employees.length / PER_PAGE)

  const openAdd  = () => { setForm(BLANK); setModal({ open:true, mode:'add', emp:null }) }
  const openEdit = emp => { setForm({ ...emp, password:'' }); setModal({ open:true, mode:'edit', emp }) }
  const openView = async id => {
    const r = await api.get(`/employees/${id}`)
    setModal({ open:true, mode:'view', emp:r.data.data })
  }
  const closeModal = () => setModal({ open:false, mode:'view', emp:null })

  const handleSave = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal.mode === 'add') { await api.post('/employees', form); show('Staff added successfully', 'success') }
      else { await api.put(`/employees/${modal.emp.id}`, form); show('Staff record updated', 'success') }
      closeModal(); load()
    } catch (err) { show(err.response?.data?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const handleDeactivate = async id => {
    try { await api.delete(`/employees/${id}`); show('Staff deactivated', 'success'); load() }
    catch { show('Error', 'error') }
  }

  const f = (k, v) => setForm(x => ({ ...x, [k]:v }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Staff Directory</h1>
          <p className="page-subtitle">{employees.length} staff members</p>
        </div>
        {canManage && (
          <button onClick={openAdd} className="btn btn-primary"><Plus size={16}/> Add Staff</button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="form-input pl-8" placeholder="Search by name, ID, email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          {canManage && (
            <>
              <select className="form-select w-44" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="form-select w-40" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
                <option value="">All Staff Types</option>
                {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingScreen /> : employees.length === 0 ? (
          <EmptyState icon={Search} title="No staff found" subtitle="Try adjusting search filters" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-auto w-full">
                <thead><tr>
                  <th>Staff Member</th><th>ID</th><th>Department</th>
                  <th>Designation</th><th>Type</th><th>Shift</th><th>Status</th>
                  <th className="text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {paginated.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={`${emp.first_name} ${emp.last_name}`} color={emp.avatar_color} size="sm"/>
                          <div>
                            <p className="font-medium text-slate-800">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{emp.emp_code}</span></td>
                      <td><span className="text-xs">{emp.department_name || '—'}</span></td>
                      <td><span className="text-xs">{emp.designation || '—'}</span></td>
                      <td>{emp.employee_type && <span className={`badge ${TYPE_BADGE[emp.employee_type] || 'badge-gray'}`}>{emp.employee_type}</span>}</td>
                      <td><span className="text-xs text-slate-500">{emp.shift || 'General'}</span></td>
                      <td><StatusBadge status={emp.status}/></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openView(emp.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500" title="View"><Eye size={14}/></button>
                          {canManage && <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500" title="Edit"><Edit2 size={14}/></button>}
                          {isAdmin && emp.status==='active' && emp.id!==user.id && (
                            <button onClick={() => setConfirm({ open:true, id:emp.id })} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400" title="Deactivate"><UserX size={14}/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal.open && modal.mode !== 'view'} onClose={closeModal}
        title={modal.mode==='add' ? 'Add Staff Member' : 'Edit Staff Record'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">First Name*</label>
              <input className="form-input" value={form.first_name} onChange={e=>f('first_name',e.target.value)} required/></div>
            <div><label className="form-label">Last Name*</label>
              <input className="form-input" value={form.last_name} onChange={e=>f('last_name',e.target.value)} required/></div>
          </div>
          <div><label className="form-label">Email*</label>
            <input type="email" className="form-input" value={form.email} onChange={e=>f('email',e.target.value)} required/></div>
          {modal.mode==='add' && <div><label className="form-label">Password*</label>
            <input type="password" className="form-input" value={form.password} onChange={e=>f('password',e.target.value)} required/></div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Phone</label>
              <input className="form-input" value={form.phone||''} onChange={e=>f('phone',e.target.value)}/></div>
            <div><label className="form-label">Department</label>
              <select className="form-select" value={form.department_id||''} onChange={e=>f('department_id',e.target.value)}>
                <option value="">Select Department</option>
                {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select></div>
          </div>
          <div><label className="form-label">Designation</label>
            <input className="form-input" placeholder="e.g. Staff Nurse, Resident MO, Lab Technician"
              value={form.designation||''} onChange={e=>f('designation',e.target.value)}/></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">Staff Type</label>
              <select className="form-select" value={form.employee_type||'Non-Clinical'} onChange={e=>f('employee_type',e.target.value)}>
                {EMP_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="form-label">Shift</label>
              <select className="form-select" value={form.shift||'General'} onChange={e=>f('shift',e.target.value)}>
                {SHIFTS.map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e=>f('role',e.target.value)} disabled={!isAdmin}>
                <option value="employee">Staff</option>
                <option value="manager">Manager / HOD</option>
                {isAdmin && <option value="admin">Admin</option>}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Joining Date</label>
              <input type="date" className="form-input" value={form.join_date||''} onChange={e=>f('join_date',e.target.value)}/></div>
            <div><label className="form-label">Gross Salary (₹/month)</label>
              <input type="number" className="form-input" value={form.salary||''} onChange={e=>f('salary',e.target.value)}/></div>
          </div>
          <div>
            <label className="form-label">Avatar Colour</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map(c=>(
                <button key={c} type="button" onClick={()=>f('avatar_color',c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.avatar_color===c?'border-slate-800 scale-110':'border-transparent'}`}
                  style={{ backgroundColor:c }}/>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : modal.mode==='add' ? 'Add Staff' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={modal.open && modal.mode==='view'} onClose={closeModal} title="Staff Profile">
        {modal.emp && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={`${modal.emp.first_name} ${modal.emp.last_name}`} color={modal.emp.avatar_color} size="xl"/>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{modal.emp.first_name} {modal.emp.last_name}</h2>
                <p className="text-sm text-slate-500">{modal.emp.designation}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <StatusBadge status={modal.emp.role}/>
                  {modal.emp.employee_type && <span className={`badge ${TYPE_BADGE[modal.emp.employee_type]||'badge-gray'}`}>{modal.emp.employee_type}</span>}
                  <span className="badge badge-gray">{modal.emp.shift || 'General'} Shift</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Staff ID', modal.emp.emp_code],
                ['Email', modal.emp.email],
                ['Phone', modal.emp.phone||'—'],
                ['Department', modal.emp.department_name||'—'],
                ['Joining Date', modal.emp.join_date||'—'],
                ['Salary', modal.emp.salary ? `₹${Number(modal.emp.salary).toLocaleString('en-IN')}/mo` : '—'],
              ].map(([k,v])=>(
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="font-medium text-slate-800 text-xs">{v}</p>
                </div>
              ))}
            </div>
            {canManage && (
              <button onClick={()=>openEdit(modal.emp)} className="btn btn-secondary w-full justify-center">
                <Edit2 size={14}/> Edit Record
              </button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={()=>setConfirm({open:false,id:null})}
        onConfirm={()=>handleDeactivate(confirm.id)}
        title="Deactivate Staff" message="This staff member will lose system access. Confirm?"
        confirmText="Deactivate"/>
    </div>
  )
}
