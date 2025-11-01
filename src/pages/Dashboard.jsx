import React from 'react'
import { useTransactions } from '../context/TransactionsContext'

export default function Dashboard() {
    const { state, totals } = useTransactions()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Dashboard</h2>
                <div className="flex items-center gap-3">
                    <button className="btn btn-ghost">Export</button>
                    <button className="btn-primary">New Transaction</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <div className="text-sm muted">Total Credit</div>
                    <div className="text-2xl font-bold text-green-600 mt-2">${totals.credit.toFixed(2)}</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm muted">Total Debit</div>
                    <div className="text-2xl font-bold text-red-600 mt-2">${totals.debit.toFixed(2)}</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm muted">Balance</div>
                    <div className="text-2xl font-bold mt-2">${totals.balance.toFixed(2)}</div>
                </div>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium">Recent Transactions</h3>
                        <div className="muted">Showing latest 8</div>
                    </div>
                    <ul className="divide-y">
                        {state.transactions.slice(0, 8).map(tx => (
                            <li key={tx.id} className="flex items-center justify-between py-3">
                                <div>
                                    <div className="font-medium">{tx.description} <span className="muted">· {tx.category}</span></div>
                                    <div className="muted">{tx.date} · {tx.type}</div>
                                </div>
                                <div className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>${Number(tx.amount).toFixed(2)}</div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-6">
                    <div className="card-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium">Totals by Category</h3>
                        </div>
                        <div className="divide-y">
                            {Object.entries(totals.totalsByCategory || {}).map(([cat, vals]) => {
                                const net = vals.credit - vals.debit
                                const netClass = net >= 0 ? 'text-green-600' : 'text-red-600'
                                return (
                                    <div key={cat} className="flex items-center justify-between py-3">
                                        <div>
                                            <div className="font-medium">{cat}</div>
                                            <div className="muted">Credit ${vals.credit.toFixed(2)} · Debit ${vals.debit.toFixed(2)}</div>
                                        </div>
                                        <div className={`font-semibold ${netClass}`}>{net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}</div>
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
