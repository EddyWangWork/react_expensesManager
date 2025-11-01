import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../context/TransactionsContext'
import { useUI } from '../context/UIContext'

export default function Dashboard() {
    const { state, totals, dispatch } = useTransactions()
    const navigate = useNavigate()
    const { openAddModal, openAccountModal, openCategoryModal, showNotification } = useUI()
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [pageSize] = useState(8)
    const [page, setPage] = useState(1)

    const topCategories = Object.entries(totals.totalsByCategory || {}).map(([cat, v]) => ({
        name: cat,
        net: (v.credit || 0) - (v.debit || 0)
    })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 6)

    const sparkline = (values = []) => {
        const w = 140, h = 36, pad = 4
        if (!values || values.length === 0) return null
        const max = Math.max(...values.map(v => Math.abs(v)), 1)
        const step = (w - pad * 2) / Math.max(1, values.length - 1)
        const points = values.map((v, i) => {
            const x = pad + i * step
            const y = h - pad - ((v + max) / (max * 2)) * (h - pad * 2)
            return `${x},${y}`
        }).join(' ')
        const last = values[values.length - 1]
        return (
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block align-middle">
                <polyline fill="none" stroke="#60a5fa" strokeWidth="2" points={points} />
                <circle cx={pad + (values.length - 1) * step} cy={h - pad - ((last + max) / (max * 2)) * (h - pad * 2)} r="3" fill="#2563eb" />
            </svg>
        )
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
        a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const filteredTxs = useMemo(() => {
        const q = (query || '').toLowerCase().trim()
        return (state.transactions || []).filter(t => {
            if (typeFilter !== 'all' && t.type !== typeFilter) return false
            if (!q) return true
            return String(t.description || '').toLowerCase().includes(q) || String(t.category || '').toLowerCase().includes(q) || String(t.account || '').toLowerCase().includes(q)
        }).slice(0, 50)
    }, [state.transactions, query, typeFilter])

    const visibleTxs = filteredTxs.slice(0, pageSize * page)

    const loadMore = () => setPage(p => p + 1)

    const onEditTx = (tx) => {
        openAddModal(tx.id)
    }

    const onDeleteTx = (tx) => {
        if (!window.confirm('Delete this transaction?')) return
        const prev = JSON.parse(JSON.stringify(state))
        dispatch({ type: 'delete', payload: tx.id })
        showNotification && showNotification({ message: `Deleted ${tx.description}`, actionLabel: 'Undo', action: () => dispatch({ type: 'restore', payload: prev }) })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Dashboard</h2>
                <div className="flex items-center gap-3">
                    <button className="btn btn-ghost">Export</button>
                    <button onClick={() => openAccountModal(null)} className="btn">New Account</button>
                    <button onClick={() => openCategoryModal(null)} className="btn">New Category</button>
                    <button onClick={() => openAddModal(null)} className="btn-primary">New Transaction</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <div className="text-sm muted">Total Credit</div>
                    <div className="text-2xl font-bold text-green-600 mt-2">${totals.credit.toFixed(2)}</div>
                    <div className="mt-3">{sparkline(totals.monthlySummary.map(m => m.credit))}</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm muted">Total Debit</div>
                    <div className="text-2xl font-bold text-red-600 mt-2">${totals.debit.toFixed(2)}</div>
                    <div className="mt-3">{sparkline(totals.monthlySummary.map(m => -m.debit))}</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm muted">Balance</div>
                    <div className="text-2xl font-bold mt-2">${totals.balance.toFixed(2)}</div>
                    <div className="mt-3">{sparkline(totals.monthlySummary.map(m => m.balance))}</div>
                </div>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium">Recent Transactions</h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-none w-full sm:w-auto">
                                <span className="absolute inset-y-0 left-2 flex items-center text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
                                    </svg>
                                </span>
                                <input aria-label="Search transactions" placeholder="Search description, category, account" value={query} onChange={e => setQuery(e.target.value)} className="border rounded pl-8 pr-8 py-1 w-full sm:w-56 md:w-72" />
                                {query && (
                                    <button aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <select aria-label="Filter by type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded px-2 py-1 text-sm flex-none">
                                <option value="all">All</option>
                                <option value="debit">Debit</option>
                                <option value="credit">Credit</option>
                            </select>

                            <button onClick={() => exportCSV(filteredTxs)} className="btn btn-ghost btn-sm" title="Export CSV">Export</button>
                        </div>
                    </div>
                    {/* compact header for larger screens */}
                    <div className="hidden md:flex items-center justify-between text-sm muted px-2 py-2 border-b">
                        <div className="flex-1 font-medium">Description</div>
                        <div className="w-56 text-sm muted">When · Type · Account</div>
                        <div className="w-56 text-right">Amount · Bal · Actions</div>
                    </div>
                    <ul className="divide-y">
                        {visibleTxs.map(tx => (
                            <li key={tx.id} className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 rounded">
                                <div onClick={() => onEditTx(tx)} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="font-medium">{tx.description}</div>
                                        <div className="text-xs muted px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{tx.category || 'Uncategorized'}</div>
                                    </div>
                                    <div className="muted text-sm">{tx.date} · {tx.type} · {tx.account}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>${Number(tx.amount).toFixed(2)}</div>
                                    <div className="text-xs muted">Bal: ${totals.runningBalances && totals.runningBalances[tx.id] != null ? Number(totals.runningBalances[tx.id]).toFixed(2) : '-'}</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEditTx(tx)} className="btn btn-ghost btn-sm">Edit</button>
                                        <button onClick={() => onDeleteTx(tx)} className="btn btn-ghost btn-sm text-red-600">Delete</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {filteredTxs.length > visibleTxs.length && (
                        <div className="mt-3 text-center">
                            <button onClick={loadMore} className="btn">Load more</button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="card-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium">Top Categories</h3>
                        </div>
                        {/* Top categories ranked */}
                        {(() => {
                            const all = Object.entries(totals.totalsByCategory || {}).map(([cat, v]) => ({ name: cat, net: (v.credit || 0) - (v.debit || 0) }))
                            const sorted = all.sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 6)
                            const max = Math.max(1, ...sorted.map(s => Math.abs(s.net)))
                            return (
                                <div className="divide-y">
                                    {sorted.map(s => {
                                        const pct = Math.min(100, Math.abs(s.net) / max * 100)
                                        const cls = s.net >= 0 ? 'bg-green-500' : 'bg-red-500'
                                        return (
                                            <div key={s.name} className="flex items-center justify-between py-3">
                                                <div className="flex-1 pr-4">
                                                    <div className="font-medium cursor-pointer text-indigo-700 hover:underline" onClick={() => openCategoryModal(s.name)}>{s.name}</div>
                                                    <div className="muted text-xs">Net {s.net >= 0 ? '+' : '-'}${Math.abs(s.net).toFixed(2)}</div>
                                                    <div className="w-full bg-gray-100 h-2 rounded mt-2 overflow-hidden"><div style={{ width: `${pct}%` }} className={`h-2 ${cls}`}></div></div>
                                                </div>
                                                <div className={`font-semibold ml-4 ${s.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{s.net >= 0 ? '+' : '-'}${Math.abs(s.net).toFixed(0)}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })()}
                    </div>

                    <div className="card-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium">Totals by Category</h3>
                        </div>
                        <div className="divide-y">
                            {Object.entries(totals.totalsByCategory || {}).map(([cat, vals]) => {
                                const net = vals.credit - vals.debit
                                const netClass = net >= 0 ? 'text-green-600' : 'text-red-600'
                                const pct = Math.min(100, Math.abs(net) / (Math.max(1, totals.balance || 1)) * 100)
                                return (
                                    <div key={cat} className="flex items-center justify-between py-3">
                                        <div className="flex-1 pr-4">
                                            <div className="font-medium">{cat}</div>
                                            <div className="muted text-xs">Credit ${vals.credit.toFixed(2)} · Debit ${vals.debit.toFixed(2)}</div>
                                            <div className="w-full bg-gray-100 h-2 rounded mt-2 overflow-hidden"><div style={{ width: `${pct}%` }} className={`h-2 ${net >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div></div>
                                        </div>
                                        <div className={`font-semibold ml-4 ${netClass}`}>{net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="card-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium">Totals by Account</h3>
                        </div>
                        <div className="divide-y">
                            {Object.entries(totals.totalsByAccount || {}).map(([acc, vals]) => {
                                const net = vals.credit - vals.debit
                                const netClass = net >= 0 ? 'text-green-600' : 'text-red-600'
                                const starting = state.accounts && state.accounts[acc] ? Number(state.accounts[acc]) : 0
                                const current = starting + net
                                const currentClass = current >= 0 ? 'text-green-600' : 'text-red-600'
                                return (
                                    <div key={acc} className="flex items-center justify-between py-3">
                                        <div>
                                            <div className="font-medium">{acc}</div>
                                            <div className="muted">Credit ${vals.credit.toFixed(2)} · Debit ${vals.debit.toFixed(2)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-semibold ${netClass}`}>{net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}</div>
                                            <div className={`muted ${currentClass}`}>Balance ${current.toFixed(2)}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="card-lg">
                        <h3 className="text-lg font-medium mb-3">Monthly Summary (last 6 months)</h3>
                        <ul className="space-y-3">
                            {totals.monthlySummary.map(m => (
                                <li key={m.month} className="flex items-center gap-4">
                                    <div className="w-20 muted">{m.month}</div>
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="text-sm text-green-600">+${m.credit.toFixed(0)}</div>
                                        <div className="text-sm text-red-600">-${m.debit.toFixed(0)}</div>
                                        <div className="flex-1 bg-gray-100 h-2 rounded overflow-hidden">
                                            <div style={{ width: `${Math.min(100, Math.abs(m.balance) / (Math.max(1, totals.credit) / 5) * 100)}%` }} className={`h-2 ${m.balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        </div>
                                        <div className="text-sm font-medium w-20 text-right">${m.balance.toFixed(0)}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    )
}
