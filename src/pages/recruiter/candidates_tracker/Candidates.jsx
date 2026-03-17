import React, { useMemo, useState, useEffect } from "react";
import {
  listReferrals,
  getJobByIdL,
} from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import "./Candidates.css";
import Icons from "../../../components/Icons.jsx";

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

/* ================= TABLE ================= */
function CandidateTable({ title, rows, jobMap }) {
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    candidate: "",
    job: "",
    email: "",
  });
  const [localFilters, setLocalFilters] = useState({
    status: "",
    candidate: "",
    job: "",
    email: "",
  });

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const dataOptions = useMemo(() => {
    const names = new Set();
    const jobs = new Set();
    const emails = new Set();
    
    rows.forEach(r => {
       if (r.candidateName) names.add(r.candidateName);
       if (r.candidateEmail) emails.add(r.candidateEmail);
       if (r.job && jobMap[r.job]?.title) jobs.add(jobMap[r.job].title);
    });
    return {
      candidates: Array.from(names),
      jobs: Array.from(jobs),
      emails: Array.from(emails)
    };
  }, [rows, jobMap]);

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const matchStatus =
        !appliedFilters.status || c.status === appliedFilters.status;

      const matchCandidate = (c.candidateName || "")
        .toLowerCase()
        .includes(appliedFilters.candidate.toLowerCase());

      const matchJob = (jobMap[c.job]?.title || "")
        .toLowerCase()
        .includes(appliedFilters.job.toLowerCase());

      const matchEmail = (c.candidateEmail || "")
        .toLowerCase()
        .includes(appliedFilters.email.toLowerCase());

      return matchStatus && matchCandidate && matchJob && matchEmail;
    });
  }, [rows, appliedFilters, jobMap]);

  const paged = paginate(filtered, page);

  const handleApply = () => setAppliedFilters(localFilters);
  const handleClear = () => {
     const empty = { status: "", candidate: "", job: "", email: "" };
     setLocalFilters(empty);
     setAppliedFilters(empty);
  };

  return (
    <div className="mb-12 relative">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 px-2">
          {title}
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-200 text-xs font-semibold text-gray-700">{filtered.length}</span>
      </h3>

      {/* FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 sm:p-8 rounded-t-[24px] shadow-sm shadow-blue-900/5 border border-gray-100 border-b-0 relative z-10">
        <AutocompleteInput
          label="Candidate Name"
          placeholder="Search name..."
          value={localFilters.candidate}
          onChange={(v) => setLocalFilters(f => ({ ...f, candidate: v }))}
          options={dataOptions.candidates}
        />
        <AutocompleteInput
          label="Job Title"
          placeholder="Filter by job..."
          value={localFilters.job}
          onChange={(v) => setLocalFilters(f => ({ ...f, job: v }))}
          options={dataOptions.jobs}
        />
        <AutocompleteInput
          label="Email"
          placeholder="Filter by email..."
          value={localFilters.email}
          onChange={(v) => setLocalFilters(f => ({ ...f, email: v }))}
          options={dataOptions.emails}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm transition-all outline-none cursor-pointer"
            value={localFilters.status}
            onChange={(e) => setLocalFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-4 flex items-center justify-end gap-3 mt-2">
          <button onClick={handleClear} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            Clear Filters
          </button>
          <button onClick={handleApply} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-600 transition-all">
            Apply Filters
          </button>
        </div>
      </div>

      {/* TABLE */}
      <section className="bg-white rounded-b-[24px] shadow-sm shadow-blue-900/5 border border-gray-100 p-6 sm:p-8 border-t-0">
        <div className="h-[1px] w-full bg-gray-100 mb-8 mt-[-32px]"></div>
        <div className="overflow-x-auto custom-scrollbar rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 font-semibold text-gray-600">Name</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Job</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Salary</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Bonus</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Email</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Phone</th>
                <th className="px-5 py-4 font-semibold text-gray-600">CV</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Links</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{c.candidateName}</td>
                  <td className="px-5 py-4 text-gray-600 max-w-[200px] truncate" title={jobMap[c.job]?.title}>{jobMap[c.job]?.title || "-"}</td>
                  <td className="px-5 py-4 text-gray-600 font-semibold">{jobMap[c.job]?.salary || "-"}</td>
                  <td className="px-5 py-4">
                      {c.status ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none
                              ${c.status === 'hired' ? 'bg-green-100 text-green-700' :
                              c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              c.status.includes('review') ? 'bg-yellow-100 text-yellow-700' :
                              c.status === 'offer' ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-700'}`}
                          >
                              {c.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                      ) : (
                          "-"
                      )}
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-semibold">{c.bonus ?? "-"}</td>
                  <td className="px-5 py-4 text-gray-600">{c.candidateEmail || "-"}</td>
                  <td className="px-5 py-4 text-gray-600">{c.candidatePhone || "-"}</td>
  
                  <td className="px-5 py-4">
                    {c.cvUrl ? (
                      <a href={c.cvUrl} target="_blank" rel="noreferrer" className="text-primary hover:text-blue-700 font-medium transition-colors">
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
  
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        {c.linkedin ? (
                        <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            LinkedIn
                        </a>
                        ) : (
                        <span className="text-gray-300">-</span>
                        )}
                        {c.portfolio ? (
                        <a href={c.portfolio} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            Port.
                        </a>
                        ) : (
                        <span className="text-gray-300">-</span>
                        )}
                    </div>
                  </td>
  
                  <td className="px-5 py-4 text-xs text-gray-500 font-medium">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString("vi-VN", {
                          hour: '2-digit', minute:'2-digit',
                          day: '2-digit', month: '2-digit', year: 'numeric'
                      })
                      : "-"}
                  </td>
                </tr>
              ))}
  
              {!paged.length && (
                <tr>
                  <td colSpan="11">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <i data-lucide="inbox" className="w-6 h-6 text-gray-400"></i>
                        </div>
                        <p className="text-gray-500 font-medium">No candidates found in this view</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
  
        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500 font-medium">Showing page <span className="font-bold text-gray-900">{page}</span> of {Math.ceil(filtered.length / PAGE_SIZE) || 1}</p>
          <div className="flex gap-2">
            <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= MAIN ================= */
export default function MyCandidates() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const userEmail = user?.email;

  const [candidates, setCandidates] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balance, setBalance] = useState(0);
  const [jobMap, setJobMap] = useState({});

  /* ===== LOAD REFERRALS ===== */
  useEffect(() => {
    if (!userId && !userEmail) return;

    Promise.all([
      listReferrals({
        id: userId,
        email: userEmail,
        isAdmin: false,
      }),
      listReferrals({
        id: userId,
        email: userEmail,
        isAdmin: false,
        status: "rejected",
      }),
    ]).then(([active, rejected]) => {
      setCandidates(active || []);
      setArchived(rejected || []);
    });

 
  }, [userId, userEmail]);

  /* ===== LOAD JOB INFO ===== */
  useEffect(() => {
    const all = [...candidates, ...archived];
    const jobIds = [...new Set(all.map((c) => c.job).filter(Boolean))];

    if (!jobIds.length) return;

    Promise.all(
      jobIds.map(async (id) => {
        if (jobMap[id]) return [id, jobMap[id]];
        const res = await getJobByIdL(id);
        return [
          id,
          {
            title: res?.job?.title || "-",
            salary: res?.job?.salary || "-",
          },
        ];
      })
    ).then((entries) => {
      setJobMap((p) => ({ ...p, ...Object.fromEntries(entries) }));
    });
  }, [candidates, archived]); // intentionally skip jobMap

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">My Candidates</h2>
            <p className="text-gray-500 text-base">Track the status and progress of the candidates you've referred.</p>
          </div>
          <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 shadow-sm flex items-center gap-2">
                  <i data-lucide="wallet" className="w-5 h-5"></i>
                  Balance: ${balance}
              </div>
          </div>
        </header>

      <CandidateTable
        title="Active Candidates"
        rows={candidates.filter((c) => c.status !== "rejected")}
        jobMap={jobMap}
      />

      <CandidateTable
        title="Rejected Candidates"
        rows={archived}
        jobMap={jobMap}
      />

      <Icons />
      </div>
    </div>
  );
}
