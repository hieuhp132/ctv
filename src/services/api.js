export const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof window !== "undefined" &&
    window.location &&
    window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://apih.ant-tech.asia");
import axios from "axios";

console.log(API_BASE);

export async function getUsersListL() {
  const res = await fetch(`${API_BASE}/local/users`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("[Client]: Failed get local userlist");
  const users = await res.json();
  return Array.isArray(users) ? users : [];
}

export async function fetchAllJobsStrict() {
  const res = await fetch(`${API_BASE}/local/jobs`);
  if (!res.ok) throw new Error("Failed to load job openings.");
  const data = await res.json();
  if (!Array.isArray(data.jobs)) throw new Error("The jobs response was invalid.");
  return data.jobs;
}

export async function saveJobL(jobId, userId) {
  const res = await fetch(`${API_BASE}/local/jobs/${jobId}/save`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to save job locally");
  return await res.json();
}
export async function unsaveJobL(jobId, userId) {
  const res = await fetch(`${API_BASE}/local/jobs/${jobId}/unsave`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to unsave job locally");
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
  } catch { }
}

function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch { }
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

// Session helpers for Authorization
function getSession() {
  try {
    const raw = localStorage.getItem("authSession");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCurrentUser() {
  return getSession()?.user || null;
}

function authHeaders() {
  const session = getSession();
  const token = session?.token || session?.user?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminUsersRequest(path = "", options = {}) {
  const response = await fetch(`${API_BASE}/local/admin/users${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    if (response.status === 404) {
      throw new Error("User management API is not deployed on the backend yet. Deploy the latest server code and try again.");
    }
    throw new Error(`User management API returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "User management request failed");
  }
  return data;
}

export async function getAdminUsersL() {
  const data = await adminUsersRequest();
  return data.data.map((user) =>
    user.role === "recruiter" ? { ...user, role: "recruiter_freelancer" } : user
  );
}

export async function createAdminUserL(user) {
  return adminUsersRequest("", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function updateAdminUserRoleL(userId, role) {
  return adminUsersRequest(`/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function updateAdminUserStatusL(userId, status) {
  return adminUsersRequest(`/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function resetAdminUserPasswordL(userId, password) {
  return adminUsersRequest(`/${encodeURIComponent(userId)}/password`, {
    method: "PUT",
    body: JSON.stringify({ password }),
  });
}

export async function deleteAdminUserL(userId) {
  return adminUsersRequest(`/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
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

export async function createJobL(job) {
  const res = await fetch(`${API_BASE}/local/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  if (!res.ok) throw new Error("Failed to create job.");
  const created = await res.json();
  return created;
}

export async function updateJobL(updated) {
  const { _id, ...payload } = updated;
  const res = await fetch(`${API_BASE}/local/jobs/update/${_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update job.");
  const saved = await res.json();
  return saved;
}

async function employeeRequest(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  const responseText = await res.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`Recruiter workspace returned an invalid response (HTTP ${res.status}).`);
  }
  if (!res.ok) throw new Error(data.message || "Recruiter workspace request failed.");
  return data;
}

export async function createEmployeeJobL(job) {
  return employeeRequest("/local/recruiter-fulltime/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
}

export async function updateEmployeeJobL(id, updates) {
  return employeeRequest(`/local/recruiter-fulltime/jobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteJobL(id) {
  // console.log("deleteJobL called with id:", id);
  const res = await fetch(`${API_BASE}/local/jobs/${id}/remove`, {
    method: "DELETE",
  });
  if (!res.ok) return false;
  // console.log("Response ok for deleteJobL", res);
  return true;
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

export async function lregister({
  name,
  email,
  password,
  company,
  promoCode = null,
  fromSupabase,
  recruiterType = "freelancer",
}) {
  try {
    const registrationPath = recruiterType === "fulltime"
      ? "/local/register/recruiter-fulltime"
      : "/local/register";
    const res = await fetch(`${API_BASE}${registrationPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, company, promoCode, fromSupabase }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Registration failed");
    }

    // Backend trả success: true hoặc HTTP error
    return data;
  } catch (err) {
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
  isHiringManager = false,
  jobIds = [],
} = {}) {
  if (!id && !email) return [];

  if (isHiringManager) {
    const managerParams = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) managerParams.set("status", status);
    if (q) managerParams.set("q", q);
    const res = await fetch(`${API_BASE}/local/referrals/hiring-manager?${managerParams.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load the candidate pipeline.");
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  }

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
  if (jobIds.length) params.set("jobIds", jobIds.join(","));

  const res = await fetch(`${API_BASE}/local/referrals?${params.toString()}`);

  if (!res.ok) throw new Error("Failed to load the candidate pipeline.");

  const data = await res.json();
  // console.log("listReferrals data:", data);
  return Array.isArray(data.items) ? data.items : [];
}

export async function updateEmployeeReferralL(id, updates) {
  return employeeRequest(`/local/referrals/hiring-manager/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function getRecruiterDashboardStats() {
  const response = await fetch(`${API_BASE}/api/metrics/recruiter-dashboard`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`Dashboard metrics returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(data.message || "Failed to load dashboard metrics.");
  const metricFields = ["referralCredits", "toReview", "confirmedAmount", "inProgressAmount"];
  if (metricFields.some((field) => !Number.isFinite(data[field]) || data[field] < 0)) {
    throw new Error("Dashboard metrics response is missing valid values.");
  }
  return data;
}

export async function fetchAdminReferrals(adminId, email) {
  return listReferrals({
    id: adminId || email,
    email,
    isAdmin: true,
    limit: 10000,
  });
}

export async function updateReferralFieldsById(id, updates) {
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

export async function removeReferralFieldsById(id) {
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

export async function createSubmissionL(payload) {
  const bonusMatch = String(payload.bonus ?? "").match(/[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/);
  const parsedBonus = bonusMatch ? Number(bonusMatch[0].replace(/,/g, "")) : 0;
  const res = await fetch(`${API_BASE}/local/referrals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      bonus: Number.isFinite(parsedBonus) ? parsedBonus : 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.json();
}

export async function fetchSavedJobsL(userId) {
  const res = await fetch(`${API_BASE}/local/jobs?savedBy=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch saved jobs from local");
  return await res.json();
}

export async function updateBasicInfoOnServerL(userId, basicInfo) {
  if (!userId) return { success: false, error: "User ID is required" };

  try {
    const res = await fetch(
      `${API_BASE}/local/users/updateBasicInfo/${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(basicInfo),
      },
    );

    if (!res.ok) {
      const errorBody = await res
        .json()
        .catch(() => ({ message: "Failed to update basic info" }));
      throw new Error(errorBody.message);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("updateBasicInfoOnServerL error:", err);
    return { success: false, error: err.message };
  }
}

export async function fetchProfileFromServerL(userId) {
  if (!userId) return null;

  try {
    const res = await fetch(`${API_BASE}/local/users/profile/${userId}`);

    if (!res.ok) return null;

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchProfileFromServerL error:", err);
    return null;
  }
}

export async function uploadFile(file) {
  try {
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(`${API_BASE}/spb/upload`, {
      method: "POST", // Specify POST method for uploading
      body: form, // Send FormData object as request body
      // IMPORTANT: Do NOT manually set Content-Type header for FormData
    });

    if (!response.ok) {
      let errMsg = "";
      try {
        const errJson = await response.json();
        errMsg = errJson?.error || JSON.stringify(errJson);
      } catch (_) {
        errMsg = await response.text();
      }

      console.error("UPLOAD ERROR:", errMsg); // ✅ thêm dòng này
      throw new Error(errMsg); // ✅ đừng return null
    }

    const data = await response.json(); // Parse JSON response

    return data; // Return response data for further use
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
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
    const PUBLIC_JD_PATH = "storage/v1/object/public/files";

    const SUPABASE_STORAGE_PUBLIC_URL = `${SUPABASE_URL}/${PUBLIC_JD_PATH}`;

    // Map files to include publicUrl
    const filesWithUrls = data.files.map((file) => {
      return {
        ...file,
        // Construct publicUrl using your base URL + file name
        publicUrl: `${SUPABASE_STORAGE_PUBLIC_URL}/${encodeURIComponent(file.name)}`,
      };
    });

    return filesWithUrls;
  } catch (error) {
    throw error;
  }
}

export async function resetPasswordL({ email, newPassword }) {
  try {
    const res = await fetch(`${API_BASE}/local/users/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        newPassword,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Reset failed");

    return data;
  } catch (e) {
    console.error("resetPasswordL error:", e.message);
    throw e;
  }
}

export async function removeUserByIdL({ id }) {
  try {
    const res = await fetch(`${API_BASE}/local/users/${id}/remove`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || "Failed to delete user locally");

    return data;
  } catch (e) {
    console.error("removeUserByIdL error:", e.message);
    throw e;
  }
}

export async function updateUserStatusL({ userId, newStatus }) {
  try {
    const res = await fetch(`${API_BASE}/local/users/update-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Nếu bạn có dùng JWT để bảo mật route admin, hãy thêm dòng dưới:
        // "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ userId, newStatus }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update status");
    }

    return data; // Trả về kết quả thành công { success: true, message: ..., user: ... }
  } catch (err) {
    console.error("updateUserStatusL error:", err);
    throw err;
  }
}

export async function getUserStatusL(email) {
  try {
    const res = await fetch(
      `${API_BASE}/local/user-status?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    return data; // Trả về { success: true, status: "..." }
  } catch (err) {
    throw err;
  }
}



export async function fetchConversations() {
  try {
    const res = await fetch(`${API_BASE}/api/messaging/conversations`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    return data;
  } catch (err) {
    throw err;
  }
}

export async function fetchMessages(conversationId) {
  try {
    const res = await fetch(
      `${API_BASE}/api/messaging/conversations/${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  } catch (err) {
    throw err;
  }
}

export async function fetchNotifications() {
  try {
    const res = await fetch(`${API_BASE}/api/messaging/notifications`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  } catch (err) {
    throw err;
  }
}
export async function sendMessage(conversationId, message, finalRecipientId) {
  try {
    const res = await fetch(`${API_BASE}/api/messaging/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        conversationId,
        content: message,
        recipientId: finalRecipientId, // ✅ fixed typo
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to send message");
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export async function getUnreadMessages() {
  try {
    const res = await fetch(`${API_BASE}/api/messaging/unread-count/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  } catch (err) {
    throw err;
  }
}

export async function markMessagesAsRead(messageIds) {
  if (!messageIds || messageIds.length === 0) return;

  // 🔑 chỉ cần 1 messageId bất kỳ
  const firstMessageId = messageIds[0];

  const res = await fetch(
    `${API_BASE}/api/messaging/messages/read/${firstMessageId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to mark messages as read");
  return data;
}


export async function deleteConversation(conversationId) {
  try {
    const res = await fetch(`${API_BASE}/api/messaging/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete conversation");
    return data;
  } catch (err) {
    throw err;
  }
}