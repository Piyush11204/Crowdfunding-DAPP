import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { connectWithWallet } from '../helper/helper'
import { loadAccount } from '../redux/interactions'

export default function Home() {
  const router = useRouter()
  const dispatch = useDispatch()
  const web3 = useSelector(state => state.web3Reducer.connection)

  const connect = () => {
    const onSuccess = () => {
      loadAccount(web3, dispatch)
      router.push('/dashboard')
    }
    connectWithWallet(onSuccess)
  }

  useEffect(() => {
    (async () => {
      if (web3) {
        const account = await loadAccount(web3, dispatch)
        if (account && account.length > 0) {
          router.push('/dashboard')
        }
      }
    })()
  }, [web3])

  const features = [
    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Secure & Transparent', desc: 'All transactions recorded on blockchain' },
    { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Community Driven', desc: 'Contributors vote on fund withdrawals' },
    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Instant Contributions', desc: 'Send ETH directly to projects you believe in' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
      
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
          Fund<span className="text-indigo-400">Chain</span>
        </h1>
        <p className="text-slate-300 text-lg sm:text-xl max-w-lg mb-10 leading-relaxed">
          Decentralized crowdfunding powered by Ethereum. Back projects you believe in — transparently and securely.
        </p>

        <button
          onClick={connect}
          className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-100"
        >
          <svg className="w-5 h-5" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32.9582 1L13.1099 15.4339L16.7948 6.99733L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.0332 1L20.7226 15.5717L17.2052 6.99733L1.0332 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Connect MetaMask
        </button>

        <p className="text-slate-500 text-sm mt-4">MetaMask extension required</p>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto w-full px-4 pb-20 grid sm:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 text-left">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm mb-1">{f.label}</p>
            <p className="text-slate-400 text-xs">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
