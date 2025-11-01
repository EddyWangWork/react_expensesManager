import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import AddTransaction from './pages/AddTransaction'
import About from './pages/About'
import { TransactionsProvider } from './context/TransactionsContext'

export default function App() {
    return (
        <TransactionsProvider>
            <div className="app-shell">
                <NavBar />
                <main className="max-w-7xl mx-auto px-6 py-10">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/add" element={<AddTransaction />} />
                        <Route path="/about" element={<About />} />
                    </Routes>
                </main>
            </div>
        </TransactionsProvider>
    )
}
