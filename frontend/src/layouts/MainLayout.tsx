import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { ToastContainer } from "../components/Toast";

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden text-[#0F172A]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto ambient-glow p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};
