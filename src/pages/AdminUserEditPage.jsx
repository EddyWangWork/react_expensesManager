import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

export default function AdminUserEditPage() {
    const { id } = useParams()
    const uid = Number(id)
    const { listUsers, updateUserRoles, updateUserPassword } = useAuth()
    const { showNotification } = useUI()
    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [roles, setRoles] = useState([])
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        const u = listUsers().find(x => x.id === uid)
        setUser(u || null)
        setRoles(u ? u.roles.slice() : [])
    }, [uid])

    if (!user) return (
        <div className="max-w-3xl mx-auto py-20 text-center">
            <div className="text-slate-600">User not found</div>
        </div>
    )

    const toggleRole = (role) => {
        setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
    }

    const save = async () => {
        const ok = updateUserRoles(user.id, roles)
        if (!ok) return showNotification && showNotification({ message: 'Failed to update roles' })
        if (newPassword) {
            const pOk = await updateUserPassword(user.id, newPassword)
            if (!pOk) return showNotification && showNotification({ message: 'Failed to update password' })
        }
        showNotification && showNotification({ message: 'User updated' })
        navigate('/admin/users')
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Edit user: {user.username}</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="mb-4">
                    <div className="text-sm muted">Roles</div>
                    <div className="mt-2">
                        <label className="inline-flex items-center gap-2 mr-3">
                            <input type="checkbox" checked={roles.includes('user')} onChange={() => toggleRole('user')} />
                            <span className="text-sm">user</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={roles.includes('admin')} onChange={() => toggleRole('admin')} />
                            <span className="text-sm">admin</span>
                        </label>
                    </div>
                </div>
                <div className="mb-4">
                    <div className="text-sm muted">Reset password</div>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" placeholder="Leave blank to keep current" />
                </div>
                <div className="flex gap-3">
                    <button className="btn" onClick={() => navigate('/admin/users')}>Cancel</button>
                    <button className="btn btn-primary" onClick={save}>Save</button>
                </div>
            </div>
        </div>
    )
}
