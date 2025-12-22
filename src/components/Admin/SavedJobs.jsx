import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSavedJobs } from "../../api";
import { useAuth } from "../../context/AuthContext";
import Icons from "../Icons";
// import "./SavedJobs.css";

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

useEffect(() => {
  if (!user) return;

  (async () => {
    try {
      const savedRes = await fetchSavedJobsL(user.email);

      const jobs = (savedRes?.jobs || [])
        .map(j => j.job || j) // phòng khi backend bọc job
        .filter(Boolean);

      setSavedJobs(jobs);
    } catch (err) {
      console.error(err);
    }
  })();
}, [user]);

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="page-header">
        <h2>Saved Jobs</h2>
        <span className="subtitle">
          Jobs you bookmarked for later review
        </span>
      </header>

      {/* CONTENT */}
      <section className="card">
        {savedJobs.length === 0 ? (
          <p className="empty-text">
            You haven't saved any jobs yet.
          </p>
        ) : (
          <div className="jobs-grid">
            {savedJobs.map((job) => (
              <div
                key={job._id}
                className="job-card"
                onClick={() => {
                  if (job._id) navigate(`/job/${job._id}`);
                  else alert("Invalid job ID");
                }}
              >
                <div className="job-header">
                  <h3>{job.title}</h3>
                </div>

                <div className="job-meta">
                  <div>
                    <label>Company</label>
                    : {job.company}
                  </div>
                  <div>
                    <label>Location</label>
                    : {job.location}
                  </div>
                  {job.deadline && (
                    <div>
                      <label>Deadline</label>
                      : {job.deadline}
                    </div>
                  )}
                  <div>
                    <label>Bonus</label>
                    : {job.bonus}
                  </div>
                </div>

                {Array.isArray(job.keywords) &&
                  job.keywords.length > 0 && (
                    <div className="job-tags">
                      {job.keywords.map((kw) => (
                        <span key={kw}>{kw}</span>
                      ))}
                    </div>
                  )}

                <div className="job-footer">
                  Vacancies: {job.vacancies} · Applicants:{" "}
                  {job.applicants} · Online{" "}
                  {job.onlineDaysAgo} days ago
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Icons />
    </div>
  );
}
