import { useState, useEffect } from 'react'
import { Users, Calendar, CreditCard, FileText, Activity, Stethoscope, Heart, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen, StatCard, Avatar, StatusBadge } from '../components/UI'

const DEPT_COLORS = ['#3b82f6','#ec4899','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316','#6366f1','#14b8a6','#a855f7']

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

  const { stats, recentLeaves, recentEmployees, attendanceTrend, deptDistribution } = data

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{greeting()}, {user?.first_name}!</h1>
        <p className="page-subtitle">
          {user?.designation} &nbsp;·&nbsp; {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Staff"      value={stats.totalEmployees}
          iconBg="bg-blue-100" iconColor="text-blue-600" sub="Active hospital staff" />
        <StatCard icon={Activity}   label="On Duty Today"    value={stats.presentToday}
          iconBg="bg-emerald-100" iconColor="text-emerald-600"
          sub={`${Math.round((stats.presentToday / Math.max(stats.totalEmployees,1)) * 100)}% attendance`} />
        <StatCard icon={FileText}   label="Pending Leaves"   value={stats.pendingLeaves}
          iconBg="bg-amber-100" iconColor="text-amber-600" sub="Awaiting approval" />
        <StatCard icon={CreditCard} label="Monthly Payroll"  value={stats.monthlyPayroll ? `₹${(stats.monthlyPayroll/100000).toFixed(1)}L` : '—'}
          iconBg="bg-purple-100" iconColor="text-purple-600" sub="Current month net" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Staff Attendance Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 14 working days</p>
            </div>
            <Activity size={16} className="text-slate-400" />
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceTrend} margin={{ top:5, right:10, bottom:5, left:-20 }}>
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, border:'1px solid #e2e8f0', fontSize:12 }} />
                <Bar dataKey="present"  fill="#3b82f6" radius={[3,3,0,0]} name="Present" />
                <Bar dataKey="absent"   fill="#fca5a5" radius={[3,3,0,0]} name="Absent" />
                <Bar dataKey="half_day" fill="#fde68a" radius={[3,3,0,0]} name="Half Day" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-slate-900">Department Strength</h2>
            <p className="text-xs text-slate-500 mt-0.5">Active staff by department</p>
          </div>
          <div className="p-4 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={deptDistribution.filter(d=>d.count>0)} dataKey="count" nameKey="name"
                  cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                  {deptDistribution.map((_,i) => <Cell key={i} fill={DEPT_COLORS[i%DEPT_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-1 max-h-40 overflow-y-auto">
              {deptDistribution.filter(d=>d.count>0).map((d,i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor:DEPT_COLORS[i%DEPT_COLORS.length] }}/>
                    <span className="text-slate-600 truncate max-w-[110px]">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 ml-1">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Leave Requests</h2>
            <span className="badge badge-yellow">{stats.pendingLeaves} pending</span>
          </div>
          <div>
            {recentLeaves.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No recent requests</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLeaves.map(l => (
                  <div key={l.id} className="flex items-center gap-3 px-6 py-3">
                    <Avatar name={`${l.first_name} ${l.last_name}`} color={l.avatar_color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{l.first_name} {l.last_name}</p>
                      <p className="text-xs text-slate-500 capitalize">{l.leave_type} leave · {l.days} day{l.days>1?'s':''}</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-slate-900">Recently Joined Staff</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEmployees.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-6 py-3">
                <Avatar name={`${e.first_name} ${e.last_name}`} color={e.avatar_color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.first_name} {e.last_name}</p>
                  <p className="text-xs text-slate-500">{e.designation} · {e.department_name}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{e.join_date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
