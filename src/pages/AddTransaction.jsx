import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../context/TransactionsContext'

export default function AddTransaction() {
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState('debit')
    const [category, setCategory] = useState('General')
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

    const { dispatch } = useTransactions()
    const navigate = useNavigate()

    const onSubmit = (e) => {
        e.preventDefault()
        const payload = {
            id: Date.now(),
            description: description || 'Untitled',
            amount: parseFloat(amount) || 0,
            type,
            category: category || 'General',
            date
        }
        dispatch({ type: 'add', payload })
        navigate('/transactions')
    }

    return (
        <div className="max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Add Transaction</h2>
            <form onSubmit={onSubmit} className="card-lg">
                <label className="block mb-3">
                    <div className="text-sm muted">Description</div>
                    <input value={description} onChange={e => setDescription(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <label className="block">
                        <div className="text-sm muted">Amount</div>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                    </label>

                    <label className="block">
                        <div className="text-sm muted">Type</div>
                        <select value={type} onChange={e => setType(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2">
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                        </select>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <label>
                        <div className="text-sm muted">Category</div>
                        <input value={category} onChange={e => setCategory(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                    </label>

                    <label>
                        <div className="text-sm muted">Date</div>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                    </label>
                </div>

                <div className="flex gap-3">
                    <button type="submit" className="btn-primary">Add</button>
                    <button type="button" onClick={() => navigate(-1)} className="btn">Cancel</button>
                </div>
            </form>
        </div>
    )
}
