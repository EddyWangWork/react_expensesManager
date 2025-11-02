import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// simple SHA-256 hex hasher using Web Crypto
async function hashPassword(password) {
    const enc = new TextEncoder()
    const data = enc.encode(password)
    const hashBuffer = await (window.crypto && window.crypto.subtle ? window.crypto.subtle.digest('SHA-256', data) : Promise.resolve(new Uint8Array()))
    if (!hashBuffer || typeof hashBuffer === 'string') return ''
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }) {
    // initialize user synchronously from localStorage so protected routes don't redirect
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('auth_user')
            return raw ? JSON.parse(raw) : null
        } catch (e) {
            return null
        }
    })
    // indicates auth initialization (reading localStorage, seeding) completed
    const [isReady, setIsReady] = useState(false)

    // seed a default admin user for local/dev testing if no users exist
    useEffect(() => {
        ; (async () => {
            try {
                const usersRaw = localStorage.getItem('auth_users')
                const users = usersRaw ? JSON.parse(usersRaw) : []
                if (!users || users.length === 0) {
                    const passHash = await hashPassword('admin')
                    const admin = { id: Date.now(), username: 'admin', passHash, roles: ['admin', 'user'] }
                    localStorage.setItem('auth_users', JSON.stringify([admin]))
                    // auto-login seeded admin on first run
                    setUser({ id: admin.id, username: admin.username, roles: admin.roles })
                }
            } catch (e) { }
            // mark auth initialization complete
            setIsReady(true)
        })()
    }, [])

    useEffect(() => {
        try {
            if (user) localStorage.setItem('auth_user', JSON.stringify(user))
            else localStorage.removeItem('auth_user')
        } catch (e) { }
    }, [user])

    const register = async (username, password, roles = ['user']) => {
        const usersRaw = localStorage.getItem('auth_users')
        const users = usersRaw ? JSON.parse(usersRaw) : []
        if (users.find(u => u.username === username)) {
            throw new Error('Username already exists')
        }
        const passHash = await hashPassword(password)
        const newUser = { id: Date.now(), username, passHash, roles }
        users.push(newUser)
        localStorage.setItem('auth_users', JSON.stringify(users))
        setUser({ id: newUser.id, username: newUser.username, roles: newUser.roles })
        try { console.info('Auth: registered', newUser.username) } catch (e) { }
        return newUser
    }

    const login = async (username, password) => {
        const usersRaw = localStorage.getItem('auth_users')
        const users = usersRaw ? JSON.parse(usersRaw) : []
        const passHash = await hashPassword(password)
        const found = users.find(u => u.username === username && u.passHash === passHash)
        if (!found) throw new Error('Invalid username or password')
        setUser({ id: found.id, username: found.username, roles: found.roles || ['user'] })
        try { console.info('Auth: login', found.username) } catch (e) { }
        return found
    }

    const logout = () => {
        setUser(null)
        try { console.info('Auth: logout') } catch (e) { }
    }

    // admin helpers: list/update/delete users (client-only localStorage operations)
    const listUsers = () => {
        try {
            const usersRaw = localStorage.getItem('auth_users')
            return usersRaw ? JSON.parse(usersRaw) : []
        } catch (e) { return [] }
    }

    const updateUserRoles = (id, roles) => {
        try {
            const users = listUsers()
            const idx = users.findIndex(u => u.id === id)
            if (idx === -1) return false
            users[idx].roles = roles
            localStorage.setItem('auth_users', JSON.stringify(users))
            // if current user was updated, refresh user state
            if (user && user.id === id) setUser({ id: users[idx].id, username: users[idx].username, roles: users[idx].roles })
            return true
        } catch (e) { return false }
    }

    const deleteUser = (id) => {
        try {
            const users = listUsers().filter(u => u.id !== id)
            localStorage.setItem('auth_users', JSON.stringify(users))
            // if current user was deleted, log out
            if (user && user.id === id) setUser(null)
            return true
        } catch (e) { return false }
    }

    const updateUserPassword = async (id, newPassword) => {
        try {
            const users = listUsers()
            const idx = users.findIndex(u => u.id === id)
            if (idx === -1) return false
            const passHash = await hashPassword(newPassword)
            users[idx].passHash = passHash
            localStorage.setItem('auth_users', JSON.stringify(users))
            return true
        } catch (e) {
            return false
        }
    }

    const hasRole = (role) => {
        if (!user || !user.roles) return false
        return user.roles.includes(role)
    }

    return (
        <AuthContext.Provider value={{ user, isReady, register, login, logout, hasRole, listUsers, updateUserRoles, deleteUser, updateUserPassword }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
