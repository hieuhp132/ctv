import React, { useState, useEffect } from "react";
import { fetchJobs, createJob, updateJob, deleteJob } from "../../api";

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    salary: "",
    location: "",
    description: "",
    requirements: "",
    benefits: "",
  });
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const jobsData = await fetchJobs();
    setJobs(jobsData);
  };

  const handleCreate = async () => {
    await createJob(newJob);
    loadJobs();
    setIsCreating(false);
    setNewJob({ title: "", salary: "", location: "", description: "", requirements: "", benefits: "" });
  };

  const handleUpdate = async (job) => {
    await updateJob(job);
    loadJobs();
    setEditingJob(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      await deleteJob(id);
      loadJobs();
    }
  };

  const renderJobForm = (job, handler, buttonText) => (
    <div className="job-form">
      <input
        type="text"
        placeholder="Job Title"
        value={job.title}
        onChange={(e) => handler({ ...job, title: e.target.value })}
      />
      <input
        type="text"
        placeholder="Salary"
        value={job.salary}
        onChange={(e) => handler({ ...job, salary: e.target.value })}
      />
      <input
        type="text"
        placeholder="Location"
        value={job.location}
        onChange={(e) => handler({ ...job, location: e.target.value })}
      />
      <textarea
        placeholder="Description"
        value={job.description}
        onChange={(e) => handler({ ...job, description: e.target.value })}
      />
      <textarea
        placeholder="Requirements"
        value={job.requirements}
        onChange={(e) => handler({ ...job, requirements: e.target.value })}
      />
      <textarea
        placeholder="Benefits"
        value={job.benefits}
        onChange={(e) => handler({ ...job, benefits: e.target.value })}
      />
      <button onClick={() => (buttonText === "Create" ? handleCreate() : handleUpdate(job))}>
        {buttonText}
      </button>
      {buttonText !== "Create" && <button onClick={() => setEditingJob(null)}>Cancel</button>}
    </div>
  );

  return (
    <div>
      <h2>Admin – Manage Jobs</h2>
      <button onClick={() => setIsCreating(!isCreating)}>
        {isCreating ? "Cancel" : "Add New Job"}
      </button>
      {isCreating && renderJobForm(newJob, setNewJob, "Create")}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Salary</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              {editingJob === job.id ? (
                <td colSpan="4">{renderJobForm(job, (updatedJob) => setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j)), "Update")}</td>
              ) : (
                <>
                  <td>{job.title}</td>
                  <td>{job.salary}</td>
                  <td>{job.location}</td>
                  <td>
                    <button onClick={() => setEditingJob(job.id)}>Edit</button>
                    <button onClick={() => handleDelete(job.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
