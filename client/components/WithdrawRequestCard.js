import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toastError, toastSuccess } from '../helper/toastMessage'
import { voteWithdrawRequest, withdrawAmount } from '../redux/interactions'

const WithdrawRequestCard = ({ props, withdrawReq, setWithdrawReq, contractAddress }) => {
  const dispatch = useDispatch()
  const [btnLoader, setBtnLoader] = useState(false)
  const account = useSelector(state => state.web3Reducer.account)
  const web3 = useSelector(state => state.web3Reducer.connection)

  const isCompleted = props.status === 'Completed'
  const isRecipient = account === props.reciptant

  const withdrawBalance = (reqId) => {
    setBtnLoader(reqId)
    const data = { contractAddress, reqId, account, amount: props.amount }
    withdrawAmount(web3, dispatch, data,
      () => {
        setBtnLoader(false)
        setWithdrawReq(withdrawReq.map(r => r.requestId === props.requestId ? { ...r, status: 'Completed' } : r))
        toastSuccess('Withdrawal completed')
      },
      (msg) => { setBtnLoader(false); toastError(msg) }
    )
  }

  const vote = (reqId) => {
    setBtnLoader(reqId)
    const data = { contractAddress, reqId, account }
    voteWithdrawRequest(web3, data,
      () => {
        setBtnLoader(false)
        setWithdrawReq(withdrawReq.map(r => r.requestId === props.requestId ? { ...r, totalVote: Number(r.totalVote) + 1 } : r))
        toastSuccess('Vote recorded')
      },
      (msg) => { setBtnLoader(false); toastError(msg) }
    )
  }

  return (
    <div className={'card border-l-4 ' + (isCompleted ? 'border-l-emerald-500' : 'border-l-blue-500')}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-sm font-semibold text-slate-700">{props.desc}</p>
        </div>
        <span className={'ribbon ' + (isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')}>
          <span className={'w-1.5 h-1.5 rounded-full mr-1.5 inline-block ' + (isCompleted ? 'bg-emerald-500' : 'bg-blue-500')}></span>
          {props.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="inner-card">
          <p className="stat-label">Requested Amount</p>
          <p className="stat-value">{props.amount} ETH</p>
        </div>
        <div className="inner-card">
          <p className="stat-label">Votes</p>
          <p className="stat-value">{props.totalVote}</p>
        </div>
        <div className="inner-card col-span-2 sm:col-span-1">
          <p className="stat-label">Recipient</p>
          <p className="text-xs font-mono text-slate-600 mt-0.5 truncate">{props.reciptant}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        {isRecipient ? (
          <button
            className="btn-success w-auto px-6"
            onClick={() => withdrawBalance(props.requestId)}
            disabled={isCompleted || btnLoader === props.requestId}
          >
            {btnLoader === props.requestId ? 'Processing...' : isCompleted ? 'Withdrawn' : 'Withdraw Funds'}
          </button>
        ) : (
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 px-6 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => vote(props.requestId)}
            disabled={btnLoader === props.requestId}
          >
            {btnLoader === props.requestId ? 'Voting...' : 'Vote to Approve'}
          </button>
        )}
      </div>
    </div>
  )
}

export default WithdrawRequestCard
