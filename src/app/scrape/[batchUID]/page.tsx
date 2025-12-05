"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getScrapeBatch, getScrapeJobs } from "../../../../api/scrape";

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
}

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

export default function BatchPage() {
  const params = useParams();
  const router = useRouter();
  const batchUID = params?.batchUID as string;

  const [isLoading, setIsLoading] = useState(true);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fadeIn, setFadeIn] = useState(false);

  console.log(jobs.length,'batchh')

  useEffect(() => {
    setFadeIn(true);
  }, []);

  useEffect(() => {
    if (!batchUID) return;

    const fetchBatchInfo = async () => {
      try {
        const res = await getScrapeBatch(batchUID);
        setBatch(res.data);
      } catch (err) {
        console.error("Error fetching batch:", err);
      }
    };

    fetchBatchInfo();
  }, [batchUID]);

  useEffect(() => {
    if (!batchUID) return;

    const fetchJobs = async () => {
      try {
        const res = await getScrapeJobs(batchUID);
        console.log(res.data, "resyy");
        setJobs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [batchUID]);

  if (!batchUID) return <div>Missing batch id.</div>;

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`;
  }

  return (
    <div
      className={`flex-1 min-h-screen p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 transition-all duration-700 ${
        fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Batch details */}
        {batch ? (
          <section className="mb-10 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-2xl">
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6 tracking-tight">
              Batch Details
            </h1>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
              <div className="border-l-4 border-indigo-500/70 pl-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500 mb-1">
                  Batch UID
                </dt>
                <dd className="break-words text-base font-semibold text-slate-900">
                  {batch.batchUID}
                </dd>
              </div>
              <div className="border-l-4 border-indigo-500/70 pl-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500 mb-1">
                  Scrape Date
                </dt>
                <dd className="text-base font-semibold text-slate-900">
                  {new Date(batch.scrapeDate).toLocaleString()}
                </dd>
              </div>
              <div className="border-l-4 border-indigo-500/70 pl-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500 mb-1">
                  Duration
                </dt>
                <dd className="text-base font-semibold text-slate-900">
                  {formatDuration(batch.duration)}
                </dd>
              </div>
              <div className="border-l-4 border-indigo-500/70 pl-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500 mb-1">
                  Jobs Scraped
                </dt>
                <dd className="text-base font-semibold text-slate-900">
                  {jobs.length}
                </dd>
              </div>
              <div className="border-l-4 border-indigo-500/70 pl-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500 mb-1">
                  Batch Type
                </dt>
                <dd className="text-base font-semibold text-slate-900 capitalize">
                  {batch.type}
                </dd>
              </div>
            </dl>
          </section>
        ) : (
          <p className="text-slate-500 mb-8 italic">Loading batch details…</p>
        )}

        {/* Jobs section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Jobs for batch {batchUID}
          </h2>
          {jobs.length > 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
              {jobs.length.toLocaleString()} jobs
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="relative mx-auto">
                <div className="w-16 h-16 border-4 border-blue-200/50 border-t-violet-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 rounded-full animate-ping opacity-75" />
              </div>
              <p className="text-slate-500 text-sm font-medium">
                Loading jobs for this batch…
              </p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/60 backdrop-blur-sm p-10 text-center text-slate-500">
            No jobs found for this batch.
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job.jobUID}
                className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur-xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">
                      {job.jobTitle}
                    </h3>
                    {job.companyName && (
                      <p className="text-sm text-slate-500 mt-1">
                        {job.companyName}
                      </p>
                    )}
                  </div>
                  {job.jobIndustry && (
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {job.jobIndustry}
                    </span>
                  )}
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.jobSkills?.map((skill) => (
                    <span
                      key={skill}
                      className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-700 mb-4 line-clamp-4">
                  {job.jobDescription}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-600">
                  {job.employment?.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      {job.employment.join(", ")}
                    </span>
                  )}
                  {job.workTypes?.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 font-medium">
                      {job.workTypes.join(", ")}
                    </span>
                  )}
                </div>

                {/* Salary */}
                {(job.salaryRange.min !== null || job.salaryRange.max !== null) && (
                  <div className="mb-4 text-sm font-semibold text-slate-900">
                    Salary:{" "}
                    {job.salaryRange.min && job.salaryRange.max
                      ? `${job.salaryRange.currency ?? ""} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} / ${job.salaryRange.frequency ?? ""}`
                      : "Salary range available"}
                  </div>
                )}

                {/* Link */}
                <a
                  href={job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View full job posting
                  <span className="ml-1 text-xs">↗</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
