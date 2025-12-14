// src/components/AdminDashboard/JobFormModal.js
import React from "react";

export default function JobFormModal({ editingJob, jobForm, onChangeJobField, onSubmit, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, width: 600, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{editingJob ? 'Edit job' : 'Add job'}</h3>
        <form onSubmit={onSubmit} className="candidate-form">
          <div style={{ display: 'grid', gap: 8 }}>
            <input name="title" placeholder="Title" value={jobForm.title} onChange={onChangeJobField} required />
            <input name="company" placeholder="Company" value={jobForm.company} onChange={onChangeJobField} required />
            <input name="location" placeholder="Location" value={jobForm.location} onChange={onChangeJobField} required />
            <input
              name="keywords"
              placeholder="e.g. JavaScript, React, Remote, Full-time"
              value={jobForm.keywords}
              onChange={onChangeJobField}
            />

            <input
              name="salary"
              placeholder="Salary (e.g.: 1000 USD)"
              value={jobForm.salary || ""}
              onChange={(e) => {
                const value = e.target.value;
                onChangeJobField({ target: { name: 'salary', value: value.trim() } });
              }}
              required
            />
            <input name="bonus" placeholder="Bonus (e.g.: 500 USD)" value={jobForm.bonus || ""} onChange={onChangeJobField} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="rewardCandidateUSD" type="number" placeholder="Reward/Candidate" value={jobForm.rewardCandidateUSD || ""} onChange={onChangeJobField} />
              <input name="rewardInterviewUSD" type="number" placeholder="Reward/Interview" value={jobForm.rewardInterviewUSD || ""} onChange={onChangeJobField} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="vacancies" type="number" placeholder="Vacancies" value={jobForm.vacancies || ""} onChange={onChangeJobField} />
              <input name="applicants" type="number" placeholder="Applicants" value={jobForm.applicants || ""} onChange={onChangeJobField} />
            </div>
            <input name="deadline" placeholder="Deadline (YYYY-MM-DD)" value={jobForm.deadline} onChange={onChangeJobField} />
            
            {/* New fields for job details */}
            <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Job Details</h4>
              <textarea 
                name="description" 
                placeholder="Job Description" 
                value={jobForm.description} 
                onChange={onChangeJobField}
                rows="4"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
              />
              <textarea 
                name="requirements" 
                placeholder="Job Requirements" 
                value={jobForm.requirements} 
                onChange={onChangeJobField}
                rows="3"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', marginTop: '8px' }}
              />
              <textarea 
                name="benefits" 
                placeholder="Benefits & Perks" 
                value={jobForm.benefits} 
                onChange={onChangeJobField}
                rows="3"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', marginTop: '8px' }}
              />
            </div>
            
            {/*Other */}
            <div>
              <textarea 
                  name="other" 
                  placeholder="Other" 
                  value={jobForm.other} 
                  onChange={onChangeJobField}
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', marginTop: '8px' }}
                />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#FFA500,#FF5E62)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6 }}>
              {editingJob ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
