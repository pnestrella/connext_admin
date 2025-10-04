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
import Loading from "./Loading";
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



  const limit = 10; // items per page

  const summaryCards = useMemo(
    () => [
      {
        title: "Employers Pending",
        count: countDisplay?.pending || 0,
        icon: <UsersRound size={24} />,
        bgColor: "bg-blue-500",
      },
      {
        title: "Total Job Seekers",
        count: countDisplay?.totalJobseekers || 0,
        icon: <Briefcase size={24} />,
        bgColor: "bg-purple-600",
      },
      {
        title: "Verified This Week",
        count: countDisplay?.verifiedThisWeek || 0,
        icon: <VerifiedIcon size={24} />,
        bgColor: "bg-indigo-600",
      },
      {
        title: "Total Employers",
        count: countDisplay?.approved || 0,
        icon: <Building size={24} />,
        bgColor: "bg-purple-600",
      },
    ],
    [countDisplay]
  );

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      // Fetch counts
      const resCounts = await getAllVerificationsCount();
      const jobseekerRes = await getJobseekerCount();

      // Calculate total pages dynamically based on counts sum


      // Fetch verification data for current page
      let status: "" | "all" | "pending" | "approved" | "rejected" = statusFilter
      if (statusFilter == 'all') {
        status = ""
        const totalItems =
          (resCounts.counts?.approved || 0) +
          (resCounts.counts?.pending || 0) +
          (resCounts.counts?.rejected || 0);
        setTotalPages(Math.ceil(totalItems / limit));
      } else if (statusFilter === 'approved') {
        const totalItems = resCounts.counts.approved || 0
        setTotalPages(Math.ceil(totalItems / limit))
      } else if (statusFilter === 'rejected') {
        const totalItems = resCounts.counts.rejected || 0
        setTotalPages(Math.ceil(totalItems / limit))
      } else {
        const totalItems = resCounts.counts.pending || 0
        setTotalPages(Math.ceil(totalItems / limit))
      }

      console.log(resCounts, 'rescounts')
      const verificationRes = await getAllVerifications(status, page);

      console.log(verificationRes, 'meios')
      const transformedData = verificationRes.data.map((item: any, index: number) => ({
        ...item,
        _rowNumber: (page - 1) * limit + index + 1, // dynamic numbering
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

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      {loading && (
        <div className="absolute top-0 bottom-0 left-0 right-0 w-full h-full bg-white/80">
          <Loading />
        </div>
      )}

      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-600 mb-6">
        A quick overview of what you need to know.
      </p>

      {/* Summary Cards */}
      <div className="flex space-x-4 mb-6">
        {summaryCards.map(({ title, count, icon, bgColor }) => (
          <div
            key={title}
            className={`flex-1 rounded-md p-4 text-white ${bgColor} flex items-center justify-between`}
          >
            <div>
              <p className="text-sm">{title}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      {/* Search + Status Filter */}
      <div className="mb-4 flex items-center space-x-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>


      {/* Table */}
      <div className="overflow-x-auto rounded-md bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <Mail size={18} className="inline mr-1" />
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <Building2 size={18} className="inline mr-1" />
                Company Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <IdCardLanyard size={18} className="inline mr-1" />
                ID Uploaded
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <CalendarClock size={18} className="inline mr-1" />
                Last Reviewed At
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <ShieldCheck size={18} className="inline mr-1" />
                Verification Status
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map(
              ({
                _id,
                _rowNumber,
                employerUID,
                email,
                companyName,
                idUploaded,
                verificationStatus,
                reviewedAt,
              }) => (
                <tr key={_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {_rowNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-2">
                    <File size={18} />
                    <span>{idUploaded}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {reviewedAt
                      ? reviewedAt.toLocaleString()
                      : "Not yet reviewed"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[verificationStatus] ||
                        "bg-gray-200 text-gray-800"
                        }`}
                    >
                      {verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRowClick(employerUID)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded ${currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          Prev
        </button>
        <span className="px-3 py-2 text-sm font-semibold">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded ${currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
