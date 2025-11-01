import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../context/TransactionsContext'
import { useUI } from '../context/UIContext'
import { AreaChart, DonutChart, HorizontalBarChart } from '../components/Charts'

export default function Dashboard() {
    const { state, totals, dispatch } = useTransactions()
    const navigate = useNavigate()
    const { openAddModal, openAccountModal, openCategoryModal, showNotification } = useUI()
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [selectedYear, setSelectedYear] = useState('all')
    const [selectedMonth, setSelectedMonth] = useState('all')
    const [sortBy, setSortBy] = useState('date_desc')
    const [pageSize] = useState(8)
    const [page, setPage] = useState(1)

    const CREDIT_TYPES = ['credit', 'transfer_in']
    const DEBIT_TYPES = ['debit', 'transfer_out']

    // We'll compute dashboard-wide totals from the active filtered transactions so
    // the year/month/type/query filters apply to charts and summaries too.
    const computeTotalsFromTxs = (txs = []) => {
        const totalsByCategory = {}
        const totalsByAccount = {}
        let credit = 0, debit = 0

        for (const t of txs) {
            const amt = Number(t.amount || 0)
            if (CREDIT_TYPES.includes(t.type)) credit += amt
            else debit += amt

            const cat = t.category || 'Uncategorized'
            totalsByCategory[cat] = totalsByCategory[cat] || { credit: 0, debit: 0 }
            if (CREDIT_TYPES.includes(t.type)) totalsByCategory[cat].credit += amt
            else totalsByCategory[cat].debit += amt

            const acc = t.account || 'Unknown'
            totalsByAccount[acc] = totalsByAccount[acc] || { credit: 0, debit: 0 }
            if (CREDIT_TYPES.includes(t.type)) totalsByAccount[acc].credit += amt
            else totalsByAccount[acc].debit += amt
        }

        const balance = credit - debit

        // monthly summary for the last 6 months (by year-month)
        const now = new Date()
        const months = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            months.push({ key, monthLabel: d.toLocaleString(undefined, { month: 'short', year: 'numeric' }), credit: 0, debit: 0, balance: 0 })
        }
        const monthMap = Object.fromEntries(months.map(m => [m.key, m]))
        for (const t of txs) {
            const d = new Date(t.date)
            if (isNaN(d)) continue
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (monthMap[key]) {
                const amt = Number(t.amount || 0)
                if (CREDIT_TYPES.includes(t.type)) monthMap[key].credit += amt
                else monthMap[key].debit += amt
                monthMap[key].balance = monthMap[key].credit - monthMap[key].debit
            }
        }

        const monthlySummary = months.map(m => ({ month: m.monthLabel, credit: m.credit, debit: m.debit, balance: m.balance }))

        return { credit, debit, balance, totalsByCategory, totalsByAccount, monthlySummary }
    }

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

    const activeTxs = useMemo(() => {
        const q = (query || '').toLowerCase().trim()
        const all = (state.transactions || []).slice()
        const res = all.filter(t => {
            // type filter
            if (typeFilter !== 'all' && t.type !== typeFilter) return false
            // year/month filter
            if (selectedYear !== 'all' || selectedMonth !== 'all') {
                const d = new Date(t.date)
                if (selectedYear !== 'all' && String(d.getFullYear()) !== String(selectedYear)) return false
                if (selectedMonth !== 'all' && String(d.getMonth()) !== String(selectedMonth)) return false
            }
            // text query
            if (!q) return true
            return String(t.description || '').toLowerCase().includes(q) || String(t.category || '').toLowerCase().includes(q) || String(t.account || '').toLowerCase().includes(q)
        })

        // sorting
        res.sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date)
            if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date)
            if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount)
            if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount)
            return 0
        })

        return res
    }, [state.transactions, query, typeFilter, selectedYear, selectedMonth, sortBy])

    // derive visible (paginated) list from activeTxs
    const filteredTxs = useMemo(() => activeTxs.slice(0, 50), [activeTxs])

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

    // derive totals and summaries from the filtered (active) transactions so the
    // entire dashboard reflects the UI filters (year/month/type/query)
    const activeTotals = useMemo(() => computeTotalsFromTxs(activeTxs), [activeTxs])

    const topCategories = Object.entries(activeTotals.totalsByCategory || {}).map(([cat, v]) => ({
        name: cat,
        net: (v.credit || 0) - (v.debit || 0)
    })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 6)

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

            {/* Global filters / toolbar moved here from Recent Transactions card */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="relative flex-none w-full sm:w-auto">
                    <span className="absolute inset-y-0 left-2 flex items-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                    <option value="transfer_in">Transfer In</option>
                    <option value="transfer_out">Transfer Out</option>
                </select>

                {/* Year filter */}
                <select aria-label="Filter by year" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="border rounded px-2 py-1 text-sm">
                    <option value="all">All years</option>
                    {
                        // derive years from transactions
                        Array.from(new Set((state.transactions || []).map(t => {
                            const d = new Date(t.date)
                            return isNaN(d.getFullYear()) ? null : String(d.getFullYear())
                        }).filter(Boolean))).sort((a, b) => Number(b) - Number(a)).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))
                    }
                </select>

                {/* Month filter */}
                <select aria-label="Filter by month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border rounded px-2 py-1 text-sm">
                    <option value="all">All months</option>
                    {
                        ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                            <option key={m} value={String(idx)}>{m}</option>
                        ))
                    }
                </select>

                {/* Sorting */}
                <select aria-label="Sort transactions" value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1 text-sm">
                    <option value="date_desc">Date ↓</option>
                    <option value="date_asc">Date ↑</option>
                    <option value="amount_desc">Amount ↓</option>
                    <option value="amount_asc">Amount ↑</option>
                </select>

                <button onClick={() => exportCSV(filteredTxs)} className="btn btn-ghost btn-sm" title="Export CSV">Export</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <div className="text-sm muted">Total Credit</div>
                    <div className="text-2xl font-bold text-green-600 mt-2">${activeTotals.credit.toFixed(2)}</div>
                    <div className="mt-3">{sparkline(activeTotals.monthlySummary.map(m => m.credit))}</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm muted">Total Debit</div>
                    <div className="text-2xl font-bold text-red-600 mt-2">${activeTotals.debit.toFixed(2)}</div>
                    <div className="mt-3">{sparkline(activeTotals.monthlySummary.map(m => -m.debit))}</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm muted">Balance</div>
                    <div className="text-2xl font-bold mt-2">${activeTotals.balance.toFixed(2)}</div>
                    <div className="mt-3">{sparkline(activeTotals.monthlySummary.map(m => m.balance))}</div>
                </div>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium">Recent Transactions</h3>
                        {/* toolbar moved to top section */}
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
                                    <div className={`font-semibold ${CREDIT_TYPES.includes(tx.type) ? 'text-green-600' : 'text-red-600'}`}>${Number(tx.amount).toFixed(2)}</div>
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
                        <h3 className="text-lg font-medium mb-3">Charts</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm muted mb-2">Balance (spark)</div>
                                <AreaChart values={activeTotals.monthlySummary.map(m => m.balance)} width={220} height={70} />
                            </div>

                            <div>
                                <div className="text-sm muted mb-2">Top Categories</div>
                                <DonutChart items={topCategories.map(t => ({ label: t.name, value: Math.abs(t.net) }))} size={120} thickness={16} />
                            </div>

                            <div>
                                <div className="text-sm muted mb-2">Accounts</div>
                                <HorizontalBarChart items={Object.entries(activeTotals.totalsByAccount || {}).map(([k, v]) => ({ label: k, value: (v.credit || 0) - (v.debit || 0) }))} maxWidth={160} />
                            </div>
                        </div>
                    </div>
                    <div className="card-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium">Top Categories</h3>
                        </div>
                        {/* Top categories ranked */}
                        {(() => {
                            const all = Object.entries(activeTotals.totalsByCategory || {}).map(([cat, v]) => ({ name: cat, net: (v.credit || 0) - (v.debit || 0) }))
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
                            {Object.entries(activeTotals.totalsByCategory || {}).map(([cat, vals]) => {
                                const net = vals.credit - vals.debit
                                const netClass = net >= 0 ? 'text-green-600' : 'text-red-600'
                                const pct = Math.min(100, Math.abs(net) / (Math.max(1, activeTotals.balance || 1)) * 100)
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
                            {Object.entries(activeTotals.totalsByAccount || {}).map(([acc, vals]) => {
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
                            {activeTotals.monthlySummary.map(m => (
                                <li key={m.month} className="flex items-center gap-4">
                                    <div className="w-20 muted">{m.month}</div>
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="text-sm text-green-600">+${m.credit.toFixed(0)}</div>
                                        <div className="text-sm text-red-600">-${m.debit.toFixed(0)}</div>
                                        <div className="flex-1 bg-gray-100 h-2 rounded overflow-hidden">
                                            <div style={{ width: `${Math.min(100, Math.abs(m.balance) / (Math.max(1, activeTotals.credit) / 5) * 100)}%` }} className={`h-2 ${m.balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
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
