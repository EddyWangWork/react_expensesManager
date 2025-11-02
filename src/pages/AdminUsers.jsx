import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import AdminUserEditor from './AdminUserEditor'

export default function AdminUsers() {
    const { listUsers, updateUserRoles, deleteUser } = useAuth()
    const { openConfirm, showNotification } = useUI()
    const [users, setUsers] = useState([])
    const [editingUserId, setEditingUserId] = useState(null)

    useEffect(() => {
        setUsers(listUsers())
    }, [])

    const toggleRole = (id, role) => {
        const u = users.find(x => x.id === id)
        if (!u) return
        const roles = u.roles.includes(role) ? u.roles.filter(r => r !== role) : [...u.roles, role]
        if (updateUserRoles(id, roles)) {
            setUsers(listUsers())
        }
    }

    const handleDelete = (id) => {
        openConfirm && openConfirm({
            title: 'Delete user',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            onConfirm: () => {
                if (deleteUser(id)) {
                    setUsers(listUsers())
                    showNotification && showNotification({ message: 'User deleted' })
                } else {
                    showNotification && showNotification({ message: 'Failed to delete user' })
                }
            }
        })
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">User Management</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="text-sm text-slate-500">
                            <th className="py-2">Username</th>
                            <th className="py-2">Roles</th>
                            <th className="py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-t dark:border-slate-700">
                                <td className="py-2">{u.username}</td>
                                <td className="py-2">
                                    <label className="inline-flex items-center gap-2 mr-3">
                                        <input type="checkbox" checked={u.roles.includes('user')} onChange={() => toggleRole(u.id, 'user')} />
                                        <span className="text-sm">user</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input type="checkbox" checked={u.roles.includes('admin')} onChange={() => toggleRole(u.id, 'admin')} />
                                        <span className="text-sm">admin</span>
                                    </label>
                                </td>
                                <td className="py-2">
                                    <div className="flex items-center gap-2">
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingUserId(u.id)}>Edit</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingUserId && (
                <AdminUserEditor userId={editingUserId} onClose={() => { setEditingUserId(null); setUsers(listUsers()) }} />
            )}
        </div>
    )
}
