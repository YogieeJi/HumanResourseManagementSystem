import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const remove = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), [])

  const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info }
  const styles = {
    success: 'bg-emerald-600 text-white',
    error:   'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info:    'bg-blue-600 text-white',
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {toasts.map(t => {
          const Icon = icons[t.type] || Info
          return (
            <div key={t.id} className={`toast ${styles[t.type]} animate-fadeInUp`}>
              <Icon size={16} className="flex-shrink-0" />
              <span>{t.message}</span>
              <button onClick={() => remove(t.id)} className="ml-2 opacity-75 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
