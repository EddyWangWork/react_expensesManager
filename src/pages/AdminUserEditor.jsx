import React, { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

export default function AdminUserEditor({ userId, onClose }) {
    const { listUsers, updateUserRoles, updateUserPassword } = useAuth()
    const { showNotification } = useUI()
    const [user, setUser] = useState(null)
    const [roles, setRoles] = useState([])
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        const u = listUsers().find(x => x.id === userId)
        setUser(u || null)
        setRoles(u ? u.roles.slice() : [])
    }, [userId])

    if (!user) return null

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
        onClose && onClose()
    }

    return (
        <Modal onClose={onClose} title={`Edit ${user.username}`} footer={(
            <>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={save}>Save</button>
            </>
        )}>
            <div className="space-y-4">
                <div>
                    <div className="text-sm muted">Username</div>
                    <div className="font-medium mt-1">{user.username}</div>
                </div>

                <div>
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

                <div>
                    <div className="text-sm muted">Reset password</div>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" placeholder="Leave blank to keep current" />
                </div>
            </div>
        </Modal>
    )
}
