import React from 'react'
import { Link } from 'react-router-dom'

export default function AccessDenied() {
    return (
        <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-3xl font-semibold mb-4">Access denied</h1>
            <p className="mb-6 text-slate-600">You don't have permission to view this page.</p>
            <div className="flex justify-center gap-3">
                <Link to="/" className="btn">Home</Link>
            </div>
        </div>
    )
}
