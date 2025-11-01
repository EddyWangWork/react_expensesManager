import React from 'react'
import { useUI } from '../context/UIContext'
import { useTransactions } from '../context/TransactionsContext'

export default function Transactions() {
    const { state, dispatch, totals } = useTransactions()
    const { openAddModal } = useUI()

    const onDelete = (id) => {
        if (window.confirm('Delete this transaction?')) dispatch({ type: 'delete', payload: id })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Transactions</h2>
                <div className="muted">Total: {state.transactions.length}</div>
            </div>

            <div className="card-lg">
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
                            {state.transactions.map(tx => (
                                <tr key={tx.id} className="align-middle">
                                    <td className="px-4 py-3 text-sm text-gray-600">{tx.date}</td>
                                    <td className="px-4 py-3">{tx.description}</td>
                                    <td className="px-4 py-3">{tx.category || 'Uncategorized'}</td>
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
