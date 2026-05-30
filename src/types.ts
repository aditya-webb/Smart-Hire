/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'candidate' | 'recruiter' | 'admin';
export type JobType = 'remote' | 'hybrid' | 'on-site';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';
export type JobStatus = 'draft' | 'published' | 'archived';
export type ApplicationStatus = 'applied' | 'under-review' | 'shortlisted' | 'interview' | 'selected' | 'rejected';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';
export type NotificationType = 'info' | 'interview' | 'application' | 'message';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  status: 'active' | 'suspended';
  companyId?: string;
}

export interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

export interface Experience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface CandidateProfile {
  userId: string;
  fullName: string;
  title: string;
  summary: string;
  email: string;
  phoneNumber: string;
  location: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  resumeText?: string;
  profileCompleteMeter: number;
}

export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  companyBio?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string;
  type: JobType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  experienceLevel: ExperienceLevel;
  category: string;
  tags: string[];
  status: JobStatus;
  recruiterId: string;
  numApplications: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeAnalysis {
  skills: string[];
  education: string[];
  experience: string[];
  achievements: string[];
  weaknesses: string[];
  missingKeywords: string[];
  atsScore: number;
  suggestions: string[];
  resumeStrength: number;
}

export interface AIRecommendation {
  jobId: string;
  matchScore: number;
  compatibilityScore: number;
  skillGapAnalysis: string[];
  learningSuggestions: string[];
  careerRoadmap: string[];
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  matchScore?: number;
  compatibilityScore?: number;
  skillGapAnalysis?: string[];
  coverLetter?: string;
  resumeAnalysis?: ResumeAnalysis | null;
  recruiterNotes?: string;
  candidateName: string;
  candidateTitle: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  recruiterId: string;
  jobId: string;
  title: string;
  description: string;
  dateTime: string;
  type: 'virtual' | 'on-site';
  status: InterviewStatus;
  meetingLink?: string;
  duration: number; // in minutes
  notes?: string;
  candidateName: string;
  jobTitle: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
}

export interface Message {
  id: string;
  chatId: string; // senderId_receiverId combined alphabetically
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatSession {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  lastMessage?: string;
  lastMessageAt?: string;
}
