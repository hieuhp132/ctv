import React from "react";
import { useNavigate } from "react-router-dom";
import { fetchSavedJobs } from "../../api";
import { useAuth } from "../../context/AuthContext";
import Icons from "../Icons";

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = React.useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const localSavedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
    setSavedJobs(localSavedJobs);
    if (user?.id || user?.email) {
      fetchSavedJobs(user.id || user.email).then((data) => {
        const savedJobsFromBackend = data.items || [];
        setSavedJobs(savedJobsFromBackend);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobsFromBackend));
      });
    }
  }, [user]);

  return (
    <div style={{padding: '24px'}}>
      <h2 style={{marginBottom: '24px'}}>Saved Jobs</h2>
      {savedJobs.length === 0 ? (
        <p>You haven't saved any jobs yet.</p>
      ) : (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
          {savedJobs.map(job => (
            <div 
              key={job._id} 
              onClick={() => {
                if (job._id) {
                  navigate(`/job/${job._id}`);
                } else {
                  console.error("Invalid job ID:", job);
                  alert("Failed to navigate to job details. Invalid job ID.");
                }
              }}
              style={{
                border: '1px solid #eee',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: '20px',
                minWidth: '260px',
                maxWidth: '320px',
                background: '#fff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h3 style={{margin: 0}}>{job.title}</h3>
              </div>
              <div><strong>Company:</strong> {job.company}</div>
              <div><strong>Location:</strong> {job.location}</div>
              {job.deadline && <div><strong>Deadline:</strong> {job.deadline}</div>}
              <div><strong>Bonus:</strong> {job.bonus}</div>
              {Array.isArray(job.keywords) && job.keywords.length > 0 && (
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '6px 0 8px'}}>
                  {job.keywords.map(kw => (
                    <span key={kw} style={{background: '#eef2ff', color: '#3730a3', padding: '2px 8px', borderRadius: '999px', fontSize: '12px'}}>{kw}</span>
                  ))}
                </div>
              )}
              <div style={{fontSize: '12px', color: '#666'}}>
                Vacancies: {job.vacancies} · Applicants: {job.applicants} · Online {job.onlineDaysAgo} days ago
              </div>
            </div>
          ))}
        </div>
      )}
      <Icons />
    </div>
  );
}
