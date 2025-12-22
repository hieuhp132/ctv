export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
  || (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://apih.ant-tech.asia');
import axios from 'axios';  


console.log(API_BASE);

export async function getUsersList() {

  const headers = {'Content-Type':'application/json'};
  const res = await fetch(`${API_BASE}/db/users`, {
    method: 'GET',
    headers,
  })
  if(!res.ok) throw new Error('[Client]: Failed get userlist');
  return await res.json(); 
}

// Save job for user
// Unsave job for user
export async function unsaveJob(jobId, userId) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/unsave`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Failed to unsave job');
  return await res.json();
}
export async function saveJob(jobId, userId) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/save`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ userId })
  });
  if (!res.ok) {
    throw new Error('Failed to save job');
  }
  return await res.json();
}
// src/api.js

export async function saveJobL(jobId, userId) {
  const res = await fetch(`${API_BASE}/local/jobs/${jobId}/save`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Failed to save job locally');
  return await res.json();
}
export async function unsaveJobL(jobId, userId) {
  const res = await fetch(`${API_BASE}/local/jobs/${jobId}/unsave`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Failed to unsave job locally');
  return await res.json();
}

const LS_SUBMISSIONS = "submissions"; // active
const LS_ARCHIVED = "submissionsArchived"; // finalized (onboard/Rejected)
const LS_NOTIFICATIONS = "notifications";
const LS_BALANCES = "balances"; // { adminCredit: number, ctvBonusById: { [id:string]: number } }
const LS_JOBS = "jobs";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function removeKey(key) {
  try { localStorage.removeItem(key); } catch {}
}

function nowId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function parseAmount(input) {
  if (input == null) return 0;
  if (typeof input === "number") return input;
  const num = String(input).replace(/[^0-9.-]/g, "");
  const n = parseFloat(num);
  return Number.isFinite(n) ? n : 0;
}

// Balances API
export async function getBalances() {
  const res = await fetch(`${API_BASE}/api/metrics/balances`, { headers: { ...authHeaders() } });
  if (!res.ok) return { adminCredit: 5000, ctvBonusById: {} };
  const b = await res.json();
  if (typeof b.adminCredit !== "number") b.adminCredit = parseAmount(b.adminCredit);
  if (!b.ctvBonusById || typeof b.ctvBonusById !== "object") b.ctvBonusById = {};
  return b;
}

export function setBalances(next) { /* no-op: server computed */ }

export function resetDemoData() {
  removeKey(LS_SUBMISSIONS);
  removeKey(LS_ARCHIVED);
  removeKey(LS_NOTIFICATIONS);
  removeKey(LS_JOBS);
  writeJson(LS_BALANCES, { adminCredit: 5000, ctvBonusById: {} });
}

function addBonusForCTV(ctvId, amount) {
  if (!ctvId || !amount) return;
  const bal = getBalances();
  bal.ctvBonusById[ctvId] = parseAmount(bal.ctvBonusById[ctvId]) + parseAmount(amount);
  bal.adminCredit = parseAmount(bal.adminCredit) - parseAmount(amount);
  setBalances(bal);
}

// Session helpers for Authorization
function getSession() {
  try {
    const raw = sessionStorage.getItem("authSession");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCurrentUser() {
  return getSession()?.user || null;
}

function authHeaders() {
  const token = getCurrentUser()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}



function mapJobFromServer(j) {
  return {
    id: j._id || j.id || `unknown-${Math.random().toString(36).substr(2, 9)}`,
    title: j.title,
    company: j.company,
    location: j.location,
    salary: j.salary || 'N/A',
    bonus: j.bonus,
    deadline: j.deadline ? String(j.deadline).slice(0, 10) : "",
    jdFileName: j.jdFileName || "",
    jdUrl: j.jdUrl || "",
    jdLink: j.jdLink || "",
    keywords: j.keywords || [],
    vacancies: j.vacancies || 0,
    applicants: j.applicants || 0,
    onlineDaysAgo: j.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(j.createdAt)) / (1000 * 60 * 60 * 24))) : 0,
    rewardCandidateUSD: j.rewardCandidateUSD || 0,
    rewardInterviewUSD: j.rewardInterviewUSD || 0,
    status: j.status || "Active",
    description: j.jobsdetail?.description || j.description || "",
    requirements: j.jobsdetail?.requirement || j.requirements || "",
    benefits: j.jobsdetail?.benefits || j.benefits || "",
    other: j.other || "",
  };
}

// Jobs
export async function fetchJobs({ page = 1, limit = 1000, q = "" } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (q) params.set("q", q);

  try {
    const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`, {
      headers: { ...authHeaders() },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(mapJobFromServer);
  } catch (error) {
    return [];
  }
}

export async function fetchAllJobs(limit) {
  try {
    const res = await fetch(`${API_BASE}/local/jobs`);
    if (!res.ok) return [];

    let data = await res.json();
    if (limit) data = data.jobs.slice(0, limit); // limit here
    return data;
  } catch (error) {
    return [];
  }
}


export async function getJobById(id) {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`);
  if (!res.ok) return null;
  const j = await res.json();
  return mapJobFromServer(j);
}

export async function getJobByIdL(id) {
  const res = await fetch(`${API_BASE}/local/job/${id}`);
  if (!res.ok) return null;
  const j = await res.json();
  return j;
}

export async function createJob(job) {
  const body = {
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary || "N/A", // Ensure salary is sent
    bonus: job.bonus,
    deadline: job.deadline,
    rewardCandidateUSD: job.rewardCandidateUSD,
    rewardInterviewUSD: job.rewardInterviewUSD,
    vacancies: job.vacancies,
    applicants: job.applicants,
    status: job.status,
    jobsdetail: {
      description: job.description || "",
      requirement: job.requirements || "",
      benefits: job.benefits || "",
    },
    other: job.other || "",
    keywords: job.keywords || [],
  };
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  const created = await res.json();
  const mapped = mapJobFromServer(created);
  await pushNotification({ role: "CTV", message: `New job: ${mapped.title}` });
  return mapped;
}

export async function updateJob(updated) {
  const body = {
    title: updated.title,
    company: updated.company,
    location: updated.location,
    salary: updated.salary || "N/A", // Ensure salary is sent
    bonus: updated.bonus,
    deadline: updated.deadline,
    rewardCandidateUSD: updated.rewardCandidateUSD,
    rewardInterviewUSD: updated.rewardInterviewUSD,
    vacancies: updated.vacancies,
    applicants: updated.applicants,
    status: updated.status,
    jobsdetail: {
      description: updated.description || "",
      requirement: updated.requirements || "",
      benefits: updated.benefits || "",
    },
    other: updated.other || "",
    keywords: updated.keywords || [],
  };
  const res = await fetch(`${API_BASE}/api/jobs/${updated.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  const saved = await res.json();
  const mapped = mapJobFromServer(saved);
  // await pushNotification({ role: "CTV", message: `Job updated: ${mapped.title}` });
  return mapped;
}

export async function createJobL(job) {
  console.log("createJobL called with:", job);
  const res = await fetch(`${API_BASE}/local/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  const created = await res.json();
  console.log("createJobL created:", created);
  return created;
}

export async function updateJobL(updated) {
  console.log("updateJobL called with:", updated);
  const { _id, ...payload } = updated;
  const res = await fetch(`${API_BASE}/local/jobs/update/${_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const saved = await res.json();
  console.log("updateJobL saved:", saved);
  return saved;
} 

export async function deleteJob(id) {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) return false;
  await pushNotification({ role: "CTV", message: `Job deleted: ${id}` });
  await pushNotification({ role: "admin", message: `You deleted job ${id}` });
  return true;
}

export async function deleteJobL(id) {
  console.log("deleteJobL called with id:", id);
  const res = await fetch(`${API_BASE}/local/jobs/${id}/remove`, {
    method: "DELETE",
  });
  if (!res.ok) return false;
  console.log("Response ok for deleteJobL", res);
  return true;
}

// Auth mocks
// export async function login(email, password) { return { token: "fake-token", user: { email } }; }
// export async function signup(email, password) { return { token: "fake-token", user: { email } }; }

export async function apiLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/db/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    // API trả về user + token
    return {
      user: data.user,
      token: data.token, // maybe access_token or both tokens
    };

  } catch (err) {
    console.error("API login() error:", err);
    throw err;
  }
}

export async function llogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/local/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      // Backend trả success: false hoặc HTTP error
      throw new Error(data.message || "Login failed");
    }

    // user object đã có token bên backend
    return {
      user: data.user,
      token: data.user.token,
    };
  } catch (err) {
    console.error("API login() error:", err);
    throw err;
  }
}

export async function signup({ name, email, password, promoCode = null, fromSupabase }) {
  try {
    const res = await fetch(`${API_BASE}/db/users/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        promoCode,
        fromSupabase
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed");
    }

    // Backend signup thường không gửi token / user → chỉ trả success
    return data;
  } catch (err) {
    console.error("API signup() error:", err);
    throw err;
  }
}

export async function lregister({ name, email, password, promoCode = null, fromSupabase }) {
  try {
    const res = await fetch(`${API_BASE}/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, promoCode, fromSupabase }),
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Registration failed");
    }

    // Backend trả success: true hoặc HTTP error
    return data;
  }

  catch (err) {
    console.error("API register() error:", err);
    throw err;
  }
}

// Submissions API (CTV -> Admin)
function mapReferralToClient(r) {
  return {
    id: r._id || r.id,
    candidate: r.candidateName,
    job: (r.job && (r.job.title || r.job)) || r.jobTitle || "",
    jobId: r.job?._id || r.job,
    ctv: r.recruiter?.email || r.recruiter || "CTV",
    status: (r.status || "submitted").replace(/^./, (c) => c.toUpperCase()),
    bonus: r.bonus ?? "-",
    cv: r.cvFileName || null,
    cvUrl: r.cvUrl || null,
    linkedin: r.linkedin || null,
    email: r.candidateEmail || null,
    phone: r.candidatePhone || null,
    portfolio: r.portfolio || null,
    suitability: r.suitability || null,
    createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
    finalizedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : undefined,
  };
}

export async function listSubmissions({ page = 1, limit = 1000, status, jobId, q } = {}) {
  const user = getCurrentUser();
  if (!user) return [];
  const path = user.role === "admin" ? "/api/referrals" : "/api/referrals/mine";
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (status) params.set("status", String(status).toLowerCase());
  if (jobId) params.set("jobId", String(jobId));
  if (q) params.set("q", q);
  const res = await fetch(`${API_BASE}${path}?${params.toString()}`, { headers: { ...authHeaders() } });
  if (!res.ok) return [];
  const data = await res.json();
  const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const items = list.map(mapReferralToClient);
  // active = not finalized statuses
  const finals = ["onboard", "Rejected"];
  return items.filter((s) => !finals.includes(s.status));
}

export async function listReferrals({
  id,
  email,
  isAdmin = false,
  page = 1,
  limit = 1000,
  status,
  jobId,
  q,
  finalized,
} = {}) {
  if (!id && !email) return [];

  const params = new URLSearchParams({
    isAdmin: String(isAdmin),
    page,
    limit,
  });

  if (id) params.set("id", id);
  if (email) params.set("email", email);

  if (status) params.set("status", status);
  if (jobId) params.set("jobId", jobId);
  if (q) params.set("q", q);
  if (finalized !== undefined) {
    params.set("finalized", String(finalized));
  }

  const res = await fetch(
    `${API_BASE}/local/referrals?${params.toString()}`
  );

  if (!res.ok) return [];

  const data = await res.json();
  console.log("listReferrals data:", data);
  return Array.isArray(data.items) ? data.items : [];
}

export async function updateReferralFields(id, updates) {
  const res = await fetch(`${API_BASE}/local/referrals/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to update referral: ${txt}`);
  }

  return res.json();
}

export async function removeReferralFields(id) {
  const res = await fetch(`${API_BASE}/local/referrals/${id}/remove`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to remove referral: ${txt}`);
  }
  return true;
}

export async function listArchivedSubmissions(opts = {}) {
  const user = getCurrentUser();
  if (!user) return [];

  const path = user.role === "admin" ? "/api/referrals" : "/api/referrals/mine";
  const url = `${API_BASE}${path}?finalized=true`;

  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) return [];

  const data = await res.json();
  const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return list.map(mapReferralToClient);
}


export async function createSubmission({ candidateName, jobId, jobTitle, ctvId, email, phone, linkedin, portfolio, suitability, cvFile, bonus }) {
  const form = new FormData();
  form.append("jobId", jobId);
  form.append("candidateName", candidateName);
  if (email) form.append("email", email);
  if (phone) form.append("phone", phone);
  if (linkedin) form.append("linkedin", linkedin);
  if (portfolio) form.append("portfolio", portfolio);
  if (suitability) form.append("suitability", suitability);
  if (typeof bonus !== 'undefined') form.append("bonus", String(bonus));
  if (cvFile) form.append("cv", cvFile);
  const res = await fetch(`${API_BASE}/api/referrals`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form,
  });
  if (!res.ok) {
    alert("Failed to submit candidate v1");
    throw new Error("Failed to submit candidate");
  }
  const r = await res.json();
  const item = mapReferralToClient(r);
  return item;
}

export async function createSubmissionL(payload) {
  const res = await fetch(`${API_BASE}/local/referrals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.json();
}



export async function updateSubmissionStatus({ id, status, bonus }) {
  const body = {};
  if (status) body.status = String(status).toLowerCase();

  if (bonus != null) {
    body.bonus =
      typeof bonus === "number" ? bonus : parseFloat(String(bonus).replace(/[, ]/g, ""));
  }

  const res = await fetch(`${API_BASE}/api/referrals/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to update submission status: ${txt}`);
  }

  return res.json();
}




export async function finalizeSubmission({ referralId }) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/referrals/${referralId}/finalize`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({}) // Empty body for this request
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: 'Failed to finalize submission' }));
    throw new Error(errorBody.message);
  }
  return await res.json();
}

// Notifications API
export async function listNotifications(role = "all") {
  const res = await fetch(`${API_BASE}/api/notifications?role=${encodeURIComponent(role)}`, { headers: { ...authHeaders() } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((n) => ({ id: n._id || n.id, role: n.role, message: n.message, createdAt: new Date(n.createdAt).getTime() }));
}
export async function pushNotification({ role = "all", message }) {
  const res = await fetch(`${API_BASE}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role, message })
  });
  if (!res.ok) return null;
  const n = await res.json();
  return { id: n._id || n.id, role: n.role, message: n.message, createdAt: new Date(n.createdAt).getTime() };
}

// Legacy placeholders for compatibility
export async function fetchCandidates() {
  const subs = await listSubmissions();
  return subs.map((s) => ({ id: s.id, name: s.candidate, jobTitle: s.job, status: s.status, bonus: s.bonus || "-" }));
}

export async function submitCandidate({ name, jobId, linkedin, cv, ctvId, bonus }) {
  const formData = new FormData();
  formData.append("candidateName", name);
  formData.append("jobId", jobId);
  formData.append("linkedin", linkedin);
  formData.append("cvFile", cv);
  formData.append("ctvId", ctvId);
  formData.append("bonus", bonus);

  const res = await fetch(`${API_BASE}/api/submissions`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to submit candidate");
  return await res.json();
}

export async function fetchSavedJobs(userId) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/jobs?savedBy=${userId}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch saved jobs');
  return await res.json();
}

export async function fetchSavedJobsL(userId) {
  const res = await fetch(`${API_BASE}/local/jobs?savedBy=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch saved jobs from local');
  return await res.json();
}

// Update referral fields
export async function updateReferralFields(referralId, updates) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/referrals/${referralId}/fields`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    throw new Error('Failed to update referral fields');
  }
  return await res.json();
}

export async function updateBasicInfoOnServer(basicInfo) {
  try {

    const headers = { 'Content-Type': 'application/json', ...authHeaders() };
    const response = await fetch(`${API_BASE}/api/auth/user/updateBasicInfo`, {
      method: "PUT",
      headers,
      body: JSON.stringify(basicInfo),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateBasicInfoOnServerL(userId, basicInfo) {
  if (!userId) return { success: false, error: 'User ID is required' };

  try {
    const res = await fetch(`${API_BASE}/local/users/updateBasicInfo/${userId}`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basicInfo),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ message: 'Failed to update basic info' }));
      throw new Error(errorBody.message);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("updateBasicInfoOnServerL error:", err);
    return { success: false, error: err.message };
  }
}

export async function fetchProfileFromServer() {
  try {
    const headers = { 'Content-Type': 'application/json', ...authHeaders() };
    const response = await fetch(`${API_BASE}/api/auth/user/profile`, { headers });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

export async function fetchProfileFromServerL(userId) {
  if (!userId) return null;

  try {
    const res = await fetch(
      `${API_BASE}/local/users/profile/${userId}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchProfileFromServerL error:", err);
    return null;
  }
}


export async function removeCandidateById(id) {
  try {
    const headers = { 'Content-Type': 'application/json', ...authHeaders() };
    const response = await fetch(`${API_BASE}/api/referrals/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to delete candidate' }));
      throw new Error(errorBody.message);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }

}

export async function uploadFile(file) {
  try {
    const form = new FormData();
    form.append('file', file);

    const response = await fetch(`${API_BASE}/spb/upload`, {
      method: 'POST',        // Specify POST method for uploading
      body: form,            // Send FormData object as request body
      // IMPORTANT: Do NOT manually set Content-Type header for FormData
    });


    if (!response.ok) {
      let errMsg = '';
      try {
        const errJson = await response.json();
        errMsg = errJson?.error || JSON.stringify(errJson);
      } catch (_) {
        errMsg = await response.text();
      }

      return null;
    }
    const data = await response.json();  // Parse JSON response


    return data;  // Return response data for further use

  } catch (error) {
    return null;
  }
}


export async function getListFiles() {
  try {
    const response = await axios.get(`${API_BASE}/spb/list`);

    if (response.status !== 200) {
      throw new Error("Failed to fetch files list on supabase");
    }

    const data = response.data;

    if (!data || !Array.isArray(data.files)) {
      throw new Error("Invalid files list response");
    }

    // Assuming your Supabase Storage public base URL looks like this:
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
    const PUBLIC_JD_PATH = "storage/v1/object/public/files";

    const SUPABASE_STORAGE_PUBLIC_URL = `${SUPABASE_URL}/${PUBLIC_JD_PATH}`;


    // Map files to include publicUrl
    const filesWithUrls = data.files.map((file) => {
      return {
        ...file,
        // Construct publicUrl using your base URL + file name
        publicUrl: `${SUPABASE_STORAGE_PUBLIC_URL}/${encodeURIComponent(file.name)}`
      };
    });

    return filesWithUrls;
  } catch (error) {
    throw error;
  }
}


// updateJobJD: patch JD info (jdLink, jdFileName, clearFile) for a job by ID
export async function updateJobJD(id, { jdLink, jdFileName, clearFile } = {}) {
  try {
    const payload = {};
    if (jdLink !== undefined) payload.jdLink = jdLink;
    if (jdFileName !== undefined) payload.jdFileName = jdFileName;
    if (clearFile !== undefined) payload.clearFile = clearFile;

    const headers = { 'Content-Type': 'application/json', ...authHeaders() };
    const response = await axios.patch(`${API_BASE}/api/jobs/${id}/jd`, payload, {headers});

    return response.data; // updated job object
  } catch (error) {
    throw error;
  }
}

export async function resetPassword({email, password}) {
  try {
    const res = await fetch(`${API_BASE}/db/users/resetPassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password }),
    });

    if (!res.ok) throw new Error(data.message || "Reset failed");
    const data = await res.json();
    return data;
  } catch (err) {
  }
}

export async function removeUserById({ id }) {
  try {
    const res = await fetch(`${API_BASE}/db/user/${id}/remove`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete user");

    return data;
  } catch (e) {
    console.error("removeUserById error:", e.message);
    throw e;
  }
}
