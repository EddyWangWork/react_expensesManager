import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransactions } from '../context/TransactionsContext'

export default function AddTransaction({ onClose, editingId: propEditingId, defaultAccount, mode }) {
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState('debit')
    const [category, setCategory] = useState('General')
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
    const [account, setAccount] = useState(defaultAccount || 'ABCBank')
    const [newAccountName, setNewAccountName] = useState('')
    const [newAccountBalance, setNewAccountBalance] = useState('0')
    const [categoryMsg, setCategoryMsg] = useState('')
    const [categoryMsgType, setCategoryMsgType] = useState('')
    const [newCategoryName, setNewCategoryName] = useState('')

    const { state, dispatch } = useTransactions()
    const navigate = useNavigate()
    const params = useParams()
    const editingId = propEditingId != null ? Number(propEditingId) : (params?.id ? Number(params.id) : null)
    const editing = !!editingId

    useEffect(() => {
        if (editing) {
            const tx = state.transactions.find(t => t.id === editingId)
            if (tx) {
                setDescription(tx.description || '')
                setAmount(String(tx.amount || ''))
                setType(tx.type || 'debit')
                setCategory(tx.category || 'General')
                setDate(tx.date || new Date().toISOString().slice(0, 10))
                setAccount(tx.account || 'ABCBank')
            }
        } else {
            // if opening modal with a defaultAccount, prefill it
            if (defaultAccount) setAccount(defaultAccount)
        }
    }, [editing, editingId, state.transactions])

    const onSubmit = (e) => {
        e.preventDefault()
        const payload = {
            id: Date.now(),
            description: description || 'Untitled',
            amount: parseFloat(amount) || 0,
            type,
            category: category || '',
            // normalize date to YYYY-MM-DD
            date: (new Date(date)).toISOString().slice(0, 10),
            account: account || 'Unassigned'
        }
        // if creating a new account inline, add it first
        if (account === '__new__') {
            const name = newAccountName && newAccountName.trim()
            if (!name) {
                alert('Please provide a name for the new account')
                return
            }
            const start = parseFloat(newAccountBalance) || 0
            dispatch({ type: 'addAccount', payload: { name, balance: start } })
            payload.account = name
        }

        if (editing) {
            // preserve id when updating
            payload.id = editingId
            // handle inline new category if present
            if (payload.category === '__new__') {
                const name = (newCategoryName || '').trim()
                if (!name) {
                    alert('Please provide a name for the new category')
                    return
                }
                if (!((state.categories || {})[name])) dispatch({ type: 'addCategory', payload: { name } })
                payload.category = name
            } else if (!payload.category) {
                payload.category = 'Uncategorized'
            }
            dispatch({ type: 'update', payload })
        } else {
            // handle inline new category if present
            if (payload.category === '__new__') {
                const name = (newCategoryName || '').trim()
                if (!name) {
                    alert('Please provide a name for the new category')
                    return
                }
                if (!((state.categories || {})[name])) dispatch({ type: 'addCategory', payload: { name } })
                payload.category = name
            } else if (!payload.category) {
                payload.category = 'Uncategorized'
            }
            dispatch({ type: 'add', payload })
        }
        if (onClose) onClose()
        else navigate('/transactions')
    }

    const onDelete = (skipConfirm = false) => {
        if (!editing) return
        if (skipConfirm || window.confirm('Delete this transaction?')) {
            dispatch({ type: 'delete', payload: editingId })
            if (onClose) onClose()
            else navigate('/transactions')
        }
    }

    const handleConfirmNewCategory = () => {
        const name = (newCategoryName || '').trim()
        if (!name) {
            setCategoryMsg('Please enter a category name')
            setCategoryMsgType('error')
            setTimeout(() => setCategoryMsg(''), 2500)
            return
        }
        if ((state.categories || {})[name]) {
            setCategoryMsg('Category already exists')
            setCategoryMsgType('error')
            setCategory(name)
            setNewCategoryName('')
            setTimeout(() => setCategoryMsg(''), 2000)
            return
        }
        // inline add only creates main categories (parent = null)
        dispatch({ type: 'addCategory', payload: { name, parent: null } })
        setCategoryMsg('Category added')
        setCategoryMsgType('success')
        setCategory(name)
        setNewCategoryName('')
        setNewCategoryParent('')
        setTimeout(() => setCategoryMsg(''), 2000)
    }

    const getCategoryPath = (name) => {
        const map = state.categories || {}
        const path = []
        let cur = name
        while (cur) {
            path.unshift(cur)
            const entry = map[cur]
            if (!entry || !entry.parent) break
            cur = entry.parent
        }
        return path
    }

    return (
        <div className="max-w-md">
            <h2 className="text-2xl font-semibold mb-4">{mode === 'delete' ? 'Delete Transaction' : (editing ? 'Edit Transaction' : 'Add Transaction')}</h2>
            {mode === 'delete' && (
                <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <div className="text-sm font-medium text-red-700">Delete transaction</div>
                    <div className="text-sm muted">This will permanently remove the transaction. Fields are disabled. Click Delete to confirm.</div>
                </div>
            )}
            <form onSubmit={onSubmit} className="card-lg">
                <label className="block mb-3">
                    <div className="text-sm muted">Description</div>
                    <input value={description} onChange={e => setDescription(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                </label>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <label className="block">
                        <div className="text-sm muted">Amount</div>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                    </label>

                    <label className="block">
                        <div className="text-sm muted">Type</div>
                        <select value={type} onChange={e => setType(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'}>
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                        </select>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <label>
                        <div className="text-sm muted">Category</div>
                        <div className="mt-2">
                            {/* searchable picker using datalist for quicker selection */}
                            <input list="categories-list" value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                            <datalist id="categories-list">
                                <option value="">Uncategorized</option>
                                {Object.keys(state.categories || {}).map(n => (
                                    <option key={n} value={n}>{state.categories[n] && state.categories[n].parent ? `${state.categories[n].parent} › ${n}` : n}</option>
                                ))}
                                <option value="__new__">+ Add new category...</option>
                            </datalist>
                            {/* breadcrumb for selected category */}
                            {category && category !== '__new__' && category !== '' && (
                                <div className="text-xs muted mt-1">{getCategoryPath(category).join(' › ')}</div>
                            )}
                            {category === '__new__' && (
                                <div className="mt-3 grid grid-cols-1 gap-2">
                                    <input placeholder="New category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleConfirmNewCategory() }} className="w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                                    <div className="text-xs muted">(Creates a main category. To create a subcategory, use Categories → Add subcategory)</div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={handleConfirmNewCategory} className="btn-primary">Add category</button>
                                        <button type="button" onClick={() => { setCategory(''); setNewCategoryName(''); setNewCategoryParent('') }} className="btn">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {categoryMsg && (
                            <div className={"text-xs mt-1 " + (categoryMsgType === 'error' ? 'text-red-500' : 'text-green-600')}>{categoryMsg}</div>
                        )}
                    </label>

                    <label>
                        <div className="text-sm muted">Date</div>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                    </label>
                </div>

                <div className="mb-4">
                    <label>
                        <div className="text-sm muted">Account</div>
                        <select value={account} onChange={e => setAccount(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'}>
                            {(state.accounts ? Object.keys(state.accounts) : []).map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                            {account && account !== '__new__' && !(state.accounts || {})[account] && (
                                <option value={account}>{account}</option>
                            )}
                            <option value="__new__">+ Add new account...</option>
                        </select>
                    </label>

                    {account === '__new__' && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <input placeholder="Account name" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                            <input placeholder="Starting balance" value={newAccountBalance} onChange={e => setNewAccountBalance(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    {mode === 'delete' ? (
                        <>
                            <button type="button" onClick={onDelete} className="btn bg-red-600 text-white hover:bg-red-700">Delete</button>
                            <button type="button" onClick={() => onClose ? onClose() : navigate(-1)} className="btn">Cancel</button>
                        </>
                    ) : (
                        <>
                            <button type="submit" className="btn-primary">{editing ? 'Save' : 'Add'}</button>
                            <button type="button" onClick={() => onClose ? onClose() : navigate(-1)} className="btn">Cancel</button>
                        </>
                    )}
                </div>
            </form>
        </div>
    )
}
