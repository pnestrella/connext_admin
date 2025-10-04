"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <Loader2 className="w-10 h-10 animate-spin text-[#5c4033]" />

        {/* Text */}
        <p className="text-[#5c4033] font-mukta text-lg tracking-wide">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
}
