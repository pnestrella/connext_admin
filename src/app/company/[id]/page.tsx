"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  MapPin,
  File,
  Clock,
  Calendar,
  MailIcon,
  Download,
  X,
} from "lucide-react";
import { getVerification, reviewVerification, getAllVerifications } from "../../../../api/verification";
import { getFileUrl } from "../../../../api/imagekit";
import Loading from "../../../../components/Loading";
import { useAuth } from "../../../../context/AuthHook";
import { Document, Page, pdfjs } from "react-pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface VerificationResponse {
  _id: string;
  verificationStatus?: string;
  verificationDocs?: string[];
  submittedAt?: string;
  employerInfo?: {
    email?: string;
    companyName?: string;
    industries?: string[];
    location?: {
      country?: string;
      province?: string;
      city?: string;
      postalCode?: string;
      _id?: string;
    };
  };
}

export default function CompanyDetail() {
  const { loading, setLoading, userMDB } = useAuth();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  console.log(id)

  const [company, setCompany] = useState<VerificationResponse | null>(null);
  const [status, setStatus] = useState("pending");
  const [originalStatus, setOriginalStatus] = useState("pending");
  const [files, setFiles] = useState<string[]>([]);
  const [modal, setModal] = useState<null | { type: "save" | "back" | "success"; title: string; description: string }>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationResponse[]>([]);

  const [verificationUID, setVerificationUID] = useState("")

  const hasChanges = status !== originalStatus;

  // Fetch single company detail
  useEffect(() => {
    console.log(params,'wamwamwam')
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getVerification(id);

        console.log(res.data.verificationUID,'ressy')
        if (res.success && res.data) {
          setCompany(res.data);
          setStatus(res.data.verificationStatus || "pending");
          setOriginalStatus(res.data.verificationStatus || "pending");
          setVerificationUID(res.data.verificationUID)
        }

        if (res.data?.verificationDocs?.length) {
          const imagekit = await getFileUrl(res.data.verificationDocs);
          if (imagekit?.files) {
            const urls = imagekit.files.map((file: any) => file.signedUrl);
            setFiles(urls);
          }
        }
      } catch (err) {
        console.error("Error fetching verification:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, setLoading]);

  // Fetch filtered verifications list
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getAllVerifications(statusFilter, 1, 10);
        if (res.success && res.data) {
          setFilteredVerifications(res.data);
        }
      } catch (err) {
        console.error("Error fetching filtered verifications:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter, setLoading]);

  if (!company) {
    return (
      <div className="p-8">
        <p>Company not found.</p>
        <button
          onClick={() => router.push("/home")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const employerInfo = company.employerInfo || {};
  const submittedAt = company.submittedAt || "";

  const handleConfirm = () => {
    if (modal?.type === "save") {
      setOriginalStatus(status);
      (async () => {
        const res = await reviewVerification(status, userMDB.adminUID, "", verificationUID);
        console.log(res, "Successfully updated");
      })();

      setModal({
        type: "success",
        title: "Changes Saved",
        description: "Your verification status has been successfully updated.",
      });

      router.push('/home')
    } else if (modal?.type === "back") {
      router.back();
    } else {
      setModal(null);
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case "approved":
        return { bg: "bg-green-100", text: "text-green-800", icon: "text-green-600" };
      case "rejected":
        return { bg: "bg-red-100", text: "text-red-800", icon: "text-red-600" };
      default:
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: "text-yellow-600" };
    }
  };

  const colors = getStatusColors(status);

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      {loading && (
        <div className="absolute top-0 bottom-0 left-0 right-0 w-full h-full bg-white/80">
          <Loading />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (hasChanges) {
                setModal({
                  type: "back",
                  title: "Unsaved Changes",
                  description:
                    "You have unsaved changes. Do you really want to go back and discard them?",
                });
              } else {
                router.back();
              }
            }}
            className="flex items-center space-x-2 bg-indigo-600 px-4 py-2 rounded shadow"
          >
            <ArrowLeft size={16} color="white" />
            <span className="text-white cursor-pointer">Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded">
            <Building size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{employerInfo.companyName || "N/A"}</h1>
            <p className="text-gray-500 text-sm">Company Details and Information</p>
          </div>
        </div>

        <button
          onClick={() =>
            setModal({
              type: "save",
              title: "Confirm Save",
              description: "Are you sure you want to save changes to this verification status?",
            })
          }
          disabled={!hasChanges}
          className={`px-6 py-2 rounded shadow ${hasChanges
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
        >
          Save Changes
        </button>
      </div>

      {/* Main Content */}
      <div className="flex space-x-6">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Building size={20} className="text-blue-600" />
              <span>Company Information</span>
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <Building size={16} className="text-gray-600" />
                <span className="font-semibold">Company Name</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Email Address</span>
              </div>
              <div>{employerInfo.companyName || "N/A"}</div>
              <div>{employerInfo.email || "N/A"}</div>
              <div className="flex items-center space-x-2">
                <File size={16} className="text-gray-600" />
                <span className="font-semibold">Industries</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-gray-600" />
                <span className="font-semibold">Location</span>
              </div>
              <div>
                {employerInfo.industries?.length
                  ? employerInfo.industries.join(", ")
                  : "N/A"}
              </div>
              <div>
                {employerInfo.location?.city || "N/A"},{" "}
                {employerInfo.location?.province || "N/A"},{" "}
                {employerInfo.location?.country || "N/A"} (
                {employerInfo.location?.postalCode || "N/A"})
              </div>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <File size={20} className="text-blue-600" />
              <span>Uploaded Documents</span>
            </h2>
            {files.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents uploaded.</p>
            ) : (
              <UploadedDocuments files={files} onPreview={setPreviewUrl} />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="w-80 space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Clock size={20} className={colors.icon} />
              <span>Verification Status</span>
            </h2>
            <div className="flex flex-col items-center space-y-4">
              <div className={`${colors.bg} rounded-full p-4`}>
                <Clock size={32} className={colors.icon} />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${colors.bg} ${colors.text} px-4 py-1 rounded text-sm font-semibold cursor-pointer`}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div className="mt-6 border-t border-gray-200 pt-4 text-xs text-gray-600 space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>Application Date</span>
              </div>
              <p className="ml-6">
                {submittedAt ? new Date(submittedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <button className="w-full flex items-center space-x-2 border border-gray-300 rounded px-4 py-2 mb-3 hover:bg-gray-100">
              <MailIcon size={16} />
              <span className="text-sm">Send an email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {modal && (
        <ConfirmModal
          title={modal.title}
          description={modal.description}
          type={modal.type}
          onCancel={() => setModal(null)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  );
}

// Confirm Modal Component
function ConfirmModal({
  title,
  description,
  type,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  type: "save" | "back" | "success";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end space-x-3">
          {type !== "success" && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700"
          >
            {type === "success" ? "Done" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Uploaded Documents Component
function UploadedDocuments({
  files,
  onPreview,
}: {
  files: string[];
  onPreview: (url: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((url, idx) => {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        const isPDF = /\.pdf$/i.test(url);
        const fileName = url.split("/").pop();

        return (
          <div
            key={idx}
            onClick={() => onPreview(url)}
            className="cursor-pointer border rounded-lg overflow-hidden shadow hover:shadow-md transition"
          >
            {isImage && (
              <img
                src={url}
                alt={fileName || `Document ${idx + 1}`}
                className="w-full h-32 object-cover"
              />
            )}
            {isPDF && (
              <div className="flex flex-col items-center justify-center h-32 bg-red-50 text-red-600">
                <File size={32} />
                <span className="text-xs mt-2">PDF</span>
              </div>
            )}
            {!isImage && !isPDF && (
              <div className="flex flex-col items-center justify-center h-32 bg-gray-100 text-gray-600">
                <File size={32} />
                <span className="text-xs mt-2">File</span>
              </div>
            )}
            <div className="px-2 py-1 text-sm text-center truncate bg-gray-50">
              {fileName || `Document ${idx + 1}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Preview Modal Component
function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = /\.pdf$/i.test(url);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 h-5/6 relative p-4 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200"
        >
          <X size={20} />
        </button>

        <div className="flex-1 flex items-center justify-center overflow-auto">
          {isImage ? (
            <img src={url} alt="Preview" className="max-h-full max-w-full" />
          ) : isPDF ? (
            <Document file={url}>
              <Page pageNumber={1} width={800} />
            </Document>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <p className="text-gray-700 mb-4">Preview not supported</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download size={16} />
                <span>Download File</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
