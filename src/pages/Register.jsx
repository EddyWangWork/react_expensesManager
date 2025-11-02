import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (password !== confirm) return setError('Passwords do not match')
        try {
            const roles = isAdmin ? ['user', 'admin'] : ['user']
            await register(username.trim(), password, roles)
            const dest = location.state && location.state.from ? location.state.from.pathname || '/' : '/'
            navigate(dest, { replace: true })
        } catch (err) {
            setError(err.message || 'Registration failed')
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Register</h2>
            <form onSubmit={onSubmit} className="card-lg">
                <label className="block mb-3">
                    <div className="text-sm muted">Username</div>
                    <input value={username} onChange={e => setUsername(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>
                <label className="block mb-3">
                    <div className="text-sm muted">Password</div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>
                <label className="block mb-3">
                    <div className="text-sm muted">Confirm Password</div>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>
                <label className="block mb-3">
                    <div className="text-sm muted">Roles</div>
                    <div className="mt-2">
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} />
                            <span className="text-sm">Grant admin role (for testing)</span>
                        </label>
                    </div>
                </label>
                {error && <div className="text-red-600 mb-2">{error}</div>}
                <div className="flex gap-3">
                    <button type="submit" className="btn-primary">Register</button>
                    <Link to="/login" className="btn">Login</Link>
                </div>
            </form>
        </div>
    )
}
