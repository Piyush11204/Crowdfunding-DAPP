import React from 'react'
import authWrapper from '../helper/authWrapper'
import FundRiserForm from '../components/FundRiserForm'
import { useSelector } from 'react-redux'
import FundRiserCard from '../components/FundRiserCard'
import Loader from '../components/Loader'

const Dashboard = () => {
  const projectsList = useSelector(state => state.projectReducer.projects)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Active Campaigns</h1>
        <p className="text-slate-500 text-sm mt-1">Browse and contribute to ongoing fundraising projects</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Projects list */}
        <div className="flex-1 min-w-0">
          {projectsList === undefined ? (
            <div className="flex items-center justify-center h-64"><Loader /></div>
          ) : projectsList.length > 0 ? (
            <div className="space-y-4">
              {projectsList.map((data, i) => (
                <FundRiserCard props={data} key={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No campaigns yet</p>
            </div>
          )}
        </div>

        {/* Form sidebar */}
        <div className="lg:w-96 shrink-0">
          <div className="card sticky top-20">
            <FundRiserForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default authWrapper(Dashboard)
