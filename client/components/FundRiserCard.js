import React, { useState } from 'react'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { contribute, createWithdrawRequest } from '../redux/interactions'
import { etherToWei } from '../helper/helper'
import { toastSuccess, toastError } from '../helper/toastMessage'

const statusConfig = {
  Fundraising: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  Expired:     { bg: 'bg-red-100',  text: 'text-red-700',  dot: 'bg-red-500' },
  Successful:  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

const FundRiserCard = ({ props, pushWithdrawRequests }) => {
  const [btnLoader, setBtnLoader] = useState(false)
  const [amount, setAmount] = useState('')
  const dispatch = useDispatch()
  const crowdFundingContract = useSelector(state => state.fundingReducer.contract)
  const account = useSelector(state => state.web3Reducer.account)
  const web3 = useSelector(state => state.web3Reducer.connection)
  const status = statusConfig[props.state] || statusConfig.Fundraising

  const contributeAmount = (projectId, minContribution) => {
    if (Number(amount) < Number(minContribution)) {
      toastError('Minimum contribution amount is ' + minContribution + ' ETH')
      return
    }
    setBtnLoader(projectId)
    const contributionAmount = etherToWei(amount)
    const data = { contractAddress: projectId, amount: contributionAmount, account }
    contribute(crowdFundingContract, data, dispatch,
      () => { setBtnLoader(false); setAmount(''); toastSuccess('Contributed ' + amount + ' ETH successfully') },
      (msg) => { setBtnLoader(false); toastError(msg) }
    )
  }

  const requestForWithdraw = (projectId) => {
    setBtnLoader(projectId)
    const contributionAmount = etherToWei(amount)
    const data = { description: amount + ' ETH requested for withdraw', amount: contributionAmount, recipient: account, account }
    createWithdrawRequest(web3, projectId, data,
      (d) => { setBtnLoader(false); setAmount(''); if (pushWithdrawRequests) pushWithdrawRequests(d); toastSuccess('Withdraw request created for ' + amount + ' ETH') },
      (msg) => { setBtnLoader(false); toastError(msg) }
    )
  }

  return (
    <div className="card border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <Link href={'/project-details/' + props.address}>
            <h2 className="text-lg font-bold text-slate-800 hover:text-indigo-600 cursor-pointer truncate transition-colors">{props.title}</h2>
          </Link>
          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{props.description}</p>
        </div>
        <span className={'ribbon ' + status.bg + ' ' + status.text}>
          <span className={'w-1.5 h-1.5 rounded-full mr-1.5 inline-block ' + status.dot}></span>
          {props.state}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="inner-card">
          <p className="stat-label">Goal</p>
          <p className="stat-value">{props.goalAmount} ETH</p>
        </div>
        <div className="inner-card">
          <p className="stat-label">Raised</p>
          <p className="stat-value">{props.currentAmount} ETH</p>
        </div>
        <div className="inner-card">
          <p className="stat-label">Min. Contribution</p>
          <p className="stat-value">{props.minContribution} ETH</p>
        </div>
        <div className="inner-card">
          <p className="stat-label">Deadline</p>
          <p className="stat-value">{props.deadline}</p>
        </div>
      </div>

      {/* Progress bar */}
      {props.state !== 'Successful' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{props.progress}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress" style={{ width: props.progress + '%' }}></div>
          </div>
        </div>
      )}

      {/* Action area */}
      {props.state !== 'Successful' ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Contribute (ETH)</label>
          <div className="flex w-full sm:w-auto gap-0">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={btnLoader === props.address}
              className="input flex-1 sm:w-36"
            />
            <button
              className="button"
              onClick={() => contributeAmount(props.address, props.minContribution)}
              disabled={btnLoader === props.address}
            >
              {btnLoader === props.address ? 'Loading...' : 'Back'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="inner-card flex-1">
            <p className="stat-label">Contract Balance</p>
            <p className="stat-value">{props.contractBalance} ETH</p>
          </div>
          {props.creator === account && (
            <div className="flex gap-0 w-full sm:w-auto">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={btnLoader === props.address}
                className="input flex-1 sm:w-36"
              />
              <button className="button" onClick={() => requestForWithdraw(props.address)} disabled={btnLoader === props.address}>
                {btnLoader === props.address ? 'Loading...' : 'Withdraw'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FundRiserCard
