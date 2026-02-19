import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Loader from '../components/Loader'
import authWrapper from '../helper/authWrapper'
import { getMyContributionList } from '../redux/interactions'
import Link from 'next/link'

const MyContributions = () => {
  const crowdFundingContract = useSelector(state => state.fundingReducer.contract)
  const account = useSelector(state => state.web3Reducer.account)
  const [contributions, setContributions] = useState(null)

  useEffect(() => {
    (async () => {
      if (crowdFundingContract) {
        const res = await getMyContributionList(crowdFundingContract, account)
        setContributions(res)
      }
    })()
  }, [crowdFundingContract])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Contributions</h1>
        <p className="text-slate-500 text-sm mt-1">Projects you have backed with ETH</p>
      </div>

      {contributions === null ? (
        <div className="flex items-center justify-center h-64"><Loader /></div>
      ) : contributions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributions.map((data, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="stat-label">Amount Contributed</p>
                  <p className="text-xl font-bold text-indigo-600">{data.amount} <span className="text-sm font-semibold text-slate-500">ETH</span></p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="stat-label mb-1">Project Address</p>
                <Link href={'/project-details/' + data.projectAddress}>
                  <p className="text-sm font-mono text-indigo-600 hover:text-indigo-800 cursor-pointer truncate">{data.projectAddress}</p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No contributions yet</p>
          <p className="text-slate-400 text-sm mt-1">Head to the dashboard to back a campaign</p>
          <Link href="/dashboard"><span className="mt-4 inline-block btn-primary w-auto px-6 py-2">Browse Campaigns</span></Link>
        </div>
      )}
    </div>
  )
}

export default authWrapper(MyContributions)
