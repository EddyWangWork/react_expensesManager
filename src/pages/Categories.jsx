import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useTransactions } from '../context/TransactionsContext'
import { useUI } from '../context/UIContext'
import Icon from '../components/Icon'

export default function Categories() {
    const { state, totals } = useTransactions()
    const { openCategoryModal } = useUI()

    const [searchQuery, setSearchQuery] = useState('')
    const [txFilter, setTxFilter] = useState('all') // all | has | empty
    const [mainFilter, setMainFilter] = useState('all')
    const [subFilter, setSubFilter] = useState('all')

    const CREDIT_TYPES = ['credit', 'transfer_in']
    const DEBIT_TYPES = ['debit', 'transfer_out']

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

    // options for main/sub selects
    const parentOptions = categories[null] || []
    const subOptions = useMemo(() => {
        if (mainFilter && mainFilter !== 'all') return categories[mainFilter] || []
        // all children across parents (collect from our categories map, excluding top-level list at key null)
        const allChildren = []
        for (const p in categories) {
            if (p === 'null') continue
            if (Array.isArray(categories[p])) allChildren.push(...categories[p])
        }
        return Array.from(new Set(allChildren)).sort()
    }, [categories, mainFilter])

    // reset subFilter when mainFilter changes to avoid stale selection
    useEffect(() => {
        setSubFilter('all')
    }, [mainFilter])

    const subRef = useRef(null)
    const searchRef = useRef(null)

    // focus the sub select when main changes
    useEffect(() => {
        if (subRef.current) subRef.current.focus()
    }, [mainFilter])

    const categoryTxCount = (name) => {
        const txs = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === name)
        return txs.length
    }

    const filteredParents = useMemo(() => {
        const q = (searchQuery || '').trim().toLowerCase()
        const parents = (categories[null] || []).filter(parentName => {
            // main/sub filter: if mainFilter is set, only include that parent
            if (mainFilter && mainFilter !== 'all' && parentName !== mainFilter) return false
            // if a specific subFilter is chosen, only include the parent that owns it
            if (subFilter && subFilter !== 'all') {
                // determine if this parent should be included for the selected subFilter
                let matched = false
                // 1) metadata map: sub has explicit parent
                if (state.categories && state.categories[subFilter] && state.categories[subFilter].parent) {
                    matched = (state.categories[subFilter].parent === parentName)
                } else {
                    // 2) computed categories map: check if this parent's children include the sub
                    if ((categories[parentName] || []).includes(subFilter)) matched = true
                    // 3) if subFilter itself is a top-level parent, allow the matching parentName
                    if (!matched && parentName === subFilter) matched = true
                    // 4) fallback: search other parents for the sub (rare) and match only if found under this parent
                    if (!matched) {
                        for (const p in categories) {
                            if (p === 'null') continue
                            if ((categories[p] || []).includes(subFilter)) { matched = (p === parentName); break }
                        }
                    }
                }
                if (!matched) return false
            }
            // transaction filter
            const pCount = categoryTxCount(parentName)
            if (txFilter === 'has' && pCount === 0) return false
            if (txFilter === 'empty' && pCount > 0) return false

            if (!q) return true
            // match parent name
            if (parentName.toLowerCase().includes(q)) return true
            // match any child name
            const children = categories[parentName] || []
            for (const c of children) {
                if (c.toLowerCase().includes(q)) return true
            }
            return false
        })
        return parents
    }, [categories, searchQuery, txFilter, state.transactions, mainFilter, subFilter])

    const renderCategory = (name) => {
        const children = categories[name] || []
        const txs = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === name)
        const total = txs.reduce((s, t) => (CREDIT_TYPES.includes(t.type) ? s + Number(t.amount || 0) : s - Number(t.amount || 0)), 0)
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

            {/* controls above the grid */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Icon name="search" className="w-4 h-4" />
                        </div>
                        <input
                            ref={searchRef}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search categories..."
                            className="border rounded px-8 py-1 text-sm w-64"
                            aria-label="Search categories"
                            title="Search categories"
                        />
                        {searchQuery && (
                            <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1">
                                <Icon name="x" className="w-4 h-4" title="Clear" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="mainFilter" className="sr-only">Filter by main category</label>
                        <select id="mainFilter" value={mainFilter} onChange={e => setMainFilter(e.target.value)} className="border rounded px-2 py-1 text-sm" title="Filter by main category">
                            <option value="all">All mains</option>
                            {parentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>

                        <label htmlFor="subFilter" className="sr-only">Filter by subcategory</label>
                        <select id="subFilter" ref={subRef} value={subFilter} onChange={e => setSubFilter(e.target.value)} className="border rounded px-2 py-1 text-sm" title="Filter by subcategory">
                            <option value="all">All subs</option>
                            {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select value={txFilter} onChange={e => setTxFilter(e.target.value)} className="border rounded px-2 py-1 text-sm" title="Filter by transaction presence">
                            <option value="all">All</option>
                            <option value="has">Has transactions</option>
                            <option value="empty">No transactions</option>
                        </select>

                        <button type="button" onClick={() => { setMainFilter('all'); setSubFilter('all'); setTxFilter('all'); setSearchQuery(''); if (searchRef.current) searchRef.current.focus(); }} title="Clear main and sub filters" aria-label="Clear category filters" className="ml-2 text-sm px-2 py-1 border rounded bg-gray-50 hover:bg-gray-100">
                            <Icon name="x" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="text-sm muted">Showing {filteredParents.length} of {(categories[null] || []).length} parent categories</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {catsArr.length === 0 && (<div className="card">No categories yet.</div>)}
                {catsArr.length > 0 && filteredParents.length === 0 && (<div className="card">No categories match your filters.</div>)}
                {filteredParents.map(name => {
                    const children = categories[name] || []
                    const txs = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === name)
                    const total = txs.reduce((s, t) => (CREDIT_TYPES.includes(t.type) ? s + Number(t.amount || 0) : s - Number(t.amount || 0)), 0)

                    // compute visible children based on search and txFilter
                    const q = (searchQuery || '').trim().toLowerCase()
                    const visibleChildren = children.filter(cn => {
                        if (txFilter === 'has') {
                            const ccount = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === cn).length
                            if (ccount === 0) return false
                        }
                        if (txFilter === 'empty') {
                            const ccount = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === cn).length
                            if (ccount > 0) return false
                        }
                        if (!q) return true
                        return cn.toLowerCase().includes(q)
                    })

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

                            {visibleChildren.length > 0 && (
                                <div className="mt-3 border-t pt-3">
                                    <div className="text-sm muted mb-2">Subcategories</div>
                                    <div className="grid gap-2">
                                        {visibleChildren.map(cn => {
                                            const ctxs = (state.transactions || []).filter(t => (t.category || 'Uncategorized') === cn)
                                            const ctotal = ctxs.reduce((s, t) => (CREDIT_TYPES.includes(t.type) ? s + Number(t.amount || 0) : s - Number(t.amount || 0)), 0)
                                            return (
                                                <div key={cn} className="flex items-center justify-between">
                                                    <div className="text-sm">{cn}</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`text-sm font-medium ${ctotal < 0 ? 'text-red-600' : ctotal == 0 ? '' : 'text-green-600'}`}>{ctxs.length} tx</div>
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
