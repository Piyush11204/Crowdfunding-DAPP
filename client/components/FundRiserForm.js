import React, { useState } from 'react'
import moment from 'moment'
import { startFundRaising } from '../redux/interactions'
import { useDispatch, useSelector } from 'react-redux'
import { etherToWei } from '../helper/helper'
import { toastSuccess, toastError } from '../helper/toastMessage'

const FundRiserForm = () => {
  const crowdFundingContract = useSelector(state => state.fundingReducer.contract)
  const account = useSelector(state => state.web3Reducer.account)
  const web3 = useSelector(state => state.web3Reducer.connection)
  const dispatch = useDispatch()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetedContributionAmount, setTargetedContributionAmount] = useState('')
  const [minimumContributionAmount, setMinimumContributionAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [btnLoading, setBtnLoading] = useState(false)

  const riseFund = (e) => {
    e.preventDefault()
    setBtnLoading(true)
    const unixDate = moment(deadline).valueOf()

    const onSuccess = () => {
      setBtnLoading(false)
      setTitle(''); setDescription(''); setTargetedContributionAmount(''); setMinimumContributionAmount(''); setDeadline('')
      toastSuccess('Campaign started successfully!')
    }
    const onError = (error) => { setBtnLoading(false); toastError(error) }

    const data = {
      minimumContribution: etherToWei(minimumContributionAmount),
      deadline: Number(unixDate),
      targetContribution: etherToWei(targetedContributionAmount),
      projectTitle: title,
      projectDesc: description,
      account,
    }
    startFundRaising(web3, crowdFundingContract, data, onSuccess, onError, dispatch)
  }

  const Field = ({ label, children }) => (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Start a Campaign</h2>
          <p className="text-xs text-slate-400">Free to create — powered by Ethereum</p>
        </div>
      </div>

      <form onSubmit={riseFund}>
        <Field label="Campaign Title">
          <input type="text" placeholder="e.g. Build a community garden" className="form-control-input" value={title} onChange={e => setTitle(e.target.value)} required />
        </Field>

        <Field label="Description">
          <textarea placeholder="Describe your project..." className="form-control-input resize-none" rows={3} value={description} onChange={e => setDescription(e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Goal (ETH)">
            <input type="number" placeholder="0.00" step="0.001" className="form-control-input" value={targetedContributionAmount} onChange={e => setTargetedContributionAmount(e.target.value)} required />
          </Field>
          <Field label="Min. Contribution (ETH)">
            <input type="number" placeholder="0.00" step="0.001" className="form-control-input" value={minimumContributionAmount} onChange={e => setMinimumContributionAmount(e.target.value)} required />
          </Field>
        </div>

        <Field label="Deadline">
          <div className="date-picker">
            <input type="date" className="form-control-input" value={deadline} onChange={e => setDeadline(e.target.value)} required />
          </div>
        </Field>

        <button type="submit" className="btn-primary mt-2" disabled={btnLoading}>
          {btnLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating...
            </span>
          ) : 'Launch Campaign'}
        </button>
      </form>
    </div>
  )
}

export default FundRiserForm
