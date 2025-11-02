import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

const NavBar = () => {
    const [dark, setDark] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const { user, logout, hasRole } = useAuth()
    const { showNotification, openConfirm, openAddModal } = useUI()
    const navigate = useNavigate()

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

    const handleLogout = () => {
        openConfirm && openConfirm({
            title: 'Sign out',
            message: 'Are you sure you want to log out?',
            onConfirm: () => {
                try { logout() } catch (e) { }
                showNotification && showNotification({ message: 'Signed out' }, 3000)
                navigate('/login')
            }
        })
    }

    return (
        <header className="sticky top-0 z-30 backdrop-blur bg-white/60 dark:bg-slate-900/60 border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* left: brand */}
                    <div className="flex items-center gap-4">
                        <NavLink to="/" className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-semibold">EM</div>
                            <div className="hidden sm:block">
                                <div className="text-lg font-semibold">ExpensesManager</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Personal</div>
                            </div>
                        </NavLink>
                    </div>

                    {/* center / desktop nav */}
                    <nav className="hidden md:flex items-center gap-2">
                        <NavLink to="/" className={linkClass}>Dashboard</NavLink>
                        {user && (
                            <>
                                <NavLink to="/transactions" className={linkClass}>Transactions</NavLink>
                                <NavLink to="/categories" className={linkClass}>Categories</NavLink>
                                <NavLink to="/accounts" className={linkClass}>Accounts</NavLink>
                                <button onClick={() => openAddModal && openAddModal(null)} className={linkClass({ isActive: false })}>Add</button>
                                <NavLink to="/about" className={linkClass}>About</NavLink>
                                {hasRole && hasRole('admin') && (
                                    <NavLink to="/admin" className={linkClass}>Admin</NavLink>
                                )}
                            </>
                        )}
                    </nav>

                    {/* right: actions */}
                    <div className="flex items-center gap-3">
                        {/* mobile menu button */}
                        <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* auth actions */}
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium">{(user.username || 'U').charAt(0).toUpperCase()}</div>
                                    <div className="hidden sm:block text-sm">{user.username}</div>
                                </div>
                                <button onClick={handleLogout} className="px-3 py-1 rounded-md text-sm border hover:bg-gray-50 dark:hover:bg-slate-800">Logout</button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <NavLink to="/login" className={linkClass}>Login</NavLink>
                                <NavLink to="/register" className={linkClass}>Register</NavLink>
                            </div>
                        )}

                        <button onClick={toggle} aria-label="Toggle theme" className="ml-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                            {dark ? '🌙' : '☀️'}
                        </button>
                    </div>
                </div>

                {/* mobile menu panel */}
                {mobileOpen && (
                    <div className="md:hidden mt-2 pb-4">
                        <nav className="flex flex-col gap-1">
                            <NavLink to="/" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Dashboard</NavLink>
                            {user ? (
                                <>
                                    <NavLink to="/transactions" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Transactions</NavLink>
                                    <NavLink to="/categories" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Categories</NavLink>
                                    <NavLink to="/accounts" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Accounts</NavLink>
                                    <button onClick={() => { setMobileOpen(false); openAddModal && openAddModal(null) }} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Add</button>
                                    <NavLink to="/about" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>About</NavLink>
                                    {hasRole && hasRole('admin') && (
                                        <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Admin</NavLink>
                                    )}
                                    <button onClick={() => { setMobileOpen(false); handleLogout() }} className="text-left px-3 py-2 rounded-md text-slate-700 dark:text-slate-200">Logout</button>
                                </>
                            ) : (
                                <>
                                    <NavLink to="/login" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Login</NavLink>
                                    <NavLink to="/register" onClick={() => setMobileOpen(false)} className={({ isActive }) => `${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'} block px-3 py-2 rounded-md`}>Register</NavLink>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}

export default NavBar
