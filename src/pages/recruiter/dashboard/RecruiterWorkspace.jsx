import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { fetchAllJobs, listReferrals } from "../../../services/api";
import Ambient3DObject from "../../../components/Ambient3DObject";
import SubmitCandidateModal from "../../../components/SubmitCandidateModal";
import "../../../styles/DashboardMotion.css";
import "./RecruiterWorkspace.css";

const PIPELINE_STAGES = [
  "submitted",
  "under_review",
  "interviewing",
  "offer",
  "hired",
  "onboard",
  "rejected",
];

const stageLabel = (status) =>
  String(status || "submitted").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function getAmount(referral) {
  const parseAmount = (value) => {
    if (value === null || value === undefined || value === "" || value === "-") return null;
    const match = String(value).match(/[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/);
    if (!match) return null;
    const amount = Number(match[0].replace(/,/g, ""));
    return Number.isFinite(amount) ? amount : null;
  };
  const referralAmount = parseAmount(
    referral?.bonus ?? referral?.commissionAmount ?? referral?.estimatedCommission ?? referral?.commission?.amount
  );
  return referralAmount;
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const referralJobTitle = (referral) =>
  typeof referral?.job === "object"
    ? referral.job?.title || "Role not specified"
    : referral?.jobTitle || "Role not specified";

function Icon({ name, size = 20 }) {
  const icons = {
    wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M16 14h.01" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15m6-12v15" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export default function RecruiterWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const recruiterId = user?._id || user?.id;
  const recruiterEmail = user?.email;
  const submissionRecruiterId = user?.id || recruiterEmail;
  const [referrals, setReferrals] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitJob, setSubmitJob] = useState(null);

  const loadWorkspace = useCallback(async () => {
    if (!recruiterId && !recruiterEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [referralItems, jobResponse] = await Promise.all([
        listReferrals({ id: recruiterId, email: recruiterEmail, isAdmin: false }),
        fetchAllJobs(),
      ]);
      setReferrals(Array.isArray(referralItems) ? referralItems : []);
      setJobs(Array.isArray(jobResponse) ? jobResponse : jobResponse?.jobs || []);
    } catch (loadError) {
      console.error("Failed to load recruiter workspace:", loadError);
      setError("We couldn't load your workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [recruiterId, recruiterEmail]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const activeJobs = useMemo(() => {
    const today = new Date();
    return jobs.filter((job) => {
      const deadlineValid = !job.deadline || today <= new Date(job.deadline);
      return job.status === "Active" && deadlineValid;
    }).slice(0, 4);
  }, [jobs]);

  const filteredReferrals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return referrals.filter((referral) => {
      const status = String(referral.status || "submitted").toLowerCase();
      const candidate = String(referral.candidateName || "").toLowerCase();
      const title = referralJobTitle(referral).toLowerCase();
      const matchesQuery = !normalizedQuery || candidate.includes(normalizedQuery) || title.includes(normalizedQuery);
      return matchesQuery && (statusFilter === "all" || status === statusFilter);
    }).slice(0, 6);
  }, [referrals, query, statusFilter]);

  const metrics = useMemo(() => {
    return PIPELINE_STAGES.reduce((result, stage) => ({
      ...result,
      [stage]: referrals.filter((referral) => String(referral.status || "submitted").toLowerCase() === stage).length,
    }), {});
  }, [referrals]);

  const commissionStats = useMemo(() => {
    const confirmed = referrals.filter((referral) =>
      ["hired", "onboard"].includes(String(referral.status || "").toLowerCase())
    );
    const inProgress = referrals.filter((referral) =>
      ["submitted", "under_review", "interviewing", "offer"].includes(String(referral.status || "").toLowerCase())
    );
    const totalFor = (items) => items.reduce((total, referral) => {
      const amount = getAmount(referral);
      return amount === null ? total : total + amount;
    }, 0);

    return {
      confirmedCount: confirmed.filter((referral) => getAmount(referral) !== null).length,
      confirmedAmount: totalFor(confirmed),
      inProgressCount: inProgress.filter((referral) => getAmount(referral) !== null).length,
      inProgressAmount: totalFor(inProgress),
      placements: confirmed.length,
      placementRate: referrals.length ? Math.round((confirmed.length / referrals.length) * 100) : 0,
    };
  }, [referrals]);

  return (
    <main className="recruiter-workspace">
      <div className="recruiter-workspace__container">
        <header className="recruiter-welcome">
          <Ambient3DObject className="ambient-3d-object--recruiter" />
          <div>
            <span className="recruiter-eyebrow">RECRUITER WORKSPACE</span>
            <h1>Good to see you, {user?.name?.split(" ")[0] || "Recruiter"}</h1>
            <p>Manage your referrals, track commissions, and find your next opportunity.</p>
          </div>
          <button className="recruiter-primary-button" onClick={() => navigate("/recruiter/jobs")}>
            <Icon name="plus" size={18} />
            Find a role to refer
          </button>
        </header>

        {error && (
          <div className="recruiter-workspace__error" role="alert">
            <span>{error}</span>
            <button onClick={loadWorkspace}>Try again</button>
          </div>
        )}

        <section className="recruiter-metrics" aria-label="Recruiter performance">
          <article className="recruiter-metric-card recruiter-metric-card--cyan" data-dashboard-card="interactive">
            <div className="recruiter-metric-card__top">
              <span className="recruiter-metric-card__icon"><Icon name="wallet" /></span>
              <span className="recruiter-metric-card__tag">CONFIRMED</span>
            </div>
            <p>Commission earned</p>
            <strong>{loading ? "…" : commissionStats.confirmedCount ? formatCurrency(commissionStats.confirmedAmount) : "—"}</strong>
            <span className="recruiter-metric-card__note">
              {commissionStats.confirmedCount} {commissionStats.confirmedCount === 1 ? "referral" : "referrals"} with commission data
            </span>
          </article>
          <article className="recruiter-metric-card recruiter-metric-card--violet" data-dashboard-card="interactive">
            <div className="recruiter-metric-card__top">
              <span className="recruiter-metric-card__icon"><Icon name="clock" /></span>
              <span className="recruiter-metric-card__tag">IN PROGRESS</span>
            </div>
            <p>Pipeline commission</p>
            <strong>{loading ? "…" : commissionStats.inProgressCount ? formatCurrency(commissionStats.inProgressAmount) : "—"}</strong>
            <span className="recruiter-metric-card__note">
              {commissionStats.inProgressCount} {commissionStats.inProgressCount === 1 ? "referral" : "referrals"} with commission data
            </span>
          </article>
          <article className="recruiter-metric-card recruiter-metric-card--blue" data-dashboard-card="interactive">
            <div className="recruiter-metric-card__top">
              <span className="recruiter-metric-card__icon"><Icon name="users" /></span>
              <span className="recruiter-metric-card__tag">ALL TIME</span>
            </div>
            <p>CVs referred</p>
            <strong>{loading ? "…" : referrals.length}</strong>
            <span className="recruiter-metric-card__note">Candidates in your pipeline</span>
          </article>
          <article className="recruiter-metric-card recruiter-metric-card--green" data-dashboard-card="interactive">
            <div className="recruiter-metric-card__top">
              <span className="recruiter-metric-card__icon"><Icon name="chart" /></span>
              <span className="recruiter-metric-card__tag">PLACEMENT RATE</span>
            </div>
            <p>Successful placements</p>
            <strong>{loading ? "…" : `${commissionStats.placementRate}%`}</strong>
            <span className="recruiter-metric-card__note">{commissionStats.placements} hired or onboarded</span>
          </article>
        </section>

        <section className="recruiter-panel recruiter-pipeline" data-dashboard-card>
          <div className="recruiter-panel__heading">
            <div>
              <span className="recruiter-eyebrow">YOUR REFERRALS</span>
              <h2>Candidate pipeline</h2>
              <p>Stay on top of every candidate you’ve submitted.</p>
            </div>
            <Link className="recruiter-text-link" to="/recruiter/candidates">
              View all candidates <Icon name="arrow" size={16} />
            </Link>
          </div>

          <div className="recruiter-stage-counts">
            {["submitted", "under_review", "interviewing", "hired"].map((stage) => (
              <div className="recruiter-stage-count" key={stage} data-dashboard-card="interactive">
                <span className={`recruiter-stage-dot recruiter-stage-dot--${stage}`} />
                <span>{stageLabel(stage)}</span>
                <strong>{loading ? "–" : metrics[stage]}</strong>
              </div>
            ))}
          </div>

          <div className="recruiter-table-tools">
            <label className="recruiter-search">
              <Icon name="search" size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search candidates or roles"
                aria-label="Search candidates or roles"
              />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter candidates by status">
              <option value="all">All statuses</option>
              {PIPELINE_STAGES.map((stage) => <option value={stage} key={stage}>{stageLabel(stage)}</option>)}
            </select>
          </div>

          <div className="recruiter-table-wrap">
            <table className="recruiter-table">
              <thead>
                <tr><th>Candidate</th><th>Role</th><th>Submitted</th><th>Status</th><th>Commission</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="recruiter-table__empty" colSpan="6">Loading your referral pipeline…</td></tr>
                ) : filteredReferrals.length ? filteredReferrals.map((referral, index) => {
                  const status = String(referral.status || "submitted").toLowerCase();
                  const candidateName = referral.candidateName || "Unnamed candidate";
                  const initials = candidateName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
                  const referralDate = referral.createdAt ? new Date(referral.createdAt) : null;
                  const amount = getAmount(referral);
                  return (
                    <tr key={referral._id || referral.id || `${candidateName}-${index}`}>
                      <td>
                        <div className="recruiter-candidate-cell">
                          <span className={`recruiter-avatar recruiter-avatar--${index % 4}`}>{initials}</span>
                          <span><strong>{candidateName}</strong><small>{referral.candidateEmail || "Candidate referral"}</small></span>
                        </div>
                      </td>
                      <td><span className="recruiter-role-name">{referralJobTitle(referral)}</span><small className="recruiter-company">{referral.company || referral.job?.company || ""}</small></td>
                      <td>{referralDate && !Number.isNaN(referralDate.getTime()) ? referralDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                      <td><span className={`recruiter-status recruiter-status--${status}`}>{stageLabel(status)}</span></td>
                      <td className="recruiter-commission">{amount === null ? "—" : formatCurrency(amount)}</td>
                      <td><Link className="recruiter-row-action" to="/recruiter/candidates" aria-label={`View ${candidateName}`}><Icon name="chevron" size={18} /></Link></td>
                    </tr>
                  );
                }) : (
                  <tr><td className="recruiter-table__empty" colSpan="6">{referrals.length ? "No referrals match your search." : "You haven’t referred any candidates yet. Submit a candidate to start your pipeline."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="recruiter-panel recruiter-featured" id="exclusive-roles" data-dashboard-card>
          <div className="recruiter-panel__heading">
            <div>
              <span className="recruiter-eyebrow">HANDPICKED OPPORTUNITIES</span>
              <h2>Featured open roles</h2>
              <p>Explore active roles and earn by referring great talent.</p>
            </div>
            <Link className="recruiter-text-link" to="/recruiter/jobs">Browse all jobs <Icon name="arrow" size={16} /></Link>
          </div>
          {loading ? (
            <div className="recruiter-featured__empty">Loading open roles…</div>
          ) : activeJobs.length ? (
            <div className="recruiter-job-grid">
              {activeJobs.map((job) => {
                const commission = getAmount(job);
                return (
                  <article className="recruiter-job-card" key={job._id || job.id} data-dashboard-card="interactive">
                    <div className="recruiter-job-card__top">
                      <span className="recruiter-job-icon"><Icon name="briefcase" /></span>
                      <span className="recruiter-open-label"><i /> Open</span>
                    </div>
                    <h3>{job.title || "Open position"}</h3>
                    <p className="recruiter-job-company">{job.company || "Company not specified"}</p>
                    <div className="recruiter-job-meta">
                      <span><Icon name="map" size={15} />{job.location || "Location flexible"}</span>
                      {job.salary && <span>{job.salary}</span>}
                    </div>
                    <div className="recruiter-job-card__footer">
                      <span><small>Referral commission</small><strong>{commission === null ? "See role details" : formatCurrency(commission)}</strong></span>
                      <button onClick={() => setSubmitJob(job)}>Submit CV <Icon name="arrow" size={15} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="recruiter-featured__empty">
              No active roles to show right now. <Link to="/recruiter/jobs">Browse the job board</Link>
            </div>
          )}
        </section>
      </div>

      <SubmitCandidateModal
        open={!!submitJob}
        job={submitJob}
        recruiterId={submissionRecruiterId}
        onClose={() => setSubmitJob(null)}
        onSuccess={loadWorkspace}
      />
    </main>
  );
}
