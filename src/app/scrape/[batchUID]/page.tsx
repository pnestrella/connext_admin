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
    location?: string | null | {
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
    // const [jobs, setJobs] = useState<any[]>([]);
    const [batch, setBatch] = useState<Batch | null>(null);  // Single batch, not array

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

    //jobs

    const [jobs, setJobs] = useState<Job[]>([]);


    useEffect(() => {
        if (!batchUID) return;

        const fetchJobs = async () => {
            try {
                const res = await getScrapeJobs(batchUID);
                console.log(res.data, 'resyy')
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
        <div className="flex">
            <div className="flex-1 p-8 bg-gray-100 min-h-screen">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center space-x-2 bg-indigo-600 px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
                    >
                        <ArrowLeft size={16} color="white" />
                        <span className="text-white">Back to Dashboard</span>
                    </button>
                </div>

                {batch ? (
                    <section className="mb-8 p-8 bg-white rounded-lg shadow-lg text-gray-800">
                        <h1 className="text-3xl font-extrabold mb-6 text-gray-900 border-b pb-3">
                            Batch Details
                        </h1>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <dt className="text-sm font-medium uppercase tracking-wide text-indigo-600 mb-1">
                                    Batch UID
                                </dt>
                                <dd className="break-words text-lg font-semibold">{batch?.batchUID}</dd>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <dt className="text-sm font-medium uppercase tracking-wide text-indigo-600 mb-1">
                                    Scrape Date
                                </dt>
                                <dd className="text-lg font-semibold">
                                    {new Date(batch.scrapeDate).toLocaleString()}
                                </dd>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <dt className="text-sm font-medium uppercase tracking-wide text-indigo-600 mb-1">
                                    Duration
                                </dt>
                                <dd className="text-lg font-semibold">{formatDuration(batch.duration)}</dd>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <dt className="text-sm font-medium uppercase tracking-wide text-indigo-600 mb-1">
                                    Jobs Scraped
                                </dt>
                                <dd className="text-lg font-semibold">{batch.numOfJobScraped.toLocaleString()}</dd>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <dt className="text-sm font-medium uppercase tracking-wide text-indigo-600 mb-1">
                                    Batch Type
                                </dt>
                                <dd className="capitalize text-lg font-semibold">{batch.type}</dd>
                            </div>
                        </dl>
                    </section>
                ) : (
                    <p className="text-gray-600 mb-8 italic">Loading batch details…</p>
                )}



                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Jobs for batch {batchUID}</h2>
                {isLoading ? (
                    <p>Loading jobs…</p>
                ) : jobs.length === 0 ? (
                    <p>No jobs found for this batch.</p>
                ) : (
                    <div className="space-y-6">
                        {jobs.map((job) => (
                            <div key={job?.jobUID} className="p-6 bg-white rounded shadow hover:shadow-lg transition">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-lg text-gray-900">{job.jobTitle}</h3>

                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {job?.jobSkills?.map((skill: string) => (
                                        <span
                                            key={skill}
                                            className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-sm text-gray-700 mb-3 line-clamp-4">{job.jobDescription}</p>

                                <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
                                    {job.jobIndustry && (
                                        <span className="px-2 py-1 bg-gray-200 rounded">{job.jobIndustry}</span>
                                    )}
                                    {job.employment?.length > 0 && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                            {job.employment.join(", ")}
                                        </span>
                                    )}
                                    {job.workTypes?.length > 0 && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                            {job.workTypes.join(", ")}
                                        </span>
                                    )}
                                </div>

                                {(job.salaryRange.min !== null || job.salaryRange.max !== null) && (
                                    <div className="mb-3 text-sm font-semibold text-gray-900">
                                        Salary: {job.salaryRange.min && job.salaryRange.max
                                            ? `${job.salaryRange.currency ?? ""} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} / ${job.salaryRange.frequency ?? ""}`
                                            : "Salary range available"}
                                    </div>
                                )}


                                <a
                                    href={job.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    View full job posting
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
