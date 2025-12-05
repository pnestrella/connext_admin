"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";

const analyticsData = {
  jobSeekers: {
    total: 1247,
    newThisWeek: 89,
    newThisMonth: 342,
    active7Days: 456,
    active30Days: 892,
    avgApplications: 4.2,
    totalApplications: 5234
  },
  jobs: {
    totalActive: 1567,
    newThisWeek: 123,
    newThisMonth: 389,
    avgApplicationsPerJob: 3.3,
    totalApplications: 5234
  },
  coreSwipes: {
    totalSwipes: 45231,
    shortlistedCount: 8742,
    skippedCount: 36489,
    overallShortlistRate: "19.3%"
  },
  perJobStats: [
    { jobTitle: "Senior React Developer", swipes: 342, shortlists: 89, skips: 253, rate: "26.0%" },
    { jobTitle: "Fullstack Engineer", swipes: 287, shortlists: 72, skips: 215, rate: "25.1%" }
  ],
  perSeekerStats: [
    { seeker: "john_doe23", swipes: 156, shortlists: 34, skips: 122, rate: "21.8%" },
    { seeker: "maria_smith", swipes: 89, shortlists: 32, skips: 57, rate: "35.9%" }
  ],
  industryBreakdown: [
    { industry: "Frontend", shortlists: 2345, skips: 4567, rate: "33.9%" },
    { industry: "Backend", shortlists: 1987, skips: 3892, rate: "33.8%" }
  ],
  workTypeBreakdown: [
    { type: "Remote", shortlists: 4567, skips: 7891, rate: "36.6%" },
    { type: "Onsite", shortlists: 2345, skips: 5678, rate: "29.2%" }
  ]
};

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setFadeIn(true), 300);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-200/50 border-t-violet-500 rounded-full animate-spin mx-auto mb-8" />
              <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-violet-400 rounded-full mx-auto animate-ping opacity-75" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent tracking-tight">
                Loading Analytics
              </h1>
              <p className="text-xl text-slate-500 font-medium">Fetching comprehensive platform analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className={`flex-1 p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen transition-all duration-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 bg-clip-text text-transparent mb-4 tracking-tight">
            Platform Analytics
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl leading-relaxed">
            Complete overview of job seekers, listings, swipes, and engagement metrics
          </p>
        </div>

        {/* Top Metrics Grid - All Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Job Seekers */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-200/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-black text-slate-900 mb-4">{analyticsData.jobSeekers.total.toLocaleString()}</div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Total Job Seekers</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold text-emerald-600 block">+{analyticsData.jobSeekers.newThisWeek}</span><span>New this week</span></div>
              <div><span className="font-semibold text-slate-900">{analyticsData.jobSeekers.active30Days}</span><span>Active (30d)</span></div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:border-emerald-200/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2 2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2 2m-2 10H3" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-black text-slate-900 mb-4">{analyticsData.jobs.totalActive.toLocaleString()}</div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Active Job Listings</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold text-emerald-600">+{analyticsData.jobs.newThisWeek}</span><span>New this week</span></div>
              <div><span className="font-semibold text-slate-900">{analyticsData.jobs.avgApplicationsPerJob}</span><span>Apps/Job</span></div>
            </div>
          </div>

          {/* Total Swipes */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:border-pink-200/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-black text-slate-900 mb-4">{analyticsData.coreSwipes.totalSwipes.toLocaleString()}</div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Total Swipes</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-semibold text-emerald-600">{analyticsData.coreSwipes.shortlistedCount.toLocaleString()}</span>
              <span className="font-semibold text-rose-600">{analyticsData.coreSwipes.skippedCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Job Seekers & Jobs Details */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-8 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Engagement Metrics
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 text-lg">Job Seekers</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Active (7d)</span><span className="font-bold">{analyticsData.jobSeekers.active7Days}</span></div>
                  <div className="flex justify-between"><span>Avg Apps/Seeker</span><span className="font-bold text-amber-600">{analyticsData.jobSeekers.avgApplications}</span></div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 text-lg">Job Listings</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Avg Apps/Job</span><span className="font-bold">{analyticsData.jobs.avgApplicationsPerJob}</span></div>
                  <div className="flex justify-between"><span>Total Applications</span><span className="font-bold">{analyticsData.jobs.totalApplications.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe Performance */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-8 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Swipe Performance
            </h2>
            <div className="space-y-6">
              <div className="text-3xl font-black text-emerald-600 mb-2">{analyticsData.coreSwipes.overallShortlistRate}</div>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Overall Shortlist Rate</p>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{width: '19.3%'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Jobs */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl max-h-96 overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-3">
              Top Jobs <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Live</span>
            </h3>
            <div className="space-y-3">
              {analyticsData.perJobStats.map((job, idx) => (
                <div key={idx} className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl hover:bg-emerald-50 transition-all">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate pr-4">{job.jobTitle}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 text-lg">{job.rate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Seekers */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Top Seekers by Shortlist Rate
            </h3>
            <div className="space-y-3">
              {analyticsData.perSeekerStats.map((seeker, idx) => (
                <div key={idx} className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs mr-3">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate pr-4">{seeker.seeker}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 text-lg">{seeker.rate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industry & Work Type - Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {analyticsData.industryBreakdown.slice(0, 2).map((industry, idx) => (
            <div key={idx} className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 group hover:shadow-xl transition-all">
              <p className="font-semibold text-slate-900 mb-2">{industry.industry}</p>
              <div className="text-2xl font-black text-emerald-600">{industry.rate}</div>
            </div>
          ))}
          {analyticsData.workTypeBreakdown.slice(0, 1).map((type, idx) => (
            <div key={idx} className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 group hover:shadow-xl transition-all col-span-1 md:col-span-2 lg:col-span-1">
              <p className="font-semibold text-slate-900 mb-2">{type.type}</p>
              <div className="text-2xl font-black text-emerald-600">{type.rate}</div>
              <p className="text-sm text-slate-500 mt-1">{type.shortlists.toLocaleString()} shortlists</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
