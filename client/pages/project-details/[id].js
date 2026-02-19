import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import FundRiserCard from '../../components/FundRiserCard'
import Loader from '../../components/Loader'
import WithdrawRequestCard from '../../components/WithdrawRequestCard'
import authWrapper from '../../helper/authWrapper'
import { getAllWithdrawRequest, getContributors } from '../../redux/interactions'

const ProjectDetails = () => {
  const router = useRouter()
  const { id } = router.query
  const web3 = useSelector(state => state.web3Reducer.connection)
  const projectsList = useSelector(state => state.projectReducer.projects)
  const filteredProject = projectsList?.filter(data => data.address === id)

  const [contributors, setContributors] = useState(null)
  const [withdrawReq, setWithdrawReq] = useState(null)

  useEffect(() => {
    if (id) {
      getContributors(web3, id, setContributors, err => console.error(err))
      getAllWithdrawRequest(web3, id, setWithdrawReq)
    }
  }, [id])

  const pushWithdrawRequests = (data) => {
    setWithdrawReq(prev => prev ? [...prev, data] : [data])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/dashboard"><span className="hover:text-indigo-600 cursor-pointer">Dashboard</span></Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-800 font-medium">Project Details</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: project card + withdraw requests */}
        <div className="flex-1 min-w-0 space-y-6">
          {filteredProject && filteredProject.length > 0 ? (
            <FundRiserCard props={filteredProject[0]} pushWithdrawRequests={pushWithdrawRequests} />
          ) : (
            <div className="flex items-center justify-center h-40"><Loader /></div>
          )}

          {/* Withdraw Requests */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">Withdraw Requests</h2>
            {withdrawReq === null ? (
              <div className="flex items-center justify-center h-24"><Loader /></div>
            ) : withdrawReq.length > 0 ? (
              <div className="space-y-3">
                {withdrawReq.map((data, i) => (
                  <WithdrawRequestCard key={i} props={data} withdrawReq={withdrawReq} setWithdrawReq={setWithdrawReq} contractAddress={id} />
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <p className="text-slate-400 text-sm">No withdraw requests yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: contributors */}
        <div className="lg:w-80 shrink-0">
          <div className="card sticky top-20">
            <h2 className="text-base font-bold text-slate-800 mb-4">Contributors</h2>
            {contributors === null ? (
              <div className="flex items-center justify-center h-24"><Loader /></div>
            ) : contributors.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {contributors.map((data, i) => (
                  <div key={i} className="inner-card flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-600 truncate">{data.contributor}</p>
                      <p className="text-xs font-bold text-indigo-600">{data.amount} ETH</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-6">No contributors yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default authWrapper(ProjectDetails)
