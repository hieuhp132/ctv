import React, { useEffect, useState, useMemo } from "react";
import "./All.css";
import {
  fetchAllJobs,
  deleteJobL,
  fetchSavedJobsL,
  unsaveJobL,
  saveJobL,
  updateJobL,
  createJobL,
} from "../../../services/api.js";
import Section from "../../../components/Section.jsx";
import Modal from "../../../components/Modal.jsx";
import Filters from "../../../components/Filters.jsx";
import { useAuth } from "../../../context/AuthContext";
import { NavLink } from "react-router-dom";

const EMPTY_JOB_FORM = {
  title: "",
  company: "",
  location: "",
  salary: "",
  bonus: "",
  rewardCandidateUSD: "",
  rewardInterviewUSD: "",
  vacancies: 0,
  applicants: 0,
  deadline: "",
  status: "Active",
  keywords: "",
  jobsdetail: {
    description: "",
    requirement: "",
    benefits: "",
    other: "",
  },
};

const mapJobToForm = (job) => ({
  title: job.title || "",
  company: job.company || "",
  location: job.location || "",
  salary: job.salary || "",
  bonus: job.bonus || "",
  rewardCandidateUSD: job.rewardCandidateUSD ?? "",
  rewardInterviewUSD: job.rewardInterviewUSD ?? "",
  vacancies: job.vacancies ?? 0,
  applicants: job.applicants ?? 0,
  deadline: job.deadline || "",
  status: job.status || "Active",
  keywords: Array.isArray(job.keywords)
    ? job.keywords.join(", ")
    : job.keywords || "",
  jobsdetail: {
    description: job.jobsdetail?.description ?? job.description ?? "",
    requirement: job.jobsdetail?.requirement ?? job.requirements ?? "",
    benefits: job.jobsdetail?.benefits ?? job.benefits ?? "",
    other: job.jobsdetail?.other ?? job.other ?? "",
  },
});

export default function All() {
  const { user } = useAuth();
  const adminId = user?.id || user?.email;

  const [jobs, setJobs] = useState([]);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [editingJob, setEditingJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);

  const jobsPerPage = 9;

  /* ================= LOAD ================= */
  useEffect(() => {
    const load = async () => {
      const res = await fetchAllJobs();
      let list = [...(res.jobs || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      if (user?.email) {
        const saved = await fetchSavedJobsL(user.email);
        const savedIds = new Set(
          (saved.jobs || []).map((j) => j.jobId || j._id),
        );
        list = list.map((j) => ({ ...j, isSaved: savedIds.has(j._id) }));
      }

      setJobs(list);
    };

    load();
  }, [user]);

  /* ================= FILTER ================= */
  const filteredJobs = useMemo(() => {
    const text = searchText.toLowerCase();

    return jobs.filter((j) => {
      const matchText = [j.title, j.company, j.location, j.keywords]
        .join(" ")
        .toLowerCase()
        .includes(text);

      const matchLocation = !filterLocation || j.location === filterLocation;

      const matchCompany = !filterCompany || j.company === filterCompany;

      const matchCategory =
        !filterCategory ||
        (Array.isArray(j.keywords)
          ? j.keywords.includes(filterCategory)
          : j.keywords?.includes(filterCategory));

      return matchText && matchLocation && matchCompany && matchCategory;
    });
  }, [jobs, searchText, filterLocation, filterCompany, filterCategory]);

  /* ================= ACTIVE / INACTIVE ================= */
  const today = new Date();
  const isActive = (j) =>
    j.status === "Active" && (!j.deadline || today <= new Date(j.deadline));

  const activeJobs = filteredJobs.filter(isActive);
  const inactiveJobs = filteredJobs.filter((j) => !isActive(j));

  const paginate = (list, page) =>
    list.slice((page - 1) * jobsPerPage, page * jobsPerPage);

  /* ================= OPTIONS ================= */
  const locationOptions = useMemo(
    () =>
      [...new Set(jobs.map((j) => j.location).filter(Boolean))].map((loc) => ({
        value: loc,
        label: loc,
      })),
    [jobs],
  );

  const companyOptions = useMemo(
    () =>
      [...new Set(jobs.map((j) => j.company).filter(Boolean))].map((c) => ({
        value: c,
        label: c,
      })),
    [jobs],
  );

  const categoryOptions = useMemo(
    () =>
      [
        ...new Set(
          jobs
            .flatMap((j) =>
              Array.isArray(j.keywords)
                ? j.keywords
                : (j.keywords || "").split(","),
            )
            .map((k) => k.trim())
            .filter(Boolean),
        ),
      ].map((cat) => ({ value: cat, label: cat })),
    [jobs],
  );

  /* ================= ACTIONS ================= */
  const openAddModal = () => {
    setEditingJob(null);
    setJobForm(EMPTY_JOB_FORM);
    setShowJobModal(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setJobForm(mapJobToForm(job));
    setShowJobModal(true);
  };

  const handleSaveToggle = async (job) => {
    job.isSaved
      ? await unsaveJobL(job._id, adminId)
      : await saveJobL(job._id, adminId);

    setJobs((jobs) =>
      jobs.map((j) => (j._id === job._id ? { ...j, isSaved: !j.isSaved } : j)),
    );
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === "Active" ? "Inactive" : "Active";
    await updateJobL({ _id: job._id, status: newStatus });

    setJobs((jobs) =>
      jobs.map((j) => (j._id === job._id ? { ...j, status: newStatus } : j)),
    );
  };

  const removeJob = async (job) => {
    if (!window.confirm(`Delete ${job.title}?`)) return;
    await deleteJobL(job._id);
    setJobs((jobs) => jobs.filter((j) => j._id !== job._id));
  };

  const submitJobForm = async (payload) => {
    setShowJobModal(false);

    if (!editingJob) {
      const created = await createJobL({
        title: payload.title,
        company: payload.company,
        location: payload.location,
        salary: payload.salary,
        bonus: payload.bonus,
        rewardCandidateUSD: payload.rewardCandidateUSD,
        rewardInterviewUSD: payload.rewardInterviewUSD,
        vacancies: payload.vacancies,
        applicants: payload.applicants,
        deadline: payload.deadline,
        status: payload.status,
        keywords: String(payload.keywords || "")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        jobsdetail: {
          description: payload.jobsdetail?.description || "",
          requirement: payload.jobsdetail?.requirement || "",
          benefits: payload.jobsdetail?.benefits || "",
          other: payload.jobsdetail?.other || "",
        },
      });
      setJobs((j) => [created, ...j]);
      return;
    }

    const updated = await updateJobL({
      _id: editingJob._id,
      title: payload.title,
      company: payload.company,
      location: payload.location,
      salary: payload.salary,
      bonus: payload.bonus,
      rewardCandidateUSD: payload.rewardCandidateUSD,
      rewardInterviewUSD: payload.rewardInterviewUSD,
      vacancies: payload.vacancies,
      applicants: payload.applicants,
      deadline: payload.deadline,
      status: payload.status,
      keywords: String(payload.keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      jobsdetail: {
        description: payload.jobsdetail?.description || "",
        requirement: payload.jobsdetail?.requirement || "",
        benefits: payload.jobsdetail?.benefits || "",
        other: payload.jobsdetail?.other || "",
      },
    });

    setJobs((j) => j.map((x) => (x._id === updated._id ? updated : x)));

    setEditingJob(null);
  };

  const handleSharedJob = (jobId) => {
    const jobUrl = `${window.location.origin}/job/${jobId}`;
    navigator.clipboard.writeText(jobUrl);
    alert("Job link copied to clipboard!");
  }

  const handleSubmitCandidate = (jobId) => {
    const candidateUrl = `${window.location.origin}/apply/${jobId}`;
    navigator.clipboard.writeText(candidateUrl);
    alert("Candidate application link copied to clipboard!");
  }

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 40,
      borderRadius: 8,
      fontSize: 14,
    }),
    valueContainer: (base) => ({ ...base, padding: "2px 10px" }),
    option: (base, state) => ({
      ...base,
      padding: "10px 12px",
      fontSize: 14,
      backgroundColor: state.isFocused ? "#f3f4f6" : "#fff",
      color: "#111",
      cursor: "pointer",
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };
  /* ================= RENDER ================= */
  return (
    <div className="admin-dashboard">
      {user.role === "admin" && (
        <div className="tasks">
          <NavLink to="/admin-dashboard">Beta</NavLink>
          <NavLink to="/admin/users">Users List</NavLink>
        </div>)
        }

      <Filters
        searchText={searchText}
        setSearchText={setSearchText}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
        filterCompany={filterCompany}
        setFilterCompany={setFilterCompany}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        locationOptions={locationOptions}
        companyOptions={companyOptions}
        categoryOptions={categoryOptions}
        selectStyles={selectStyles}
      />

      <Section
        title="ACTIVE JOBS"
        color="green"
        action={<button onClick={openAddModal}>+ Add Job</button>}
        jobs={paginate(activeJobs, activePage)}
        page={activePage}
        totalPages={Math.ceil(activeJobs.length / jobsPerPage)}
        onPrev={() => setActivePage((p) => Math.max(1, p - 1))}
        onNext={() => setActivePage((p) => p + 1)}
        gridProps={{
          onEdit: openEditModal,
          onDelete: removeJob,
          onSaveToggle: handleSaveToggle,
          onToggleStatus: handleToggleStatus,
          onSharedJob: handleSharedJob,
          onSubmitCandidate: handleSubmitCandidate,
        }}
        role={user?.role}
      />

      <Section
        title="INACTIVE JOBS"
        color="red"
        jobs={paginate(inactiveJobs, inactivePage)}
        page={inactivePage}
        totalPages={Math.ceil(inactiveJobs.length / jobsPerPage)}
        onPrev={() => setInactivePage((p) => Math.max(1, p - 1))}
        onNext={() => setInactivePage((p) => p + 1)}
        gridProps={{
          onEdit: openEditModal,
          onDelete: removeJob,
          onSaveToggle: handleSaveToggle,
          onToggleStatus: handleToggleStatus,
          onSharedJob: handleSharedJob,
          onSubmitCandidate: handleSubmitCandidate,
        }}
        role={user?.role}
      />


      <Modal
        open={showJobModal}
        editingJob={editingJob}
        jobForm={jobForm}
        setJobForm={setJobForm}
        onSubmit={submitJobForm}
        onClose={() => setShowJobModal(false)}
      />
    </div>
  );
}
