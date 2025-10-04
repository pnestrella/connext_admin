"use client";

import React from "react";
import Sidebar from "../../../components/Sidebar";
import Dashboard from "../../../components/Dashboard";

export default function page() {
  return (
    <div className="flex flex-row min-h-screen">
      <Sidebar />
      <Dashboard />
    </div>
  );
}