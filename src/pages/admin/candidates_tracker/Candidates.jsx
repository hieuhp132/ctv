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
  } catch { }
}

/* ================= AUTOCOMPLETE INPUT ================= */
const AutocompleteInput = ({ label, placeholder, value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    if (!value) return options.slice(0, 10);
    return options.filter(o => o.toLowerCase().includes(value.toLowerCase()) && o !== value).slice(0, 10);
  }, [value, options]);

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <input
        className="w-full px-4 py-2.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm transition-all outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-100 shadow-xl rounded-xl max-h-48 overflow-y-auto custom-scrollbar">
          {filteredOptions.map((o, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700"
              onClick={() => { onChange(o); setIsOpen(false); }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ================= FILTER UI ================= */
const FilterUI = React.memo(({ onApply, dataOptions }) => {
  const [localFilters, setLocalFilters] = useState({
    candidateName: "",
    job: "",
    recruiter: "",
    candidateEmail: "",
    status: "",
  });

  const handleChange = (k, v) => setLocalFilters((p) => ({ ...p, [k]: v }));

  const handleClear = () => {
    const empty = { candidateName: "", job: "", recruiter: "", candidateEmail: "", status: "" };
    setLocalFilters(empty);
    onApply(empty);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-t-[24px] shadow-sm shadow-blue-900/5 border border-gray-100 border-b-0 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AutocompleteInput
          label="Candidate Name"
          placeholder="Search name..."
          value={localFilters.candidateName}
          onChange={(v) => handleChange("candidateName", v)}
          options={dataOptions.candidates}
        />
        <AutocompleteInput
          label="Job Title"
          placeholder="Filter by job..."
          value={localFilters.job}
          onChange={(v) => handleChange("job", v)}
          options={dataOptions.jobs}
        />
        <AutocompleteInput
          label="Recruiter"
          placeholder="Filter by CTV..."
          value={localFilters.recruiter}
          onChange={(v) => handleChange("recruiter", v)}
          options={dataOptions.recruiters}
        />
        <AutocompleteInput
          label="Email"
          placeholder="Filter by email..."
          value={localFilters.candidateEmail}
          onChange={(v) => handleChange("candidateEmail", v)}
          options={dataOptions.emails}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm transition-all outline-none cursor-pointer"
            value={localFilters.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={handleClear} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
          Clear Filters
        </button>
        <button onClick={() => onApply(localFilters)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
          Apply Filters
        </button>
      </div>
    </div>
  );
});

/* ================= MAIN ================= */
export default function CandidateManagement() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
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
  }, [appliedFilters]);

  /* ================= BUILD AUTOCOMPLETE OPTIONS ================= */
  const dataOptions = useMemo(() => {
    const names = new Set();
    const jobs = new Set();
    const recruiters = new Set();
    const emails = new Set();

    rows.forEach(r => {
      if (r.candidateName) names.add(r.candidateName);
      if (r.candidateEmail) emails.add(r.candidateEmail);
      if (r.job && jobMap[r.job]?.title) jobs.add(jobMap[r.job].title);
      if (r.recruiter && recruiterMap[r.recruiter]?.email) recruiters.add(recruiterMap[r.recruiter].email);
    });
    return {
      candidates: Array.from(names),
      jobs: Array.from(jobs),
      recruiters: Array.from(recruiters),
      emails: Array.from(emails)
    };
  }, [rows, jobMap, recruiterMap]);

  /* ================= FILTER ================= */
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        Object.entries(appliedFilters).every(([k, v]) => {
          if (!v) return true;
          let cellValue = String(r[k] || "");
          if (k === "job") {
            cellValue = String(jobMap[r.job]?.title || "");
          } else if (k === "recruiter") {
            cellValue = String(recruiterMap[r.recruiter]?.email || r.recruiter || "");
          }
          return cellValue.toLowerCase().includes(String(v).toLowerCase());
        })
      ),
    [rows, appliedFilters, jobMap, recruiterMap],
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
        } catch { }
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
      } catch { }
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
        } catch { }
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
        } catch { }
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
  const renderTable = (title, data, page, setPage, total, isFirst = false) => (
    <section className={`bg-white shadow-sm shadow-blue-900/5 border border-gray-100 p-6 sm:p-8 mb-8 ${isFirst ? 'rounded-b-[24px] border-t-0' : 'rounded-[24px]'}`}>
      {isFirst && <div className="h-[1px] w-full bg-gray-100 mb-8 mt-[-32px]"></div>}
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i data-lucide={title.includes("Active") ? "users" : "user-x"} className="w-5 h-5 text-gray-400"></i>
        {title}
        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 border border-gray-200">{total}</span>
      </h3>
      <div className="overflow-x-auto custom-scrollbar rounded-xl border border-gray-100">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort("candidateName")}>
                <div className="flex items-center gap-2">Name <span className="text-gray-400">{sortIcon("candidateName")}</span></div>
              </th>
              <th className="px-5 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort("job")}>
                <div className="flex items-center gap-2">Job <span className="text-gray-400">{sortIcon("job")}</span></div>
              </th>
              <th className="px-5 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort("recruiter")}>
                <div className="flex items-center gap-2">CTV <span className="text-gray-400">{sortIcon("recruiter")}</span></div>
              </th>
              <th className="px-5 py-4 font-semibold text-gray-600">Email</th>
              <th className="px-5 py-4 font-semibold text-gray-600">CV</th>
              <th className="px-5 py-4 font-semibold text-gray-600">Links</th>
              <th className="px-5 py-4 font-semibold text-gray-600">Status</th>
              <th className="px-5 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort("updatedAt")}>
                <div className="flex items-center gap-2">Time <span className="text-gray-400">{sortIcon("updatedAt")}</span></div>
              </th>
              <th className="px-5 py-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-medium text-gray-900">{r.candidateName}</td>
                <td className="px-5 py-4 text-gray-600 max-w-[200px] truncate" title={jobMap[r.job]?.title}>{jobMap[r.job]?.title || "Unknown Job"}</td>
                <td className="px-5 py-4 text-gray-600">
                  {recruiterMap[r.recruiter]?.email ||
                    r.recruiter ||
                    "Unknown User"}
                </td>
                <td className="px-5 py-4 text-gray-600">{r.candidateEmail || "-"}</td>
                <td className="px-5 py-4">
                  {r.cvUrl ? (
                    <div className="flex items-center gap-3">
                      <a href={r.cvUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-blue-700 font-medium transition-colors">View</a>
                      <button className="text-gray-500 hover:text-gray-800 font-medium transition-colors" onClick={() => downloadCV(r)}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {r.linkedin ? <a href={r.linkedin} className="text-blue-600 hover:underline">LinkedIn</a> : <span className="text-gray-300">-</span>}
                    {r.portfolio ? <a href={r.portfolio} className="text-blue-600 hover:underline">Port.</a> : <span className="text-gray-300">-</span>}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <select
                    className="pl-3 pr-8 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[position:right_8px_center] bg-no-repeat"
                    value={localStatuses[r._id] || r.status}
                    onChange={(e) => handleStatusChange(r._id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500 font-medium">
                  {new Date(r.updatedAt || r.createdAt).toLocaleString("vi-VN", {
                    hour: '2-digit', minute: '2-digit',
                    day: '2-digit', month: '2-digit', year: 'numeric'
                  })}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleUpdate(r._id)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                      Save
                    </button>
                    <button onClick={() => handleRemove(r._id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan="9">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <i data-lucide="inbox" className="w-6 h-6 text-gray-400"></i>
                    </div>
                    <p className="text-gray-500 font-medium">No candidates found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6 px-2">
        <p className="text-sm text-gray-500 font-medium">Showing page <span className="font-bold text-gray-900">{page}</span> of {Math.ceil(total / PAGE_SIZE) || 1}</p>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            Previous
          </button>
          <button
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>
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
    <div className="min-h-screen bg-[#f8fafc] py-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Candidate Management</h2>
            <p className="text-gray-500 text-base">Track, filter, and modify candidates across all listings.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              <i data-lucide="download" className="w-4 h-4"></i>
              Export Excel
            </button>
            <button
              onClick={downloadAllCVs}
              disabled={zipping}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              <i data-lucide="file-archive" className="w-4 h-4"></i>
              {zipping ? "Compressing..." : "Download CVs"}
            </button>
          </div>
        </header>

        {zipping && (
          <div className="mb-6 p-4 bg-white border border-blue-100 rounded-xl flex items-center gap-4 shadow-sm">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="flex-1 max-w-md h-2 bg-gray-100 rounded-full overflow-hidden">
              <div style={{ width: `${zipProgress}%` }} className="h-full bg-blue-500 transition-all duration-300"></div>
            </div>
            <span className="text-sm font-bold text-gray-700">{zipProgress}% <span className="text-gray-400 font-medium">({zipAdded}/{zipTotal})</span></span>
          </div>
        )}

        <FilterUI
          onApply={(f) => setAppliedFilters(f)}
          dataOptions={dataOptions}
        />

        {renderTable(
          "Active Candidates",
          activePaged,
          activePage,
          setActivePage,
          activeRows.length,
          true
        )}

        {renderTable(
          "Rejected Candidates",
          rejectedPaged,
          rejectedPage,
          setRejectedPage,
          rejectedRows.length,
          false
        )}
      </div>
    </div>
  );
}
