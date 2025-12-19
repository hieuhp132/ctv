import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaMapMarkerAlt, FaDollarSign, FaBuilding } from "react-icons/fa";
import "./HomePage.css";
import logoImg from "../assets/logo.png";
import fbIcon from "../assets/fb.jpg";
import teleIcon from "../assets/tele.png";
import { fetchAllJobs } from "../api";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState("it");
  const [searchParams, setSearchParams] = useSearchParams();


  const categories = ["Developer", "Sales", "Marketing", "Manager", "Finance", "HR", "Designer", "Data"];

  // Fetch initial jobs (limit 12)
  useEffect(() => {
    let mounted = true;
    console.log("[DEBUG] Fetching initial jobs...");
    setLoading(true);
    fetchAllJobs(12)
      .then(list => {
        console.log("[DEBUG] Jobs fetched:", list);
        if (mounted) setJobs(Array.isArray(list) ? list : []);
      })
      .catch(err => {
        console.error("[DEBUG] Error fetching jobs:", err);
        setError("Không tải được danh sách công việc");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);


  // Handle top tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "it" || tab === "nonit") {
      console.log("[DEBUG] Setting active top tab from URL:", tab);
      setActiveTopTab(tab);
    }
  }, [searchParams]);

  const isIT = (j) => /(engineer|developer|software|data|dev|backend|frontend|system|security)/i.test(j.title || "")
    || (Array.isArray(j.keywords) && j.keywords.some(k => /(it|developer|engineer|software)/i.test(String(k))));
  const topIt = jobs.filter(isIT);
  const topNonIt = jobs.filter(j => !isIT(j));

  const handleSearch = async () => {
    console.log("[DEBUG] Searching jobs with keyword:", keyword, "and location:", location);
    setLoading(true);
    try {
      let list = await fetchAllJobs(24);
      list = Array.isArray(list) ? list : [];
      if (keyword) list = list.filter(j => (j.title || "").toLowerCase().includes(keyword.toLowerCase()));
      if (location) list = list.filter(j => (j.location || "").toLowerCase().includes(location.toLowerCase()));
      console.log("[DEBUG] Filtered jobs:", list);
      setJobs(list);
    } catch (err) {
      console.error("[DEBUG] Error searching jobs:", err);
      setError("Không tải được danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      {/* Header */}
      <header className="homepage-header">
        <div className="homepage-container">
          <div className="header-content">
            <div className="logo">
              <a href="#hero"><img src={logoImg} alt="Ant-Tech Asia" className="logo-img" /></a>
            </div>
            <button className="mobile-toggle" onClick={() => { console.log("[DEBUG] Mobile menu opened"); setMenuOpen(true); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <nav className="nav-menu">
              <a href="#about">About</a>
              <a href="#features">Solutions</a>
              <a href="#process">Process</a>
              <a href="#jobs">Jobs</a>
              <a href="#faq">FAQ</a>
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-register">Register</Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Become an Ant-Tech Collaborator – Earn Extra Income with Flexibility</h1>
            <p className="hero-subtitle">Refer qualified candidates and receive attractive rewards for every successful hire.</p>
            <Link to="/signup" className="btn-cta">Join Now <FaArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="jobs-section" id="jobs">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Job Openings</h1>
          <div className="hero-search">
            <input type="text" placeholder="Find something..." value={keyword} onChange={e => setKeyword(e.target.value)} />
            <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
            <button className="btn-hero-search" onClick={handleSearch}>Find jobs</button>
          </div>
          <div className="category-chips">
            {categories.map(c => (
              <button key={c} className="chip" onClick={() => { setKeyword(c); handleSearch(); console.log("[DEBUG] Category clicked:", c); }}>{c}</button>
            ))}
          </div>

          {loading ? <div className="jobs-loading">Loading jobs...</div> :
            error ? <div className="jobs-error">{error}</div> :
              jobs.length === 0 ? <div className="jobs-empty">No jobs available.</div> :
                <div className="jobs-grid">
                  {jobs.map(job => (
                    <div key={job.id} className="job-card">
                      <div className="job-header">
                        <div className="job-title">{job.title}</div>
                        <div className="job-company"><FaBuilding /> {job.company || "N/A"}</div>
                      </div>
                      <div className="job-meta">
                        <span><FaMapMarkerAlt /> {job.location || "Remote/Onsite"}</span>
                        <span><FaDollarSign /> {job.salary || "N/A"}</span>
                      </div>
                      <div className="job-actions">
                        <Link to={user ? `/job/${job.id}` : "/login"} className="btn-view">View details</Link>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>
      </section>

      {/* Top Jobs */}
      <section className="topjobs-section">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Top Jobs</h1>
          <div className="toptabs">
            <button className={`toptab ${activeTopTab==='it'?'active':''}`} onClick={() => { console.log("[DEBUG] Active tab set to IT"); setActiveTopTab('it'); setSearchParams({ tab: 'it' }); }}>
              IT Jobs <span className="count">{topIt.length}</span>
            </button>
            <button className={`toptab ${activeTopTab==='nonit'?'active':''}`} onClick={() => { console.log("[DEBUG] Active tab set to Non-IT"); setActiveTopTab('nonit'); setSearchParams({ tab: 'nonit' }); }}>
              Non‑IT Jobs <span className="count">{topNonIt.length}</span>
            </button>
          </div>
          <div className="topjobs-grid">
            {(activeTopTab==='it' ? topIt : topNonIt).slice(0,8).map(j => (
              <div key={j.id} className="topjob-item">
                <div className="topjob-title">{j.title}</div>
                <div className="topjob-sub">{j.company || 'N/A'} • {j.location || 'Remote/Onsite'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="homepage-container">
          <p style={{color:'#fff'}}>&copy; 2025 Ant-Tech. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating icons */}
      <div className="floating-icons">
        <a href="https://m.me/anttechasia"><img src={fbIcon} alt="FB" className="logo-img"/></a>
        <a href="https://t.me/anttechasia"><img src={teleIcon} alt="Telegram" className="logo-img"/></a>
      </div>
    </div>
  );
}
