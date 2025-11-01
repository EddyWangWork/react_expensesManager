import React, { useState, useEffect } from 'react'
import { useTransactions } from '../context/TransactionsContext'
import { useUI } from '../context/UIContext'

export default function AccountEditor({ name, onClose }) {
    const { state, dispatch } = useTransactions()
    const start = name ? Number((state.accounts || {})[name] || 0) : 0
    const [balance, setBalance] = useState(start)
    const [accountName, setAccountName] = useState(name || '')

    useEffect(() => {
        setBalance(start)
        setAccountName(name || '')
    }, [name])

    const onSave = () => {
        if (!name) {
            // create new account
            const nm = (accountName || '').trim()
            if (!nm) {
                alert('Please provide an account name')
                return
            }
            dispatch({ type: 'addAccount', payload: { name: nm, balance: Number(balance || 0) } })
            if (onClose) onClose()
            return
        }

        // existing account: may support rename
        const nm = (accountName || '').trim()
        if (nm !== name) {
            // rename
            dispatch({ type: 'renameAccount', payload: { oldName: name, newName: nm } })
        }
        // update balance
        dispatch({ type: 'updateAccount', payload: { name: nm, balance: Number(balance || 0) } })
        if (onClose) onClose()
    }

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [reassignTo, setReassignTo] = useState('Unassigned')

    const onDeleteConfirm = () => {
        if (!name) return
        const target = reassignTo || 'Unassigned'
        const prev = JSON.parse(JSON.stringify(state))
        dispatch({ type: 'deleteAccount', payload: { name, reassignTo: target } })
        showNotification && showNotification({ message: `Deleted ${name}`, actionLabel: 'Undo', action: () => dispatch({ type: 'restore', payload: prev }) })
        setShowDeleteConfirm(false)
        if (onClose) onClose()
    }

    const { showNotification } = useUI()

    return (
        <div className="max-w-md">
            <h2 className="text-2xl font-semibold mb-4">{name ? 'Edit Account' : 'New Account'}</h2>
            <div className="card-lg">
                <div className="mb-4">
                    <div className="text-sm muted">Account Name</div>
                    {name ? (
                        <input value={accountName} onChange={e => setAccountName(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                    ) : (
                        <input placeholder="Account name" value={accountName} onChange={e => setAccountName(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                    )}
                </div>

                <label className="block mb-4">
                    <div className="text-sm muted">Starting Balance</div>
                    <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>

                <div className="flex items-center gap-3 justify-end">
                    <button onClick={onSave} className="btn btn-primary">Save</button>
                    {name && <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-ghost text-red-600">Delete</button>}
                    <button onClick={onClose} className="btn">Cancel</button>
                </div>
            </div>
            {showDeleteConfirm && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-4 rounded">
                    <div className="text-sm font-medium text-red-700 mb-2">Confirm delete</div>
                    <div className="text-sm muted mb-2">Choose where to reassign transactions previously using this account.</div>
                    <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} className="w-full border rounded px-3 py-2 mb-3">
                        <option value="Unassigned">Unassigned</option>
                        {Object.keys(state.accounts || {}).filter(a => a !== name).map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 justify-end">
                        <button onClick={onDeleteConfirm} className="btn btn-primary">Delete</button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="btn">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    )
}
