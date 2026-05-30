/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LandingPage } from "./components/LandingPage";
import { CandidatePortal } from "./components/CandidatePortal";
import { RecruiterPortal } from "./components/RecruiterPortal";
import { AdminPortal } from "./components/AdminPortal";
import { ShieldAlert, RefreshCcw } from "lucide-react";

const PortalSwitcher: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest animate-pulse">Launching SmartHire.AI Engines...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Handle suspended accounts
  if (user.status === "suspended") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-left font-sans">
        <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight uppercase">Account Suspended</h3>
            <p className="text-xs text-slate-400">
              Access to this SmartHire profile has been locked by a superuser due to system compliance reviews.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                localStorage.removeItem("smarthire_user");
                window.location.reload();
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-full text-xs transition"
            >
              Exit Closed Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic portal rendering
  switch (user.role) {
    case "candidate":
      return <CandidatePortal />;
    case "recruiter":
      return <RecruiterPortal />;
    case "admin":
      return <AdminPortal />;
    default:
      return <LandingPage />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <PortalSwitcher />
    </AuthProvider>
  );
}
