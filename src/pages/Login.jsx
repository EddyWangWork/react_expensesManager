import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await login(username.trim(), password)
            const dest = location.state && location.state.from ? location.state.from.pathname || '/' : '/'
            navigate(dest, { replace: true })
        } catch (err) {
            setError(err.message || 'Login failed')
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Login</h2>
            <form onSubmit={onSubmit} className="card-lg">
                <label className="block mb-3">
                    <div className="text-sm muted">Username</div>
                    <input value={username} onChange={e => setUsername(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>
                <label className="block mb-3">
                    <div className="text-sm muted">Password</div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>
                {error && <div className="text-red-600 mb-2">{error}</div>}
                <div className="flex gap-3">
                    <button type="submit" className="btn-primary">Login</button>
                    <Link to="/register" className="btn">Register</Link>
                </div>
            </form>
        </div>
    )
}
