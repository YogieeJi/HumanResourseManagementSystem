import { useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, XCircle, Plus, Download } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, Modal, StatusBadge, LoadingScreen, StatCard, EmptyState } from '../components/UI'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Attendance() {
  const { user, canManage } = useAuth()
  const { show } = useToast()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [summary, setSummary]     = useState(null)
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkLoading, setCheckLoading] = useState(false)
  const [modal, setModal]  = useState(false)
  const [form, setForm]    = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'present' })
  const [empFilter, setEmpFilter] = useState(canManage ? '' : String(user.id))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { month, year }
      if (empFilter) params.employee_id = empFilter
      const [attRes, todayRes] = await Promise.all([
        api.get('/attendance', { params }),
        api.get('/attendance/today-status')
      ])
      setRecords(attRes.data.data)
      setTodayRecord(todayRes.data.data)

      if (!canManage) {
        const sumRes = await api.get(`/attendance/summary/${user.id}`, { params: { month, year } })
        setSummary(sumRes.data.data)
      }
    } finally { setLoading(false) }
  }, [month, year, empFilter, canManage])

  useEffect(() => {
    if (canManage) api.get('/employees').then(r => setEmployees(r.data.data))
  }, [canManage])

  useEffect(() => { load() }, [load])

  const handleCheckIn = async () => {
    setCheckLoading(true)
    try {
      const r = await api.post('/attendance/check-in')
      show(r.data.message, 'success')
      load()
    } catch (err) { show(err.response?.data?.message || 'Error', 'error') }
    finally { setCheckLoading(false) }
  }

  const handleCheckOut = async () => {
    setCheckLoading(true)
    try {
      const r = await api.post('/attendance/check-out')
      show(r.data.message, 'success')
      load()
    } catch (err) { show(err.response?.data?.message || 'Error', 'error') }
    finally { setCheckLoading(false) }
  }

  const handleAddRecord = async e => {
    e.preventDefault()
    try {
      await api.post('/attendance', form)
      show('Attendance recorded', 'success')
      setModal(false)
      load()
    } catch (err) { show(err.response?.data?.message || 'Error', 'error') }
  }

  const statusColor = s => ({ present: 'bg-emerald-50', absent: 'bg-red-50', half_day: 'bg-amber-50' }[s] || '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track and manage attendance records</p>
        </div>
        {canManage && (
          <button onClick={() => setModal(true)} className="btn btn-primary"><Plus size={16} /> Add Record</button>
        )}
      </div>

      {/* Check-in/out for employees */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Clock size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900" id="clock">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-sm text-slate-500">{now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' })}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {!todayRecord?.check_in ? (
              <button onClick={handleCheckIn} disabled={checkLoading}
                className="btn btn-success"><CheckCircle size={16} />
                {checkLoading ? 'Processing...' : 'Check In'}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                <CheckCircle size={15} className="text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">Checked in at {todayRecord.check_in}</span>
              </div>
            )}
            {todayRecord?.check_in && !todayRecord?.check_out && (
              <button onClick={handleCheckOut} disabled={checkLoading}
                className="btn btn-danger"><XCircle size={16} />
                {checkLoading ? 'Processing...' : 'Check Out'}
              </button>
            )}
            {todayRecord?.check_out && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <XCircle size={15} className="text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Checked out at {todayRecord.check_out} · {todayRecord.hours_worked}h</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My summary (employee) */}
      {!canManage && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={CheckCircle} label="Present Days" value={summary.present} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <StatCard icon={XCircle}    label="Absent Days"   value={summary.absent}  iconBg="bg-red-100"     iconColor="text-red-600" />
          <StatCard icon={Clock}      label="Half Days"     value={summary.half_day} iconBg="bg-amber-100"   iconColor="text-amber-600" />
          <StatCard icon={Clock}      label="Total Hours"   value={`${summary.total_hours}h`} iconBg="bg-blue-100" iconColor="text-blue-600" />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select className="form-select w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="form-select w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {canManage && (
          <select className="form-select flex-1 min-w-[180px]" value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </select>
        )}
        <span className="text-sm text-slate-500 ml-auto">{records.length} records</span>
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingScreen /> : records.length === 0 ? (
          <EmptyState icon={Clock} title="No attendance records" subtitle="No records found for the selected period" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  {canManage && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    {canManage && (
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={`${r.first_name} ${r.last_name}`} color={r.avatar_color} size="sm" />
                          <div>
                            <p className="font-medium text-slate-800 text-xs">{r.first_name} {r.last_name}</p>
                            <p className="text-[10px] text-slate-400">{r.emp_code}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td>{new Date(r.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                    <td><span className="font-mono text-xs">{r.check_in || '—'}</span></td>
                    <td><span className="font-mono text-xs">{r.check_out || '—'}</span></td>
                    <td>{r.hours_worked > 0 ? `${r.hours_worked}h` : '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add attendance modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Attendance Record">
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div>
            <label className="form-label">Employee*</label>
            <select className="form-select" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Date*</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Check In</label>
              <input type="time" className="form-input" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} /></div>
            <div><label className="form-label">Check Out</label>
              <input type="time" className="form-input" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} /></div>
          </div>
          <div><label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Record</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
