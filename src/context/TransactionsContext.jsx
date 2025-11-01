import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react'

const TransactionsContext = createContext(null)

const initialState = {
    transactions: [
        { id: 1, description: 'Salary', amount: 3000, type: 'credit', category: 'Income', date: '2025-10-01', account: 'ABCBank' },
        { id: 2, description: 'Groceries', amount: 120, type: 'debit', category: 'Food', date: '2025-10-03', account: 'CreditCardA' },
        { id: 3, description: 'Utilities', amount: 80, type: 'debit', category: 'Bills', date: '2025-09-28', account: 'ABCBank' },
        { id: 4, description: 'Restaurant', amount: 45.5, type: 'debit', category: 'Food', date: '2025-09-15', account: 'CreditCardA' },
        { id: 5, description: 'Freelance', amount: 700, type: 'credit', category: 'Income', date: '2025-08-20', account: 'PayPal' },
        { id: 6, description: 'Gym Membership', amount: 35, type: 'debit', category: 'Health', date: '2025-08-05', account: 'ABCBank' },
        { id: 7, description: 'Coffee', amount: 4.5, type: 'debit', category: 'Food', date: '2025-10-10', account: 'Cash' },
        { id: 8, description: 'Internet', amount: 60, type: 'debit', category: 'Bills', date: '2025-10-02', account: 'ABCBank' },
        { id: 9, description: 'Stock Dividend', amount: 50, type: 'credit', category: 'Investment', date: '2025-07-30', account: 'Brokerage' }
    ]
    ,
    accounts: {
        ABCBank: 2000,
        CreditCardA: -150,
        PayPal: 300,
        Cash: 50,
        Brokerage: 1000
    }
    ,
    // categories: map name -> { parent: string | null }
    categories: {
        Income: { parent: null },
        Food: { parent: null },
        Bills: { parent: null },
        Health: { parent: null },
        Investment: { parent: null },
        General: { parent: null }
    }
}

function reducer(state, action) {
    switch (action.type) {
        case 'add':
            return { ...state, transactions: [action.payload, ...state.transactions] }
        case 'delete':
            return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }
        case 'update':
            return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) }
        case 'addAccount':
            return { ...state, accounts: { ...(state.accounts || {}), [action.payload.name]: Number(action.payload.balance || 0) } }
        case 'updateAccount':
            return { ...state, accounts: { ...(state.accounts || {}), [action.payload.name]: Number(action.payload.balance || 0) } }
        case 'deleteAccount': {
            const name = action.payload.name
            const reassignTo = action.payload.reassignTo || 'Unassigned'
            const accounts = { ...(state.accounts || {}) }
            delete accounts[name]
            // reassign transactions from this account to reassignTo
            const transactions = (state.transactions || []).map(t => t.account === name ? { ...t, account: reassignTo } : t)
            return { ...state, accounts, transactions }
        }
        case 'renameAccount': {
            const { oldName, newName } = action.payload
            const accounts = { ...(state.accounts || {}) }
            const val = accounts[oldName]
            if (val === undefined) return state
            // put newName and delete old
            accounts[newName] = Number(accounts[oldName] || 0)
            delete accounts[oldName]
            // update transactions
            const transactions = (state.transactions || []).map(t => t.account === oldName ? { ...t, account: newName } : t)
            return { ...state, accounts, transactions }
        }
        case 'addCategory': {
            const name = action.payload.name
            const parent = action.payload.parent || null
            return { ...state, categories: { ...(state.categories || {}), [name]: { parent } } }
        }
        case 'deleteCategory': {
            const name = action.payload.name
            const reassignTo = action.payload.reassignTo || 'Uncategorized'
            const categories = { ...(state.categories || {}) }
            delete categories[name]
            // reparent any children of the deleted category
            const newParent = reassignTo === 'Uncategorized' ? null : reassignTo
            Object.keys(categories).forEach(k => {
                if (categories[k] && categories[k].parent === name) categories[k].parent = newParent
            })
            const transactions = (state.transactions || []).map(t => t.category === name ? { ...t, category: reassignTo } : t)
            return { ...state, categories, transactions }
        }
        case 'renameCategory': {
            const { oldName, newName } = action.payload
            const categories = { ...(state.categories || {}) }
            const val = categories[oldName]
            if (val === undefined) return state
            // move entry
            categories[newName] = { ...(categories[oldName] || {}) }
            delete categories[oldName]
            // update any children parent references
            Object.keys(categories).forEach(k => {
                if (categories[k] && categories[k].parent === oldName) categories[k].parent = newName
            })
            const transactions = (state.transactions || []).map(t => t.category === oldName ? { ...t, category: newName } : t)
            return { ...state, categories, transactions }
        }
        case 'restore': {
            // replace entire state (used for undo)
            return action.payload
        }
        default:
            return state
    }
}

export function TransactionsProvider({ children }) {
    // initialize from localStorage when available
    function init(initial) {
        try {
            const raw = localStorage.getItem('expenses_state')
            if (raw) return JSON.parse(raw)
        } catch (e) {
            // ignore
        }
        return initial
    }

    const [state, dispatch] = useReducer(reducer, initialState, init)

    // persist state to localStorage on changes
    useEffect(() => {
        try {
            localStorage.setItem('expenses_state', JSON.stringify(state))
        } catch (e) {
            // ignore quota errors
        }
    }, [state])

    const totals = useMemo(() => {
        const credit = state.transactions
            .filter(t => t.type === 'credit')
            .reduce((s, t) => s + Number(t.amount || 0), 0)
        const debit = state.transactions
            .filter(t => t.type === 'debit')
            .reduce((s, t) => s + Number(t.amount || 0), 0)
        // totals by category
        const totalsByCategory = state.transactions.reduce((acc, t) => {
            const cat = t.category || 'Uncategorized'
            acc[cat] = acc[cat] || { credit: 0, debit: 0 }
            if (t.type === 'credit') acc[cat].credit += Number(t.amount || 0)
            else acc[cat].debit += Number(t.amount || 0)
            return acc
        }, {})

        // totals by account
        const totalsByAccount = state.transactions.reduce((acc, t) => {
            const accName = t.account || 'Unknown'
            acc[accName] = acc[accName] || { credit: 0, debit: 0 }
            if (t.type === 'credit') acc[accName].credit += Number(t.amount || 0)
            else acc[accName].debit += Number(t.amount || 0)
            return acc
        }, {})

        // monthly summary (group by YYYY-MM)
        const groupByMonth = state.transactions.reduce((acc, t) => {
            const d = t.date ? new Date(t.date) : new Date()
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            acc[key] = acc[key] || { credit: 0, debit: 0 }
            if (t.type === 'credit') acc[key].credit += Number(t.amount || 0)
            else acc[key].debit += Number(t.amount || 0)
            return acc
        }, {})

        // produce an ordered array of months (last 6 months)
        const months = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const item = groupByMonth[key] || { credit: 0, debit: 0 }
            months.push({ month: key, credit: item.credit, debit: item.debit, balance: item.credit - item.debit })
        }

        // compute running balances per transaction per account
        const runningBalances = (() => {
            const map = {}
            // start from initial accounts (copy)
            const accBalances = { ...(state.accounts || {}) }
            // sort transactions by date asc, then id asc
            const txs = [...state.transactions].sort((a, b) => {
                const da = new Date(a.date).getTime() || 0
                const db = new Date(b.date).getTime() || 0
                if (da !== db) return da - db
                return a.id - b.id
            })
            for (const t of txs) {
                const name = t.account || 'Unassigned'
                if (accBalances[name] === undefined) accBalances[name] = 0
                if (t.type === 'credit') accBalances[name] += Number(t.amount || 0)
                else accBalances[name] -= Number(t.amount || 0)
                map[t.id] = accBalances[name]
            }
            return map
        })()

        return { credit, debit, balance: credit - debit, totalsByCategory, totalsByAccount, monthlySummary: months, runningBalances }
    }, [state.transactions, state.accounts])

    const value = { state, dispatch, totals }

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    )
}

export function useTransactions() {
    const ctx = useContext(TransactionsContext)
    if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider')
    return ctx
}
