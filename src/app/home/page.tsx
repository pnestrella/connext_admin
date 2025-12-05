"use client";

import React from "react";
import Sidebar from "../../../components/Sidebar";
import Dashboard from "../../../components/Dashboard";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />        
      <Dashboard />     
    </div>
  );
}
