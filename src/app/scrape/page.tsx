"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import {
  createScrapeBatch,
  deleteScrapeJob,
  getAllScrapedJobs,
  getScrapeBatches,
  postJobsExternal,
  scrapeJobs,
} from "../../../api/scrape";
import { useRouter } from "next/navigation";

interface Batch {
  _id: string;
  batchUID: string;
  duration: number;
  numOfJobScraped: number;
  type: string;
  scrapeDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Job {
  _id: string;
  jobUID: string;
  batchUID: string;
  jobTitle: string;
  jobNormalized: string;
  jobIndustry: string;
  jobDescription: string;
  jobSkills: string[];
  employment: string[];
  workTypes: string[];
  companyName?: string | null;
  salaryRange: {
    min: number | null;
    max: number | null;
    currency: string | null;
    frequency: string | null;
  };
  location?:
  | string
  | null
  | {
    display_name?: string;
    city?: string;
    province?: string;
    country?: string;
  };
  isExternal: boolean;
  status: boolean;
  profilePic: string;
  link: string;
  createdAt: string;
  scrapedDate: string;
  updatedAt: string;
  interactionCount?: number; // <-- Added property
}

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrapedJobs, setScrapedJobs] = useState<Job[]>([]);
  const [scrapeType, setScrapeType] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // ✅ FIXED: Added missing state
  const [externalSearchQuery, setExternalSearchQuery] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    jobUID: string | null;
  }>({ show: false, jobUID: null });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cancelConfirmation, setCancelConfirmation] = useState(false);
  const [scrapeDuration, setScrapeDuration] = useState(0);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [externalJobs, setExternalJobs] = useState<Job[]>([]);
  const [fadeIn, setFadeIn] = useState(false);

  console.log(externalJobs.filter(job => job.batchUID === '78de68b0-e705-40f5-94ed-42f78bc8d7d6').length, 'external')


  const router = useRouter();

  // Table state
  const [selectedBatchUID, setSelectedBatchUID] = useState<string | null>(null);
  const [currentTableView, setCurrentTableView] = useState<"batches" | "external-jobs">("batches");

  // External jobs expanded state and delete state
  const [expandedExternalJob, setExpandedExternalJob] = useState<string | null>(
    null
  );
  const [externalDeleteModal, setExternalDeleteModal] = useState<{
    show: boolean;
    jobUID: string | null;
  }>({ show: false, jobUID: null });

  //get the batches
  const getBatches = async () => {
    try {
      const batches = await getScrapeBatches();
      console.log(batches, " batched");
      setBatches([...batches.data].reverse());
    } catch (err) {
      console.log(err);
      alert("error catching batches");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setFadeIn(true), 300);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  //get externalJobs
const getExternalJobs = async () => {
  const MIN_LOADING_TIME = 1200;

  setIsLoading(true);
  const start = Date.now();
  try {
    const jobs = await getAllScrapedJobs();
    console.log(jobs, " EXTENRAL JOBSSSSSSSSSS");
    setExternalJobs(jobs.data);
  } catch (err) {
    console.log(err);
    alert("error catching External Jobs");
  } finally {
    const elapsed = Date.now() - start;
    const remaining = MIN_LOADING_TIME - elapsed;

    if (remaining > 0) {
      setTimeout(() => setIsLoading(false), remaining);
    } else {
      setIsLoading(false);
    }
  }
};

  useEffect(() => {
    getBatches();
    getExternalJobs();
  }, []);

  const scrapeStartTime = useRef<number | null>(null);
  const scrapeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  // Format location for display and search
  const formatLocation = (
    location:
      | string
      | {
        display_name?: string;
        city?: string;
        province?: string;
        country?: string;
      }
      | null
      | undefined
  ) => {
    if (!location) return null;
    if (typeof location === "string") return location;
    return location.display_name || location.city || "N/A";
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
      regex.test(job.jobIndustry || "") ||
      (job.location && regex.test(formatLocation(job.location) || ""))
    );
  });

  // Enhanced search function for external jobs
  const filterExternalJobs = (jobs: Job[], query: string) => {
    if (!query.trim()) return jobs;
    const regex = new RegExp(query.trim(), "i");

    return jobs.filter((job) => {
      if (regex.test(job.jobTitle)) return true;
      if (regex.test(job.jobDescription)) return true;
      if (regex.test(job.profilePic)) return true;
      if (job.jobSkills?.some((skill) => regex.test(skill))) return true;
      if (regex.test(job.jobIndustry || "")) return true;
      if (regex.test(job.jobNormalized || "")) return true;
      if (regex.test(job.companyName || "")) return true;
      if (job.employment?.some((emp) => regex.test(emp))) return true;
      if (job.workTypes?.some((type) => regex.test(type))) return true;

      const locationStr = formatLocation(job.location);
      if (locationStr && regex.test(locationStr)) return true;

      if (job.location && typeof job.location === "object") {
        if (regex.test(job.location.display_name || "")) return true;
        if (regex.test(job.location.city || "")) return true;
        if (regex.test(job.location.province || "")) return true;
        if (regex.test(job.location.country || "")) return true;
      }

      return false;
    });
  };

  const filteredExternalJobs = filterExternalJobs(
    externalJobs,
    externalSearchQuery
  );

  const startScrapeTimer = () => {
    scrapeStartTime.current = Date.now();
    setScrapeDuration(0);
    scrapeIntervalRef.current = setInterval(() => {
      if (scrapeStartTime.current) {
        setScrapeDuration(
          Math.floor((Date.now() - scrapeStartTime.current) / 1000)
        );
      }
    }, 1000);
  };

  const stopScrapeTimer = () => {
    if (scrapeIntervalRef.current) {
      clearInterval(scrapeIntervalRef.current);
      scrapeIntervalRef.current = null;
    }
    if (scrapeStartTime.current) {
      const finalDuration = Math.floor(
        (Date.now() - scrapeStartTime.current) / 1000
      );
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
      const uniqueJobs = Array.from(
        new Map(
          (res.data.jobs || []).map((job: Job) => [job.jobUID, job])
        ).values()
      );
      setScrapedJobs(uniqueJobs as Job[]);
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
      const uniqueJobs = Array.from(
        new Map(
          (res.data.jobs || []).map((job: Job) => [job.jobUID, job])
        ).values()
      );
      setScrapedJobs(uniqueJobs as Job[]);
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
        type: scrapeType,
      };

      console.log(filteredJobs, "FILTERED JOBS");
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

  const handleDeleteClick = (jobUID: string) => {
    setDeleteModal({ show: true, jobUID });
  };

  const confirmDelete = () => {
    if (deleteModal.jobUID) {
      setScrapedJobs((prev) =>
        prev.filter((job) => job?.jobUID !== deleteModal.jobUID)
      );
    }
    setDeleteModal({ show: false, jobUID: null });
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, jobUID: null });
  };

  const toggleDescription = (jobUID: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [jobUID]: !prev[jobUID],
    }));
  };

  const jobToDelete = scrapedJobs.find(
    (job) => job.jobUID === deleteModal.jobUID
  );

  const formatSalary = (salaryRange: Job["salaryRange"]) => {
    if (!salaryRange?.min && !salaryRange?.max) return null;
    if (salaryRange.min && salaryRange.max) {
      return `${salaryRange.currency || ""}${salaryRange.min.toLocaleString()}-${salaryRange.max.toLocaleString()
        }/${salaryRange.frequency || "yr"}`;
    }
    return `${salaryRange.currency || ""}${salaryRange.min?.toLocaleString() || salaryRange.max?.toLocaleString()
      }/${salaryRange.frequency || "yr"}`;
  };

  // External jobs handlers
  const handleRowClick = (jobUID: string) => {
    setExpandedExternalJob(
      expandedExternalJob === jobUID ? null : jobUID
    );
  };

  const handleExternalDeleteClick = (
    jobUID: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setExternalDeleteModal({ show: true, jobUID });
  };

  const confirmExternalDelete = () => {
    const job = externalJobs.find(
      (j) => j.jobUID === externalDeleteModal.jobUID
    );
    if (job) {
      (async () => {
        const res = await deleteScrapeJob(job.jobUID);
        console.log(res, "DELETED");
        getBatches();
        getExternalJobs();
      })();
    }
    setExternalDeleteModal({ show: false, jobUID: null });
  };

  const cancelExternalDelete = () => {
    setExternalDeleteModal({ show: false, jobUID: null });
  };

  const externalJobToDelete = externalJobs.find(
    (job) => job.jobUID === externalDeleteModal.jobUID
  );


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
                Loading External Jobs
              </h1>
              <p className="text-xl text-slate-500 font-medium">Retrieving external job posts…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <Sidebar />
      <div
  className={`flex-1 p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen transition-all duration-700 ${
    fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  }`}
>
        <div className="max-w-full mx-auto">
          <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 bg-clip-text text-transparent mb-2 tracking-tight">
            External Jobs Control Panel
          </h1>
          <p className="text-lg text-slate-600 font-medium mb-8 max-w-2xl">
            Manage and run external job imports with real-time scraping batches and saved jobs.
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Batches */}
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-slate-50 to-indigo-500/10 rounded-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">
                    Total Batches
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {batches.length.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total External Jobs */}
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-slate-50 to-teal-500/10 rounded-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">
                    External Jobs
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {externalJobs.length.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Scrape Duration */}
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-slate-50 to-purple-500/10 rounded-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">
                    Avg Duration
                  </p>
                  {batches.length > 0 ? (
                    <p className="text-3xl font-black text-slate-900">
                      {formatDuration(
                        Math.round(
                          batches.reduce(
                            (sum, b) => sum + b.duration,
                            0
                          ) / batches.length
                        )
                      )}
                    </p>
                  ) : (
                    <p className="text-3xl font-black text-slate-400">
                      -
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-inner">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Jobs per Batch */}
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-slate-50 to-amber-500/10 rounded-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">
                    Jobs / Batch
                  </p>
                  {batches.length > 0 ? (
                    <p className="text-3xl font-black text-slate-900">
                      {Math.round(
                        batches.reduce(
                          (sum, b) => sum + b.numOfJobScraped,
                          0
                        ) / batches.length
                      ).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-3xl font-black text-slate-400">
                      -
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-inner">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-6"
            disabled={isLoading || showResults || isSaving || saveSuccess}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>{isLoading ? "Scraping..." : "Run Scrape"}</span>
          </button>

          {/* Table Toggle Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                setCurrentTableView("batches");
                setSelectedBatchUID(null);
              }}
              className={`px-6 py-2 rounded-2xl text-sm font-semibold transition-all border ${currentTableView === "batches"
                ? "bg-slate-900 text-white shadow-lg border-slate-900"
                : "bg-white/80 text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm"
                }`}
            >
              Scraping Batches
            </button>
            <button
              onClick={() => {
                setCurrentTableView("external-jobs");
                setSelectedBatchUID(null);
              }}
              className={`px-6 py-2 rounded-2xl text-sm font-semibold transition-all border ${currentTableView === "external-jobs"
                ? "bg-emerald-600 text-white shadow-lg border-emerald-600"
                : "bg-white/80 text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm"
                }`}
            >
              External Jobs
            </button>
          </div>

          {/* DYNAMIC TABLE */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {currentTableView === "batches"
                  ? "Recent Scraping Batches"
                  : "Saved External Jobs"}
              </h2>

              {/* EXTERNAL JOBS SEARCH BAR */}
              {currentTableView === "external-jobs" && (
                <div className="mt-1">
                  <div className="relative max-w-md">
                    <input
                      type="text"
                      placeholder="Search jobs (title, skills, location, company, industry...)"
                      value={externalSearchQuery}
                      onChange={(e) => setExternalSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 bg-white/90 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  {externalSearchQuery && (
                    <p className="text-xs text-slate-500 mt-1">
                      Showing {filteredExternalJobs.length} of{" "}
                      {externalJobs.length} jobs
                    </p>
                  )}
                </div>
              )}
            </div>

            {currentTableView === "batches" ? (
              // BATCHES TABLE
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Scrape Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Jobs Scraped
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 divide-y divide-slate-100">
                    {batches.map((batch, index) => (
                      <tr
                        key={batch.batchUID}
                        className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${selectedBatchUID === batch.batchUID
                          ? "bg-indigo-50"
                          : ""
                          }`}
                        onClick={() =>
                          router.push(`/scrape/${batch.batchUID}`)
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {index + 1}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-700 truncate max-w-xs"
                          title={batch.batchUID}
                        >
                          {batch.batchUID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                          {formatDate(batch.scrapeDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${batch?.type === "full"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                          >
                            {batch?.type === "full"
                              ? "Full scrape"
                              : "Partial scrape"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                            {formatDuration(batch.duration)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {externalJobs.filter(jobs => jobs?.batchUID === batch?.batchUID).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // EXTERNAL JOBS TABLE
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Swipes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 divide-y divide-slate-100">
                    {filteredExternalJobs.map((job) => {
                      const isExpanded = expandedExternalJob === job.jobUID;

                      return (
                        <React.Fragment key={job.jobUID}>
                          <tr
                            className={`hover:bg-indigo-50/40 transition-colors ${isExpanded ? "bg-indigo-50" : ""
                              }`}
                            onClick={() => handleRowClick(job.jobUID)}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                                  <span className="font-semibold text-xs text-indigo-700">
                                    {job.profilePic
                                      ?.charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div
                                    className="text-sm font-semibold text-slate-900 truncate max-w-xs"
                                    title={job.jobTitle}
                                  >
                                    {job.jobTitle}
                                  </div>
                                  {job.jobSkills
                                    ?.slice(0, 2)
                                    .map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full mr-1"
                                      >
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
                            <td
                              className="px-4 py-4 whitespace-nowrap text-sm text-slate-900"
                              title={formatLocation(job.location) ?? undefined}
                            >
                              {formatLocation(job.location) ||
                                job.workTypes?.join(", ") ||
                                "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                              {formatSalary(job.salaryRange) || "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                              <div className="font-bold text-lg text-pink-600">
                                {job.interactionCount || 0}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {formatDate(job.createdAt)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={(e) =>
                                  handleExternalDeleteClick(
                                    job.jobUID,
                                    e
                                  )
                                }
                                className="p-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all shadow-sm"
                                title="Delete job"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>

                          {/* EXPANDED ROW */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td
                                colSpan={7}
                                className="px-6 py-8"
                              >
                                <div className="max-w-4xl mx-auto space-y-6">
                                  <div className="p-6 bg-white/90 rounded-2xl border border-slate-100 shadow-md">
                                    <div className="flex items-start justify-between mb-4">
                                      <h3 className="text-lg font-semibold text-slate-900">
                                        Full Job Description
                                      </h3>
                                      <button
                                        onClick={() =>
                                          handleRowClick(job.jobUID)
                                        }
                                        className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center"
                                      >
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                        Collapse
                                      </button>
                                    </div>
                                    <div className="prose prose-sm max-w-none">
                                      <p className="whitespace-pre-wrap text-slate-900 leading-relaxed">
                                        {job.jobDescription}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="p-6 bg-white/90 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-3">
                                        Skills
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {job.jobSkills?.map(
                                          (skill, idx) => (
                                            <span
                                              key={idx}
                                              className="px-3 py-1.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
                                            >
                                              {skill}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div className="p-6 bg-white/90 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-3">
                                        Details
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="text-slate-500">
                                            Location:
                                          </span>{" "}
                                          <span
                                            title={
                                              formatLocation(
                                                job.location
                                              ) ?? undefined
                                            }
                                          >
                                            {formatLocation(
                                              job.location
                                            ) ||
                                              job.workTypes?.join(
                                                ", "
                                              ) ||
                                              "N/A"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">
                                            Salary:
                                          </span>{" "}
                                          {formatSalary(
                                            job.salaryRange
                                          ) || "N/A"}
                                        </div>
                                        <div>
                                          <span className="text-slate-500">
                                            Swipes:
                                          </span>{" "}
                                          <span className="font-semibold text-pink-600">
                                            {job.interactionCount ||
                                              0}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">
                                            Industry:
                                          </span>{" "}
                                          {job.jobIndustry || "N/A"}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="p-6 bg-white/90 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-3">
                                        Links
                                      </div>
                                      <div className="space-y-3">
                                        <a
                                          href={job.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-all group"
                                        >
                                          <svg
                                            className="w-4 h-4 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                          </svg>
                                          Open Original Posting
                                        </a>
                                        <div className="text-xs text-slate-500">
                                          📱 Source: {job.profilePic}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ✅ FIXED: Added COMPLETE Results Modal */}
          {showResults &&
            !isSaving &&
            !saveSuccess &&
            scrapedJobs.length > 0 &&
            !cancelConfirmation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                  onClick={handleCancelRequest}
                />
                <div className="relative z-10 w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-1">
                        Scraped Jobs
                      </h2>
                      <p className="text-sm text-slate-600 mb-1">
                        Found{" "}
                        <span className="font-semibold text-blue-700">
                          {scrapedJobs.length}
                        </span>{" "}
                        {scrapeType.toLowerCase()} jobs
                        {searchQuery &&
                          ` • Showing ${filteredJobs.length} matching "${searchQuery}"`}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-semibold">
                        ✅ Completed in {scrapeDuration}s
                      </span>
                    </div>
                  </div>

                  <div className="p-6 border-b border-slate-100 bg-slate-50/70">
                    <div className="relative w-full">
                      <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Search jobs by title, description, skills, location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 px-6 pb-6 overflow-y-auto">
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((job) => (
                        <div
                          key={job.jobUID}
                          className="p-4 border border-slate-100 rounded-2xl mb-4 bg-white/90 hover:bg-slate-50/90 transition-all hover:shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-inner">
                                <span className="font-semibold text-sm text-slate-600">
                                  {job.profilePic
                                    ?.charAt(0)
                                    .toUpperCase() || "R"}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-lg text-slate-900 truncate pr-4">
                                    {job.jobTitle}
                                  </h3>
                                  {job.workTypes?.[0] && (
                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                                      {job.workTypes[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                                  <span className="font-medium">
                                    {job.profilePic}
                                  </span>
                                  {job.employment && (
                                    <span>{job.employment}</span>
                                  )}
                                  {job.location && (
                                    <span>
                                      • {formatLocation(job.location)}
                                    </span>
                                  )}
                                </div>
                                {formatSalary(job.salaryRange) && (
                                  <div className="mb-3 p-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                                    <span className="text-sm font-semibold text-emerald-800">
                                      💰 {formatSalary(job.salaryRange)}
                                    </span>
                                  </div>
                                )}
                                <div className="mb-3">
                                  <p
                                    className={`text-sm text-slate-600 leading-relaxed ${expandedDescriptions[job.jobUID]
                                      ? ""
                                      : "line-clamp-2"
                                      }`}
                                  >
                                    {job.jobDescription}
                                  </p>
                                  <button
                                    onClick={() =>
                                      toggleDescription(job.jobUID)
                                    }
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-1 hover:underline"
                                  >
                                    {expandedDescriptions[job.jobUID]
                                      ? "See less"
                                      : "See more"}
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                    {job.jobIndustry}
                                  </span>
                                  {job.jobSkills?.map(
                                    (skill, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}
                                </div>
                                {job.link && (
                                  <a
                                    href={job.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium underline group"
                                  >
                                    🔗 View full job posting
                                    <svg
                                      className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteClick(job.jobUID)
                              }
                              className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex-shrink-0 shadow-sm"
                              title="Remove this job"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <svg
                          className="w-16 h-16 mx-auto mb-4 opacity-60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium mb-1">
                          No jobs match "{searchQuery}"
                        </p>
                        <p className="text-sm">
                          Try adjusting your search terms.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={
                        filteredJobs.length === 0 || isSaving
                      }
                      className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <span>💾 Save</span>
                      <span>{filteredJobs.length} Jobs</span>
                    </button>
                    <button
                      onClick={handleCancelRequest}
                      className="px-6 py-3 rounded-2xl bg-white/90 text-slate-700 hover:bg-slate-100 font-semibold transition-all border border-slate-200 shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* External Delete Confirmation Modal */}
          {externalDeleteModal.show && externalJobToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={cancelExternalDelete}
              />
              <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Delete External Job?
                  </h3>
                  <p className="text-sm text-slate-600 mb-1">
                    Remove{" "}
                    <span className="font-medium">
                      {externalJobToDelete.jobTitle}
                    </span>{" "}
                    permanently?
                  </p>
                  <p className="text-xs text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={confirmExternalDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-2xl hover:bg-red-700 transition-all shadow-sm"
                  >
                    Delete Permanently
                  </button>
                  <button
                    onClick={cancelExternalDelete}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 rounded-2xl hover:bg-slate-100 transition-all"
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
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl p-8 shadow-2xl text-center border border-white/60">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-indigo-600 mb-4" />
                <h2 className="text-lg font-semibold mb-1 text-slate-900 capitalize">
                  {scrapeType || "Job"} scraping... ({scrapeDuration}s)
                </h2>
                <p className="text-sm text-slate-600">
                  Fetching real jobs from sources
                </p>
              </div>
            </div>
          )}

          {/* Choose scrape type modal */}
          {isOpen &&
            !isLoading &&
            !showResults &&
            !isSaving &&
            !saveSuccess && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                  onClick={() => setIsOpen(false)}
                />
                <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl p-6 shadow-2xl border border-white/60">
                  <h2 className="text-xl font-semibold mb-2 text-slate-900">
                    Choose scrape type
                  </h2>
                  <p className="text-sm text-slate-600 mb-6">
                    Select whether to run a full scrape or only new jobs.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleFullScrape}
                      className="w-full px-4 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 font-semibold transition-all shadow-md"
                      disabled={isLoading}
                    >
                      Full Scrape
                    </button>
                    <button
                      onClick={handlePartialScrape}
                      className="w-full px-4 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-all shadow-md"
                      disabled={isLoading}
                    >
                      Partial Scrape (New Only)
                    </button>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 w-full text-sm text-slate-500 hover:text-slate-700 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          {/* Saving modal */}
          {(isSaving || saveSuccess) && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl p-10 shadow-2xl text-center flex flex-col items-center space-y-4 border border-white/60">
                {isSaving && (
                  <>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-3 border-slate-200 border-t-emerald-600 mb-2" />
                    <h2 className="text-xl font-semibold text-slate-900">
                      Saving jobs...
                    </h2>
                    <p className="text-sm text-slate-600">
                      Please wait while the scraped jobs are saved.
                    </p>
                  </>
                )}
                {saveSuccess && (
                  <>
                    <svg
                      className="w-16 h-16 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <h2 className="text-2xl font-semibold text-emerald-600">
                      Jobs saved successfully!
                    </h2>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Cancel confirmation modal */}
          {cancelConfirmation && (
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={cancelCancel}
              />
              <div className="relative z-20 max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl text-center border border-white/60">
                <h3 className="text-lg font-semibold text-slate-900">
                  Cancel Scraping?
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Are you sure you want to cancel? Unsaved scraped
                  jobs will be lost.
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={confirmCancel}
                    className="px-5 py-2 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 transition shadow-sm"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={cancelCancel}
                    className="px-5 py-2 bg-slate-200 text-slate-800 font-semibold rounded-2xl hover:bg-slate-300 transition"
                  >
                    No, Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete job confirmation modal */}
          {deleteModal.show && jobToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={cancelDelete}
              />
              <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Delete Job?
                  </h3>
                  <p className="text-sm text-slate-600 mb-1">
                    Remove{" "}
                    <span className="font-medium">
                      {jobToDelete.jobTitle}
                    </span>{" "}
                    from scraped jobs?
                  </p>
                  <p className="text-xs text-slate-500">
                    This will remove it locally and will not be saved
                    to the database.
                  </p>
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-2xl hover:bg-red-700 transition-all shadow-sm"
                  >
                    Delete Job
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
