import React from 'react'
import { useParams } from 'react-router-dom'
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
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // group transactions by date (YYYY-MM-DD)
    const grouped = txs.reduce((acc, t) => {
        const key = t.date || 'Unknown'
        acc[key] = acc[key] || []
        acc[key].push(t)
        return acc
    }, {})

    const dateGroups = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

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
                {txs.length === 0 && <div className="muted">No transactions for this account.</div>}

                {txs.length > 0 && (
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
                                {dateGroups.map(dateKey => {
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
                                                        <span className={t.type === 'credit' ? 'badge-credit' : 'badge-debit'}>{t.type}</span>
                                                    </td>
                                                    <td className="py-3 text-sm text-right align-middle">
                                                        <span className={t.type === 'credit' ? 'text-emerald-600 dark:text-emerald-300 font-medium' : 'text-rose-600 dark:text-rose-300 font-medium'}>{(t.amount || 0).toFixed(2)}</span>
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
                                                        const credit = items.filter(it => it.type === 'credit').reduce((s, it) => s + Number(it.amount || 0), 0)
                                                        const debit = items.filter(it => it.type === 'debit').reduce((s, it) => s + Number(it.amount || 0), 0)
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
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
