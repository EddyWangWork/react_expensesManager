import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransactions } from '../context/TransactionsContext'
import Icon from '../components/Icon'

export default function AddTransaction({ onClose, editingId: propEditingId, defaultAccount, mode }) {
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState('debit')
    // const [category, setCategory] = useState('General')
    const [mainCategory, setMainCategory] = useState('')
    const [subCategory, setSubCategory] = useState('')
    const [newCategoryParent, setNewCategoryParent] = useState(null)
    // typeahead/query states
    const [mainQuery, setMainQuery] = useState('')
    const [subQuery, setSubQuery] = useState('')
    const [showMainList, setShowMainList] = useState(false)
    const [showSubList, setShowSubList] = useState(false)
    const mainRef = useRef(null)
    const subRef = useRef(null)
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
    const [account, setAccount] = useState(defaultAccount || 'ABCBank')
    const [otherAccount, setOtherAccount] = useState('')
    const [newOtherAccountName, setNewOtherAccountName] = useState('')
    const [newOtherAccountBalance, setNewOtherAccountBalance] = useState('0')
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
                // split stored category into main/sub if it has a parent
                const storedCat = tx.category || ''
                const cats = state.categories || {}
                if (storedCat) {
                    const entry = cats[storedCat]
                    if (entry && entry.parent) {
                        setMainCategory(entry.parent)
                        setSubCategory(storedCat)
                        setMainQuery(entry.parent)
                        setSubQuery(storedCat)
                    } else {
                        setMainCategory(storedCat)
                        setSubCategory('')
                        setMainQuery(storedCat)
                        setSubQuery('')
                    }
                } else {
                    setMainCategory('')
                    setSubCategory('')
                    setMainQuery('')
                    setSubQuery('')
                }
                setDate(tx.date || new Date().toISOString().slice(0, 10))
                setAccount(tx.account || 'ABCBank')
                // if this transaction is part of a paired transfer, populate otherAccount
                if (tx.transferId) {
                    const pair = state.transactions.find(t => t.transferId === tx.transferId && t.id !== tx.id)
                    if (pair) setOtherAccount(pair.account || '')
                }
            }
        } else {
            // if opening modal with a defaultAccount, prefill it
            if (defaultAccount) setAccount(defaultAccount)
        }
    }, [editing, editingId, state.transactions])

    // when primary account changes, clear otherAccount if it matches (avoid selecting same account)
    useEffect(() => {
        if (otherAccount && account && otherAccount === account) {
            setOtherAccount('')
        }
    }, [account])

    // hide suggestion lists when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (mainRef.current && !mainRef.current.contains(e.target)) setShowMainList(false)
            if (subRef.current && !subRef.current.contains(e.target)) setShowSubList(false)
        }
        document.addEventListener('click', onDocClick)
        return () => document.removeEventListener('click', onDocClick)
    }, [])

    const allCategoryNames = useMemo(() => {
        const map = state.categories || {}
        const fromTx = new Set((state.transactions || []).map(t => t.category).filter(Boolean))
        return Array.from(new Set([...Object.keys(map), ...Array.from(fromTx)]))
    }, [state.categories, state.transactions])

    // visible suggestion lists (main and sub) used for keyboard navigation
    const mainVisible = useMemo(() => {
        return allCategoryNames
            .filter(n => { const e = (state.categories || {})[n]; return !(e && e.parent) })
            .filter(n => n.toLowerCase().includes(mainQuery.toLowerCase()))
    }, [allCategoryNames, mainQuery, state.categories])

    const subVisible = useMemo(() => {
        return allCategoryNames
            .filter(n => { const e = (state.categories || {})[n]; return e && e.parent === mainCategory })
            .filter(n => n.toLowerCase().includes(subQuery.toLowerCase()))
    }, [allCategoryNames, subQuery, state.categories, mainCategory])

    const [mainFocus, setMainFocus] = useState(-1)
    const [subFocus, setSubFocus] = useState(-1)

    // reset focus when query or visibility changes
    useEffect(() => { setMainFocus(-1) }, [mainQuery, showMainList])
    useEffect(() => { setSubFocus(-1) }, [subQuery, showSubList, mainCategory])

    const onSubmit = (e) => {
        e.preventDefault()
        const baseId = Date.now()
        const normalizedDate = (new Date(date)).toISOString().slice(0, 10)

        const payload = {
            id: baseId,
            description: description || 'Untitled',
            amount: parseFloat(amount) || 0,
            type,
            // category will be determined from main/sub selection below
            category: '',
            // normalize date to YYYY-MM-DD
            date: normalizedDate,
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

        // if transfer, handle creating otherAccount inline if requested
        if ((type === 'transfer_in' || type === 'transfer_out') && otherAccount === '__new__') {
            const name = newOtherAccountName && newOtherAccountName.trim()
            if (!name) {
                alert('Please provide a name for the other account')
                return
            }
            const start = parseFloat(newOtherAccountBalance) || 0
            dispatch({ type: 'addAccount', payload: { name, balance: start } })
            setOtherAccount(name)
        }

        // validate transfer other account
        if (type === 'transfer_in' || type === 'transfer_out') {
            if (!otherAccount || otherAccount === '') {
                alert('Please select the other account for the transfer')
                return
            }
            if (otherAccount === (payload.account || '')) {
                alert('Source and destination accounts must be different')
                return
            }
        }

        if (editing) {
            // preserve id when updating
            payload.id = editingId
            // determine selected category from main/sub
            let selectedCat = ''
            if (subCategory === '__new__') {
                // creating a new subcategory under the chosen main
                const name = (newCategoryName || '').trim()
                if (!name) {
                    alert('Please provide a name for the new category')
                    return
                }
                const parent = mainCategory || null
                if (!((state.categories || {})[name])) dispatch({ type: 'addCategory', payload: { name, parent } })
                selectedCat = name
            } else if (mainCategory === '__new__') {
                // creating a new main category
                const name = (newCategoryName || '').trim()
                if (!name) {
                    alert('Please provide a name for the new category')
                    return
                }
                if (!((state.categories || {})[name])) dispatch({ type: 'addCategory', payload: { name, parent: null } })
                selectedCat = name
            } else if (subCategory) {
                selectedCat = subCategory
            } else if (mainCategory) {
                selectedCat = mainCategory
            } else {
                selectedCat = 'Uncategorized'
            }
            payload.category = selectedCat
            // if editing a transfer (has transferId), update both sides
            const existing = state.transactions.find(t => t.id === editingId)
            if (existing && existing.transferId) {
                const transferId = existing.transferId
                // build items for both sides
                const pair = state.transactions.find(t => t.transferId === transferId && t.id !== editingId)
                const a = { ...payload }
                const b = pair ? { ...pair } : null
                // determine accounts/types: if current edited is transfer_in, then pair is transfer_out and vice versa
                if (type === 'transfer_in') {
                    a.type = 'transfer_in'
                    a.account = account
                    if (b) {
                        b.type = 'transfer_out'
                        b.account = otherAccount || b.account
                        b.description = a.description
                        b.amount = a.amount
                        b.category = a.category
                        b.date = a.date
                    }
                } else if (type === 'transfer_out') {
                    a.type = 'transfer_out'
                    a.account = account
                    if (b) {
                        b.type = 'transfer_in'
                        b.account = otherAccount || b.account
                        b.description = a.description
                        b.amount = a.amount
                        b.category = a.category
                        b.date = a.date
                    }
                } else {
                    // not a transfer anymore: just update single
                    dispatch({ type: 'update', payload: a })
                    if (onClose) onClose()
                    else navigate('/transactions')
                    return
                }
                // ensure both have transferId and new ids
                a.transferId = transferId
                a.id = editingId
                if (b) b.transferId = transferId
                if (b && !b.id) b.id = baseId + 1
                const items = [a, b].filter(Boolean)
                dispatch({ type: 'updateTransfer', payload: { transferId, items } })
            } else {
                // normal update
                dispatch({ type: 'update', payload })
            }
        } else {
            // handle inline new category if present
            // determine selected category for non-edit create flow
            let selectedCat = ''
            if (subCategory === '__new__') {
                const name = (newCategoryName || '').trim()
                if (!name) {
                    alert('Please provide a name for the new category')
                    return
                }
                const parent = mainCategory || null
                if (!((state.categories || {})[name])) dispatch({ type: 'addCategory', payload: { name, parent } })
                selectedCat = name
            } else if (mainCategory === '__new__') {
                const name = (newCategoryName || '').trim()
                if (!name) {
                    alert('Please provide a name for the new category')
                    return
                }
                if (!((state.categories || {})[name])) dispatch({ type: 'addCategory', payload: { name, parent: null } })
                selectedCat = name
            } else if (subCategory) {
                selectedCat = subCategory
            } else if (mainCategory) {
                selectedCat = mainCategory
            } else {
                selectedCat = 'Uncategorized'
            }
            payload.category = selectedCat
            if (type === 'transfer_in' || type === 'transfer_out') {
                // create paired transactions: one transfer_out and one transfer_in
                const transferId = `tr_${baseId}`
                // determine roles: account is primary side chosen in form
                const primaryAccount = account || 'Unassigned'
                const other = otherAccount || ''
                // build both transactions
                const txA = {
                    id: baseId,
                    transferId,
                    description: payload.description,
                    amount: payload.amount,
                    type: type === 'transfer_in' ? 'transfer_in' : 'transfer_out',
                    category: payload.category,
                    date: normalizedDate,
                    account: primaryAccount
                }
                const txB = {
                    id: baseId + 1,
                    transferId,
                    description: payload.description,
                    amount: payload.amount,
                    type: type === 'transfer_in' ? 'transfer_out' : 'transfer_in',
                    category: payload.category,
                    date: normalizedDate,
                    account: other || 'Unassigned'
                }
                dispatch({ type: 'addTransfer', payload: { items: [txA, txB] } })
            } else {
                dispatch({ type: 'add', payload })
            }
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

    const handleConfirmNewCategory = (parent = null) => {
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
            // select the existing category
            if (parent) {
                setMainCategory(parent)
                setSubCategory(name)
            } else {
                setMainCategory(name)
                setSubCategory('')
            }
            setNewCategoryName('')
            setTimeout(() => setCategoryMsg(''), 2000)
            return
        }
        dispatch({ type: 'addCategory', payload: { name, parent } })
        setCategoryMsg('Category added')
        setCategoryMsgType('success')
        if (parent) {
            setMainCategory(parent)
            setSubCategory(name)
            setMainQuery(parent)
            setSubQuery(name)
        } else {
            setMainCategory(name)
            setSubCategory('')
            setMainQuery(name)
            setSubQuery('')
        }
        setNewCategoryName('')
        setNewCategoryParent(null)
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
                            <option value="transfer_in">Transfer In</option>
                            <option value="transfer_out">Transfer Out</option>
                        </select>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <label ref={mainRef}>
                        <div className="text-sm muted">Main category</div>
                        <div className="mt-2 relative">
                            <input
                                value={mainQuery}
                                onChange={e => { setMainQuery(e.target.value); setMainCategory(''); setSubCategory(''); setShowMainList(true) }}
                                onFocus={() => setShowMainList(true)}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') { setMainCategory(''); setMainQuery(''); setShowMainList(false); setMainFocus(-1); e.stopPropagation(); }
                                    else if (e.key === 'ArrowDown') {
                                        e.preventDefault()
                                        // allow focus to go to add-new (index = mainVisible.length)
                                        setMainFocus(f => Math.min(f + 1, mainVisible.length))
                                        setShowMainList(true)
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault()
                                        setMainFocus(f => Math.max(f - 1, 0))
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (mainFocus >= 0) {
                                            if (mainFocus < mainVisible.length) {
                                                const sel = mainVisible[mainFocus]
                                                setMainCategory(sel); setMainQuery(sel); setShowMainList(false); setSubCategory(''); setMainFocus(-1)
                                            } else {
                                                // add new
                                                setNewCategoryName(mainQuery)
                                                handleConfirmNewCategory(null)
                                                setShowMainList(false)
                                                setMainFocus(-1)
                                            }
                                        } else if (mainVisible.length === 1) {
                                            const sel = mainVisible[0]
                                            setMainCategory(sel); setMainQuery(sel); setShowMainList(false); setSubCategory(''); setMainFocus(-1)
                                        }
                                    }
                                }}
                                placeholder="Type to search or create"
                                className="w-full border rounded-lg px-3 py-2 pr-8"
                                disabled={mode === 'delete'}
                            />
                            {(mainQuery || mainCategory) && mode !== 'delete' && (
                                <button type="button" aria-label="Clear main category" onClick={() => { setMainCategory(''); setMainQuery(''); setSubCategory(''); setShowMainList(false); setMainFocus(-1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                    <Icon name="x" className="w-4 h-4" title="Clear" />
                                </button>
                            )}
                            <div aria-hidden={!showMainList} className={`absolute z-20 bg-white dark:bg-gray-800 border rounded mt-1 w-full max-h-60 overflow-auto transition-all duration-200 ease-out transform-gpu ${showMainList ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'}`}>
                                <div className="p-2 text-xs muted">Top-level categories</div>
                                <div>
                                    {mainVisible.map((n, idx) => (
                                        <div
                                            key={n}
                                            className={`px-3 py-1 hover:bg-gray-100 cursor-pointer ${mainFocus === idx ? 'bg-gray-100' : ''}`}
                                            onClick={() => { setMainCategory(n); setMainQuery(n); setShowMainList(false); setSubCategory(''); setMainFocus(-1) }}
                                            onMouseEnter={() => setMainFocus(idx)}
                                        >
                                            {n}
                                        </div>
                                    ))}
                                    {/* add-new item is index === mainVisible.length */}
                                    <div
                                        className={`px-3 py-1 hover:bg-gray-100 cursor-pointer text-primary ${mainFocus === mainVisible.length ? 'bg-gray-100' : ''}`}
                                        onClick={() => { setNewCategoryName(mainQuery); handleConfirmNewCategory(null); setShowMainList(false); setMainFocus(-1) }}
                                        onMouseEnter={() => setMainFocus(mainVisible.length)}
                                    >
                                        + Add new "{mainQuery || 'category'}"
                                    </div>
                                </div>
                            </div>
                            {categoryMsg && (
                                <div className={"text-xs mt-1 " + (categoryMsgType === 'error' ? 'text-red-500' : 'text-green-600')}>{categoryMsg}</div>
                            )}
                        </div>
                    </label>

                    <label ref={subRef}>
                        <div className="text-sm muted">Subcategory</div>
                        <div className="mt-2 relative">
                            <input
                                value={subQuery}
                                onChange={e => { setSubQuery(e.target.value); setSubCategory(''); setShowSubList(true) }}
                                onFocus={() => setShowSubList(true)}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') { setSubCategory(''); setSubQuery(''); setShowSubList(false); setSubFocus(-1); e.stopPropagation(); }
                                    else if (e.key === 'ArrowDown') {
                                        e.preventDefault()
                                        setSubFocus(f => Math.min(f + 1, subVisible.length))
                                        setShowSubList(true)
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault()
                                        setSubFocus(f => Math.max(f - 1, 0))
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (subFocus >= 0) {
                                            if (subFocus < subVisible.length) {
                                                const sel = subVisible[subFocus]
                                                setSubCategory(sel); setSubQuery(sel); setShowSubList(false); setSubFocus(-1)
                                            } else {
                                                // add new sub
                                                setNewCategoryName(subQuery || '')
                                                handleConfirmNewCategory(mainCategory)
                                                setShowSubList(false)
                                                setSubFocus(-1)
                                            }
                                        } else if (subVisible.length === 1) {
                                            const sel = subVisible[0]
                                            setSubCategory(sel); setSubQuery(sel); setShowSubList(false); setSubFocus(-1)
                                        }
                                    }
                                }}
                                placeholder={mainCategory ? `Search subcategories of ${mainCategory}` : 'Select a main category first'}
                                className="w-full border rounded-lg px-3 py-2 pr-8"
                                disabled={mode === 'delete' || !mainCategory || mainCategory === '__new__'}
                            />
                            {(subQuery || subCategory) && mode !== 'delete' && (
                                <button type="button" aria-label="Clear subcategory" onClick={() => { setSubCategory(''); setSubQuery(''); setShowSubList(false); setSubFocus(-1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                    <Icon name="x" className="w-4 h-4" title="Clear" />
                                </button>
                            )}
                            <div aria-hidden={!showSubList || !mainCategory} className={`absolute z-20 bg-white dark:bg-gray-800 border rounded mt-1 w-full max-h-60 overflow-auto transition-all duration-200 ease-out transform-gpu ${showSubList && mainCategory ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'}`}>
                                <div className="p-2 text-xs muted">Subcategories</div>
                                <div>
                                    {subVisible.map((n, idx) => (
                                        <div
                                            key={n}
                                            className={`px-3 py-1 hover:bg-gray-100 cursor-pointer ${subFocus === idx ? 'bg-gray-100' : ''}`}
                                            onClick={() => { setSubCategory(n); setSubQuery(n); setShowSubList(false); setSubFocus(-1) }}
                                            onMouseEnter={() => setSubFocus(idx)}
                                        >
                                            {n}
                                        </div>
                                    ))}
                                    <div
                                        className={`px-3 py-1 hover:bg-gray-100 cursor-pointer text-primary ${subFocus === subVisible.length ? 'bg-gray-100' : ''}`}
                                        onClick={() => { setNewCategoryName(subQuery || ''); handleConfirmNewCategory(mainCategory); setShowSubList(false); setSubFocus(-1) }}
                                        onMouseEnter={() => setSubFocus(subVisible.length)}
                                    >
                                        + Add new "{subQuery || 'subcategory'}" under {mainCategory}
                                    </div>
                                </div>
                            </div>

                            {/* breadcrumb for selected category */}
                            {((subCategory && subCategory !== '__new__') || (mainCategory && mainCategory !== '__new__')) && (
                                <div className="text-xs muted mt-1">{getCategoryPath(subCategory || mainCategory).join(' › ')}</div>
                            )}
                        </div>
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

                {/* Other account for transfers */}
                {(type === 'transfer_in' || type === 'transfer_out') && (
                    <div className="mb-4">
                        <label>
                            <div className="text-sm muted">Other account</div>
                            <select value={otherAccount} onChange={e => setOtherAccount(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'}>
                                <option value="">Select other account</option>
                                {(state.accounts ? Object.keys(state.accounts).filter(a => a !== account) : []).map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                                {otherAccount && otherAccount !== '__new__' && otherAccount !== account && !(state.accounts || {})[otherAccount] && (
                                    <option value={otherAccount}>{otherAccount}</option>
                                )}
                                <option value="__new__">+ Add new account...</option>
                            </select>
                        </label>

                        {otherAccount === '__new__' && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <input placeholder="Other account name" value={newOtherAccountName} onChange={e => setNewOtherAccountName(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                                <input placeholder="Starting balance" value={newOtherAccountBalance} onChange={e => setNewOtherAccountBalance(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={mode === 'delete'} />
                            </div>
                        )}
                    </div>
                )}

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
