// src/components/AdminDashboard/AdminDashboard.js
import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import {
  fetchJobs,
  getBalances,
  createJob,
  updateJob,
  deleteJob,
  saveJob,
  unsaveJob,
  fetchSavedJobs,
} from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import UsersManagement from "./UsersManagement";
import JobCard from "./subcomponents/JobsCard";
import JobFormModal from "./subcomponents/JobFormModal";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const { user } = useAuth();
  const [balances, setBalancesState] = useState({ adminCredit: 5000, ctvBonusById: {} });

  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    keywords: "",
    salary: "",
    bonus: "",
    rewardCandidateUSD: "",
    rewardInterviewUSD: "",
    vacancies: "",
    applicants: "",
    deadline: "",
    description: "",
    requirements: "",
    benefits: "",
    other: "",
    status: "Active",
  });

  const navigate = useNavigate();

  // Load jobs and balances
  const refresh = async () => {
    try {
      const [js, bal, saved] = await Promise.all([fetchJobs(), getBalances(), fetchSavedJobs(user?.id)]);
      setJobs(js);
      setBalancesState(bal);
      setSavedJobs(saved);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Handlers

  // Open modal for adding new job
  function onAddJob() {
    setEditingJob(null);
    setJobForm({
      title: "",
      company: "",
      location: "",
      keywords: "",
      salary: "",
      bonus: "",
      rewardCandidateUSD: "",
      rewardInterviewUSD: "",
      vacancies: "",
      applicants: "",
      deadline: "",
      description: "",
      requirements: "",
      benefits: "",
      other: "",
      status: "Active",
    });
    setShowJobModal(true);
  }

  // Open modal for editing job
  function onEditJob(job) {
    setEditingJob(job);
    setJobForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      keywords: job.keywords || "",
      salary: job.salary || "",
      bonus: job.bonus || "",
      rewardCandidateUSD: job.rewardCandidateUSD || "",
      rewardInterviewUSD: job.rewardInterviewUSD || "",
      vacancies: job.vacancies || "",
      applicants: job.applicants || "",
      deadline: job.deadline || "",
      description: job.description || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      other: job.other || "",
      status: job.status || "Active",
    });
    setShowJobModal(true);
  }

  // Handle modal input changes
  function onChangeJobField(e) {
    const { name, value } = e.target;
    setJobForm((f) => ({ ...f, [name]: value }));
  }

  // Submit modal form (create or update)
  async function onSubmitJobForm(e) {
    e.preventDefault();
    try {
      if (editingJob) {
        // Update existing job
        await updateJob(editingJob.id, jobForm);
      } else {
        // Create new job
        await createJob(jobForm);
      }
      setShowJobModal(false);
      refresh();
    } catch (err) {
      console.error("Failed to save job", err);
      alert("Failed to save job. Please try again.");
    }
  }

  // Cancel modal
  function onCancelJobForm() {
    setShowJobModal(false);
  }

  // Delete job
  async function onDeleteJob(job) {
    if (!window.confirm(`Are you sure you want to delete job "${job.title}"?`)) return;
    try {
      await deleteJob(job.id);
      refresh();
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job.");
    }
  }

  // Save or unsave job
  async function onSaveToggle(job) {
    try {
      const isSaved = Array.isArray(savedJobs) && savedJobs.some((j) => j.id === job.id);
      if (isSaved) {
        await unsaveJob(job.id);
      } else {
        await saveJob(job.id);
      }
      // Refresh saved jobs list
      const updatedSavedJobs = await fetchSavedJobs(user?.id);
      setSavedJobs(Array.isArray(updatedSavedJobs) ? updatedSavedJobs : []);
      console.log(savedJobs);
    } catch (err) {
      console.error("Failed to toggle save job", err);
      alert("Failed to save/unsave job.");
    }
  }

  // Toggle job status between Active and Inactive (Pause/Resume)
  async function onToggleJobStatus(job) {
    try {
      const newStatus = job.status === "Active" ? "Inactive" : "Active";
      await updateJob(job.id, { ...job, status: newStatus });
      refresh();
    } catch (err) {
      console.error("Failed to toggle job status", err);
      alert("Failed to change job status.");
    }
  }

  return (
    <div className="admin-dashboard">
      <h2>Jobs Management</h2>
      <button onClick={onAddJob} style={{ marginBottom: "12px" }}>
        + Add New Job
      </button>

      <div className="jobs-grid">
        {jobs.length === 0 && <p>No jobs available.</p>}
        {jobs.map((job) => {
          // Check if job is inactive or deadline passed
          const today = new Date();
          const deadlineDate = job.deadline ? new Date(job.deadline) : null;
          const isPastDeadline = deadlineDate && today > deadlineDate;
          const isInactive = job.status === "Inactive" || isPastDeadline;

          return (
            <JobCard
              key={job.id}
              job={job}
              isInactive={isInactive}
              savedJobs={Array.isArray(savedJobs)? savedJobs:[]}
              user={user}
              onSaveToggle={onSaveToggle}
              onEdit={onEditJob}
              onDelete={onDeleteJob}
              onToggleStatus={onToggleJobStatus}
              navigate={navigate}
            />
          );
        })}
      </div>

      {showJobModal && (
        <JobFormModal
          editingJob={editingJob}
          jobForm={jobForm}
          onChangeJobField={onChangeJobField}
          onSubmit={onSubmitJobForm}
          onCancel={onCancelJobForm}
        />
      )}

    </div>
  );
}
