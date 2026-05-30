/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Job, Application, Interview, CandidateProfile, ResumeAnalysis } from "../types";
import {
  Sparkles, FileText, Briefcase, Play, Calendar, User, CheckCircle2, AlertCircle,
  TrendingUp, MapPin, Search, Compass, ShieldAlert, Award, FileSpreadsheet, Send,
  Cpu, ExternalLink, HelpCircle, RefreshCcw, LogOut
} from "lucide-react";

export const CandidatePortal: React.FC = () => {
  const { user, logout, notifications, markNotificationRead } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "resume" | "kanban" | "profile">("dashboard");

  // State Management
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  // App loader
  const [loading, setLoading] = useState(false);

  // Job Search/Filter Options
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // AI Matching Suite state
  const [matchingLoader, setMatchingLoader] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Apply inputs
  const [applicationCoverLetter, setApplicationCoverLetter] = useState("");
  const [coverLetterLoader, setCoverLetterLoader] = useState(false);
  const [coverTone, setCoverTone] = useState("enthusiastic");

  // Resume analysis state
  const [resumeText, setResumeText] = useState("");
  const [analysisLoader, setAnalysisLoader] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);

  // Profile Editor state
  const [profName, setProfName] = useState("");
  const [profTitle, setProfTitle] = useState("");
  const [profSummary, setProfSummary] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profLocation, setProfLocation] = useState("");
  const [profSkills, setProfSkills] = useState("");
  const [profLinkedin, setProfLinkedin] = useState("");
  const [profGithub, setProfGithub] = useState("");
  const [profPortfolio, setProfPortfolio] = useState("");

  useEffect(() => {
    fetchJobs();
    fetchAppData();
  }, [user?.id]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppData = async () => {
    if (!user?.id) return;
    try {
      // Applications list
      const appRes = await fetch(`/api/applications?candidateId=${user.id}`);
      if (appRes.ok) {
        const data = await appRes.json();
        setApplications(data);
      }

      // Interviews lists
      const intRes = await fetch(`/api/interviews?candidateId=${user.id}`);
      if (intRes.ok) {
        const data = await intRes.json();
        setInterviews(data);
      }

      // User Profiles
      const profRes = await fetch(`/api/profiles/${user.id}`);
      if (profRes.ok) {
        const data = await profRes.json();
        setProfile(data);
        // Pre-populate forms
        setProfName(data.fullName || "");
        setProfTitle(data.title || "");
        setProfSummary(data.summary || "");
        setProfEmail(data.email || "");
        setProfPhone(data.phoneNumber || "");
        setProfLocation(data.location || "");
        setProfSkills(data.skills ? data.skills.join(", ") : "");
        setProfLinkedin(data.linkedinUrl || "");
        setProfGithub(data.githubUrl || "");
        setProfPortfolio(data.portfolioUrl || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Matching Algorithm trigger
  const runCognitiveMatch = async (job: Job) => {
    if (!profile) return;
    setMatchingLoader(true);
    setMatchResult(null);
    try {
      const response = await fetch("/api/ai/match-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobDescription: job.description,
          candidateSkills: profile.skills,
          candidateSummary: profile.summary || "Full stack technology enthusiast."
        })
      });
      if (response.ok) {
        const result = await response.json();
        setMatchResult(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatchingLoader(false);
    }
  };

  // Auto cover letter writer
  const generateAICoverLetter = async (job: Job) => {
    setCoverLetterLoader(true);
    try {
      const response = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          companyName: job.companyName,
          skills: profile ? profile.skills.join(", ") : "React, Typescript, Express",
          tone: coverTone
        })
      });
      if (response.ok) {
        const result = await response.json();
        setApplicationCoverLetter(result.letter);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCoverLetterLoader(false);
    }
  };

  // Submit Job Application
  const submitApplicationObj = async (job: Job) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          candidateId: user.id,
          coverLetter: applicationCoverLetter,
          matchScore: matchResult?.matchScore || 75,
          compatibilityScore: matchResult?.compatibilityScore || 78,
          skillGapAnalysis: matchResult?.skillGapAnalysis || ["Slight platform stack variances"],
          resumeAnalysis: analysisResult || null
        })
      });
      if (response.ok) {
        await fetchAppData();
        setSelectedJob(null);
        setApplicationCoverLetter("");
        setMatchResult(null);
        setActiveTab("kanban");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Resume parsing module
  const analyzeResumeInput = async () => {
    if (!resumeText) return;
    setAnalysisLoader(true);
    setAnalysisResult(null);
    try {
      const response = await fetch("/api/ai/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText })
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalysisLoader(false);
    }
  };

  // Edit fields profile
  const saveCandidateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/profiles/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profName,
          title: profTitle,
          summary: profSummary,
          email: profEmail,
          phoneNumber: profPhone,
          location: profLocation,
          skills: profSkills.split(",").map(s => s.trim()).filter(s => s !== ""),
          education: profile?.education || [],
          experience: profile?.experience || [],
          projects: profile?.projects || [],
          certifications: profile?.certifications || [],
          linkedinUrl: profLinkedin,
          githubUrl: profGithub,
          portfolioUrl: profPortfolio
        })
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        fetchAppData();
        alert("SaaS Profile database synchronized.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter Jobs list
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || j.type === selectedType;
    const matchesLevel = selectedLevel === "all" || j.experienceLevel === selectedLevel;
    
    // exclude already applied
    const hasAppliedObj = applications.some(a => a.jobId === j.id);
    return matchesSearch && matchesType && matchesLevel && !hasAppliedObj;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC]">
      
      {/* Sidebar Workspace */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col justify-between p-6">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-2.5 mb-10">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                SmartHire AI
              </span>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Candidate Workspace</p>
            </div>
          </div>

          {/* User badge */}
          <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl mb-8 flex items-center space-x-3">
            <img 
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} 
              alt="avatar" 
              className="w-10 h-10 rounded-full border border-indigo-400"
            />
            <div className="overflow-hidden">
              <h5 className="font-bold text-xs truncate text-slate-100">{user?.name}</h5>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="bg-indigo-900 border border-indigo-600 text-[9px] text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                  Score: {profile?.profileCompleteMeter || 15}%
                </span>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1.5 text-xs font-bold text-slate-400">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center space-x-3 transition ${activeTab === "dashboard" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Job Discovery Hub</span>
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center justify-between transition ${activeTab === "jobs" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <div className="flex items-center space-x-3">
                <Compass className="w-4 h-4" />
                <span>Search New Jobs</span>
              </div>
              {filteredJobs.length > 0 && (
                <span className="bg-cyan-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {filteredJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("resume")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center space-x-3 transition ${activeTab === "resume" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>AI Resume Scanner</span>
            </button>
            <button
              onClick={() => setActiveTab("kanban")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center space-x-3 transition ${activeTab === "kanban" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <Cpu className="w-4 h-4" />
              <span>Kanban Tracker</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center space-x-3 transition ${activeTab === "profile" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <User className="w-4 h-4" />
              <span>Modular Profile Builder</span>
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
        
        {/* Header alert notification feed */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === "dashboard" ? "My Application Hub" : 
               activeTab === "jobs" ? "AI Smart Recruiting Listings" :
               activeTab === "resume" ? "Gemini-3.5 Cognitive Analyzer" :
               activeTab === "kanban" ? "Hiring Pipeline Boards" : "Edit Profile Metadata"}
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Active Session Token: <strong className="text-indigo-600">{user?.email}</strong>
            </p>
          </div>

          {/* Quick Stats overview panel */}
          <div className="flex items-center space-x-3 bg-white p-1.5 border border-slate-200 rounded-2xl">
            <div className="px-4 py-2 text-center border-r border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Applied</p>
              <p className="text-sm font-black text-slate-800">{applications.length}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Interviews</p>
              <p className="text-sm font-black text-emerald-600">{interviews.length}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ATS Match</p>
              <p className="text-sm font-black text-slate-800">82%</p>
            </div>
          </div>
        </div>

        {/* Real-time Push alert notifications wrapper */}
        {notifications.some(n => !n.isRead) && (
          <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-3xl space-y-3">
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Platform Activity Notifications Feed</span>
            </p>
            <div className="space-y-2">
              {notifications.filter(n => !n.isRead).map(n => (
                <div key={n.id} className="flex justify-between items-center text-xs text-indigo-950 font-semibold bg-white p-3 rounded-2xl border border-indigo-100/50 shadow-sm animate-fade-in">
                  <div>
                    <strong>{n.title}</strong>: {n.message}
                  </div>
                  <button 
                    onClick={() => markNotificationRead(n.id)}
                    className="text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-full font-bold transition"
                  >
                    Mute
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ---------------------------------- */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* Grid 1: Welcome overview & interviews */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
                <div className="relative z-10 space-y-4 max-w-md">
                  <h3 className="text-xl font-bold">Discover how closely you match open positions.</h3>
                  <p className="text-xs text-slate-350 leading-relaxed font-normal">
                    Our AI recommendation engine uses modern Large Language parsing algorithms to analyze compatibility, locate missing skills keywords, and plot custom roadmaps.
                  </p>
                  <button 
                    onClick={() => setActiveTab("jobs")}
                    className="bg-white hover:bg-indigo-50 text-slate-950 text-xs font-bold px-5 py-3 rounded-xl transition inline-flex items-center space-x-2"
                  >
                    <span>Scan Open Positions</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  </button>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 text-[150px] font-black tracking-tighter select-none">
                  AI
                </div>
              </div>

              {/* Profile complete gauge */}
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">SaaS Profile Quality</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Auto-calculated complete metrics index</p>
                </div>
                
                <div className="my-6">
                  <div className="flex justify-between items-end mb-2.5">
                    <span className="text-3xl font-black text-slate-900">{profile?.profileCompleteMeter || 15}%</span>
                    <span className="text-xs font-bold text-indigo-600">Completeness Ratio</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${profile?.profileCompleteMeter || 15}%` }}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab("profile")}
                  className="text-center w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Adjust My Portals Information
                </button>
              </div>
            </div>

            {/* Grid 2: Active Applications list & Interview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left applied applications column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-base">Active Logged Applications</h4>
                  <button 
                    onClick={() => setActiveTab("kanban")}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View Status Tracking Board
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 p-8 rounded-3xl text-center text-slate-450 text-xs font-semibold">
                    No active applications found. Click "Search New Jobs" above to apply.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map(app => (
                      <div key={app.id} className="bg-white border border-slate-150 p-5 rounded-3xl flex justify-between items-center hover:shadow-md transition">
                        <div className="space-y-1 overflow-hidden pr-2">
                          <h5 className="font-bold text-sm text-slate-800 truncate">{app.jobTitle}</h5>
                          <p className="text-xs text-slate-500 font-medium">{app.companyName}</p>
                          <div className="flex items-center space-x-2 pt-2">
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Applied: {new Date(app.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-right space-y-2 flex-shrink-0">
                          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                            app.status === "shortlisted" ? "bg-cyan-50 text-cyan-600 border border-cyan-150" :
                            app.status === "interview" ? "bg-indigo-50 text-indigo-600 border border-indigo-150" :
                            app.status === "selected" ? "bg-emerald-50 text-emerald-600 border border-emerald-150" :
                            app.status === "rejected" ? "bg-rose-50 text-rose-600 border border-rose-150" :
                            "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {app.status.replace("-", " ")}
                          </span>
                          
                          {app.matchScore && (
                            <div className="text-[10px] font-bold text-indigo-600">
                              AI Precision Concord: {app.matchScore}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right scheduled interviews list column */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-base">Upcoming Interview Schedules</h4>
                
                {interviews.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 p-8 rounded-3xl text-center text-slate-450 text-xs font-semibold">
                    No scheduled calendars registered.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map(inv => (
                      <div key={inv.id} className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm relative">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h5 className="font-bold text-xs text-indigo-600 uppercase tracking-widest flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Virtual Discussion Interview</span>
                            </h5>
                            <h4 className="font-black text-sm text-slate-900">{inv.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{inv.jobTitle}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl text-[11px] space-y-2 border border-slate-100">
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>Schedules Time</span>
                            <span className="text-slate-800 font-extrabold">{new Date(inv.dateTime).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>Duration Limit</span>
                            <span className="text-slate-800 font-extrabold">{inv.duration} Minutes</span>
                          </div>
                        </div>

                        {inv.meetingLink && (
                          <a 
                            href={inv.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                          >
                            <span>Launch Video Conference URL</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 2: JOB DISCOVERY */}
        {/* ---------------------------------- */}
        {activeTab === "jobs" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter tags header block */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search label */}
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  placeholder="Query roles, stacks or industries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* Type dropdown */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="all">Any Work Arrangement (All)</option>
                  <option value="remote">Remote Roles Only</option>
                  <option value="hybrid">Hybrid Positions</option>
                  <option value="on-site">On-Site Positions</option>
                </select>
              </div>

              {/* Level dropdown */}
              <div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="all">Any Experience Scale (All)</option>
                  <option value="entry">Entry Scale Roles</option>
                  <option value="mid">Mid Scale Roles</option>
                  <option value="senior">Senior Positions</option>
                  <option value="lead">Lead Architect Positions</option>
                </select>
              </div>

            </div>

            {/* Split listing layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left lists cards */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                  Open Matching Opportunities ({filteredJobs.length})
                </h4>

                {filteredJobs.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 p-8 rounded-3xl text-center text-slate-450 text-xs font-semibold">
                    No matching jobs found. Refine your keywords filter logic.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map(job => (
                      <div 
                        key={job.id} 
                        onClick={() => { setSelectedJob(job); setMatchResult(null); runCognitiveMatch(job); }}
                        className={`bg-white border p-5 rounded-3xl transition duration-300 cursor-pointer hover:shadow-lg text-left ${selectedJob?.id === job.id ? "border-indigo-500 bg-indigo-50/20" : "border-slate-150"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {job.category}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 mt-2">{job.title}</h4>
                            <p className="text-xs text-slate-500 font-semibold">{job.companyName}</p>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-sm">
                            {job.companyLogo || "🏢"}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-bold pt-4 border-t border-slate-100 mt-4">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{job.location}</span>
                          </span>
                          <span>•</span>
                          <span className="uppercase">{job.type}</span>
                          <span>•</span>
                          <span className="text-indigo-600">
                            ${job.salaryMin?.toLocaleString() || "100k"} - ${job.salaryMax?.toLocaleString() || "150k"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right expanded matching details drawer panel */}
              <div className="lg:col-span-7">
                {!selectedJob ? (
                  <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center text-slate-400 text-xs font-semibold space-y-2">
                    <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>Select an open matching opportunity on the left block to trigger the Gemini Cognitive Analyzer.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-lg">
                    
                    <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                      <div className="space-y-1">
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Job Spec Card Summary
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-2">{selectedJob.title}</h3>
                        <p className="text-xs text-indigo-600 font-bold">{selectedJob.companyName} ({selectedJob.location})</p>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedJob(null)}
                        className="text-slate-400 hover:text-slate-600 text-sm font-extrabold"
                      >
                        Close
                      </button>
                    </div>

                    {/* COGNITIVE AI ALIGNMENTS SECTION */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-indigo-600" />
                          <span className="font-black text-xs text-slate-800 uppercase tracking-wider">Gemini Cognitive Concord Scorer</span>
                        </div>
                        {matchingLoader && <span className="text-[10px] text-indigo-600 font-bold animate-pulse">Running Prompts...</span>}
                      </div>

                      {matchResult ? (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                          <div className="sm:col-span-4 flex flex-col justify-center items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-3xl font-black text-slate-900">{matchResult.matchScore}%</span>
                            <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest mt-1">Match Percentage</span>
                          </div>

                          <div className="sm:col-span-8 space-y-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-amber-500 font-bold uppercase flex items-center space-x-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Core Skill-Gap Checkpoints</span>
                              </span>
                              <ul className="list-disc list-inside text-[11px] text-slate-650 font-medium leading-relaxed pl-1 space-y-1">
                                {matchResult.skillGapAnalysis?.map((gap: string, idx: number) => (
                                  <li key={idx}>{gap}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-indigo-600 font-bold uppercase">Dynamic Transition Roadmaps</span>
                              <ul className="list-decimal list-inside text-[11px] text-slate-600 font-medium leading-relaxed pl-1 space-y-1">
                                {matchResult.careerRoadmap?.map((road: string, idx: number) => (
                                  <li key={idx}>{road}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 leading-normal font-medium">
                          Our LLM matching model compares your parsed profile background skills to these descriptions. Learn compatibility index, gap reports, and roadmap matrices.
                        </p>
                      )}
                    </div>

                    {/* Specifications text */}
                    <div className="space-y-3 text-xs leading-normal font-normal text-slate-600">
                      <h4 className="font-bold text-slate-800">Job Description</h4>
                      <p className="leading-relaxed bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">{selectedJob.description}</p>
                    </div>

                    {/* Requirements checklist */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-xs">Core Requirements</h4>
                      <ul className="space-y-2 text-xs text-slate-650 pl-1">
                        {selectedJob.requirements?.map((req, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Instant AI Cover Letter Assistant */}
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 text-xs">Draft Persuasive Custom Cover Letter</h4>
                          <p className="text-[10px] text-slate-400">Uses your builder profile achievements matched to this role</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <select 
                            value={coverTone}
                            onChange={(e) => setCoverTone(e.target.value)}
                            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold focus:outline-none focus:border-indigo-500 text-slate-700"
                          >
                            <option value="enthusiastic">Enthusiastic Tone</option>
                            <option value="formal">Formal & Polite</option>
                            <option value="creative">Creative Tech Style</option>
                          </select>
                          
                          <button
                            type="button"
                            onClick={() => generateAICoverLetter(selectedJob)}
                            disabled={coverLetterLoader}
                            className="bg-indigo-50 hover:bg-indigo-150 text-indigo-700 border border-indigo-100 px-3 py-1 text-[10px] font-bold rounded-full transition"
                          >
                            {coverLetterLoader ? "Composing..." : "+ Auto Draft Letter"}
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={5}
                        placeholder="Type standard cover letter or click Auto Draft above..."
                        value={applicationCoverLetter}
                        onChange={(e) => setApplicationCoverLetter(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => submitApplicationObj(selectedJob)}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg"
                      >
                        <Send className="w-4 h-4" />
                        <span>{loading ? "Registering Submission..." : "Submit My Application"}</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 3: RESUME ANALYZER */}
        {/* ---------------------------------- */}
        {activeTab === "resume" && (
          <div className="space-y-8 animate-fade-in text-left">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="space-y-1">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI ATS Precision Scanners
                </span>
                <h3 className="text-xl font-bold mt-2">Upload Raw Resume Material</h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Paste plain text versions of your CV or portfolio index sheets. Our server-side model extracts credentials, outputs ATS compatibility ranks, scores weak alignments, and highlights critical changes.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={8}
                  placeholder="Paste your resume lines here (e.g., Alex Rivera, Senior Web Engineer, Skills: React, CSS, Node, Postgres...)"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl p-4 text-xs focus:outline-none focus:border-indigo-500 font-semibold text-slate-700 leading-relaxed"
                />
                
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <p className="text-[10px] text-slate-550 font-bold uppercase">
                    Requires valid Gemini API secrets set on server
                  </p>
                  
                  <button
                    onClick={analyzeResumeInput}
                    disabled={analysisLoader || !resumeText}
                    className="bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center space-x-1.5 shadow-md"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{analysisLoader ? "Extracting insights..." : "Run ATS Analysis"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Result display */}
            {analysisResult && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-up">
                
                {/* Left score panel */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 text-center flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <Award className="w-10 h-10 text-indigo-600 mx-auto" />
                    <h4 className="font-extrabold text-slate-800 text-base">ATS Match Index</h4>
                    <p className="text-xs text-slate-500 font-normal">Calculated keyword density compatibility</p>
                  </div>

                  <div className="my-6">
                    <span className="text-5xl font-black text-slate-900">{analysisResult.atsScore}%</span>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
                      <div className="bg-[#10B981] h-2.5 rounded-full" style={{ width: `${analysisResult.atsScore}%` }} />
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-xs space-y-1 text-emerald-850">
                    <p className="font-extrabold uppercase text-[9px] tracking-wide">Resume Strength Index</p>
                    <p className="font-black text-lg">{analysisResult.resumeStrength}%</p>
                  </div>
                </div>

                {/* Right parsed parameters */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                  
                  {/* Extracted skills badges */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Extracted Technologies</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.skills?.map((sk, id) => (
                        <span key={id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 text-[11px] font-bold rounded-full">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Highlights and weaknesses split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <h5 className="font-bold text-xs text-[#10B981] uppercase tracking-widest flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Strong Accomplishments</span>
                      </h5>
                      <ul className="list-disc list-inside text-xs text-slate-650 font-medium pl-1 leading-relaxed space-y-1">
                        {analysisResult.achievements?.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-xs text-rose-500 uppercase tracking-widest flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>Suspect Vulnerabilities</span>
                      </h5>
                      <ul className="list-disc list-inside text-xs text-slate-650 font-medium pl-1 leading-relaxed space-y-1">
                        {analysisResult.weaknesses?.map((weak, idx) => (
                          <li key={idx}>{weak}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* missing keywords */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h5 className="font-bold text-xs text-amber-500 uppercase tracking-widest">Missing Keywords (Industry benchmarks)</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.missingKeywords?.map((kw, id) => (
                        <span key={id} className="bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-0.5 text-[10px] font-extrabold rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions list */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h5 className="font-bold text-xs text-indigo-600 uppercase tracking-widest">Ats Action Items</h5>
                    <ul className="list-decimal list-inside text-xs text-slate-600 pl-1 leading-relaxed space-y-1">
                      {analysisResult.suggestions?.map((sug, id) => (
                        <li key={id}>{sug}</li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 4: KANBAN TRACKER */}
        {/* ---------------------------------- */}
        {activeTab === "kanban" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-indigo-600/10 border border-indigo-200/50 p-4 rounded-3xl flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Application Pipeline Timeline</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Track ongoing updates and recruiter status advancements in real-time.
                </p>
              </div>
              <button 
                onClick={fetchAppData}
                className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 p-2 rounded-xl transition shadow-sm flex items-center space-x-1"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              
              {/* Column 1: Applied */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Applied</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {applications.filter(a => a.status === "applied").length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {applications.filter(a => a.status === "applied").map(app => (
                    <div key={app.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{app.jobTitle}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{app.companyName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Under Review */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Review</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {applications.filter(a => a.status === "under-review").length}
                  </span>
                </div>

                <div className="space-y-3">
                  {applications.filter(a => a.status === "under-review").map(app => (
                    <div key={app.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{app.jobTitle}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{app.companyName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Shortlisted */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Shortlist</span>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {applications.filter(a => a.status === "shortlisted").length}
                  </span>
                </div>

                <div className="space-y-3">
                  {applications.filter(a => a.status === "shortlisted").map(app => (
                    <div key={app.id} className="bg-white border border-indigo-200 p-4 rounded-2xl shadow-sm space-y-2 border-l-4 border-l-indigo-500">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{app.jobTitle}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{app.companyName}</span>
                      {app.matchScore && <div className="text-[9px] text-indigo-600 font-bold">AI Concord: {app.matchScore}%</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Interview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Interview</span>
                  <span className="bg-cyan-100 text-cyan-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {applications.filter(a => a.status === "interview").length}
                  </span>
                </div>

                <div className="space-y-3">
                  {applications.filter(a => a.status === "interview").map(app => (
                    <div key={app.id} className="bg-white border border-cyan-250 p-4 rounded-2xl shadow-sm space-y-2 border-l-4 border-l-cyan-500">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{app.jobTitle}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{app.companyName}</span>
                      <div className="p-2 bg-slate-50 rounded-xl text-[9px] font-bold text-slate-500">
                        Check Calendar for Scheduled Video sync
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 5: Selected/Hired */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Hired</span>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {applications.filter(a => a.status === "selected").length}
                  </span>
                </div>

                <div className="space-y-3">
                  {applications.filter(a => a.status === "selected").map(app => (
                    <div key={app.id} className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-lg shadow-emerald-50 space-y-2 border-l-4 border-l-emerald-500 animate-pulse">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{app.jobTitle}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{app.companyName}</span>
                      <div className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-1 rounded">
                        OFFER RETRIEVED! 🎉
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------- */}
        {/* TAB 5: PROFILE BUILDER */}
        {/* ---------------------------------- */}
        {activeTab === "profile" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 text-left max-w-3xl mx-auto animate-fade-in shadow-sm">
            <div className="border-b border-slate-150 pb-5 mb-6">
              <h3 className="text-xl font-bold text-slate-900">SaaS Profile Integration</h3>
              <p className="text-xs text-slate-500 mt-1">Keep credentials in-sync so Gemini matching algorithms score you accurately.</p>
            </div>

            <form onSubmit={saveCandidateProfile} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Title</label>
                  <input
                    type="text"
                    required
                    value={profTitle}
                    onChange={(e) => setProfTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualifications Abstract / Summary</label>
                <textarea
                  rows={3}
                  required
                  value={profSummary}
                  onChange={(e) => setProfSummary(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geographic Location</label>
                  <input
                    type="text"
                    value={profLocation}
                    onChange={(e) => setProfLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skills List (Comma Separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="React, Typescript, Node, CSS..."
                    value={profSkills}
                    onChange={(e) => setProfSkills(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold animate-pulse"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">LinkedIn Profile Link</label>
                  <input
                    type="text"
                    value={profLinkedin}
                    onChange={(e) => setProfLinkedin(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-700 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">GitHub Profile Link</label>
                  <input
                    type="text"
                    value={profGithub}
                    onChange={(e) => setProfGithub(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-700 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Personal Portfolio Link</label>
                  <input
                    type="text"
                    value={profPortfolio}
                    onChange={(e) => setProfPortfolio(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-full transition text-xs shadow-md"
              >
                {loading ? "Saving Credentials..." : "Sync Profile Database State"}
              </button>

            </form>
          </div>
        )}

      </main>
    </div>
  );
};
