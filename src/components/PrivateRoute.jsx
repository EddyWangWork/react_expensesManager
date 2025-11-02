import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, role = null }) {
    const { user, hasRole, isReady } = useAuth()
    const location = useLocation()

    // If auth isn't ready yet, show a small loading placeholder instead of redirecting.
    if (!isReady) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <div className="text-sm text-slate-500">Loading...</div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace state={{ from: location }} />
    if (role && !(hasRole && hasRole(role))) return <Navigate to="/denied" replace />
    return children
}
