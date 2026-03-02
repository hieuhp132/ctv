import React, { useEffect, useMemo, useState } from "react";
import "./Candidates.css";
import {
  updateReferralFieldsById,
  listReferrals,
  removeReferralFieldsById,
  getJobByIdL,
  fetchProfileFromServerL,
} from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ================= CONSTANTS ================= */
const STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "interviewing",
  "offer",
  "hired",
  "onboard",
  "rejected",
];
const PAGE_SIZE = 10;

/* ================= HELPERS ================= */
const paginate = (data, page) =>
  data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

// Track downloaded CVs to support incremental downloads
const STORAGE_KEY_DOWNLOADED = "downloadedCVs_v1";
function readDownloadedMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOWNLOADED);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeDownloadedMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY_DOWNLOADED, JSON.stringify(map));
  } catch {}
}

/* ================= DEBOUNCE ================= */
function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ================= FILTER UI ================= */
const FilterUI = React.memo(({ filters, onChange }) => (
  <div className="filter-container">
    <input
      placeholder="Candidate"
      value={filters.candidateName}
      onChange={(e) => onChange("candidateName", e.target.value)}
    />
    <input
      placeholder="Job"
      value={filters.job}
      onChange={(e) => onChange("job", e.target.value)}
    />
    <input
      placeholder="CTV"
      value={filters.recruiter}
      onChange={(e) => onChange("recruiter", e.target.value)}
    />
    <input
      placeholder="Email"
      value={filters.candidateEmail}
      onChange={(e) => onChange("candidateEmail", e.target.value)}
    />
    <select
      value={filters.status}
      onChange={(e) => onChange("status", e.target.value)}
    >
      <option value="">All Status</option>
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  </div>
));

/* ================= MAIN ================= */
export default function CandidateManagement() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    candidateName: "",
    job: "",
    recruiter: "",
    candidateEmail: "",
    status: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });
  const [activePage, setActivePage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const [jobMap, setJobMap] = useState({});
  const [recruiterMap, setRecruiterMap] = useState({});
  const [localStatuses, setLocalStatuses] = useState({});
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipAdded, setZipAdded] = useState(0);
  const [zipTotal, setZipTotal] = useState(0);
  const [downloadedMap, setDownloadedMap] = useState({});

  useEffect(() => {
    setDownloadedMap(readDownloadedMap());
  }, []);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!adminId) return;

    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 }).then(
      async (res = []) => {
        setRows(res);

        const statusMap = {};
        const jobIds = new Set();
        const recruiterIds = new Set();

        res.forEach((r) => {
          statusMap[r._id] = r.status;
          if (r.job) jobIds.add(r.job);
          if (r.recruiter) recruiterIds.add(r.recruiter);
        });

        setLocalStatuses(statusMap);

        jobIds.forEach(async (jobId) => {
          if (jobMap[jobId]) return;
          try {
            const res = await getJobByIdL(jobId);
            setJobMap((p) => ({ ...p, [jobId]: res?.job || null }));
          } catch {
            setJobMap((p) => ({ ...p, [jobId]: null }));
          }
        });

        recruiterIds.forEach(async (uid) => {
          if (recruiterMap[uid]) return;
          try {
            const user = await fetchProfileFromServerL(uid);
            setRecruiterMap((p) => ({ ...p, [uid]: user }));
          } catch {
            setRecruiterMap((p) => ({
              ...p,
              [uid]: { email: "Unknown User" },
            }));
          }
        });
      },
    );
  }, [adminId, email]);

  /* ================= RESET PAGE ================= */
  useEffect(() => {
    setActivePage(1);
    setRejectedPage(1);
  }, [filters]);

  /* ================= DEBOUNCE FILTERS ================= */
  const debouncedFilters = {
    candidateName: useDebounce(filters.candidateName),
    job: useDebounce(filters.job),
    recruiter: useDebounce(filters.recruiter),
    candidateEmail: useDebounce(filters.candidateEmail),
    status: filters.status,
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        Object.entries(debouncedFilters).every(([k, v]) =>
          v
            ? String(r[k] || "")
                .toLowerCase()
                .includes(String(v).toLowerCase())
            : true,
        ),
      ),
    [rows, debouncedFilters],
  );

  /* ================= SORT (FIXED) ================= */
  const sorted = useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key) return filtered;

    return [...filtered].sort((a, b) => {
      let av = "";
      let bv = "";

      if (key === "updatedAt") {
        av = new Date(a.updatedAt || a.createdAt).getTime();
        bv = new Date(b.updatedAt || b.createdAt).getTime();
      } else if (key === "recruiter") {
        av = recruiterMap[a.recruiter]?.email || "";
        bv = recruiterMap[b.recruiter]?.email || "";
      } else if (key === "job") {
        av = jobMap[a.job]?.title || "";
        bv = jobMap[b.job]?.title || "";
      } else {
        av = a[key] ?? "";
        bv = b[key] ?? "";
      }

      if (!isNaN(av) && !isNaN(bv)) {
        return direction === "asc" ? av - bv : bv - av;
      }

      return direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortConfig, recruiterMap, jobMap]);

  const activeRows = sorted.filter((r) => r.status !== "rejected");
  const rejectedRows = sorted.filter((r) => r.status === "rejected");

  const activePaged = paginate(activeRows, activePage);
  const rejectedPaged = paginate(rejectedRows, rejectedPage);

  // New CVs since last download
  const newCvItems = useMemo(() => {
    return sorted.filter((r) => {
      if (!r.cvUrl) return false;
      const saved = downloadedMap[r._id];
      if (!saved) return true;
      if (saved.cvUrl !== r.cvUrl) return true;
      const savedTime = saved.updatedAt ? new Date(saved.updatedAt).getTime() : 0;
      const currentTime = new Date(r.updatedAt || r.createdAt || Date.now()).getTime();
      return currentTime > savedTime;
    });
  }, [sorted, downloadedMap]);

  const markDownloaded = (items) => {
    const next = { ...downloadedMap };
    items.forEach((r) => {
      next[r._id] = {
        cvUrl: r.cvUrl,
        updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
      };
    });
    setDownloadedMap(next);
    writeDownloadedMap(next);
  };

  /* ================= SORT UI ================= */
  const toggleSort = (key) => {
    setSortConfig((p) => {
      if (p.key !== key) return { key, direction: "asc" };
      if (p.direction === "asc") return { key, direction: "desc" };
      return { key: "updatedAt", direction: "desc" };
    });
  };

  const sortIcon = (key) =>
    sortConfig.key !== key ? "⇅" : sortConfig.direction === "asc" ? "↑" : "↓";

  /* ================= STATUS ================= */
  const handleStatusChange = (id, value) =>
    setLocalStatuses((p) => ({ ...p, [id]: value }));

  const handleUpdate = async (id) => {
    if (!window.confirm("Update candidate status?")) return;

    const newStatus = localStatuses[id];
    const now = new Date().toISOString();

    await updateReferralFieldsById(id, { status: newStatus });

    setRows((p) =>
      p.map((r) =>
        r._id === id ? { ...r, status: newStatus, updatedAt: now } : r,
      ),
    );
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove candidate?")) return;
    await removeReferralFieldsById(id);
    setRows((p) => p.filter((r) => r._id !== id));
  };

  const downloadCV = async (r) => {
    const url = r.cvUrl;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const path = url.split("?")[0];
      const urlName = decodeURIComponent(path.split("/").pop() || "");
      const extFromUrl = urlName.includes(".") ? urlName.split(".").pop() : "";
      const ext = extFromUrl || (blob.type === "application/pdf" ? "pdf" : "dat");
      const safeCandidate = String(r.candidateName || "candidate").replace(/[^a-z0-9]+/gi, "_").slice(0, 32);
      const safeJob = String(jobMap[r.job]?.title || "job").replace(/[^a-z0-9]+/gi, "_").slice(0, 32);
      const filename = `${safeCandidate}_${safeJob}.${ext}`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      markDownloaded([r]);
    } catch (e) {
      alert("Download failed");
    }
  };

  const downloadAllCVs = async () => {
    try {
      const items = sorted.filter((r) => r.cvUrl);
      if (!items.length) {
        alert("Không có CV để tải");
        return;
      }
      setZipping(true);
      setZipProgress(0);
      setZipAdded(0);
      setZipTotal(items.length);
      const { default: JSZip } = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm");
      const zip = new JSZip();
      let added = 0;
      for (let i = 0; i < items.length; i++) {
        const r = items[i];
        try {
          const res = await fetch(r.cvUrl);
          const blob = await res.blob();
          const path = r.cvUrl.split("?")[0];
          const urlName = decodeURIComponent(path.split("/").pop() || "");
          const extFromUrl = urlName.includes(".") ? urlName.split(".").pop() : "";
          const ext = extFromUrl || (blob.type === "application/pdf" ? "pdf" : "dat");
          const safeCandidate = String(r.candidateName || "candidate").replace(/[^a-z0-9]+/gi, "_").slice(0, 32);
          const safeJob = String(jobMap[r.job]?.title || "job").replace(/[^a-z0-9]+/gi, "_").slice(0, 32);
          const filename = `${safeCandidate}_${safeJob}_${i + 1}.${ext}`;
          zip.file(filename, blob);
          added++;
          setZipAdded(added);
        } catch {}
      }
      if (!added) {
        alert("Không có CV hợp lệ để nén");
        setZipping(false);
        return;
      }
      const blobZip = await zip.generateAsync({ type: "blob" }, (meta) => {
        setZipProgress(Math.floor(meta.percent || 0));
      });
      const fileName = `cvs_${new Date().toISOString().slice(0, 10)}.zip`;
      let ok = false;
      try {
        saveAs(blobZip, fileName);
        ok = true;
      } catch {}
      if (!ok) {
        try {
          const url = URL.createObjectURL(blobZip);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          ok = true;
        } catch {}
      }
      if (!ok) {
        alert("Không thể tải file ZIP");
      }
      // mark all as downloaded
      markDownloaded(items);
      setZipProgress(100);
      setZipping(false);
    } catch (e) {
      alert("Không thể tạo file ZIP");
      setZipping(false);
    }
  };

  const downloadNewCVs = async () => {
    try {
      const items = newCvItems;
      if (!items.length) {
        alert("Không có CV mới");
        return;
      }
      setZipping(true);
      setZipProgress(0);
      setZipAdded(0);
      setZipTotal(items.length);
      const { default: JSZip } = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm");
      const zip = new JSZip();
      let added = 0;
      for (let i = 0; i < items.length; i++) {
        const r = items[i];
        try {
          const res = await fetch(r.cvUrl);
          const blob = await res.blob();
          const path = r.cvUrl.split("?")[0];
          const urlName = decodeURIComponent(path.split("/").pop() || "");
          const extFromUrl = urlName.includes(".") ? urlName.split(".").pop() : "";
          const ext = extFromUrl || (blob.type === "application/pdf" ? "pdf" : "dat");
          const safeCandidate = String(r.candidateName || "candidate").replace(/[^a-z0-9]+/gi, "_").slice(0, 32);
          const safeJob = String(jobMap[r.job]?.title || "job").replace(/[^a-z0-9]+/gi, "_").slice(0, 32);
          const filename = `${safeCandidate}_${safeJob}_${i + 1}.${ext}`;
          zip.file(filename, blob);
          added++;
          setZipAdded(added);
        } catch {}
      }
      if (!added) {
        alert("Không có CV hợp lệ để nén");
        setZipping(false);
        return;
      }
      const blobZip = await zip.generateAsync({ type: "blob" }, (meta) => {
        setZipProgress(Math.floor(meta.percent || 0));
      });
      const fileName = `cvs_new_${new Date().toISOString().slice(0, 10)}.zip`;
      try {
        saveAs(blobZip, fileName);
      } catch {
        const url = URL.createObjectURL(blobZip);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      // mark new ones as downloaded
      markDownloaded(items);
      setZipProgress(100);
      setZipping(false);
    } catch (e) {
      alert("Không thể tạo file ZIP");
      setZipping(false);
    }
  };

  /* ================= TABLE ================= */
  const renderTable = (title, data, page, setPage, total) => (
    <section className="table-section">
      <h3>{title}</h3>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("candidateName")}>
                Name {sortIcon("candidateName")}
              </th>
              <th onClick={() => toggleSort("job")}>Job {sortIcon("job")}</th>
              <th onClick={() => toggleSort("recruiter")}>
                CTV {sortIcon("recruiter")}
              </th>
              <th>Email</th>
              <th>CV</th>
              <th>Linkedln</th>
              <th>Portfolio</th>
              <th>Status</th>
              <th onClick={() => toggleSort("updatedAt")}>
                Time {sortIcon("updatedAt")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id}>
                <td>{r.candidateName}</td>
                <td>{jobMap[r.job]?.title || "Unknown Job"}</td>
                <td>
                  {recruiterMap[r.recruiter]?.email ||
                    r.recruiter ||
                    "Unknown User"}
                </td>
                <td>{r.candidateEmail || "-"}</td>
                <td>
                  {r.cvUrl ? (
                    <span>
                      <a href={r.cvUrl} target="_blank" rel="noopener noreferrer">View</a>
                      {" "}|{" "}
                      <button style={{background:"transparent", color:"black", padding:0}} onClick={() => downloadCV(r)}>
                        Download
                      </button>
                    </span>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  <a href={r.linkedin}>Link</a>
                </td>
                <td>
                  <a href={r.portfolio}>Link</a>
                </td>
                <td>
                  <select
                    value={localStatuses[r._id] || r.status}
                    onChange={(e) => handleStatusChange(r._id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {new Date(r.updatedAt || r.createdAt).toLocaleString("vi-VN")}
                </td>
                <td>
                  <button onClick={() => handleUpdate(r._id)}>Update</button>
                  <button onClick={() => handleRemove(r._id)}>Remove</button>
                </td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan="7">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {Math.ceil(total / PAGE_SIZE) || 1}
        </span>
        <button
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );

  const handleExportExcel = () => {
    if (!rows.length) {
      alert("No data to export");
      return;
    }

    const exportData = rows.map((r) => ({
      "Candidate Name": r.candidateName || "",
      "Candidate Email": r.candidateEmail || "",
      "Candidate Phone": r.candidatePhone || "",
      "Job Title": jobMap[r.job]?.title || "",
      "Job Salary": jobMap[r.job]?.salary || "",
      "CTV Email": recruiterMap[r.recruiter]?.email || r.recruiter || "",
      Status: r.status,
      Bonus: r.bonus ?? "",
      "CV Link": r.cvUrl || "",
      LinkedIn: r.linkedin || "",
      Portfolio: r.portfolio || "",
      "Created At": r.createdAt
        ? new Date(r.createdAt).toLocaleString("vi-VN")
        : "",
      "Updated At": r.updatedAt
        ? new Date(r.updatedAt).toLocaleString("vi-VN")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `candidate-management-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  /* ================= RENDER ================= */
  return (
    <div className="candidate-page">
      <h2>Candidate Management</h2>

      <FilterUI
        filters={filters}
        onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleExportExcel}
          style={{
            padding: "6px 12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Export Excel
        </button>
        <button
          onClick={downloadAllCVs}
          disabled={zipping}
          style={{
            padding: "6px 12px",
            fontWeight: 600,
            cursor: "pointer",
            opacity: zipping ? 0.6 : 1,
          }}
        >
          Download All CVs (.zip)
        </button>
        {/* <button
          onClick={downloadNewCVs}
          disabled={zipping || newCvItems.length === 0}
          style={{
            padding: "6px 12px",
            fontWeight: 600,
            cursor: "pointer",
            opacity: zipping || newCvItems.length === 0 ? 0.6 : 1,
          }}
        >
          Download New CVs (.zip){newCvItems.length ? ` (${newCvItems.length})` : ""}
        </button> */}
        {zipping && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 220 }}>
            <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${zipProgress}%`, height: "100%", background: "#2e7d32" }} />
            </div>
            <span style={{ fontSize: 12, color: "#555" }}>
              {zipProgress}% ({zipAdded}/{zipTotal})
            </span>
          </div>
        )}
      </div>

      {renderTable(
        "Active Candidates",
        activePaged,
        activePage,
        setActivePage,
        activeRows.length,
      )}

      {renderTable(
        "Rejected Candidates",
        rejectedPaged,
        rejectedPage,
        setRejectedPage,
        rejectedRows.length,
      )}
    </div>
  );
}
