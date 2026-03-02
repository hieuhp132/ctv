import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchSavedJobsL,
  unsaveJobL,
} from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import Section from "../../../components/Section.jsx";

export default function SavedJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);

  /* ================= LOAD SAVED JOBS ================= */
  useEffect(() => {
    if (!user?.email) return;

    const loadSavedJobs = async () => {
      try {
        const res = await fetchSavedJobsL(user.email);

        const jobs = (res?.jobs || [])
          .map(j => j.job || j) // backend có thể wrap job
          .filter(Boolean)
          .map(j => ({
            ...j,
            isSaved: true, // VERY IMPORTANT
          }));

        setSavedJobs(jobs);
      } catch (err) {
        console.error("Failed to load saved jobs", err);
      }
    };

    loadSavedJobs();
  }, [user]);

  /* ================= UNSAVE ================= */
  const handleUnsave = async (job) => {
    try {
      const confirmed = window.confirm("Are you sure you want to unsave this job? After doing this, you will need to go to jobs list to save it again.");
      if (!confirmed) return;
      await unsaveJobL(job._id, user.email);
      setSavedJobs(prev => prev.filter(j => j._id !== job._id));
    } catch (err) {
      console.error("Failed to unsave job", err);
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="dashboard-container">
      <Section
        title="SAVED JOBS"
        color="blue"
        jobs={savedJobs}
        page={1}
        totalPages={1}
        hidePagination
        gridProps={{
          isInactive: false,
          onSaveToggle: handleUnsave,
          onClick: job => navigate(`/job/${job._id}`),
        }}
      />
    </div>
  );
}
