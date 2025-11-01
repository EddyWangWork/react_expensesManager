import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useUI } from '../context/UIContext'
import { useTransactions } from '../context/TransactionsContext'

export default function AccountDetail() {
    const { name } = useParams()
    const acctName = decodeURIComponent(name || '')
    const { state, totals } = useTransactions()

    const start = Number((state.accounts || {})[acctName] || 0)
    const accTotals = (totals.totalsByAccount && totals.totalsByAccount[acctName]) || { credit: 0, debit: 0 }
    const current = start + (accTotals.credit || 0) - (accTotals.debit || 0)

    const txs = (state.transactions || []).filter(t => (t.account || 'Unassigned') === acctName)

    // filtering / sorting state for this account page
    const navigate = useNavigate()
    const location = useLocation()
    const initialParams = React.useMemo(() => new URLSearchParams(location.search), [location.search])

    const [query, setQuery] = React.useState(() => initialParams.get('q') || '')
    const [typeFilter, setTypeFilter] = React.useState(() => initialParams.get('type') || 'all') // all | debit | credit
    const [sortBy, setSortBy] = React.useState(() => initialParams.get('sort') || 'date_desc') // date_desc | date_asc | amount_desc | amount_asc
    const [minAmount, setMinAmount] = React.useState(() => initialParams.get('min') || '')
    const [maxAmount, setMaxAmount] = React.useState(() => initialParams.get('max') || '')
    const [startDate, setStartDate] = React.useState(() => initialParams.get('start') || '')
    const [endDate, setEndDate] = React.useState(() => initialParams.get('end') || '')

    const CREDIT_TYPES = ['credit', 'transfer_in']
    const DEBIT_TYPES = ['debit', 'transfer_out']

    // formatter to produce yyyy-mm-dd using local date parts (avoids timezone shifts)
    const fmt = d => {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0') // months are 0-indexed
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
    }

    // human-friendly date for tooltips
    const pretty = d => {
        try {
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        } catch (e) {
            return fmt(d)
        }
    }

    // compute the preset start/end (returns {s: Date, e: Date}) using the same base logic
    const computePresetRange = (preset) => {
        if (!preset) return null

        // determine base date: prefer startDate, then endDate, then today
        let base
        try {
            if (startDate) base = new Date(startDate)
            else if (endDate) base = new Date(endDate)
            else base = new Date()
            if (isNaN(base.getTime())) base = new Date()
        } catch (e) {
            base = new Date()
        }

        const currentDate = new Date()
        const currentDateY = currentDate.getFullYear()
        const currentDateM = currentDate.getMonth()
        const y = base.getFullYear()
        const m = base.getMonth()

        let s, e
        if (preset === 'this') {
            // this -> current calendar month (based on today)
            s = new Date(currentDateY, currentDateM, 1)
            e = new Date(currentDateY, currentDateM + 1, 0)
        } else if (preset === 'prev') {
            s = new Date(y, m - 1, 1)
            e = new Date(y, m, 0)
        } else if (preset === 'next') {
            s = new Date(y, m + 1, 1)
            e = new Date(y, m + 2, 0)
        } else if (preset === 'clear') {
            return null
        }

        return { s, e }
    }

    const applyPreset = (preset) => {
        if (!preset) return
        if (preset === 'clear') {
            setStartDate('')
            setEndDate('')
            return
        }
        const r = computePresetRange(preset)
        if (!r) return
        setStartDate(fmt(r.s))
        setEndDate(fmt(r.e))
    }

    // UI state: whether groups should always be newest-first (true) or follow sortBy (false)
    const [groupsNewestFirst, setGroupsNewestFirst] = React.useState(true)

    // helper to check if a preset matches the current start/end values
    const isPresetActive = (preset) => {
        const r = computePresetRange(preset)
        if (!r) return false
        return startDate === fmt(r.s) && endDate === fmt(r.e)
    }

    const clearAllFilters = () => {
        setQuery('')
        setTypeFilter('all')
        setMinAmount('')
        setMaxAmount('')
        setStartDate('')
        setEndDate('')
        setSortBy('date_desc')
    }

    // derive filtered and sorted transactions for this view
    const filteredTxs = React.useMemo(() => {
        let out = txs.slice()
        const q = (query || '').trim().toLowerCase()
        if (q) {
            out = out.filter(t => (t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
        }
        if (typeFilter && typeFilter !== 'all') {
            out = out.filter(t => t.type === typeFilter)
        }
        const min = parseFloat(minAmount)
        const max = parseFloat(maxAmount)
        const start = startDate ? new Date(startDate) : null
        const end = endDate ? new Date(endDate) : null
        if (!isNaN(min)) out = out.filter(t => (Number(t.amount) || 0) >= min)
        if (!isNaN(max)) out = out.filter(t => (Number(t.amount) || 0) <= max)
        if (start) out = out.filter(t => {
            try {
                return new Date(t.date) >= start
            } catch (e) {
                return true
            }
        })
        if (end) out = out.filter(t => {
            try {
                return new Date(t.date) <= end
            } catch (e) {
                return true
            }
        })
        switch (sortBy) {
            case 'date_asc':
                out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                break
            case 'date_desc':
                out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                break
            case 'amount_asc':
                out.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
                break
            case 'amount_desc':
                out.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
                break
            default:
                break
        }
        return out
    }, [txs, query, typeFilter, sortBy, minAmount, maxAmount, startDate, endDate])

    // group filtered transactions by date (YYYY-MM-DD)
    const grouped = React.useMemo(() => {
        return (filteredTxs || []).reduce((acc, t) => {
            const key = t.date || 'Unknown'
            acc[key] = acc[key] || []
            acc[key].push(t)
            return acc
        }, {})
    }, [filteredTxs])

    const dateGroups = React.useMemo(() => {
        const keys = Object.keys(grouped)
        if (groupsNewestFirst) {
            // always show newest groups first
            return keys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        }
        // follow sortBy
        if (sortBy === 'date_asc') {
            return keys.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        }
        return keys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    }, [grouped, sortBy, groupsNewestFirst])

    // persist filter state to URL whenever filters change
    React.useEffect(() => {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
        if (sortBy && sortBy !== 'date_desc') params.set('sort', sortBy)
        if (minAmount) params.set('min', minAmount)
        if (maxAmount) params.set('max', maxAmount)
        if (startDate) params.set('start', startDate)
        if (endDate) params.set('end', endDate)

        const search = params.toString()
        const target = search ? `${location.pathname}?${search}` : location.pathname
        navigate(target, { replace: true })
    }, [query, typeFilter, sortBy, minAmount, maxAmount, startDate, endDate, navigate, location.pathname])

    // when sorting by amount we show a flat list (no date grouping) so amount ordering is obvious
    const isFlat = sortBy && sortBy.startsWith('amount')

    const { openAddModal } = useUI()

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">{acctName}</h1>
                    <div className="text-sm muted">Starting: {start.toFixed(2)}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm muted">Current Balance</div>
                    <div className={`text-xl font-semibold ${current < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>{current.toFixed(2)}</div>
                    <div className="mt-2">
                        <button onClick={() => openAddModal(null, { defaultAccount: acctName })} className="btn btn-primary">Add Transaction</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-lg font-medium mb-4">Transactions</h2>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <input placeholder="Search description or category" value={query} onChange={e => setQuery(e.target.value)} className="border rounded px-3 py-1 w-full md:w-64" />
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded px-2 py-1">
                            <option value="all">All types</option>
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                            <option value="transfer_in">Transfer In</option>
                            <option value="transfer_out">Transfer Out</option>
                        </select>
                        <input placeholder="min" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="border rounded px-2 py-1 w-16 md:w-20" />
                        <input placeholder="max" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="border rounded px-2 py-1 w-16 md:w-20" />
                        <input type="date" aria-label="from date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1 w-28 md:w-36" />
                        <input type="date" aria-label="to date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1 w-28 md:w-36" />
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1">
                            <option value="date_desc">Date ↓</option>
                            <option value="date_asc">Date ↑</option>
                            <option value="amount_desc">Amount ↓</option>
                            <option value="amount_asc">Amount ↑</option>
                        </select>
                    </div>

                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                    <div className="inline-flex items-center gap-2">
                        {(() => {
                            const presets = ['this', 'prev', 'next']
                            return presets.map(p => {
                                const r = computePresetRange(p)
                                const title = r ? `${pretty(r.s)} — ${pretty(r.e)}` : ''
                                const active = isPresetActive(p)
                                const label = p === 'this' ? 'This' : p === 'prev' ? 'Prev' : 'Next'
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        title={title}
                                        aria-pressed={active}
                                        aria-label={active ? `${label} preset active (${title})` : `Apply ${label} preset: ${title}`}
                                        onClick={() => applyPreset(p)}
                                        className={`border rounded px-2 py-1 text-sm hover:bg-slate-100 ${active ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''}`}
                                    >
                                        {label}
                                    </button>
                                )
                            })
                        })()}

                        <button type="button" onClick={() => applyPreset('clear')} className="border rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50" title="Clear dates" aria-label="Clear date filters">Clear</button>
                        <button type="button" onClick={clearAllFilters} className="border rounded px-2 py-1 text-sm ml-2 hover:bg-slate-100" title="Clear all filters" aria-label="Clear all filters">Clear all</button>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm flex items-center gap-2">
                            <input type="checkbox" checked={groupsNewestFirst} onChange={e => setGroupsNewestFirst(e.target.checked)} />
                            <span className="text-sm muted">Groups newest-first</span>
                        </label>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                    <div className="inline-flex items-center gap-2">
                        <div className="text-sm muted">Showing {filteredTxs.length} of {txs.length}</div>
                    </div>
                </div>

                {filteredTxs.length === 0 && <div className="muted">No transactions match the filters.</div>}

                {filteredTxs.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-sm text-slate-500">
                                    <th className="pb-2">Description</th>
                                    <th className="pb-2">Type</th>
                                    <th className="pb-2 text-right">Amount</th>
                                    <th className="pb-2 text-right">Acc Balance</th>
                                    <th className="pb-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isFlat ? (
                                    filteredTxs.map(t => (
                                        <tr key={t.id} className="border-t dark:border-slate-700 row-hover">
                                            <td className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{t.description}</div>
                                                        {t.category && <div className="text-sm muted">{t.category}</div>}
                                                    </div>
                                                    <div className="ml-4 text-right">
                                                        <div className="text-sm muted">{t.date}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-sm align-middle">
                                                <span className={CREDIT_TYPES.includes(t.type) ? 'badge-credit' : 'badge-debit'}>{t.type}</span>
                                            </td>
                                            <td className="py-3 text-sm text-right align-middle">
                                                <span className={CREDIT_TYPES.includes(t.type) ? 'text-emerald-600 dark:text-emerald-300 font-medium' : 'text-rose-600 dark:text-rose-300 font-medium'}>{(t.amount || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="py-3 text-sm text-right align-middle">{(totals.runningBalances && totals.runningBalances[t.id] !== undefined) ? totals.runningBalances[t.id].toFixed(2) : '-'}</td>
                                            <td className="py-3 text-sm text-right align-middle">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button onClick={() => openAddModal(t.id)} className="text-sm text-indigo-600 hover:underline">Edit</button>
                                                    <button onClick={() => openAddModal(t.id, { action: 'delete' })} className="text-sm text-red-600 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    dateGroups.map(dateKey => {
                                        const items = grouped[dateKey]
                                        const formatted = (() => {
                                            try {
                                                const d = new Date(dateKey)
                                                return isNaN(d.getTime()) ? dateKey : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                            } catch (e) {
                                                return dateKey
                                            }
                                        })()

                                        return (
                                            <React.Fragment key={dateKey}>
                                                <tr className="bg-slate-50 dark:bg-slate-800">
                                                    <td colSpan={5} className="py-2 text-sm font-medium">{formatted}</td>
                                                </tr>
                                                {items.map(t => (
                                                    <tr key={t.id} className="border-t dark:border-slate-700 row-hover">
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="font-medium">{t.description}</div>
                                                                    {t.category && <div className="text-sm muted">{t.category}</div>}
                                                                </div>
                                                                <div className="ml-4 text-right">
                                                                    <div className="text-sm muted">{t.date}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-sm align-middle">
                                                            <span className={CREDIT_TYPES.includes(t.type) ? 'badge-credit' : 'badge-debit'}>{t.type}</span>
                                                        </td>
                                                        <td className="py-3 text-sm text-right align-middle">
                                                            <span className={CREDIT_TYPES.includes(t.type) ? 'text-emerald-600 dark:text-emerald-300 font-medium' : 'text-rose-600 dark:text-rose-300 font-medium'}>{(t.amount || 0).toFixed(2)}</span>
                                                        </td>
                                                        <td className="py-3 text-sm text-right align-middle">{(totals.runningBalances && totals.runningBalances[t.id] !== undefined) ? totals.runningBalances[t.id].toFixed(2) : '-'}</td>
                                                        <td className="py-3 text-sm text-right align-middle">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <button onClick={() => openAddModal(t.id)} className="text-sm text-indigo-600 hover:underline">Edit</button>
                                                                <button onClick={() => openAddModal(t.id, { action: 'delete' })} className="text-sm text-red-600 hover:underline">Delete</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* day subtotal row (credit / debit breakdown) */}
                                                <tr className="border-t bg-slate-100 dark:bg-slate-900/40">
                                                    <td colSpan={3} className="py-2 text-sm font-medium">Day totals</td>
                                                    <td className="py-2 text-sm text-right">
                                                        {(() => {
                                                            const credit = items.filter(it => CREDIT_TYPES.includes(it.type)).reduce((s, it) => s + Number(it.amount || 0), 0)
                                                            const debit = items.filter(it => DEBIT_TYPES.includes(it.type)).reduce((s, it) => s + Number(it.amount || 0), 0)
                                                            return (
                                                                <div className="text-sm">
                                                                    <div className="text-emerald-600 font-medium">+{credit.toFixed(2)}</div>
                                                                    <div className="text-rose-600 font-medium">-{debit.toFixed(2)}</div>
                                                                </div>
                                                            )
                                                        })()}
                                                    </td>
                                                    <td className="py-2" />
                                                </tr>
                                            </React.Fragment>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
