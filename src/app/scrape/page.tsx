"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { createScrapeBatch, deleteScrapeJob, getAllScrapedJobs, getScrapeBatches, postJobsExternal, scrapeJobs } from "../../../api/scrape";
import { useRouter } from "next/navigation";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrapedJobs, setScrapedJobs] = useState([]);
  const [scrapeType, setScrapeType] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // ✅ FIXED: Added missing state
  const [externalSearchQuery, setExternalSearchQuery] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [deleteModal, setDeleteModal] = useState({ show: false, jobUID: null });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cancelConfirmation, setCancelConfirmation] = useState(false);
  const [scrapeDuration, setScrapeDuration] = useState(0);
  const [batches, setBatches] = useState([]);
  const [externalJobs, setExternalJobs] = useState([]);

  const router = useRouter();

  // Table state
  const [selectedBatchUID, setSelectedBatchUID] = useState(null);
  const [currentTableView, setCurrentTableView] = useState('batches');

  // External jobs expanded state and delete state
  const [expandedExternalJob, setExpandedExternalJob] = useState(null);
  const [externalDeleteModal, setExternalDeleteModal] = useState({ show: false, jobUID: null });

  //get the batches
  const getBatches = async () => {
    try {
      const batches = await getScrapeBatches();
      console.log(batches, ' batched');
      setBatches([...batches.data].reverse());
    } catch (err) {
      console.log(err);
      alert("error catching batches");
    }
  };

  //get externalJobs
  const getExternalJobs = async () => {
    try {
      const jobs = await getAllScrapedJobs();
      console.log(jobs, ' EXTENRAL JOBSSSSSSSSSS');
      setExternalJobs(jobs.data);
    } catch (err) {
      console.log(err);
      alert("error catching External Jobs");
    }
  };

  useEffect(() => {
    getBatches();
    getExternalJobs();
  }, []);

  const scrapeStartTime = useRef(null);
  const scrapeIntervalRef = useRef(null);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  // Format location for display and search
  const formatLocation = (location) => {
    if (!location) return null;
    if (typeof location === 'string') return location;
    return location.display_name || location.city || 'N/A';
  };

  // ✅ FIXED: Proper filteredJobs computation
  const filteredJobs = scrapedJobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const regex = new RegExp(searchQuery.trim(), "i");
    return (
      regex.test(job.jobTitle) ||
      regex.test(job.jobDescription) ||
      regex.test(job.profilePic) ||
      (job.jobSkills && job.jobSkills.some((skill) => regex.test(skill))) ||
      regex.test(job.jobIndustry || '') ||
      (job.location && regex.test(job.location))
    );
  });

  // Enhanced search function for external jobs
  const filterExternalJobs = (jobs, query) => {
    if (!query.trim()) return jobs;
    const regex = new RegExp(query.trim(), "i");

    return jobs.filter(job => {
      if (regex.test(job.jobTitle)) return true;
      if (regex.test(job.jobDescription)) return true;
      if (regex.test(job.profilePic)) return true;
      if (job.jobSkills?.some(skill => regex.test(skill))) return true;
      if (regex.test(job.jobIndustry || '')) return true;
      if (regex.test(job.jobNormalized || '')) return true;
      if (regex.test(job.companyName || '')) return true;
      if (job.employment?.some(emp => regex.test(emp))) return true;
      if (job.workTypes?.some(type => regex.test(type))) return true;

      const locationStr = formatLocation(job.location);
      if (locationStr && regex.test(locationStr)) return true;

      if (job.location) {
        if (regex.test(job.location.display_name || '')) return true;
        if (regex.test(job.location.city || '')) return true;
        if (regex.test(job.location.province || '')) return true;
        if (regex.test(job.location.country || '')) return true;
      }

      return false;
    });
  };

  const filteredExternalJobs = filterExternalJobs(externalJobs, externalSearchQuery);

  const startScrapeTimer = () => {
    scrapeStartTime.current = Date.now();
    setScrapeDuration(0);
    scrapeIntervalRef.current = setInterval(() => {
      if (scrapeStartTime.current) {
        setScrapeDuration(Math.floor((Date.now() - scrapeStartTime.current) / 1000));
      }
    }, 1000);
  };

  const stopScrapeTimer = () => {
    if (scrapeIntervalRef.current) {
      clearInterval(scrapeIntervalRef.current);
      scrapeIntervalRef.current = null;
    }
    if (scrapeStartTime.current) {
      const finalDuration = Math.floor((Date.now() - scrapeStartTime.current) / 1000);
      setScrapeDuration(finalDuration);
    }
  };

  const handleFullScrape = async () => {
    setScrapeType("full");
    setIsLoading(true);
    startScrapeTimer();
    setIsOpen(false);
    try {
      const res = await scrapeJobs("full");
      const uniqueJobs = Array.from(new Map((res.data.jobs || []).map((job) => [job.jobUID, job])).values());
      setScrapedJobs(uniqueJobs);
      setShowResults(true);
    } catch (err) {
      console.log("Fullscrape Error", err);
      alert("Error Occurred");
    } finally {
      setIsLoading(false);
      stopScrapeTimer();
    }
  };

  const handlePartialScrape = async () => {
    setScrapeType("partial");
    setIsLoading(true);
    startScrapeTimer();
    setIsOpen(false);
    try {
      const res = await scrapeJobs("partial");
      const uniqueJobs = Array.from(new Map((res.data.jobs || []).map((job) => [job.jobUID, job])).values());
      setScrapedJobs(uniqueJobs);
      setShowResults(true);
    } catch (err) {
      console.log("Partial scrape Error", err);
      alert("Error Occurred");
    } finally {
      setIsLoading(false);
      stopScrapeTimer();
    }
  };

  const resetScrapeTimer = () => {
    stopScrapeTimer();
    setScrapeDuration(0);
    scrapeStartTime.current = null;
  };

  // ✅ FIXED: handleSave now works with filteredJobs
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const saveOutput = {
        batchUID: filteredJobs[0]?.batchUID || `batch-${Date.now()}`,
        duration: scrapeDuration,
        numOfJobScraped: filteredJobs.length,
        type: scrapeType
      };

      console.log(filteredJobs, 'FILTERED JOBS');
      const res = await createScrapeBatch(saveOutput);
      const jobs = await postJobsExternal(filteredJobs);

      console.log("JOBS EXTERNAL", jobs);
      console.log(res, "SCRAPE BATCH");

      // Reset states
      setShowResults(false);
      setScrapedJobs([]);
      setSearchQuery("");
      setExpandedDescriptions({});
      resetScrapeTimer();

      // Refresh data
      getBatches();
      getExternalJobs();

      setIsSaving(false);
      setSaveSuccess(true);

      // Auto-dismiss success
      setTimeout(() => setSaveSuccess(false), 2000);

    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed");
      setIsSaving(false);
    }
  };

  const handleCancelRequest = () => {
    resetScrapeTimer();
    setCancelConfirmation(true);
  };

  const confirmCancel = () => {
    setCancelConfirmation(false);
    setShowResults(false);
    setScrapedJobs([]);
    setSearchQuery("");
    setExpandedDescriptions({});
    setIsLoading(false);
  };

  const cancelCancel = () => {
    setCancelConfirmation(false);
  };

  const handleDeleteClick = (jobUID) => {
    setDeleteModal({ show: true, jobUID });
  };

  const confirmDelete = () => {
    if (deleteModal.jobUID) {
      setScrapedJobs((prev) => prev.filter((job) => job?.jobUID !== deleteModal.jobUID));
    }
    setDeleteModal({ show: false, jobUID: null });
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, jobUID: null });
  };

  const toggleDescription = (jobUID) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [jobUID]: !prev[jobUID],
    }));
  };

  const jobToDelete = scrapedJobs.find((job) => job.jobUID === deleteModal.jobUID);

  const formatSalary = (salaryRange) => {
    if (!salaryRange?.min && !salaryRange?.max) return null;
    if (salaryRange.min && salaryRange.max) {
      return `${salaryRange.currency || ""}${salaryRange.min.toLocaleString()}-${salaryRange.max.toLocaleString()}/${salaryRange.frequency || "yr"}`;
    }
    return `${salaryRange.currency || ""}${salaryRange.min?.toLocaleString() || salaryRange.max?.toLocaleString()}/${salaryRange.frequency || "yr"}`;
  };

  // External jobs handlers
  const handleRowClick = (jobUID) => {
    setExpandedExternalJob(expandedExternalJob === jobUID ? null : jobUID);
  };

  const handleExternalDeleteClick = (jobUID, e) => {
    e.stopPropagation();
    setExternalDeleteModal({ show: true, jobUID });
  };

  const confirmExternalDelete = () => {
    const job = externalJobs.find(j => j.jobUID === externalDeleteModal.jobUID);
    if (job) {
      (async () => {
        const res = await deleteScrapeJob(job.jobUID);
        console.log(res, "DELETED")
        getBatches();
        getExternalJobs();
      })();

    }
    setExternalDeleteModal({ show: false, jobUID: null });
  };

  const cancelExternalDelete = () => {
    setExternalDeleteModal({ show: false, jobUID: null });
  };

  const externalJobToDelete = externalJobs.find(job => job.jobUID === externalDeleteModal.jobUID);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-1">External Jobs Control Panel</h1>
        <p className="text-gray-600 mb-6">Manage and run external job imports</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-xl">
          {/* Total Batches */}
          <div className="group relative">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{batches.length.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Total External Jobs */}
          <div className="group relative">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-all duration-300">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">External Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{externalJobs.length.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Average Scrape Duration */}
          <div className="group relative">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-all duration-300">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Avg Duration</p>
                {batches.length > 0 ? (
                  <p className="text-xl font-bold text-gray-900">
                    {formatDuration(Math.round(batches.reduce((sum, b) => sum + b.duration, 0) / batches.length))}
                  </p>
                ) : (
                  <p className="text-xl font-bold text-gray-500">-</p>
                )}
              </div>
            </div>
          </div>

          {/* Jobs per Batch */}
          <div className="group relative">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-all duration-300">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Jobs/Batch</p>
                {batches.length > 0 ? (
                  <p className="text-xl font-bold text-gray-900">
                    {Math.round(batches.reduce((sum, b) => sum + b.numOfJobScraped, 0) / batches.length).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xl font-bold text-gray-500">-</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium mb-6"
          disabled={isLoading || showResults || isSaving || saveSuccess}
        >
          {isLoading ? "Scraping..." : "Run Scrape"}
        </button>

        {/* Table Toggle Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setCurrentTableView('batches');
              setSelectedBatchUID(null);
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${currentTableView === 'batches'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
          >
            Scraping Batches
          </button>
          <button
            onClick={() => {
              setCurrentTableView('external-jobs');
              setSelectedBatchUID(null);
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${currentTableView === 'external-jobs'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
          >
            External Jobs
          </button>
        </div>

        {/* DYNAMIC TABLE */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentTableView === 'batches' ? 'Recent Scraping Batches' : 'Saved External Jobs'}
            </h2>

            {/* EXTERNAL JOBS SEARCH BAR */}
            {currentTableView === 'external-jobs' && (
              <div className="mt-4">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search jobs (title, skills, location, company, industry...)"
                    value={externalSearchQuery}
                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {externalSearchQuery && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing {filteredExternalJobs.length} of {externalJobs.length} jobs
                  </p>
                )}
              </div>
            )}
          </div>

          {currentTableView === 'batches' ? (
            // BATCHES TABLE
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scrape Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs Scraped</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch, index) => (
                    <tr
                      key={batch.batchUID}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedBatchUID === batch.batchUID ? "bg-blue-50" : ""}`}
                      onClick={() => router.push(`/scrape/${batch.batchUID}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 truncate max-w-xs" title={batch.batchUID}>
                        {batch.batchUID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(batch.scrapeDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                            ${batch?.type === "full"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            }`}
                        >
                          {batch?.type === "full" ? "Full scrape" : "Partial scrape"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{formatDuration(batch.duration)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.numOfJobScraped.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // EXTERNAL JOBS TABLE
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Swipes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExternalJobs.map((job) => {
                    const isExpanded = expandedExternalJob === job.jobUID;

                    return (
                      <>
                        <tr
                          key={job.jobUID}
                          className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}
                          onClick={() => handleRowClick(job.jobUID)}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="font-semibold text-xs text-indigo-700">{job.profilePic?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={job.jobTitle}>
                                  {job.jobTitle}
                                </div>
                                {job.jobSkills?.slice(0, 2).map((skill, idx) => (
                                  <span key={idx} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full mr-1">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                              {job.profilePic}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900" title={formatLocation(job.location)}>
                            {formatLocation(job.location) || job.workTypes?.join(', ') || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatSalary(job.salaryRange) || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium text-lg text-pink-600">{job.interactionCount || 0}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(job.createdAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={(e) => handleExternalDeleteClick(job.jobUID, e)}
                              className="p-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all"
                              title="Delete job"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {/* aaa */}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED ROW */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-6 py-8">
                              <div className="max-w-4xl mx-auto">
                                <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                  <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Full Job Description</h3>
                                    <button
                                      onClick={() => handleRowClick(job.jobUID)}
                                      className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Collapse
                                    </button>
                                  </div>
                                  <div className="prose prose-sm max-w-none">
                                    <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                                      {job.jobDescription}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Skills</div>
                                    <div className="flex flex-wrap gap-2">
                                      {job.jobSkills?.map((skill, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Details</div>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="text-gray-500">Location:</span> <span title={formatLocation(job.location)}>{formatLocation(job.location) || job.workTypes?.join(', ') || 'N/A'}</span></div>
                                      <div><span className="text-gray-500">Salary:</span> {formatSalary(job.salaryRange) || 'N/A'}</div>
                                      <div><span className="text-gray-500">Swipes:</span> <span className="font-semibold text-pink-600">{job.interactionCount || 0}</span></div>
                                      <div><span className="text-gray-500">Industry:</span> {job.jobIndustry || 'N/A'}</div>
                                    </div>
                                  </div>

                                  <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Links</div>
                                    <div className="space-y-3">
                                      <a
                                        href={job.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-all group"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Open Original Posting
                                      </a>
                                      <div className="text-xs text-gray-500">
                                        📱 Source: {job.profilePic}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ FIXED: Added COMPLETE Results Modal */}
        {showResults && !isSaving && !saveSuccess && scrapedJobs.length > 0 && !cancelConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={handleCancelRequest} />
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Scraped Jobs</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Found <span className="font-semibold text-blue-600">{scrapedJobs.length}</span> {scrapeType.toLowerCase()} jobs
                    {searchQuery && ` • Showing ${filteredJobs.length} matching "${searchQuery}"`}
                    <br />
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      ✅ Completed in {scrapeDuration}s
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search jobs by title, description, skills, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 px-6 pb-6 overflow-y-auto">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <div key={job.jobUID} className="p-4 border border-gray-200 rounded-xl mb-4 hover:bg-gray-50 transition-all hover:shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="font-semibold text-sm text-gray-600">{job.profilePic?.charAt(0).toUpperCase() || "R"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg truncate pr-4">{job.jobTitle}</h3>
                              {job.workTypes?.[0] && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{job.workTypes[0]}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <span className="font-medium">{job.profilePic}</span>
                              {job.employment && <span>{job.employment}</span>}
                              {job.location && <span>• {job.location}</span>}
                            </div>
                            {formatSalary(job.salaryRange) && (
                              <div className="mb-3 p-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                                <span className="text-sm font-semibold text-emerald-800">💰 {formatSalary(job.salaryRange)}</span>
                              </div>
                            )}
                            <div className="mb-3">
                              <p className={`text-sm text-gray-500 leading-relaxed ${expandedDescriptions[job.jobUID] ? "" : "line-clamp-2"}`}>
                                {job.jobDescription}
                              </p>
                              <button
                                onClick={() => toggleDescription(job.jobUID)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 hover:underline"
                              >
                                {expandedDescriptions[job.jobUID] ? "See less" : "See more"}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{job.jobIndustry}</span>
                              {job.jobSkills?.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            {job.link && (
                              <a
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium underline group"
                              >
                                🔗 View full job posting
                                <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteClick(job.jobUID)}
                          className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Remove this job"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">No jobs match "{searchQuery}"</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={filteredJobs.length === 0 || isSaving}
                  className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>💾 Save</span>
                  <span>{filteredJobs.length} Jobs</span>
                </button>
                <button onClick={handleCancelRequest} className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* External Delete Confirmation Modal */}
        {externalDeleteModal.show && externalJobToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={cancelExternalDelete} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete External Job?</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Remove "<span className="font-medium">{externalJobToDelete.jobTitle}</span>" permanently?
                </p>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={confirmExternalDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={cancelExternalDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading modal */}
        {isLoading && !isSaving && !saveSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-8 shadow-2xl text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <h2 className="text-lg font-semibold mb-2">{scrapeType} scraping... ({scrapeDuration}s)</h2>
              <p className="text-sm text-gray-600">Fetching real jobs from sources</p>
            </div>
          </div>
        )}

        {/* Choose scrape type modal */}
        {isOpen && !isLoading && !showResults && !isSaving && !saveSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-semibold mb-2">Choose scrape type</h2>
              <p className="text-sm text-gray-600 mb-6">Select whether to run a full scrape or only new jobs.</p>
              <div className="space-y-3">
                <button
                  onClick={handleFullScrape}
                  className="w-full px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-all"
                  disabled={isLoading}
                >
                  Full Scrape
                </button>
                <button
                  onClick={handlePartialScrape}
                  className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-all"
                  disabled={isLoading}
                >
                  Partial Scrape (New Only)
                </button>
              </div>
              <button onClick={() => setIsOpen(false)} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 py-1">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Saving modal */}
        {(isSaving || saveSuccess) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-12 shadow-2xl text-center flex flex-col items-center space-y-4">
              {isSaving && (
                <>
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mb-4"></div>
                  <h2 className="text-xl font-semibold">Saving jobs...</h2>
                  <p className="text-sm text-gray-600">Please wait while we save the scraped jobs.</p>
                </>
              )}
              {saveSuccess && (
                <>
                  <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <h2 className="text-2xl font-semibold text-green-600">Jobs saved successfully!</h2>
                </>
              )}
            </div>
          </div>
        )}

        {/* Cancel confirmation modal */}
        {cancelConfirmation && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={cancelCancel}></div>
            <div className="relative z-20 max-w-md w-full bg-white rounded-xl p-6 shadow-2xl text-center">
              <h3 className="text-lg font-semibold">Cancel Scraping?</h3>
              <p className="mt-2 text-sm text-gray-600">Are you sure you want to cancel? Unsaved scraped jobs will be lost.</p>
              <div className="mt-6 flex justify-center space-x-4">
                <button onClick={confirmCancel} className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
                  Yes, Cancel
                </button>
                <button onClick={cancelCancel} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">
                  No, Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete job confirmation modal */}
        {deleteModal.show && jobToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={cancelDelete} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job?</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Remove "<span className="font-medium">{jobToDelete.jobTitle}</span>" from scraped jobs?
                </p>
                <p className="text-xs text-gray-500">This will remove it locally and won't be saved to database.</p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all">
                  Delete Job
                </button>
                <button onClick={cancelDelete} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
