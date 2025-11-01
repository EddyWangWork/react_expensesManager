import React from 'react'
import { Link } from 'react-router-dom'
import { useTransactions } from '../context/TransactionsContext'
import { useUI } from '../context/UIContext'

export default function Accounts() {
    const { state, totals } = useTransactions()

    const accounts = { ...(state.accounts || {}) }

    const { openAddModal, openAccountModal } = useUI()

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Accounts</h1>
                <div className="flex items-center gap-3">
                    <button onClick={() => openAddModal(null)} className="btn btn-primary">New Transaction</button>
                    <button onClick={() => openAccountModal(null)} className="btn">New Account</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(accounts).length === 0 && (
                    <div className="card">No accounts yet.</div>
                )}

                {Object.keys(accounts).map(name => {
                    const start = Number(accounts[name] || 0)
                    const accTotals = (totals.totalsByAccount && totals.totalsByAccount[name]) || { credit: 0, debit: 0 }
                    const current = start + (accTotals.credit || 0) - (accTotals.debit || 0)

                    return (
                        <div key={name} className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm muted">Account</div>
                                    <div className="text-lg font-medium">{name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm muted">Balance</div>
                                    <div className={`text-lg font-semibold ${current < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>{current.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm muted">Starting</div>
                                <div className="text-sm">{start.toFixed(2)}</div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <Link to={`/accounts/${encodeURIComponent(name)}`} className="text-sm text-indigo-600 hover:underline">View transactions</Link>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openAccountModal(name)} className="btn btn-ghost">Edit</button>
                                    <button onClick={() => openAddModal(null, { defaultAccount: name })} className="btn btn-ghost">Add Tx</button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
