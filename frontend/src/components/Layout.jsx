import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, CreditCard, Building2, FileText, LogOut, Menu, X, ChevronDown, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './UI'
import { useState } from 'react'

const navItems = [
  { to:'/dashboard',   icon:LayoutDashboard, label:'Dashboard',   roles:['admin','manager','employee'] },
  { to:'/employees',   icon:Users,            label:'Staff Directory', roles:['admin','manager','employee'] },
  { to:'/attendance',  icon:Calendar,         label:'Attendance',  roles:['admin','manager','employee'] },
  { to:'/leave',       icon:FileText,         label:'Leave',       roles:['admin','manager','employee'] },
  { to:'/payroll',     icon:CreditCard,       label:'Payroll',     roles:['admin','manager','employee'] },
  { to:'/departments', icon:Building2,        label:'Departments', roles:['admin','manager'] },
]

export default function Layout({ children }) {
  const { user, logout, isAdmin, canManage } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const visible = navItems.filter(i => i.roles.includes(user?.role || 'employee'))

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <>
      <div className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <rect x="9" y="2" width="6" height="20" rx="1" fill="white" opacity="0.9"/>
              <rect x="2" y="9" width="20" height="6" rx="1" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">City Hospital</p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide font-medium">HRMS Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(({ to, icon:Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <div className="relative">
          <button onClick={() => setProfileOpen(p => !p)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
            <Avatar name={`${user?.first_name} ${user?.last_name}`} color={user?.avatar_color} size="sm" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-500">{user?.designation || user?.role}</p>
            </div>
            <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
          </button>
          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10">
              <NavLink to="/profile" onClick={() => { setProfileOpen(false); setSidebarOpen(false) }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Settings size={14} /> My Profile
              </NavLink>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 flex-shrink-0">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-xl">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg"><X size={18}/></button>
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu size={20}/></button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><rect x="9" y="2" width="6" height="20" rx="1" fill="white"/><rect x="2" y="9" width="20" height="6" rx="1" fill="white"/></svg>
            </div>
            <span className="text-sm font-bold text-slate-900">City Hospital HRMS</span>
          </div>
          <Avatar name={`${user?.first_name} ${user?.last_name}`} color={user?.avatar_color} size="sm" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
