import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchSavedJobsL,
  unsaveJobL,
} from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import Card from "../../../components/Card.jsx";

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
    <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
       <div className="max-w-7xl mx-auto space-y-6">
        
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Saved Jobs</h2>
            <p className="text-gray-500 text-base">Keep track of opportunities you have marked for later.</p>
          </div>

          <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i data-lucide="bookmark" className="w-5 h-5 text-gray-400"></i>
                Saved Jobs
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 border border-gray-200">{savedJobs.length}</span>
            </h3>
            
            {savedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-100 rounded-[20px] bg-gray-50/50 top-1/2">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                        <i data-lucide="bookmark-minus" className="w-8 h-8 text-gray-300"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Saved Jobs Location</h3>
                    <p className="text-gray-500 max-w-sm">When you bookmark a job using the heart icon, it will appear here for quick access later.</p>
                </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" style={{ minHeight: 420 }}>
                 {savedJobs.map((job) => (
                    <Card 
                        key={job._id} 
                        job={job} 
                        isInactive={false}
                        onSaveToggle={handleUnsave}
                        onClick={job => navigate(`/job/${job._id}`)}
                    />
                 ))}
               </div>
            )}
          </section>

       </div>
    </div>
  );
}
