/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Job, Application, Interview, User } from "../types";
import {
  Sparkles, Briefcase, Users, Cpu, FileText, Send, Calendar, CheckCircle2, AlertCircle,
  TrendingUp, Plus, Trash2, Edit2, ShieldAlert, Award, FileSpreadsheet, RefreshCcw, LogOut, Compass
} from "lucide-react";

export const RecruiterPortal: React.FC = () => {
  const { user, logout, notifications, markNotificationRead } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "applicants" | "assistant">("dashboard");

  // State Management
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Load state
  const [loading, setLoading] = useState(false);

  // Job Creator input forms
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobType, setJobType] = useState<"remote" | "hybrid" | "on-site">("remote");
  const [jobLevel, setJobLevel] = useState<"entry" | "mid" | "senior" | "lead">("senior");
  const [jobSalaryMin, setJobSalaryMin] = useState<number>(120000);
  const [jobSalaryMax, setJobSalaryMax] = useState<number>(170000);
  const [jobCategory, setJobCategory] = useState("Frontend Development");
  const [jobTags, setJobTags] = useState("");
  const [jobDescText, setJobDescText] = useState("");
  const [jobReqs, setJobReqs] = useState("");
  const [jobResps, setJobResps] = useState("");

  // AI draft states
  const [aiJobGenLoader, setAiJobGenLoader] = useState(false);

  // AI assistant tools
  const [assistantRole, setAssistantRole] = useState("Senior AI Integration Engineer");
  const [assistantSkills, setAssistantSkills] = useState("React, Python, LLMs, Docker");
  const [assistantQuestions, setAssistantQuestions] = useState<string[]>([]);
  const [assistantLoader, setAssistantLoader] = useState(false);

  // Interview Scheduler form states
  const [showScheduler, setShowScheduler] = useState(false);
  const [intTitle, setIntTitle] = useState("");
  const [intDesc, setIntDesc] = useState("");
  const [intDate, setIntDate] = useState("");
  const [intDuration, setIntDuration] = useState(45);

  useEffect(() => {
    fetchRecruiterData();
  }, [user?.id]);

  const fetchRecruiterData = async () => {
    try {
      const jobRes = await fetch("/api/jobs?all=true");
      if (jobRes.ok) {
        const data = await jobRes.json();
        setJobs(data);
      }

      const appRes = await fetch("/api/applications");
      if (appRes.ok) {
        const data = await appRes.json();
        setApplications(data);
      }

      const intRes = await fetch("/api/interviews");
      if (intRes.ok) {
        const data = await intRes.json();
        setInterviews(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI job generator
  const triggerAIJobDraft = async () => {
    if (!jobTitle) {
      alert("Please specify a Target Job Title first.");
      return;
    }
    setAiJobGenLoader(true);
    try {
      const response = await fetch("/api/ai/generate-job-desc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          companyName: jobCompany || "Stripe",
          keySkills: jobTags || "React, Tailwind, Express",
          descLevel: jobLevel
        })
      });
      if (response.ok) {
        const result = await response.json();
        setJobDescText(result.description);
        setJobReqs(result.requirements ? result.requirements.join("\n") : "");
        setJobResps(result.responsibilities ? result.responsibilities.join("\n") : "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiJobGenLoader(false);
    }
  };

  // Publish a new Job listing
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDescText) return;
    setLoading(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          companyName: jobCompany || "SmartHire Partner",
          companyLogo: "⚡",
          companyBio: "Transformative digital infrastructure group.",
          description: jobDescText,
          requirements: jobReqs.split("\n").filter(r => r.trim() !== ""),
          responsibilities: jobResps.split("\n").filter(r => r.trim() !== ""),
          location: jobLocation || "San Francisco, CA (Remote)",
          type: jobType,
          salaryMin: Number(jobSalaryMin),
          salaryMax: Number(jobSalaryMax),
          salaryCurrency: "USD",
          experienceLevel: jobLevel,
          category: jobCategory,
          tags: jobTags.split(",").map(t => t.trim()).filter(t => t !== ""),
          status: "published",
          recruiterId: user?.id || "rec_1"
        })
      });
      if (response.ok) {
        await fetchRecruiterData();
        // Reset
        setJobTitle("");
        setJobDescText("");
        setJobReqs("");
        setJobResps("");
        setJobTags("");
        setJobLocation("");
        setShowJobForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Update application status (Kanban movement)
  const setApplicationStatus = async (appId: string, statusText: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusText })
      });
      if (response.ok) {
        const updated = await response.json();
        setApplications(prev => prev.map(a => a.id === appId ? updated : a));
        if (selectedApp?.id === appId) {
          setSelectedApp(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Job position
  const deleteJobListing = async (jobId: string) => {
    if (!confirm("Are you sure you want to archive and remove this job?")) return;
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchRecruiterData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI generator interview questions
  const handleAIQuestionsGenerate = async () => {
    setAssistantLoader(true);
    setAssistantQuestions([]);
    try {
      const response = await fetch("/api/ai/generate-interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: assistantRole,
          candidateSkills: assistantSkills.split(",").map(s => s.trim())
        })
      });
      if (response.ok) {
        const result = await response.json();
        setAssistantQuestions(result.questions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAssistantLoader(false);
    }
  };

  // Create scheduled interview
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !intTitle || !intDate) return;
    setLoading(true);
    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          candidateId: selectedApp.candidateId,
          recruiterId: user?.id || "rec_1",
          jobId: selectedApp.jobId,
          title: intTitle,
          description: intDesc,
          dateTime: intDate,
          type: "virtual",
          duration: Number(intDuration),
          candidateName: selectedApp.candidateName,
          jobTitle: selectedApp.jobTitle
        })
      });
      if (response.ok) {
        // Promote applic status directly to interview
        await setApplicationStatus(selectedApp.id, "interview");
        await fetchRecruiterData();
        setShowScheduler(false);
        setIntTitle("");
        setIntDesc("");
        alert("Virtual interview scheduled successfully and synced to Candidate alarms.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Conversion rates (applied -> shortlisted -> interview)
  const hiredCount = applications.filter(a => a.status === "selected").length;
  const interviewCount = applications.filter(a => a.status === "interview").length;
  const shortlistCount = applications.filter(a => a.status === "shortlisted").length;
  const activeJobsCount = jobs.filter(j => j.status === "published").length;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC]">
      
      {/* Sidebar Recruiter Workspace */}
      <aside className="w-full lg:w-72 bg-indigo-950 text-white flex flex-col justify-between p-6">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-2.5 mb-10">
            <div className="bg-[#F59E0B] p-2 rounded-xl text-indigo-950 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 to-indigo-300 bg-clip-text text-transparent">
                SmartHire AI
              </span>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Recruiter Workspace</p>
            </div>
          </div>

          {/* User badge */}
          <div className="bg-slate-800/40 border border-slate-700/30 p-4 rounded-2xl mb-8 flex items-center space-x-3">
            <img 
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100"} 
              alt="avatar" 
              className="w-10 h-10 rounded-full border border-amber-400"
            />
            <div className="overflow-hidden">
              <h5 className="font-bold text-xs truncate text-slate-100">{user?.name}</h5>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="bg-amber-900 border border-amber-600 text-[9px] text-amber-300 font-bold px-1.5 py-0.5 rounded">
                  Stripe HR Team
                </span>
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" />
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1.5 text-xs font-bold text-slate-400">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center space-x-3 transition ${activeTab === "dashboard" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <Users className="w-4 h-4" />
              <span>Hiring Control Center</span>
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center justify-between transition ${activeTab === "jobs" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <div className="flex items-center space-x-3">
                <Briefcase className="w-4 h-4" />
                <span>Job Management</span>
              </div>
              <span className="bg-amber-500 text-indigo-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {jobs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("applicants")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center justify-between transition ${activeTab === "applicants" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4" />
                <span>Applicant Evaluation</span>
              </div>
              {applications.length > 0 && (
                <span className="bg-cyan-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {applications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center space-x-3 transition ${activeTab === "assistant" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <Cpu className="w-4 h-4" />
              <span>AI Recruiter Assistant</span>
            </button>
          </nav>
        </div>

        {/* Footer controls */}
        <div className="space-y-4 pt-10 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            SmartHire AI v2026.05
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
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === "dashboard" ? "Hiring Analytics Control Center" : 
               activeTab === "jobs" ? "Job Openings Board Manager" :
               activeTab === "applicants" ? "Applications Screen Workbench" : "AI Recruiter Assistant"}
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Active Partner ID: <strong className="text-[#F59E0B]">{user?.email}</strong>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-3 bg-white p-1.5 border border-slate-200 rounded-2xl">
            <div className="px-4 py-2 text-center border-r border-slate-105">
              <p className="text-[9px] font-bold text-slate-400">Open Jobs</p>
              <p className="text-sm font-black text-slate-800">{activeJobsCount}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-slate-105">
              <p className="text-[9px] font-bold text-slate-400">Hired Ratio</p>
              <p className="text-sm font-black text-[#10B981]">{hiredCount} plcmt</p>
            </div>
            <button 
              onClick={fetchRecruiterData}
              className="p-2 border border-slate-100 text-slate-550 rounded-xl hover:bg-slate-50"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ---------------------------------- */}
        {/* TAB 1: RECRUITER DASHBOARD */}
        {/* ---------------------------------- */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* Grid 1: Analytics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition flex items-center space-x-4">
                <div className="bg-indigo-50 p-3.5 rounded-2xl text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Applicants</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{applications.length}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition flex items-center space-x-4">
                <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Shortlisted Pool</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{shortlistCount}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition flex items-center space-x-4">
                <div className="bg-cyan-50 p-3.5 rounded-2xl text-cyan-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Live Interviews</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{interviewCount}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition flex items-center space-x-4">
                <div className="bg-emerald-50 p-3.5 rounded-2xl text-[#10B981]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Secured Hires</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{hiredCount}</p>
                </div>
              </div>

            </div>

            {/* Funnel chart and metrics display */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
              
              {/* Hiring Conversion funnel diagram */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Visual Selection Conversion funnel</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Application logs conversion ratios</p>
                </div>

                <div className="space-y-4">
                  {/* Row 1: Total applicants */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>1. Application submissions</span>
                      <span className="text-slate-900">{applications.length} (100%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden relative">
                      <div className="bg-indigo-600 h-full rounded-lg transition-all" style={{ width: "100%" }} />
                      <span className="absolute inset-0 flex items-center px-3 text-[10px] text-white font-extrabold font-mono">SUBMISSIONS REGISTERED</span>
                    </div>
                  </div>

                  {/* Row 2: Shortlisted */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>2. Key-match shortlists</span>
                      <span className="text-slate-900">
                        {shortlistCount} ({applications.length ? Math.round((shortlistCount / applications.length)*100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden relative">
                      <div 
                        className="bg-cyan-500 h-full rounded-lg transition-all" 
                        style={{ width: applications.length ? `${(shortlistCount / applications.length)*100}%` : "0%" }} 
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-[10px] text-white font-extrabold font-mono">ATS SCIENTIFIC SELECTIONS</span>
                    </div>
                  </div>

                  {/* Row 3: Interview */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>3. Technical interviews</span>
                      <span className="text-slate-900">
                        {interviewCount} ({applications.length ? Math.round((interviewCount / applications.length)*100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden relative">
                      <div 
                        className="bg-amber-500 h-full rounded-lg transition-all" 
                        style={{ width: applications.length ? `${(interviewCount / applications.length)*100}%` : "0%" }} 
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-[10px] text-white font-extrabold font-mono font-sans">LIVE PANELS ACTIVATED</span>
                    </div>
                  </div>

                  {/* Row 4: Offered */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>4. Enterprise placement</span>
                      <span className="text-slate-900">
                        {hiredCount} ({applications.length ? Math.round((hiredCount / applications.length)*100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden relative">
                      <div 
                        className="bg-emerald-500 h-full rounded-lg transition-all" 
                        style={{ width: applications.length ? `${(hiredCount / applications.length)*100}%` : "0%" }} 
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-[10px] text-white font-extrabold font-mono">OFFER GATES COMPLETIONS</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right column: Recent Applicant rows summary */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5">
                <h4 className="font-bold text-slate-900 text-sm">Recent Inbound Submittals</h4>

                {applications.slice(0, 4).map(app => (
                  <div key={app.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                    <div className="space-y-1 overflow-hidden pr-2 text-slate-750 font-semibold">
                      <p className="font-extrabold text-slate-900 truncate">{app.candidateName}</p>
                      <p className="text-[10px] text-slate-400 leading-normal">{app.jobTitle}</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded text-[10px] flex-shrink-0 border border-indigo-100">
                      Score: {app.matchScore || 75}%
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 2: JOB MANAGEMENT */}
        {/* ---------------------------------- */}
        {activeTab === "jobs" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-slate-650 text-xs uppercase tracking-wider">Active Position Listings ({jobs.length})</h4>
              <button
                onClick={() => { setShowJobForm(!showJobForm); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{showJobForm ? "Close Form" : "Create Position Listing"}</span>
              </button>
            </div>

            {/* CREATOR JOB MODAL OR ACCORDION */}
            {showJobForm && (
              <form onSubmit={handleCreateJob} className="bg-white border-2 border-indigo-500 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Create New Open Position</h3>
                    <p className="text-xs text-slate-400 mt-1">Generate complete descriptions dynamically using server-side Gemini prompts</p>
                  </div>
                  <button
                    type="button"
                    onClick={triggerAIJobDraft}
                    disabled={aiJobGenLoader || !jobTitle}
                    className="bg-indigo-50 hover:bg-[#F59E0B]/20 text-[#6366F1] hover:text-[#D97706] border border-indigo-150 px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{aiJobGenLoader ? "AI Drafting..." : "Draft Description with AI"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Role Title</label>
                    <input 
                      type="text" required placeholder="e.g. Senior Backend Architect"
                      value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Brand</label>
                    <input 
                      type="text" required placeholder="e.g. Stripe"
                      value={jobCompany} onChange={(e) => setJobCompany(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                    <input 
                      type="text" required placeholder="e.g. New York, NY (Remote)"
                      value={jobLocation} onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Work Layout</label>
                    <select
                      value={jobType} onChange={(e) => setJobType(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="remote">Remote Work</option>
                      <option value="hybrid">Hybrid Layout</option>
                      <option value="on-site">On-Site</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500">Experience Scale</label>
                    <select
                      value={jobLevel} onChange={(e) => setJobLevel(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Lead</option>
                      <option value="lead">Principal / Architect</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500">Min Salary (USD)</label>
                    <input 
                      type="number" value={jobSalaryMin} onChange={(e) => setJobSalaryMin(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500">Max Salary (USD)</label>
                    <input 
                      type="number" value={jobSalaryMax} onChange={(e) => setJobSalaryMax(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Industry Category</label>
                    <input 
                      type="text" value={jobCategory} onChange={(e) => setJobCategory(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Required Key Stacks (Comma Separated)</label>
                    <input 
                      type="text" placeholder="e.g. React, Typescript, NodeJS"
                      value={jobTags} onChange={(e) => setJobTags(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Job Description</label>
                  <textarea 
                    rows={4} required placeholder="Job description copy..."
                    value={jobDescText} onChange={(e) => setJobDescText(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed font-semibold focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Requirements (one per line)</label>
                    <textarea 
                      rows={4} placeholder="Requirements listing..."
                      value={jobReqs} onChange={(e) => setJobReqs(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Responsibilities (one per line)</label>
                    <textarea 
                      rows={4} placeholder="Responsibilities listing..."
                      value={jobResps} onChange={(e) => setJobResps(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-slate-950 hover:bg-indigo-600 text-white font-extrabold py-3.5 rounded-full transition text-xs shadow-md"
                >
                  {loading ? "Publishing listing details..." : "Publish Position Listing Board"}
                </button>
              </form>
            )}

            {/* Jobs Board lists */}
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-lg transition">
                  <div className="space-y-1">
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      {job.category}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 mt-2">{job.title}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{job.companyName} • {job.location}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {job.tags?.map((t, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right space-y-4 flex-shrink-0 w-full md:w-auto flex md:flex-col justify-between items-center md:items-end">
                    <div className="text-slate-800 text-xs font-mono font-black">
                      ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                    </div>
                    
                    <button
                      onClick={() => deleteJobListing(job.id)}
                      className="text-slate-400 hover:text-rose-500 p-2 border border-slate-100 rounded-xl hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 3: APPLICANT EVALUATION */}
        {/* ---------------------------------- */}
        {activeTab === "applicants" && (
          <div className="space-y-6 animate-fade-in text-left">
            <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Inbound Job applications</h4>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Candidates list columns */}
              <div className="lg:col-span-5 space-y-4">
                {applications.length === 0 ? (
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center text-slate-400 text-xs font-semibold">
                    No evaluations logs.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map(app => (
                      <div 
                        key={app.id}
                        onClick={() => { setSelectedApp(app); }}
                        className={`bg-white border p-5 rounded-3xl cursor-pointer hover:shadow-lg transition flex justify-between items-center ${selectedApp?.id === app.id ? "border-indigo-600 bg-indigo-50/10" : "border-slate-150"}`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-slate-900">{app.candidateName}</h4>
                          <p className="text-xs text-slate-500 font-semibold">{app.jobTitle}</p>
                          <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase mt-2">
                            Stage: {app.status}
                          </span>
                        </div>

                        <div className="text-right space-y-1 flex-shrink-0">
                          <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-2.5 py-1 rounded border border-indigo-150">
                            {app.matchScore}% Score
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expansion Details panel */}
              <div className="lg:col-span-7">
                {!selectedApp ? (
                  <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center text-slate-400 text-xs font-medium space-y-2">
                    <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>Select an inbound candidate application on the left to inspect qualifications, update hiring states, or trigger interview calendars.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-lg">
                    
                    <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                      <div className="space-y-1">
                        <span className="bg-[#10B981]/15 text-[#10B981] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Candidate Assessment dossier
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-2">{selectedApp.candidateName}</h3>
                        <p className="text-xs text-slate-400 font-bold leading-normal">{selectedApp.candidateTitle}</p>
                      </div>
                    </div>

                    {/* AI Scoring insights panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-650">Gemini Match Suitability</span>
                        <span className="bg-indigo-600 text-white font-extrabold px-3 py-1 text-xs rounded-full">{selectedApp.matchScore}%</span>
                      </div>

                      <div className="bg-cyan-50/40 border border-cyan-100 p-4 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-650">Current Pipeline Stage</span>
                        <span className="bg-cyan-500 text-white font-extrabold px-3 py-1 text-xs rounded-full uppercase truncate max-w-[120px]">{selectedApp.status}</span>
                      </div>
                    </div>

                    {/* cover letter text */}
                    {selectedApp.coverLetter && (
                      <div className="space-y-2">
                        <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Inbound Cover Letter</h5>
                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-4 rounded-2xl leading-relaxed whitespace-pre-line">
                          {selectedApp.coverLetter}
                        </p>
                      </div>
                    )}

                    {/* parsed resume intelligence */}
                    {selectedApp.resumeAnalysis && (
                      <div className="bg-slate-900 text-[#F1F5F9] rounded-2xl p-5 space-y-4 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-400 tracking-wider">PARSED RESUME METADATA</span>
                          <span className="bg-indigo-800/80 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">ATS Match: {selectedApp.resumeAnalysis.atsScore}%</span>
                        </div>

                        <div className="text-xs font-normal leading-normal text-slate-350 space-y-2">
                          <p><strong>Educations</strong>: {selectedApp.resumeAnalysis.education ? selectedApp.resumeAnalysis.education.join(", ") : "CS Graduate"}</p>
                          <p><strong>Experience Profiles</strong>: {selectedApp.resumeAnalysis.experience ? selectedApp.resumeAnalysis.experience.join(", ") : "6 years engineering"}</p>
                          <p><strong>Skills checklist</strong>: {selectedApp.resumeAnalysis.skills ? selectedApp.resumeAnalysis.skills.join(", ") : "Node, React, Typescript"}</p>
                        </div>
                      </div>
                    )}

                    {/* Pipeline transition controller (Highly interactive!) */}
                    <div className="border-t border-slate-100 pt-6 space-y-3">
                      <h5 className="font-bold text-slate-900 text-xs">Update Candidate Pipeline Stage</h5>
                      
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button" onClick={() => setApplicationStatus(selectedApp.id, "under-review")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3.5 py-2 rounded-full transition"
                        >
                          Review App
                        </button>
                        <button 
                          type="button" onClick={() => setApplicationStatus(selectedApp.id, "shortlisted")}
                          className="bg-indigo-50 hover:bg-indigo-150 text-[#6366F1] border border-indigo-100 text-[10px] font-bold px-3.5 py-2 rounded-full transition"
                        >
                          Shortlist
                        </button>
                        <button 
                          type="button" onClick={() => { setShowScheduler(true); }}
                          className="bg-cyan-50 hover:bg-cyan-150 text-cyan-700 border border-cyan-150 text-[10px] font-bold px-3.5 py-2 rounded-full transition"
                        >
                          Schedule Video Chat
                        </button>
                        <button 
                          type="button" onClick={() => setApplicationStatus(selectedApp.id, "selected")}
                          className="bg-emerald-50 hover:bg-emerald-150 text-[#10B981] border border-emerald-150 text-[10px] font-bold px-3.5 py-2 rounded-full transition animate-bounce"
                        >
                          Confirm Offer Hire
                        </button>
                        <button 
                          type="button" onClick={() => setApplicationStatus(selectedApp.id, "rejected")}
                          className="bg-rose-50 hover:bg-rose-150 text-[#EF4444] border border-rose-150 text-[10px] font-bold px-3.5 py-2 rounded-full transition"
                        >
                          Archive/Reject
                        </button>
                      </div>
                    </div>

                    {/* INTERVIEW ADVANCED FORM */}
                    {showScheduler && (
                      <form onSubmit={handleScheduleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-scale-up">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-900 uppercase">Interview Slot Scheduler</span>
                          <button type="button" onClick={() => setShowScheduler(false)} className="text-slate-400 font-extrabold hover:text-slate-600 text-xs">×</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                          <div className="space-y-1">
                            <label>Topic / Title</label>
                            <input 
                              type="text" required placeholder="e.g. Stripe Technical Panel"
                              value={intTitle} onChange={(e) => setIntTitle(e.target.value)}
                              className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label>Slot Date/Time</label>
                            <input 
                              type="datetime-local" required
                              value={intDate} onChange={(e) => setIntDate(e.target.value)}
                              className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-755">
                          <div className="space-y-1">
                            <label>Duration Limit (Minutes)</label>
                            <input 
                              type="number" required
                              value={intDuration} onChange={(e) => setIntDuration(Number(e.target.value))}
                              className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label>Additional Notes / Guidelines</label>
                            <input 
                              type="text" placeholder="Check code repositories beforehand"
                              value={intDesc} onChange={(e) => setIntDesc(e.target.value)}
                              className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs"
                            />
                          </div>
                        </div>

                        <button
                          type="submit" disabled={loading}
                          className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-sm"
                        >
                          {loading ? "Registering interview slots..." : "Confirm Schedule & Sync Call Info"}
                        </button>
                      </form>
                    )}

                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 4: RECRUITER AI ASSISTANT */}
        {/* ---------------------------------- */}
        {activeTab === "assistant" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 text-left max-w-3xl mx-auto animte-fade-in">
            <div className="space-y-1 border-b border-slate-100 pb-5">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                HR Cognitive Copilots
              </span>
              <h3 className="text-xl font-bold mt-2">AI Panel Interview Prep Generator</h3>
              <p className="text-xs text-slate-500 leading-normal font-normal">
                Input target job descriptions and key development skills. The generator creates 5 situational, deep questions designed to test competency profiles on modern software hierarchies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-700 font-bold">
              <div className="space-y-1">
                <label>Job Title Profile</label>
                <input 
                  type="text"
                  value={assistantRole}
                  onChange={(e) => setAssistantRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label>Candidate Skills Checklist</label>
                <input 
                  type="text"
                  value={assistantSkills}
                  onChange={(e) => setAssistantSkills(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gemini model prompt integration</span>
              <button
                onClick={handleAIQuestionsGenerate}
                disabled={assistantLoader || !assistantRole}
                className="bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold px-5 py-3 rounded-xl transition flex items-center space-x-1 shadow-sm"
              >
                <Cpu className="w-4 h-4" />
                <span>{assistantLoader ? "Formulating questions..." : "Generate Panel Questions"}</span>
              </button>
            </div>

            {/* Questions lists */}
            {assistantQuestions.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-scale-up">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest flex items-center space-x-1">
                  <Cpu className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span>AI Structured Interview Questions</span>
                </h5>

                <div className="space-y-3">
                  {assistantQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 border border-slate-150 rounded-2xl flex items-start space-x-3 text-xs leading-normal">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="font-semibold text-slate-700">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
};
