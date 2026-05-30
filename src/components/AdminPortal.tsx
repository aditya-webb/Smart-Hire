/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User } from "../types";
import {
  Sparkles, Users, Cpu, FileText, CheckCircle2, ShieldAlert, ShieldCheck, 
  RefreshCcw, LogOut, Trash2, Ban, ShieldAlert as AlertIcon
} from "lucide-react";

export const AdminPortal: React.FC = () => {
  const { logout, allUsers, fetchAllUsers, updateUserStatus } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAllUsers().finally(() => setLoading(false));
  }, []);

  const handleToggleStatusObj = async (targetUser: User) => {
    const nextStatusObj = targetUser.status === "active" ? "suspended" : "active";
    if (!confirm(`Are you sure you want to transition ${targetUser.name} to '${nextStatusObj}' status?`)) return;
    setLoading(true);
    await updateUserStatus(targetUser.id, nextStatusObj);
    setLoading(false);
  };

  // System statistics
  const totalUserCount = allUsers.length;
  const recruiterCount = allUsers.filter(u => u.role === "recruiter").length;
  const candidateCount = allUsers.filter(u => u.role === "candidate").length;
  const adminCount = allUsers.filter(u => u.role === "admin").length;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC]">
      
      {/* Sidebar Admin Workspace */}
      <aside className="w-full lg:w-72 bg-slate-950 text-white flex flex-col justify-between p-6">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-2.5 mb-10">
            <div className="bg-amber-500 p-2 rounded-xl text-slate-950 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 to-indigo-350 bg-clip-text text-transparent">
                SmartHire.AI
              </span>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Platform Administration</p>
            </div>
          </div>

          {/* User badge */}
          <div className="bg-slate-800/40 border border-slate-700/30 p-4 rounded-2xl mb-8 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-amber-400 bg-amber-500 flex items-center justify-center text-slate-950 text-sm font-black">
              AD
            </div>
            <div className="overflow-hidden text-left">
              <h5 className="font-bold text-xs truncate text-slate-100">Elena Rostova</h5>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="bg-amber-900 border border-amber-700 text-[9px] text-amber-300 font-bold px-1.5 py-0.5 rounded">
                  Superuser Console
                </span>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1.5 text-xs font-bold text-slate-400">
            <button
              className="w-full text-left py-3.5 px-4 rounded-2xl bg-indigo-600 text-white flex items-center space-x-3 transition"
            >
              <Users className="w-4 h-4" />
              <span>User Control Registry</span>
            </button>
          </nav>
        </div>

        {/* Footer controls */}
        <div className="space-y-4 pt-10 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-left">
            SmartHire AI Admin v2
          </div>
          <button
            onClick={logout}
            className="w-full bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-350 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Accounts</span>
          </button>
        </div>
      </aside>

      {/* Main Core Screen Workspace */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full text-left">
        
        {/* Header alert notification feed */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              SaaS Operational Registry Dashboard
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Active Privilege Index: <strong className="text-amber-600">Enterprise root master</strong>
            </p>
          </div>

          {/* Quick Refresh */}
          <button 
            onClick={fetchAllUsers}
            disabled={loading}
            className="p-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition flex items-center space-x-1.5 text-xs font-bold"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Sync System State</span>
          </button>
        </div>

        {/* Metadata System Hardware logs (No Tech-Larping, simple literal facts) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4">
          <h4 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider">System Node Metadata</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-700 font-semibold text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase">User Accounts</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalUserCount}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase">Candidates Pool</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{candidateCount}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase">Recruiter Partners</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{recruiterCount}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase">Admins</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{adminCount}</p>
            </div>
          </div>
        </div>

        {/* Users administration registry */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="font-bold text-slate-900 text-sm">System Users Account Control Ledger</h4>
            <p className="text-slate-400 text-xs mt-0.5">Toggle status variables to suspend rogue users or verify accounts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-600 min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-4">Name & Bio</th>
                  <th className="pb-4">Email Address</th>
                  <th className="pb-4">Portal Role</th>
                  <th className="pb-4">Registration Date</th>
                  <th className="pb-4">Account Status</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map(target => (
                  <tr key={target.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 font-bold text-slate-900">{target.name}</td>
                    <td className="py-4 font-mono text-slate-500 font-semibold">{target.email}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        target.role === "admin" ? "bg-amber-100 text-amber-700" :
                        target.role === "recruiter" ? "bg-cyan-100 text-cyan-700" : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {target.role}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400">{new Date(target.createdAt).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center space-x-1 w-fit ${
                        target.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${target.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{target.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {target.role !== "admin" ? (
                        <button
                          onClick={() => handleToggleStatusObj(target)}
                          className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border transition ${
                            target.status === "active" 
                              ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" 
                              : "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {target.status === "active" ? "Suspend Account" : "Activate Account"}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Lock System Owner</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
