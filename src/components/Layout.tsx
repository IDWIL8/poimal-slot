import { Moon, Shield, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

export function Layout() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && matchMedia('(prefers-color-scheme: dark)').matches))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="min-h-screen overflow-hidden bg-cream text-ink transition-colors dark:bg-[#151613] dark:text-[#f5f4ed]">
      <header className="relative z-40 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="group flex items-center gap-3 font-extrabold tracking-tight" aria-label="На главную">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-lg text-lime transition group-hover:-rotate-6 dark:bg-lime dark:text-ink">И</span>
          <span className="hidden sm:block">Слоты с Ингой</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/admin" className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/60 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" aria-label="Админ-панель"><Shield size={17} /></Link>
          <button onClick={() => setDark(!dark)} className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/60 transition hover:rotate-6 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-2 text-[9px] text-black/40 dark:text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Сделано с заботой, чаем с мятой и разумным количеством анимации.</p>
        <p>45 минут разговора · 15 минут на осмысление</p>
      </footer>
      <Toaster position="top-center" toastOptions={{ className: '!rounded-2xl !bg-[#252621] !px-4 !py-3 !text-sm !font-semibold !text-white' }} />
    </div>
  )
}
