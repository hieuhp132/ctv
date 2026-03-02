import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaArrowRight,
  FaMapMarkerAlt,
  FaDollarSign,
  FaBuilding,
  FaGlobe,
  FaUsers,
  FaHeadset,
  FaChartLine,
  FaStar,
} from "react-icons/fa";
import "./Home.css";
import logoImg from "../../assets/logo.png";
import fbIcon from "../../assets/fb.jpg";
import teleIcon from "../../assets/tele.png";
import { fetchAllJobs } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Footer.jsx";
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

  const categories = [
    "Developer",
    "Sales",
    "Marketing",
    "Manager",
    "Finance",
    "HR",
    "Designer",
    "Data",
  ];

  // Fetch initial jobs (limit 12)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAllJobs(6)
      .then((list) => {
        if (mounted) setJobs(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("[DEBUG] Error fetching jobs:", err);
        setError("Không tải được danh sách công việc");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Handle top tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "it" || tab === "nonit") {
      console.log("[DEBUG] Setting active top tab from URL:", tab);
      setActiveTopTab(tab);
    }
  }, [searchParams]);

  const isIT = (j) =>
    /(engineer|developer|software|data|dev|backend|frontend|system|security)/i.test(
      j.title || "",
    ) ||
    (Array.isArray(j.keywords) &&
      j.keywords.some((k) =>
        /(it|developer|engineer|software)/i.test(String(k)),
      ));
  const topIt = jobs.filter(isIT);
  const topNonIt = jobs.filter((j) => !isIT(j));

  const handleSearch = async () => {
    console.log(
      "[DEBUG] Searching jobs with keyword:",
      keyword,
      "and location:",
      location,
    );
    setLoading(true);
    try {
      let list = await fetchAllJobs(9);
      list = Array.isArray(list) ? list : [];
      if (keyword)
        list = list.filter((j) =>
          (j.title || "").toLowerCase().includes(keyword.toLowerCase()),
        );
      if (location)
        list = list.filter((j) =>
          (j.location || "").toLowerCase().includes(location.toLowerCase()),
        );
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

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Become an Ant-Tech Collaborator – Earn Extra Income with
              Flexibility
            </h1>
            <p className="hero-subtitle">
              Refer qualified candidates and receive attractive rewards for
              every successful hire.
            </p>
            <Link to="/signup" className="btn-cta">
              Join Now <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="jobs-section" id="jobs">
        <div className="homepage-container">
          <h3 className="homepage-section-title">Job Openings</h3>
          <div className="hero-search">
            <input
              type="text"
              placeholder="Find something..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="btn-hero-search" onClick={handleSearch}>
              Find jobs
            </button>
          </div>
          <div className="category-chips">
            {categories.map((c) => (
              <button
                key={c}
                className="chip"
                onClick={() => {
                  setKeyword(c);
                  handleSearch();
                  console.log("[DEBUG] Category clicked:", c);
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="jobs-loading">Loading jobs...</div>
          ) : error ? (
            <div className="jobs-error">{error}</div>
          ) : jobs.length === 0 ? (
            <div className="jobs-empty">No jobs available.</div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div className="job-title">{job.title}</div>
                    {/* <div className="job-company"><FaBuilding /> {job.company || "N/A"}</div> */}
                  </div>
                  <div className="job-meta-home">
                    {/* <span><FaMapMarkerAlt /> {job.location || "Remote/Onsite"}</span> */}
                    <span>
                      {job.salary || "N/A"}
                    </span>
                  </div>
                  <div className="job-actions">
                    <Link
                      to={user ? `/job/${job._id}` : "/login"}
                      className="btn-view"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Jobs
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
      </section> */}

      {/* Blog and Clients */}
      <section className="about-section" id="about">
        <div className="homepage-container">
          <div className="about-content">
            <h1 className="hero-title">About the programm</h1>
            <div className="about-text">
              The Ant-Tech Collaborator Program is designed for anyone who wants
              to earn additional income by connecting great talent with the
              right job opportunities. You don’t need to be a professional
              recruiter – if you know talented people, you can become a
              collaborator with us.
              <div className="why-join">
                <h3>Why join?</h3>
              </div>
              <p>
                Transparent and attractive commission for each successful
                placement
              </p>
              <p>Work flexibly, anytime and anywhere</p>
              <p>
                Access to training and continuous support from the Ant-Tech HR
                team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Solutions */}
      <section className="features-section" id="features">
        <div className="homepage-container">
          <h1 className="homepage-section-title">
            Your Partner to Grow and Expand Anywhere
          </h1>
          <div className="features-grid">
            <div className="feature-item">
              <FaGlobe className="feature-icon" />
              <h3>Enter New Markets Fast</h3>
              <p>
                Operate without setting up a local entity — skip months of setup
                time.
              </p>
            </div>
            <div className="feature-item">
              <FaUsers className="feature-icon" />
              <h3>Hire Top Talent Anywhere</h3>
              <p>
                Leverage our headhunter network and talent database to find the
                right people.
              </p>
            </div>
            <div className="feature-item">
              <FaHeadset className="feature-icon" />
              <h3>All‑in‑One HR & Recruitment</h3>
              <p>
                From recruitment to admin and compliance — we handle it so you
                focus on growth.
              </p>
            </div>
            <div className="feature-item">
              <FaChartLine className="feature-icon" />
              <h3>Cost‑Effective & Scalable</h3>
              <p>
                Scale quickly with competitive pricing, built for startups and
                high‑growth teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="process-section" id="process">
        <div className="homepage-container">
          <div className="process-grid">
            <div className="process-item">
              <div className="process-number">1</div>
              <h3>Consultation & Assessment</h3>
              <p>
                We learn your hiring needs, target roles, and markets you want
                to enter.
              </p>
            </div>
            <div className="process-item">
              <div className="process-number">2</div>
              <h3>Get a Customized Plan</h3>
              <p>
                We design a tailored solution for your needs and budget, aligned
                with your goals.
              </p>
            </div>
            <div className="process-item">
              <div className="process-number">3</div>
              <h3>Hire & Scale to New Market</h3>
              <p>
                Use our services to hire, operate, and ensure your objectives
                are met.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="homepage-container">
          <h3 className="homepage-section-title">
            Frequently Asked Questions (FAQ)
          </h3>
          <div className="faq-content">
            <div className="faq-item">
              <h3>Who can join the collaborator program?</h3>
              <p>
                Anyone with a network of professionals looking for job
                opportunities. No recruitment background is required.
              </p>
            </div>
            <div className="faq-item">
              <h3>How do I earn commission?</h3>
              <p>
                You earn commission for every candidate you refer who is
                successfully hired.
              </p>
            </div>
            <div className="faq-item">
              <h3>When will I receive my payout?</h3>
              <p>
                Commissions are paid according to Ant-Tech Asia’s payout
                schedule, which is fully transparent in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating icons */}
      <div className="floating-icons">
        <a href="https://m.me/anttechasia">
          <img src={fbIcon} alt="FB" className="logo-img" />
        </a>
        <a href="https://t.me/anttechasia">
          <img src={teleIcon} alt="Telegram" className="logo-img" />
        </a>
      </div>
      {/* ================= MOBILE MENU ================= */}
      {menuOpen && (
        <div className="mobile-menu" onClick={() => setMenuOpen(false)}>
          <div
            className="mobile-menu-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="mobile-close" onClick={() => setMenuOpen(false)}>
              ×
            </button>

            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Solutions
            </a>
            <a href="#process" onClick={() => setMenuOpen(false)}>
              Process
            </a>
            <a href="#jobs" onClick={() => setMenuOpen(false)}>
              Jobs
            </a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>
              FAQ
            </a>

            {/* AUTH SECTION */}
            <div className="mobile-auth">
              {!user ? (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)}>
                    Register
                  </Link>
                </>
              ) : (
                <Link
                  to={user.role === "admin" ? "/admin" : "/dashboard"}
                  onClick={() => setMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
