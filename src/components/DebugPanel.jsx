import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function DebugPanel() {
    const { user, listUsers } = useAuth()
    const [open, setOpen] = useState(false)

    const users = listUsers()

    return (
        <div className="fixed right-4 bottom-4 z-50">
            <div className="bg-white dark:bg-slate-800 border rounded-lg shadow p-2 w-72">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Debug</div>
                    <button className="btn btn-ghost btn-xs" onClick={() => setOpen(o => !o)}>{open ? 'Close' : 'Open'}</button>
                </div>
                {open ? (
                    <div className="text-xs text-slate-700 dark:text-slate-300 max-h-64 overflow-auto">
                        <div className="mb-2">
                            <div className="text-[11px] text-slate-500">auth_user</div>
                            <pre className="text-[11px] bg-slate-50 dark:bg-slate-900 p-2 rounded mt-1">{JSON.stringify(user, null, 2)}</pre>
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500">auth_users</div>
                            <pre className="text-[11px] bg-slate-50 dark:bg-slate-900 p-2 rounded mt-1">{JSON.stringify(users, null, 2)}</pre>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-slate-500">auth_user: {user ? user.username : 'null'}</div>
                )}
            </div>
        </div>
    )
}
