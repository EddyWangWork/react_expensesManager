import React from 'react'
import { useTransactions } from '../context/TransactionsContext'
import { useUI } from '../context/UIContext'

export default function Categories() {
    const { state, totals } = useTransactions()
    const { openCategoryModal } = useUI()

    // build categories set: union of state.categories and categories from transactions
    const catSet = new Set(Object.keys(state.categories || {}))
    for (const t of (state.transactions || [])) {
        if (t.category) catSet.add(t.category)
    }
    // build hierarchical map parent -> [children]
    const catsArr = Array.from(catSet).sort()
    const categories = {}
    catsArr.forEach(name => {
        const parent = (state.categories && state.categories[name] && state.categories[name].parent) || null
        if (!categories[parent]) categories[parent] = []
        categories[parent].push(name)
    })

    const renderCategory = (name) => {
        const children = categories[name] || []
        const txs = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === name)
        const total = txs.reduce((s, t) => t.type === 'credit' ? s + Number(t.amount || 0) : s - Number(t.amount || 0), 0)
        return (
            <div key={name} className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm muted">Category</div>
                        <div className="text-lg font-medium">{name}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm muted">Transactions</div>
                        <div className={`text-lg font-semibold ${total < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>{txs.length}</div>
                    </div>
                </div>

                {children.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                        <div className="text-sm muted mb-2">Subcategories</div>
                        <div className="grid gap-2">
                            {children.map(cn => {
                                const ccount = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === cn).length
                                return (
                                    <div key={cn} className="flex items-center justify-between">
                                        <div className="text-sm">{cn}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium">{ccount} tx</div>
                                            <button onClick={() => openCategoryModal(cn)} className="btn btn-ghost btn-sm">Manage</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm muted">Net</div>
                    <div className="text-sm">{total.toFixed(2)}</div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <button onClick={() => openCategoryModal(name)} className="btn btn-ghost">Manage</button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Categories</h1>
                <div className="flex items-center gap-3">
                    <button onClick={() => openCategoryModal(null)} className="btn btn-primary">New Category</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {catsArr.length === 0 && (<div className="card">No categories yet.</div>)}
                {(categories[null] || []).map(name => {
                    const children = categories[name] || []
                    const txs = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === name)
                    const total = txs.reduce((s, t) => t.type === 'credit' ? s + Number(t.amount || 0) : s - Number(t.amount || 0), 0)
                    return (
                        <div key={name} className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm muted">Category</div>
                                    <div className="text-lg font-medium">{name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm muted">Transactions</div>
                                    <div className={`text-lg font-semibold ${total < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>{txs.length}</div>
                                </div>
                            </div>

                            {children.length > 0 && (
                                <div className="mt-3 border-t pt-3">
                                    <div className="text-sm muted mb-2">Subcategories</div>
                                    <div className="grid gap-2">
                                        {children.map(cn => {
                                            const ctxs = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === cn)
                                            const ctotal = ctxs.reduce((s, t) => t.type === 'credit' ? s + Number(t.amount || 0) : s - Number(t.amount || 0), 0)
                                            return (
                                                <div key={cn} className="flex items-center justify-between">
                                                    <div className="text-sm">{cn}</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`text-sm font-medium ${ctotal < 0 ? 'text-red-600' : ''}`}>{ctxs.length} tx</div>
                                                        <button onClick={() => openCategoryModal(cn)} className="btn btn-ghost btn-sm">Manage</button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm muted">Net</div>
                                <div className="text-sm">{total.toFixed(2)}</div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openCategoryModal(null, { parent: name })} className="btn btn-sm">+ Add subcategory</button>
                                </div>
                                <button onClick={() => openCategoryModal(name)} className="btn btn-ghost">Manage</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
