import React, { useState, useMemo } from 'react'
import { useUI } from '../context/UIContext'
import { useTransactions } from '../context/TransactionsContext'

export default function Transactions() {
    const { state, dispatch, totals } = useTransactions()
    const { openAddModal } = useUI()

    // Local UI filters (similar to Dashboard)
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [selectedYear, setSelectedYear] = useState('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('all')
    const [sortBy, setSortBy] = useState('date_desc')
    const [accountFilter, setAccountFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')

    // saved presets stored in localStorage (name -> filter object)
    const [presets, setPresets] = useState(() => {
        try {
            const raw = localStorage.getItem('tx_filter_presets')
            return raw ? JSON.parse(raw) : {}
        } catch (e) { return {} }
    })
    const [selectedPreset, setSelectedPreset] = useState('')

    const persistPresets = (next) => {
        try {
            localStorage.setItem('tx_filter_presets', JSON.stringify(next))
        } catch (e) { }
    }

    const savePreset = () => {
        const name = window.prompt('Save filter preset as:')
        if (!name) return
        const obj = { query, typeFilter, startDate, endDate, selectedYear, selectedMonth, sortBy, accountFilter, categoryFilter }
        const next = { ...(presets || {}), [name]: obj }
        setPresets(next)
        persistPresets(next)
        setSelectedPreset(name)
    }

    const loadPreset = (name) => {
        if (!name) return
        const p = presets && presets[name]
        if (!p) return
        setQuery(p.query || '')
        setTypeFilter(p.typeFilter || 'all')
        setStartDate(p.startDate || '')
        setEndDate(p.endDate || '')
        setSelectedYear(p.selectedYear || 'all')
        setSelectedMonth(p.selectedMonth || 'all')
        setSortBy(p.sortBy || 'date_desc')
        setAccountFilter(p.accountFilter || 'all')
        setCategoryFilter(p.categoryFilter || 'all')
        setSelectedPreset(name)
    }

    const deletePreset = (name) => {
        if (!name) return
        if (!window.confirm(`Delete preset '${name}'?`)) return
        const next = { ...(presets || {}) }
        delete next[name]
        setPresets(next)
        persistPresets(next)
        setSelectedPreset('')
    }

    const CREDIT_TYPES = ['credit', 'transfer_in']
    const DEBIT_TYPES = ['debit', 'transfer_out']

    const fmt = d => {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
    }

    const renderCategoryCell = (name) => {
        const map = state.categories || {}
        if (!name) return <span className="text-sm">Uncategorized</span>
        const meta = map[name]
        if (meta && meta.parent) {
            return (
                <div className="flex flex-col">
                    <div className="text-xs muted">{meta.parent}</div>
                    <div className="">{name}</div>
                </div>
            )
        }
        return <div>{name}</div>
    }

    const computePresetRange = (preset) => {
        if (!preset) return null
        let base
        try {
            if (startDate) base = new Date(startDate)
            else if (endDate) base = new Date(endDate)
            else base = new Date()
            if (isNaN(base.getTime())) base = new Date()
        } catch (e) {
            base = new Date()
        }
        const now = new Date()
        const nowY = now.getFullYear()
        const nowM = now.getMonth()
        const y = base.getFullYear()
        const m = base.getMonth()
        let s, e
        if (preset === 'this') {
            s = new Date(nowY, nowM, 1)
            e = new Date(nowY, nowM + 1, 0)
        } else if (preset === 'prev') {
            s = new Date(y, m - 1, 1)
            e = new Date(y, m, 0)
        } else if (preset === 'next') {
            s = new Date(y, m + 1, 1)
            e = new Date(y, m + 2, 0)
        } else if (preset === 'clear') return null
        return { s, e }
    }

    const applyPreset = (preset) => {
        if (!preset) return
        if (preset === 'clear') { setStartDate(''); setEndDate(''); return }
        const r = computePresetRange(preset)
        if (!r) return
        setStartDate(fmt(r.s))
        setEndDate(fmt(r.e))
    }

    const isPresetActive = (preset) => {
        const r = computePresetRange(preset)
        if (!r) return false
        return startDate === fmt(r.s) && endDate === fmt(r.e)
    }

    const exportCSV = (txs = null) => {
        const source = txs || state.transactions || []
        const rows = [
            ['id', 'date', 'description', 'type', 'amount', 'category', 'account']
        ]
        for (const t of source) {
            rows.push([t.id, t.date, t.description, t.type, t.amount, t.category || '', t.account || ''])
        }
        const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const activeTxs = useMemo(() => {
        const q = (query || '').toLowerCase().trim()
        const all = (state.transactions || []).slice()
        const res = all.filter(t => {
            if (typeFilter !== 'all' && t.type !== typeFilter) return false
            if (startDate) {
                try { if (new Date(t.date) < new Date(startDate)) return false } catch (e) { }
            }
            if (endDate) {
                try { if (new Date(t.date) > new Date(endDate)) return false } catch (e) { }
            }
            if (selectedYear !== 'all' || selectedMonth !== 'all') {
                const d = new Date(t.date)
                if (selectedYear !== 'all' && String(d.getFullYear()) !== String(selectedYear)) return false
                if (selectedMonth !== 'all' && String(d.getMonth()) !== String(selectedMonth)) return false
            }
            if (accountFilter !== 'all' && t.account !== accountFilter) return false
            if (categoryFilter !== 'all') {
                const cf = categoryFilter
                // special case: user selected 'Uncategorized'
                if (cf === 'Uncategorized') {
                    if (t.category) return false
                } else {
                    const cmap = state.categories || {}
                    const cfMeta = cmap[cf]
                    // determine if selected category should be treated as a main category
                    const isMain = cfMeta ? !cfMeta.parent : Object.keys(cmap).some(k => cmap[k] && cmap[k].parent === cf)
                    if (isMain) {
                        const tcat = t.category || ''
                        const tmeta = cmap[tcat]
                        if (!(tcat === cf || (tmeta && tmeta.parent === cf))) return false
                    } else {
                        // otherwise match exact category name (or Uncategorized)
                        if ((t.category || 'Uncategorized') !== cf) return false
                    }
                }
            }
            if (!q) return true
            return String(t.description || '').toLowerCase().includes(q) || String(t.category || '').toLowerCase().includes(q) || String(t.account || '').toLowerCase().includes(q)
        })

        res.sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date)
            if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date)
            if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount)
            if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount)
            return 0
        })

        return res
    }, [state.transactions, query, typeFilter, selectedYear, selectedMonth, sortBy, startDate, endDate, accountFilter, categoryFilter])

    const onDelete = (id) => {
        if (window.confirm('Delete this transaction?')) dispatch({ type: 'delete', payload: id })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Transactions</h2>
                <div className="muted">Total: {activeTxs.length}</div>
            </div>

            <div className="card-lg">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-2 flex items-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input aria-label="Search transactions" placeholder="Search description, category, account" value={query} onChange={e => setQuery(e.target.value)} className="border rounded pl-8 pr-8 py-1 w-full sm:w-56" />
                        </div>

                        <select aria-label="Filter by type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded px-2 py-1 text-sm flex-none">
                            <option value="all">All</option>
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                            <option value="transfer_in">Transfer In</option>
                            <option value="transfer_out">Transfer Out</option>
                        </select>

                        <select aria-label="Filter by account" value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="border rounded px-2 py-1 text-sm flex-none">
                            <option value="all">All accounts</option>
                            {Object.keys(state.accounts || {}).sort().map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>

                        <select aria-label="Filter by category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded px-2 py-1 text-sm flex-none">
                            <option value="all">All categories</option>
                            {
                                (() => {
                                    const defined = state.categories || {}
                                    const fromTx = Array.from(new Set((state.transactions || []).map(t => t.category).filter(Boolean)))
                                    const allNames = Array.from(new Set([...Object.keys(defined), ...fromTx]))
                                    // determine main/top-level names (those without a parent in defined)
                                    const mainNames = allNames.filter(n => { const e = defined[n]; return !e || !e.parent }).sort((a, b) => String(a).localeCompare(String(b)))
                                    return mainNames.map(main => {
                                        const children = allNames.filter(n => { const e = defined[n]; return e && e.parent === main }).sort((a, b) => String(a).localeCompare(String(b)))
                                        return (
                                            <optgroup key={main} label={main}>
                                                <option value={main}>{main}</option>
                                                {children.map(c => (
                                                    <option key={c} value={c}>&nbsp;{c}</option>
                                                ))}
                                            </optgroup>
                                        )
                                    })
                                })()
                            }
                            <option value="Uncategorized">Uncategorized</option>
                        </select>

                        <div className="flex items-center gap-2">
                            <input type="date" aria-label="from date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                            <input type="date" aria-label="to date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        </div>

                        <div className="inline-flex items-center gap-2">
                            {(() => {
                                const presets = ['this', 'prev', 'next']
                                return presets.map(p => {
                                    const title = (() => {
                                        const r = computePresetRange(p)
                                        if (!r) return ''
                                        return `${fmt(r.s)} — ${fmt(r.e)}`
                                    })()
                                    const active = isPresetActive(p)
                                    const label = p === 'this' ? 'This' : p === 'prev' ? 'Prev' : 'Next'
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            title={title}
                                            aria-pressed={active}
                                            onClick={() => applyPreset(p)}
                                            className={`border rounded px-2 py-1 text-sm hover:bg-slate-100 ${active ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''}`}
                                        >
                                            {label}
                                        </button>
                                    )
                                })
                            })()}

                            <button type="button" onClick={() => applyPreset('clear')} className="border rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50" title="Clear dates">Clear</button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select aria-label="Saved presets" value={selectedPreset} onChange={e => { const v = e.target.value; if (!v) { setSelectedPreset(''); } else { loadPreset(v) } }} className="border rounded px-2 py-1 text-sm">
                            <option value="">Saved</option>
                            {Object.keys(presets || {}).map(k => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>
                        <button onClick={savePreset} className="border rounded px-2 py-1 text-sm">Save</button>
                        <button onClick={() => deletePreset(selectedPreset)} disabled={!selectedPreset} className="border rounded px-2 py-1 text-sm text-red-600 disabled:opacity-50">Delete</button>

                        <select aria-label="Filter by year" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="border rounded px-2 py-1 text-sm flex-none">
                            <option value="all">All years</option>
                            {Array.from(new Set((state.transactions || []).map(t => {
                                const d = new Date(t.date)
                                return isNaN(d.getFullYear()) ? null : String(d.getFullYear())
                            }).filter(Boolean))).sort((a, b) => Number(b) - Number(a)).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <select aria-label="Filter by month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border rounded px-2 py-1 text-sm flex-none">
                            <option value="all">All months</option>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                                <option key={m} value={String(idx)}>{m}</option>
                            ))}
                        </select>

                        <select aria-label="Sort transactions" value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1 text-sm flex-none">
                            <option value="date_desc">Date ↓</option>
                            <option value="date_asc">Date ↑</option>
                            <option value="amount_desc">Amount ↓</option>
                            <option value="amount_asc">Amount ↑</option>
                        </select>

                        <button onClick={() => exportCSV(activeTxs)} className="btn btn-ghost btn-sm">Export</button>
                        <button onClick={() => openAddModal(null)} className="btn btn-primary">New Transaction</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="text-sm text-gray-500 border-b">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Account</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">Acc Balance</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {activeTxs.map(tx => (
                                <tr key={tx.id} className="align-middle">
                                    <td className="px-4 py-3 text-sm text-gray-600">{tx.date}</td>
                                    <td className="px-4 py-3">{tx.description}</td>
                                    <td className="px-4 py-3">{renderCategoryCell(tx.category)}</td>
                                    <td className="px-4 py-3">{tx.account || 'Unassigned'}</td>
                                    <td className="px-4 py-3"><span className="pill">{tx.type}</span></td>
                                    <td className="px-4 py-3 text-right font-medium">${Number(tx.amount).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-medium">${(totals.runningBalances && totals.runningBalances[tx.id] != null) ? Number(totals.runningBalances[tx.id]).toFixed(2) : '—'}</td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <button onClick={() => openAddModal(tx.id)} className="text-sm text-indigo-600 hover:underline">Edit</button>
                                        <button onClick={() => onDelete(tx.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
