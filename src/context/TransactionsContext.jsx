import React, { createContext, useContext, useReducer, useMemo } from 'react'

const TransactionsContext = createContext(null)

const initialState = {
    transactions: [
        { id: 1, description: 'Salary', amount: 3000, type: 'credit', category: 'Income', date: '2025-10-01' },
        { id: 2, description: 'Groceries', amount: 120, type: 'debit', category: 'Food', date: '2025-10-03' },
        { id: 3, description: 'Utilities', amount: 80, type: 'debit', category: 'Bills', date: '2025-09-28' },
        { id: 4, description: 'Restaurant', amount: 45.5, type: 'debit', category: 'Food', date: '2025-09-15' },
        { id: 5, description: 'Freelance', amount: 700, type: 'credit', category: 'Income', date: '2025-08-20' },
        { id: 6, description: 'Gym Membership', amount: 35, type: 'debit', category: 'Health', date: '2025-08-05' },
        { id: 7, description: 'Coffee', amount: 4.5, type: 'debit', category: 'Food', date: '2025-10-10' },
        { id: 8, description: 'Internet', amount: 60, type: 'debit', category: 'Bills', date: '2025-10-02' },
        { id: 9, description: 'Stock Dividend', amount: 50, type: 'credit', category: 'Investment', date: '2025-07-30' }
    ]
}

function reducer(state, action) {
    switch (action.type) {
        case 'add':
            return { ...state, transactions: [action.payload, ...state.transactions] }
        case 'delete':
            return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }
        default:
            return state
    }
}

export function TransactionsProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState)

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

        return { credit, debit, balance: credit - debit, totalsByCategory, monthlySummary: months }
    }, [state.transactions])

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
