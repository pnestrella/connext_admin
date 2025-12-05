"use client";

import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building,
  UsersRound,
  VerifiedIcon,
  File,
  Mail,
  Building2,
  IdCardLanyard,
  ShieldCheck,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import {
  getAllVerificationsCount,
  getAllVerifications,
} from "../api/verification";
import { getJobseekerCount } from "../api/jobseekers";
import { useAuth } from "../context/AuthHook";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-200 text-yellow-800",
  Approved: "bg-green-200 text-green-800",
  Rejected: "bg-red-200 text-red-800",
};

export default function Dashboard() {
  const { setLoading, loading } = useAuth();
  const router = useRouter();
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countDisplay, setCountDisplay] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  const limit = 10;

  const summaryCards = useMemo(
    () => [
      {
        title: "Employers Pending",
        count: countDisplay?.pending || 0,
        icon: <UsersRound size={24} />,
        bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
      },
      {
        title: "Total Job Seekers",
        count: countDisplay?.totalJobseekers || 0,
        icon: <Briefcase size={24} />,
        bgColor: "bg-gradient-to-br from-purple-500 to-purple-700",
      },
      {
        title: "Verified This Week",
        count: countDisplay?.verifiedThisWeek || 0,
        icon: <VerifiedIcon size={24} />,
        bgColor: "bg-gradient-to-br from-indigo-500 to-indigo-700",
      },
      {
        title: "Total Employers",
        count: countDisplay?.approved || 0,
        icon: <Building size={24} />,
        bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600",
      },
    ],
    [countDisplay]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
      setTimeout(() => setFadeIn(true), 300);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const resCounts = await getAllVerificationsCount();
      const jobseekerRes = await getJobseekerCount();

      let status: "" | "all" | "pending" | "approved" | "rejected" = statusFilter;
      if (statusFilter == 'all') {
        status = "";
        const totalItems =
          (resCounts.counts?.approved || 0) +
          (resCounts.counts?.pending || 0) +
          (resCounts.counts?.rejected || 0);
        setTotalPages(Math.ceil(totalItems / limit));
      } else if (statusFilter === 'approved') {
        const totalItems = resCounts.counts.approved || 0;
        setTotalPages(Math.ceil(totalItems / limit));
      } else if (statusFilter === 'rejected') {
        const totalItems = resCounts.counts.rejected || 0;
        setTotalPages(Math.ceil(totalItems / limit));
      } else {
        const totalItems = resCounts.counts.pending || 0;
        setTotalPages(Math.ceil(totalItems / limit));
      }

      const verificationRes = await getAllVerifications(status, page);

      const transformedData = verificationRes.data.map((item: any, index: number) => ({
        ...item,
        _rowNumber: (page - 1) * limit + index + 1,
        email: item.employerInfo?.email || "N/A",
        companyName: item.employerInfo?.companyName || "N/A",
        idUploaded: item.employerInfo ? "Recruiter_ID.png" : "N/A",
        verificationStatus:
          item.verificationStatus === "approved"
            ? "Approved"
            : item.verificationStatus === "pending"
              ? "Pending"
              : "Rejected",
        reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : null,
      }));

      setTableData(transformedData);
      setCountDisplay({
        ...resCounts.counts,
        totalJobseekers: jobseekerRes.totalJobseekers,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, statusFilter]);

  const filteredData = useMemo(() => {
    return tableData.filter(
      (item) =>
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tableData, searchQuery]);

  const handleRowClick = (employerUID: string) => {
    router.push(`/company/${employerUID}`);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  if (isPageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-8 max-w-md mx-auto">
          {/* DOUBLE SPINNER - centered by parent flex */}
<div className="relative w-fit mx-auto">
            <div className="w-24 h-24 border-4 border-blue-200/50 border-t-violet-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-violet-400 rounded-full animate-ping opacity-75" />
          </div>

          {/* TEXT + PULSE BAR */}
          <div className="space-y-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent tracking-tight">
              Loading Dashboard
            </h1>
            <p className="text-xl text-slate-500 font-medium">Fetching employer verifications and platform metrics...</p>

          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={`flex-1 p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen transition-all duration-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Data loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center space-y-4 max-w-md mx-auto p-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="text-lg font-medium text-slate-700">Updating dashboard...</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 bg-clip-text text-transparent mb-4 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl leading-relaxed">
            Manage employer verifications, monitor job seekers, and track platform metrics
          </p>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {summaryCards.map(({ title, count, icon, bgColor }, idx) => (
            <div
              key={title}
              className={`group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-200/50 ${bgColor} text-white`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent rounded-3xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-wider opacity-90">{title}</p>
                  <p className="text-4xl font-black">{count}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Status Filter */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search employers by company or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-6 py-4 border border-slate-200 rounded-2xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg font-medium"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Enhanced Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">#</th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Mail size={18} className="inline mr-2" />
                    Email
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Building2 size={18} className="inline mr-2" />
                    Company
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <IdCardLanyard size={18} className="inline mr-2" />
                    ID
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <CalendarClock size={18} className="inline mr-2" />
                    Reviewed
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <ShieldCheck size={18} className="inline mr-2" />
                    Status
                  </th>
                  <th className="px-8 py-5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(({ _id, _rowNumber, employerUID, email, companyName, idUploaded, verificationStatus, reviewedAt }) => (
                  <tr key={_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-slate-900">{_rowNumber}</td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-slate-700">{email}</td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-slate-900 max-w-md truncate" title={companyName}>{companyName}</td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-slate-700 flex items-center space-x-2">
                      <File size={18} className="text-slate-400" />
                      <span>{idUploaded}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-slate-600">
                      {reviewedAt ? reviewedAt.toLocaleString() : "Not reviewed"}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColors[verificationStatus] || "bg-slate-200 text-slate-800"}`}>
                        {verificationStatus}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRowClick(employerUID)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group-hover:scale-105"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-slate-500">
            Showing {filteredData.length} of {tableData.length} employers
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentPage === 1
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:shadow-md"
                }`}
            >
              Prev
            </button>
            <span className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentPage === totalPages
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:shadow-md"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
