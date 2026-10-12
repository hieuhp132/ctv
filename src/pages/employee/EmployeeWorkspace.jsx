import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  Plus,
  Search,
  Star,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createEmployeeJobL,
  fetchAllJobsStrict,
  listReferrals,
  updateEmployeeJobL,
  updateEmployeeReferralL,
} from "../../services/api";
import "./EmployeeWorkspace.css";

const PIPELINE = ["submitted", "under_review", "interviewing", "offer", "hired", "onboard", "rejected"];
const EMPTY_JOB = {
  title: "",
  company: "",
  location: "",
  salary: "",
  deadline: "",
  vacancies: 1,
  costPerHire: "",
  keywords: "",
  description: "",
  requirement: "",
  status: "Active",
};

const titleCase = (value) =>
  String(value || "submitted").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const jobIdOf = (referral) =>
  typeof referral.job === "object" ? referral.job?._id : referral.job;
const jobTitleOf = (referral, jobs) =>
  (typeof referral.job === "object" ? referral.job?.title : null) ||
  jobs.find((job) => String(job._id) === String(jobIdOf(referral)))?.title ||
  referral.jobTitle ||
  "Role not specified";
const money = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(amount) || 0);
const initials = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function Metric({ icon: Icon, label, value, note, tone }) {
  return (
    <article className={`ft-metric ft-metric--${tone}`}>
      <span className="ft-metric__icon"><Icon size={19} /></span>
      <span className="ft-metric__label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function EmployeeWorkspace() {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email;
  const [jobs, setJobs] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobModal, setJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [candidate, setCandidate] = useState(null);
  const [candidateForm, setCandidateForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadWorkspace = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError("");
    try {
      const allJobs = await fetchAllJobsStrict();
      const ownedJobs = allJobs.filter((job) => String(job.createdBy || "") === String(userId));
      const ownedJobIds = ownedJobs.map((job) => String(job._id || job.id)).filter(Boolean);
      const pipeline = ownedJobIds.length
        ? await listReferrals({ id: userId, isHiringManager: true, jobIds: ownedJobIds, limit: 1000 })
        : [];
      setJobs(ownedJobs);
      setReferrals(pipeline);
    } catch (error) {
      console.error("Failed to load employee workspace:", error);
      setLoadError(error.message || "Unable to load your recruitment workspace.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const filteredReferrals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return referrals.filter((referral) => {
      const status = String(referral.status || "submitted").toLowerCase();
      const searchable = [
        referral.candidateName,
        referral.candidateEmail,
        referral.candidatePhone,
        jobTitleOf(referral, jobs),
      ].join(" ").toLowerCase();
      return (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (statusFilter === "all" || status === statusFilter);
    });
  }, [referrals, jobs, query, statusFilter]);

  const metrics = useMemo(() => {
    const hires = referrals.filter((referral) => ["hired", "onboard"].includes(String(referral.status).toLowerCase()));
    const hiredDays = hires.map((referral) => {
      const start = new Date(referral.createdAt);
      const end = new Date(referral.hiredAt || referral.updatedAt || Date.now());
      return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
        ? null
        : Math.max(0, Math.round((end - start) / 86400000));
    }).filter((value) => value !== null);
    const totalCost = hires.reduce((total, referral) => {
      const job = jobs.find((entry) => String(entry._id) === String(jobIdOf(referral)));
      return total + Number(job?.costPerHire || 0);
    }, 0);
    return {
      openRoles: jobs.filter((job) => job.status === "Active").length,
      applicants: referrals.length,
      hires: hires.length,
      interviews: referrals.filter((referral) => String(referral.status).toLowerCase() === "interviewing").length,
      talentPool: referrals.filter((referral) => referral.isTalentPool).length,
      timeToHire: hiredDays.length ? Math.round(hiredDays.reduce((sum, days) => sum + days, 0) / hiredDays.length) : 0,
      costPerHire: hires.length ? totalCost / hires.length : 0,
    };
  }, [jobs, referrals]);

  const candidatesForView = useMemo(() => {
    if (activeTab === "interviews") {
      return filteredReferrals.filter((referral) =>
        String(referral.status).toLowerCase() === "interviewing" || referral.interviewAt
      );
    }
    if (activeTab === "talent") return filteredReferrals.filter((referral) => referral.isTalentPool);
    return filteredReferrals;
  }, [activeTab, filteredReferrals]);

  const openJobEditor = (job = null) => {
    setActionError("");
    setEditingJob(job);
    setJobForm(job ? {
      ...EMPTY_JOB,
      ...job,
      deadline: job.deadline ? String(job.deadline).slice(0, 10) : "",
      keywords: Array.isArray(job.keywords) ? job.keywords.join(", ") : job.keywords || "",
      description: job.jobsdetail?.description || job.description || "",
      requirement: job.jobsdetail?.requirement || job.requirements || "",
    } : EMPTY_JOB);
    setJobModal(true);
  };

  const saveJob = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      const payload = {
        title: jobForm.title.trim(),
        company: jobForm.company.trim() || user?.company || user?.name || "Company",
        location: jobForm.location.trim(),
        salary: jobForm.salary.trim(),
        deadline: jobForm.deadline || "",
        vacancies: Number(jobForm.vacancies) || 1,
        costPerHire: Number(jobForm.costPerHire) || 0,
        keywords: String(jobForm.keywords).split(",").map((word) => word.trim()).filter(Boolean),
        jobsdetail: { description: jobForm.description, requirement: jobForm.requirement },
        status: jobForm.status,
      };
      if (editingJob) await updateEmployeeJobL(editingJob._id, payload);
      else await createEmployeeJobL(payload);
      setJobModal(false);
      await loadWorkspace();
    } catch (error) {
      setActionError(error.message || "Unable to save this job.");
    } finally {
      setSaving(false);
    }
  };

  const toggleJobStatus = async (job) => {
    setActionError("");
    try {
      await updateEmployeeJobL(job._id, { status: job.status === "Active" ? "Inactive" : "Active" });
      await loadWorkspace();
    } catch (error) {
      setActionError(error.message || "Unable to update this job.");
    }
  };

  const openCandidate = (item) => {
    setCandidate(item);
    setCandidateForm({
      status: String(item.status || "submitted").toLowerCase(),
      interviewAt: item.interviewAt ? new Date(item.interviewAt).toISOString().slice(0, 16) : "",
      interviewScore: item.interviewScore ?? "",
      interviewQuestions: item.interviewQuestions || "",
      crmNotes: item.crmNotes || "",
      candidateFeedback: item.candidateFeedback || "",
      offerSalary: item.offerSalary ?? "",
      isTalentPool: Boolean(item.isTalentPool),
    });
    setActionError("");
  };

  const saveCandidate = async (event) => {
    event.preventDefault();
    if (!candidate) return;
    setSaving(true);
    setActionError("");
    try {
      const updates = {
        ...candidateForm,
        interviewScore: candidateForm.interviewScore === "" ? "" : Number(candidateForm.interviewScore),
        offerSalary: candidateForm.offerSalary === "" ? "" : Number(candidateForm.offerSalary),
        hiredAt: ["hired", "onboard"].includes(candidateForm.status)
          ? candidate.hiredAt || new Date().toISOString()
          : candidate.hiredAt,
      };
      await updateEmployeeReferralL(candidate._id || candidate.id, updates);
      setCandidate(null);
      await loadWorkspace();
    } catch (error) {
      setActionError(error.message || "Unable to save candidate updates.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    ["overview", "Overview", Activity],
    ["jobs", "Job openings", BriefcaseBusiness],
    ["candidates", "Candidates", UsersRound],
    ["interviews", "Interviews", CalendarDays],
    ["talent", "Talent pool", Star],
    ["reports", "Reports", ArrowUpRight],
  ];

  return (
    <main className="ft-workspace">
      <div className="ft-container">
        <header className="ft-header">
          <div>
            <span className="ft-eyebrow">EMPLOYEE WORKSPACE</span>
            <h1>Good to see you, {user?.name?.split(" ")[0] || "Recruiter"}</h1>
            <p>Own every step from the first conversation to a successful first day.</p>
          </div>
          <button className="ft-button ft-button--primary" onClick={() => openJobEditor()}>
            <Plus size={17} /> Create a job
          </button>
        </header>

        <nav className="ft-tabs" aria-label="Recruitment workspace">
          {tabs.map(([id, label, TabIcon]) => (
            <button className={activeTab === id ? "is-active" : ""} key={id} onClick={() => setActiveTab(id)}>
              <TabIcon size={16} />{label}
            </button>
          ))}
        </nav>

        {(loadError || actionError) && !jobModal && !candidate && (
          <div className="ft-alert" role="alert">
            <span>{actionError || loadError}</span>
            <button onClick={actionError ? () => setActionError("") : loadWorkspace}>
              {actionError ? "Dismiss" : "Try again"}
            </button>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            <section className="ft-metrics">
              <Metric icon={BriefcaseBusiness} label="Open positions" value={loading ? "…" : metrics.openRoles} note="Roles currently hiring" tone="cyan" />
              <Metric icon={UsersRound} label="Candidates in pipeline" value={loading ? "…" : metrics.applicants} note={`${metrics.interviews} interviews in progress`} tone="blue" />
              <Metric icon={Check} label="Successful placements" value={loading ? "…" : metrics.hires} note="Hired or onboarded" tone="green" />
              <Metric icon={Clock3} label="Average time to hire" value={loading ? "…" : metrics.hires ? `${metrics.timeToHire} days` : "—"} note="From referral to hire" tone="violet" />
            </section>

            <section className="ft-panel">
              <div className="ft-panel__heading">
                <div><span className="ft-eyebrow">HIRING PIPELINE</span><h2>Recent candidates</h2><p>Review profiles and keep each hiring team aligned.</p></div>
                <button className="ft-button ft-button--quiet" onClick={() => setActiveTab("candidates")}>View all <ArrowUpRight size={15} /></button>
              </div>
              <CandidateTable referrals={filteredReferrals.slice(0, 5)} jobs={jobs} loading={loading} onReview={openCandidate} />
            </section>
            <section className="ft-panel ft-panel--compact">
              <div className="ft-panel__heading">
                <div><span className="ft-eyebrow">YOUR REQUISITIONS</span><h2>Active job openings</h2><p>Create, update or close your JDs.</p></div>
                <button className="ft-button ft-button--quiet" onClick={() => setActiveTab("jobs")}>Manage jobs <ArrowUpRight size={15} /></button>
              </div>
              <JobList jobs={jobs.slice(0, 3)} loading={loading} onEdit={openJobEditor} onToggle={toggleJobStatus} />
            </section>
          </>
        )}

        {activeTab === "jobs" && (
          <section className="ft-panel">
            <div className="ft-panel__heading">
              <div><span className="ft-eyebrow">JOB MANAGEMENT</span><h2>Your job openings</h2><p>Publish a role, keep its JD up to date, or close the requisition.</p></div>
              <button className="ft-button ft-button--primary" onClick={() => openJobEditor()}><Plus size={16} /> New job</button>
            </div>
            <JobList jobs={jobs} loading={loading} onEdit={openJobEditor} onToggle={toggleJobStatus} />
          </section>
        )}

        {["candidates", "interviews", "talent"].includes(activeTab) && (
          <section className="ft-panel">
            <div className="ft-panel__heading">
              <div>
                <span className="ft-eyebrow">{activeTab === "talent" ? "RELATIONSHIP MANAGEMENT" : activeTab === "interviews" ? "INTERVIEW SCHEDULE" : "CV SEARCH & SCREENING"}</span>
                <h2>{activeTab === "talent" ? "Talent pool" : activeTab === "interviews" ? "Interviews and evaluations" : "Candidate pipeline"}</h2>
                <p>{activeTab === "talent" ? "Keep promising profiles warm for future opportunities." : activeTab === "interviews" ? "Prepare interviews, capture feedback and score candidates." : "Search submitted profiles, review CVs and update candidate stages."}</p>
              </div>
            </div>
            <div className="ft-tools">
              <label className="ft-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, emails or positions" /></label>
              <select aria-label="Filter candidates by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                {PIPELINE.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
            </div>
            <CandidateTable referrals={candidatesForView} jobs={jobs} loading={loading} onReview={openCandidate} />
          </section>
        )}

        {activeTab === "reports" && (
          <>
            <section className="ft-metrics ft-metrics--reports">
              <Metric icon={Clock3} label="Time to hire" value={metrics.hires ? `${metrics.timeToHire} days` : "—"} note="Average for hired and onboarded candidates" tone="violet" />
              <Metric icon={CircleDollarSign} label="Hiring cost per placement" value={metrics.hires ? money(metrics.costPerHire) : "—"} note="Based on cost per hire set on each JD" tone="cyan" />
              <Metric icon={Activity} label="Interview to placement" value={metrics.interviews + metrics.hires ? `${Math.round((metrics.hires / (metrics.hires + metrics.interviews)) * 100)}%` : "—"} note="Placements / interviews and placements" tone="blue" />
              <Metric icon={Star} label="Talent pool" value={metrics.talentPool} note="Profiles saved for future roles" tone="green" />
            </section>
            <section className="ft-panel">
              <div className="ft-panel__heading"><div><span className="ft-eyebrow">PERFORMANCE SNAPSHOT</span><h2>Hiring by position</h2><p>Pipeline, outcomes and hiring costs across your roles.</p></div></div>
              <div className="ft-report-list">
                {jobs.map((job) => {
                  const jobReferrals = referrals.filter((referral) => String(jobIdOf(referral)) === String(job._id));
                  const placements = jobReferrals.filter((referral) => ["hired", "onboard"].includes(String(referral.status).toLowerCase())).length;
                  return <article key={job._id}><span className="ft-report-list__icon"><BriefcaseBusiness size={17} /></span><span className="ft-report-list__title"><strong>{job.title}</strong><small>{job.company} · {jobReferrals.length} candidates</small></span><span><small>Placements</small><strong>{placements}</strong></span><span><small>Est. hiring cost</small><strong>{money(placements * Number(job.costPerHire || 0))}</strong></span></article>;
                })}
                {!loading && !jobs.length && <p className="ft-empty">Create a job to start tracking hiring performance.</p>}
              </div>
            </section>
          </>
        )}
      </div>

      {jobModal && (
        <div className="ft-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setJobModal(false); }}>
          <section className="ft-modal" role="dialog" aria-modal="true" aria-labelledby="ft-job-title">
            <header><div><span className="ft-eyebrow">REQUISITION</span><h2 id="ft-job-title">{editingJob ? "Edit job description" : "Create a new position"}</h2></div><button className="ft-icon-button" onClick={() => setJobModal(false)} aria-label="Close"><X size={19} /></button></header>
            {actionError && <p className="ft-modal-error" role="alert">{actionError}</p>}
            <form onSubmit={saveJob}>
              <div className="ft-form-grid">
                <Field label="Job title" required value={jobForm.title} onChange={(value) => setJobForm({ ...jobForm, title: value })} />
                <Field label="Company" required value={jobForm.company} onChange={(value) => setJobForm({ ...jobForm, company: value })} />
                <Field label="Location" required value={jobForm.location} onChange={(value) => setJobForm({ ...jobForm, location: value })} />
                <Field label="Salary range" value={jobForm.salary} onChange={(value) => setJobForm({ ...jobForm, salary: value })} />
                <Field label="Application deadline" type="date" value={jobForm.deadline} onChange={(value) => setJobForm({ ...jobForm, deadline: value })} />
                <Field label="Vacancies" type="number" min="1" value={jobForm.vacancies} onChange={(value) => setJobForm({ ...jobForm, vacancies: value })} />
                <Field label="Hiring cost per placement (USD)" type="number" min="0" value={jobForm.costPerHire} onChange={(value) => setJobForm({ ...jobForm, costPerHire: value })} />
                <Field label="Skills / keywords" value={jobForm.keywords} onChange={(value) => setJobForm({ ...jobForm, keywords: value })} />
              </div>
              <label className="ft-field"><span>Job description</span><textarea rows="4" value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} /></label>
              <label className="ft-field"><span>Requirements</span><textarea rows="3" value={jobForm.requirement} onChange={(event) => setJobForm({ ...jobForm, requirement: event.target.value })} /></label>
              <div className="ft-modal__actions"><button type="button" className="ft-button ft-button--quiet" onClick={() => setJobModal(false)}>Cancel</button><button className="ft-button ft-button--primary" disabled={saving}>{saving ? "Saving…" : editingJob ? "Save changes" : "Publish position"}</button></div>
            </form>
          </section>
        </div>
      )}

      {candidate && (
        <div className="ft-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCandidate(null); }}>
          <section className="ft-modal ft-modal--candidate" role="dialog" aria-modal="true" aria-labelledby="ft-candidate-title">
            <header><div><span className="ft-eyebrow">CANDIDATE CRM</span><h2 id="ft-candidate-title">{candidate.candidateName || "Candidate profile"}</h2><p>{jobTitleOf(candidate, jobs)} · {candidate.candidateEmail || "Email not provided"}</p></div><button className="ft-icon-button" onClick={() => setCandidate(null)} aria-label="Close"><X size={19} /></button></header>
            {actionError && <p className="ft-modal-error" role="alert">{actionError}</p>}
            <form onSubmit={saveCandidate}>
              <div className="ft-form-grid">
                <label className="ft-field"><span>Hiring stage</span><select value={candidateForm.status} onChange={(event) => setCandidateForm({ ...candidateForm, status: event.target.value })}>{PIPELINE.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
                <Field label="Interview date & time" type="datetime-local" value={candidateForm.interviewAt} onChange={(value) => setCandidateForm({ ...candidateForm, interviewAt: value })} />
                <Field label="Interview score (0–100)" type="number" min="0" max="100" value={candidateForm.interviewScore} onChange={(value) => setCandidateForm({ ...candidateForm, interviewScore: value })} />
                <Field label="Offer salary (USD)" type="number" min="0" value={candidateForm.offerSalary} onChange={(value) => setCandidateForm({ ...candidateForm, offerSalary: value })} />
              </div>
              <label className="ft-field"><span>Interview questions / evaluation</span><textarea rows="3" value={candidateForm.interviewQuestions} onChange={(event) => setCandidateForm({ ...candidateForm, interviewQuestions: event.target.value })} placeholder="Add questions, strengths and areas to explore…" /></label>
              <label className="ft-field"><span>CRM notes</span><textarea rows="3" value={candidateForm.crmNotes} onChange={(event) => setCandidateForm({ ...candidateForm, crmNotes: event.target.value })} placeholder="Follow-ups, candidate preferences and next steps…" /></label>
              <label className="ft-field"><span>Feedback / outcome message</span><textarea rows="2" value={candidateForm.candidateFeedback} onChange={(event) => setCandidateForm({ ...candidateForm, candidateFeedback: event.target.value })} placeholder="Record the feedback and result to share with the candidate…" /></label>
              <label className="ft-checkbox"><input type="checkbox" checked={candidateForm.isTalentPool} onChange={(event) => setCandidateForm({ ...candidateForm, isTalentPool: event.target.checked })} /><span>Add candidate to the talent pool</span></label>
              <div className="ft-modal__actions"><a className="ft-button ft-button--quiet" href={candidate.cvUrl || candidate.cv || undefined} target="_blank" rel="noreferrer"><FileText size={15} /> View CV</a><button type="button" className="ft-button ft-button--quiet" onClick={() => setCandidate(null)}>Cancel</button><button className="ft-button ft-button--primary" disabled={saving}>{saving ? "Saving…" : "Save candidate"}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function Field({ label, value, onChange, type = "text", required = false, min, max }) {
  return (
    <label className="ft-field">
      <span>{label}</span>
      <input type={type} required={required} min={min} max={max} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function JobList({ jobs, loading, onEdit, onToggle }) {
  if (loading) return <p className="ft-empty">Loading job openings…</p>;
  if (!jobs.length) return <div className="ft-empty"><BriefcaseBusiness size={23} /><strong>No positions yet</strong><span>Create your first job to start building a hiring pipeline.</span></div>;
  return (
    <div className="ft-job-list">
      {jobs.map((job) => (
        <article key={job._id}>
          <span className="ft-job-list__icon"><BriefcaseBusiness size={18} /></span>
          <div className="ft-job-list__body"><strong>{job.title}</strong><span>{job.company || "Company"} · {job.location || "Location flexible"}</span><small>{job.vacancies || 1} opening{job.vacancies === 1 ? "" : "s"}{job.deadline ? ` · Closes ${new Date(job.deadline).toLocaleDateString()}` : ""}</small></div>
          <span className={`ft-job-status ${job.status === "Active" ? "is-open" : ""}`}>{job.status === "Active" ? "Open" : "Closed"}</span>
          <button className="ft-button ft-button--quiet" onClick={() => onEdit(job)}>Edit JD</button>
          <button className="ft-button ft-button--quiet" onClick={() => onToggle(job)}>{job.status === "Active" ? "Close" : "Reopen"}</button>
        </article>
      ))}
    </div>
  );
}

function CandidateTable({ referrals, jobs, loading, onReview }) {
  if (loading) return <p className="ft-empty">Loading candidate profiles…</p>;
  if (!referrals.length) return <div className="ft-empty"><UsersRound size={23} /><strong>No candidates found</strong><span>Profiles referred to your job openings will appear here.</span></div>;
  return (
    <div className="ft-table-wrap">
      <table className="ft-table">
        <thead><tr><th>Candidate</th><th>Position</th><th>Stage</th><th>Interview / score</th><th>CV</th><th><span className="sr-only">Review</span></th></tr></thead>
        <tbody>
          {referrals.map((referral, index) => {
            const name = referral.candidateName || "Unnamed candidate";
            return (
              <tr key={referral._id || referral.id || `${name}-${index}`}>
                <td><div className="ft-candidate-cell"><span>{initials(name)}</span><div><strong>{name}</strong><small>{referral.candidateEmail || "Candidate profile"}</small></div></div></td>
                <td>{jobTitleOf(referral, jobs)}</td>
                <td><span className={`ft-stage ft-stage--${String(referral.status || "submitted").toLowerCase()}`}>{titleCase(referral.status)}</span></td>
                <td>{referral.interviewAt ? new Date(referral.interviewAt).toLocaleDateString() : "Not scheduled"}{referral.interviewScore !== undefined && referral.interviewScore !== "" ? <small className="ft-score">{` · ${referral.interviewScore}/100`}</small> : null}</td>
                <td>{referral.cvUrl || referral.cv ? <a className="ft-cv-link" href={referral.cvUrl || referral.cv} target="_blank" rel="noreferrer"><FileText size={14} /> Open CV</a> : "—"}</td>
                <td><button className="ft-review-button" onClick={() => onReview(referral)}>Review <ArrowUpRight size={14} /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
