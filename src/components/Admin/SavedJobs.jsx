import React from "react";
import { useNavigate } from "react-router-dom";
import { fetchJobs, fetchSavedJobs } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = React.useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const userId = user?.id || user?.email;
        if (userId) {
          const response = await fetchSavedJobs(userId);
          if (response?.items && Array.isArray(response.items)) {
            const backendSavedJobs = response.items.map((item) => {
              console.log("Debugging saved job item:", item); // Log the item for debugging
              return {
                id: item.jobId || item.id || item._id || item.jobLink || "undefined-id", // Use alternative fields for ID
                title: item.title,
                company: item.company,
                location: item.location,
                salary: item.salary,
                deadline: item.deadline,
                bonus: item.bonus,
              };
            });
            setSavedJobs(backendSavedJobs);
            localStorage.setItem('savedJobs', JSON.stringify(backendSavedJobs));
            console.log("Saved jobs loaded from backend:", backendSavedJobs);
          } else {
            console.error("Unexpected response structure for saved jobs:", response);
          }
        } else {
          const localSavedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
          setSavedJobs(localSavedJobs);
          console.log("Saved jobs loaded from localStorage:", localSavedJobs);
        }
      } catch (error) {
        console.error("Error loading saved jobs:", error);
      }
    };

    loadSavedJobs();
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
              key={job.id} 
              onClick={() => navigate(`/job/${job.id}`)}
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
    </div>
  );
}
