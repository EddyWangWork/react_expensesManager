import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const NavBar = () => {
    const [dark, setDark] = useState(false)

    useEffect(() => {
        try {
            const stored = localStorage.getItem('theme')
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            const initial = stored ? stored === 'dark' : prefersDark
            setDark(initial)
            if (initial) document.documentElement.classList.add('dark')
            else document.documentElement.classList.remove('dark')
        } catch (e) {
            // ignore
        }
    }, [])

    const toggle = () => {
        const next = !dark
        setDark(next)
        try {
            localStorage.setItem('theme', next ? 'dark' : 'light')
        } catch (e) { }
        if (next) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
    }

    const linkClass = ({ isActive }) => isActive ? 'px-3 py-2 rounded-lg text-sm bg-indigo-600 text-white' : 'px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100'
    return (
        <header className="sticky top-0 z-20 backdrop-blur-sm bg-white/60 border-b dark:bg-slate-900/60">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <div className="brand text-lg">ExpensesManager</div>
                        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                            <span className="pill">Personal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <nav className="flex items-center gap-3">
                            <NavLink to="/" className={linkClass}>Dashboard</NavLink>
                            <NavLink to="/transactions" className={linkClass}>Transactions</NavLink>
                            <NavLink to="/categories" className={linkClass}>Categories</NavLink>
                            <NavLink to="/accounts" className={linkClass}>Accounts</NavLink>
                            <NavLink to="/add" className={linkClass}>Add</NavLink>
                            <NavLink to="/about" className={linkClass}>About</NavLink>
                        </nav>

                        <button onClick={toggle} aria-label="Toggle theme" className="ml-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                            {dark ? '🌙' : '☀️'}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default NavBar
