import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Eye, RefreshCw, Printer, Download, Plus } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, Modal, LoadingScreen, EmptyState, StatCard } from '../components/UI'

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']

function SalarySlip({ slip }) {
  if (!slip) return null
  const fmt = n => Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })

  return (
    <div id="slip-print" className="bg-white text-sm border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-blue-700 text-white px-8 py-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <rect x="9" y="2" width="6" height="20" rx="1" fill="white" opacity="0.9"/>
                <rect x="2" y="9" width="20" height="6" rx="1" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">City Hospital</h2>
              <p className="text-blue-200 text-xs">Sector 14, Dwarka, New Delhi - 110078</p>
              <p className="text-blue-200 text-xs">GSTIN: 07AAACH1234N1Z5 · PF Reg: DL/EMP/12345</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-wider">Pay Slip</p>
            <p className="text-blue-200 text-xs mt-1">{MONTHS[slip.month]} {slip.year}</p>
            <p className="text-blue-200 text-xs">Generated: {new Date(slip.generated_at).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Employee Details */}
      <div className="px-8 py-4 bg-blue-50 border-b border-blue-100">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {[
            ['Employee Name',   `${slip.first_name} ${slip.last_name}`],
            ['Staff ID',        slip.emp_code],
            ['Designation',     slip.designation || '—'],
            ['Department',      slip.department_name || '—'],
            ['Staff Type',      slip.employee_type || '—'],
            ['Pay Period',      `${MONTHS[slip.month]} ${slip.year}`],
            ['Working Days',    slip.working_days],
            ['Days Present',    slip.present_days],
            ['Days Absent',     (slip.working_days - slip.present_days)],
          ].map(([k,v]) => (
            <div key={k}>
              <p className="text-blue-400 mb-0.5">{k}</p>
              <p className="font-semibold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div className="px-8 py-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-blue-700">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"/> Earnings
          </h3>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left text-slate-400 font-medium pb-2">Component</th>
              <th className="text-right text-slate-400 font-medium pb-2">Amount (₹)</th>
            </tr></thead>
            <tbody>
              {[
                ['Basic Salary',            slip.basic_salary],
                ['House Rent Allowance (HRA)', slip.hra],
                ['Transport Allowance',     slip.transport_allowance],
                ['Medical Allowance',       slip.medical_allowance],
                ['Special Allowance',       slip.other_allowance],
              ].map(([k,v]) => (
                <tr key={k} className="border-b border-slate-50">
                  <td className="py-2 text-slate-600">{k}</td>
                  <td className="py-2 text-right font-medium">{fmt(v)}</td>
                </tr>
              ))}
              <tr className="bg-emerald-50">
                <td className="py-2 px-1 font-bold text-emerald-800">Gross Earnings</td>
                <td className="py-2 px-1 text-right font-bold text-emerald-800">{fmt(slip.gross_salary)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-red-600">
            <div className="w-2 h-2 bg-red-400 rounded-full"/> Deductions
          </h3>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left text-slate-400 font-medium pb-2">Component</th>
              <th className="text-right text-slate-400 font-medium pb-2">Amount (₹)</th>
            </tr></thead>
            <tbody>
              {[
                ['Provident Fund (EPF 12%)',  slip.pf_deduction],
                ['ESI (0.75%)',               slip.esi_deduction || 0],
                ['Professional Tax',          slip.professional_tax || 0],
                ['TDS / Income Tax',          slip.tax_deduction],
                ['Other Deductions',          slip.other_deduction || 0],
              ].map(([k,v]) => (
                <tr key={k} className="border-b border-slate-50">
                  <td className="py-2 text-slate-600">{k}</td>
                  <td className="py-2 text-right font-medium">{fmt(v)}</td>
                </tr>
              ))}
              <tr className="bg-red-50">
                <td className="py-2 px-1 font-bold text-red-800">Total Deductions</td>
                <td className="py-2 px-1 text-right font-bold text-red-800">
                  {fmt((slip.pf_deduction||0)+(slip.esi_deduction||0)+(slip.professional_tax||0)+(slip.tax_deduction||0)+(slip.other_deduction||0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Net pay */}
      <div className="mx-8 mb-6 p-4 bg-blue-700 rounded-xl flex items-center justify-between text-white">
        <div>
          <p className="text-xs text-blue-200 uppercase tracking-wide font-semibold">Net Salary Payable</p>
          <p className="text-3xl font-bold mt-1">₹{fmt(slip.net_salary)}</p>
          <p className="text-xs text-blue-200 mt-0.5">Rupees {slip.net_salary >= 100000 ? `${(slip.net_salary/100000).toFixed(2)} Lakhs` : `${Math.round(slip.net_salary).toLocaleString('en-IN')}`} Only</p>
        </div>
        <div className="text-right text-xs text-blue-200">
          <p>This is a computer-generated</p>
          <p>pay slip. No signature required.</p>
        </div>
      </div>
    </div>
  )
}

export default function Payroll() {
  const { user, isAdmin, canManage } = useAuth()
  const { show } = useToast()
  const [slips, setSlips]     = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [viewModal, setViewModal] = useState(false)
  const [genModal, setGenModal]   = useState(false)
  const [genForm, setGenForm]     = useState({ month:new Date().getMonth()+1, year:new Date().getFullYear() })
  const [genLoading, setGenLoading] = useState(false)
  const [filters, setFilters]     = useState({ month:'', year:String(new Date().getFullYear()) })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.month) params.month = filters.month
      if (filters.year)  params.year  = filters.year
      const [sRes] = await Promise.all([api.get('/payroll/slips', { params })])
      setSlips(sRes.data.data)
      if (canManage) {
        const sumRes = await api.get('/payroll/summary', { params:{ month:filters.month||new Date().getMonth()+1, year:filters.year } })
        setSummary(sumRes.data.data)
      }
    } finally { setLoading(false) }
  }, [filters, canManage])

  useEffect(() => { load() }, [load])

  const openSlip = async id => {
    const r = await api.get(`/payroll/slips/${id}`)
    setSelectedSlip(r.data.data); setViewModal(true)
  }

  const handleGenerate = async e => {
    e.preventDefault(); setGenLoading(true)
    try {
      const r = await api.post('/payroll/generate', genForm)
      show(`Generated ${r.data.data.length} pay slips`, 'success')
      setGenModal(false); load()
    } catch (err) { show(err.response?.data?.message||'Error','error') }
    finally { setGenLoading(false) }
  }

  const handlePrint = () => {
    const el = document.getElementById('slip-print')
    if (!el) return
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>Pay Slip - City Hospital</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:20px;font-size:12px}
      .bg-blue-700{background:#1d4ed8;color:white;padding:20px;border-radius:8px 8px 0 0}
      .bg-blue-50{background:#eff6ff;padding:16px;border-bottom:1px solid #bfdbfe}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      th,td{padding:5px 4px;font-size:11px;border-bottom:1px solid #f1f5f9}
      th{text-align:left;color:#94a3b8;font-weight:500}
      .net-bar{background:#1d4ed8;color:white;padding:16px;border-radius:8px;margin-top:12px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:16px}
      </style></head>
      <body>${el.innerHTML}</body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Payroll & Pay Slips</h1>
          <p className="page-subtitle">Monthly salary processing and slip download</p>
        </div>
        {isAdmin && (
          <button onClick={() => setGenModal(true)} className="btn btn-primary"><RefreshCw size={15}/> Generate Payroll</button>
        )}
      </div>

      {/* Summary */}
      {canManage && summary?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={CreditCard} label="Total Slips"    value={summary.summary.total_slips||0}  iconBg="bg-blue-100"   iconColor="text-blue-600"/>
          <StatCard icon={CreditCard} label="Gross Payroll"  value={`₹${((summary.summary.total_gross||0)/100000).toFixed(1)}L`} iconBg="bg-indigo-100" iconColor="text-indigo-600"/>
          <StatCard icon={CreditCard} label="Net Payroll"    value={`₹${((summary.summary.total_net||0)/100000).toFixed(1)}L`}   iconBg="bg-emerald-100" iconColor="text-emerald-600"/>
          <StatCard icon={CreditCard} label="Avg Net Salary" value={`₹${Math.round(summary.summary.avg_salary||0).toLocaleString('en-IN')}`} iconBg="bg-amber-100" iconColor="text-amber-600"/>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="form-select w-36" value={filters.month} onChange={e=>setFilters(f=>({...f,month:e.target.value}))}>
          <option value="">All Months</option>
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="form-select w-28" value={filters.year} onChange={e=>setFilters(f=>({...f,year:e.target.value}))}>
          {['2024','2025','2026'].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-slate-500 ml-auto self-center">{slips.length} slip{slips.length!==1?'s':''}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingScreen/> : slips.length===0 ? (
          <EmptyState icon={CreditCard} title="No pay slips found"
            subtitle={isAdmin?'Generate payroll for the selected period':'No pay slips available yet'}
            action={isAdmin&&<button onClick={()=>setGenModal(true)} className="btn btn-primary mt-2"><Plus size={14}/> Generate Payroll</button>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead><tr>
                {canManage && <th>Staff Member</th>}
                <th>Period</th><th>Gross</th><th>PF</th><th>ESI</th><th>TDS</th><th>Net Pay</th><th>Days</th>
                <th className="text-right">Action</th>
              </tr></thead>
              <tbody>
                {slips.map(slip => (
                  <tr key={slip.id}>
                    {canManage && (
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={`${slip.first_name} ${slip.last_name}`} color={slip.avatar_color} size="sm"/>
                          <div>
                            <p className="font-medium text-xs">{slip.first_name} {slip.last_name}</p>
                            <p className="text-[10px] text-slate-400">{slip.emp_code} · {slip.employee_type}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td><span className="font-medium text-xs">{MONTHS[slip.month].slice(0,3)} {slip.year}</span></td>
                    <td className="text-emerald-700 font-medium text-xs">₹{Number(slip.gross_salary).toLocaleString('en-IN')}</td>
                    <td className="text-xs text-slate-500">₹{Number(slip.pf_deduction).toLocaleString('en-IN')}</td>
                    <td className="text-xs text-slate-500">₹{Number(slip.esi_deduction||0).toLocaleString('en-IN')}</td>
                    <td className="text-xs text-slate-500">₹{Number(slip.tax_deduction).toLocaleString('en-IN')}</td>
                    <td className="font-bold text-blue-700 text-xs">₹{Number(slip.net_salary).toLocaleString('en-IN')}</td>
                    <td className="text-xs">{slip.present_days}/{slip.working_days}</td>
                    <td>
                      <button onClick={()=>openSlip(slip.id)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="View Pay Slip">
                        <Eye size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Slip Modal */}
      <Modal open={viewModal} onClose={()=>setViewModal(false)}
        title={selectedSlip ? `Pay Slip — ${MONTHS[selectedSlip.month]} ${selectedSlip.year}` : 'Pay Slip'} size="xl">
        <div className="space-y-4">
          <SalarySlip slip={selectedSlip}/>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button onClick={handlePrint} className="btn btn-secondary"><Printer size={14}/> Print</button>
            <button onClick={handlePrint} className="btn btn-primary"><Download size={14}/> Download PDF</button>
          </div>
        </div>
      </Modal>

      {/* Generate Modal */}
      <Modal open={genModal} onClose={()=>setGenModal(false)} title="Generate Monthly Payroll">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            This will calculate and generate pay slips for all active staff based on their gross salary structure. Existing slips for the selected period will be overwritten.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Month*</label>
              <select className="form-select" value={genForm.month} onChange={e=>setGenForm(f=>({...f,month:Number(e.target.value)}))}>
                {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select></div>
            <div><label className="form-label">Year*</label>
              <select className="form-select" value={genForm.year} onChange={e=>setGenForm(f=>({...f,year:Number(e.target.value)}))}>
                {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
              </select></div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={()=>setGenModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={genLoading} className="btn btn-primary">
              {genLoading?'Generating...':'Generate Payroll'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
