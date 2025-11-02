import React from 'react'
import { Link } from 'react-router-dom'

export default function Admin() {
    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Admin Area</h1>
            <p className="text-sm text-slate-600">This is a protected admin-only page. You must have the 'admin' role to see it.</p>
            <div className="mt-6">
                <Link to="/admin/users" className="btn">Manage users</Link>
            </div>
        </div>
    )
}
