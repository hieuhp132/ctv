// src/components/JobList.js
import React, { useEffect, useState } from "react";
import { Link } from "../router";
import { fetchJobs, saveJob, fetchSavedJobs } from "../api";
import { useAuth } from "../context/AuthContext";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchJobs().then(setJobs);
  }, []);

  useEffect(() => {
    const localSavedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
    setSavedJobs(localSavedJobs);
    if (user?.id || user?.email) {
      fetchSavedJobs(user.id || user.email).then((data) => {
        setSavedJobs(data.items || []);
        localStorage.setItem('savedJobs', JSON.stringify(data.items || []));
      });
    }
  }, [user]);

  const handleSaveJob = async (job) => {
    if (!user?.id && !user?.email) return;
    try {
      // Cập nhật giao diện ngay lập tức
      setSavedJobs((prev) => [...prev, job]);
      const response = await saveJob(job.id, user.id || user.email);

      if (!response.success) {
        // Nếu API thất bại, hoàn tác cập nhật giao diện
        setSavedJobs((prev) => prev.filter((j) => j.id !== job.id));
        alert("Failed to save job: " + response.message);
      } else {
        // Cập nhật localStorage
        const updatedSavedJobs = [...savedJobs, job];
        setSavedJobs(updatedSavedJobs);
        localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs));
      }
    } catch (err) {
      // Nếu lỗi, hoàn tác cập nhật giao diện
      setSavedJobs((prev) => prev.filter((j) => j.id !== job.id));
      alert(`Failed to save job: ${err.message}`);
    }
  };

  return (
    <div>
      <h2>Job List</h2>
      <ul>
        {jobs.map((job) => (
          <li key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to={`/job/${job.id}`}>
              {job.title} – {job.location}
            </Link>
            <button
              title={savedJobs.some(j => j.id === job.id) ? "Saved" : "Save job"}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5em',
                color: savedJobs.some(j => j.id === job.id) ? '#f60' : '#888'
              }}
              onClick={() => {
                console.log("Button clicked for job:", job.id);
                console.log("Is job saved?", savedJobs.some(j => j.id === job.id));
                handleSaveJob(job);
              }}
            >
              {savedJobs.some(j => j.id === job.id) ? "★" : "☆"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
