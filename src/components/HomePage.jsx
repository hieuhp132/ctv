import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaQuestionCircle, FaArrowRight, FaCheckCircle, FaUsers, FaDollarSign, FaChartLine, FaHeadset, FaStar, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaGlobe, FaBuilding } from "react-icons/fa";
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
  const [banners, setBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchAllJobs(12) // limit to 12 jobs
      .then((list) => {
        if (mounted) setJobs(Array.isArray(list) ? list : []);
      })
      .catch(() => setError("Không tải được danh sách công việc"))
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);


  useEffect(() => {
  let cancelled = false;

  async function loadBanners() {
    try {
      const modules = import.meta.glob('../assets/banners/**/*.{png,jpg,jpeg,webp,gif}', {
        eager: true,
        import: 'default'
      });

      let urls = Object.entries(modules)
        .filter(([p]) => !/logo|icon|fb|tele/i.test(p))
        .map(([path, url]) => ({ path, url }));

      // 👉 Sắp xếp theo số trong tên file
      urls.sort((a, b) => {
        const getNum = (s) => Number(s.match(/\d+/)?.[0] || 0);
        return getNum(a.path) - getNum(b.path);
      });

      if (!cancelled) {
        setBanners(urls.map(x => x.url));
      }
    } catch {}
  }

    loadBanners();
    return () => { cancelled = true; };
  }, []);


  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setBannerIndex(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, [banners]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "it" || tab === "nonit") setActiveTopTab(tab);
  }, [searchParams]);

  const isIT = (j) => /(engineer|developer|software|data|dev|backend|frontend|system|security)/i.test(j.title || "")
    || (Array.isArray(j.keywords) && j.keywords.some(k => /(it|developer|engineer|software)/i.test(String(k))));

  const topIt = jobs.filter(isIT);
  const topNonIt = jobs.filter(j => !isIT(j));

  const isHot = (j) => {
    const hasBonus = !!(j.bonus || j.rewardCandidateUSD || j.rewardInterviewUSD);
    const manyApplicants = typeof j.applicants === "number" && j.applicants >= 5;
    return hasBonus || manyApplicants;
  };

  const parseUpTo = (s) => {
    if (!s) return null;
    const nums = String(s).match(/[0-9]+(?:\.[0-9]+)?/g);
    if (!nums || nums.length === 0) return null;
    const last = nums[nums.length - 1];
    return last;
  };
  return (
    <div className="homepage">
      {/* Header */}
      <header className="homepage-header">
        <div className="homepage-container">
          <div className="header-content">
            <div className="logo">              
              <a href="#hero">
                <img src={logoImg} alt="Ant-Tech Asia" className="logo-img" />
              </a>
            </div>
            <button className="mobile-toggle" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <nav className="nav-menu">
              <a href="#about">About</a>
              <a href="#features">Solutions</a>
              <a href="#process">Process</a>
              <a href="#commission">Commission</a>
              <a href="#jobs">Jobs</a>
              <a href="#faq">FAQ</a>
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-register">Register</Link>
              </div>
            </nav>
            {menuOpen && (
              <div className="mobile-menu" role="dialog" aria-modal="true" onClick={() => setMenuOpen(false)}>
                <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
                  <button className="mobile-close" aria-label="Close" onClick={() => setMenuOpen(false)}>×</button>
                  <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
                  <a href="#features" onClick={() => setMenuOpen(false)}>Solutions</a>
                  <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
                  <a href="#commission" onClick={() => setMenuOpen(false)}>Commission</a>
                  <a href="#jobs" onClick={() => setMenuOpen(false)}>Jobs</a>
                  <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
                  <div className="mobile-auth">
                    <Link to="/login" className="btn-login" onClick={() => setMenuOpen(false)}>Login</Link>
                    <Link to="/signup" className="btn-register" onClick={() => setMenuOpen(false)}>Register</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Become an Ant-Tech Collaborator – Earn Extra Income with Flexibility
            </h1>
            <p className="hero-subtitle">
              Refer qualified candidates and receive attractive rewards for every successful hire.
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
          <h1 className="homepage-section-title">Job Openings</h1>
            <div className="hero-search">
              <select defaultValue="all" aria-label="Role type">
                <option value="all">All roles</option>
                <option value="it">IT</option>
                <option value="nonit">Non‑IT</option>
              </select>
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
              <button
                className="btn-hero-search"
                onClick={() => {
                  setLoading(true);
                  fetchJobs({ limit: 24, q: keyword })
                    .then((list) => {
                      let result = Array.isArray(list) ? list : [];
                      if (location.trim()) {
                        result = result.filter((j) =>
                          String(j.location || "").toLowerCase().includes(location.trim().toLowerCase())
                        );
                      }
                      setJobs(result);
                    })
                    .finally(() => setLoading(false));
                }}
              >
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
                    setLoading(true);
                    fetchJobs({ limit: 24, q: c }).then((list) => setJobs(Array.isArray(list) ? list : [])).finally(() => setLoading(false));
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          {/* <div className="jobs-filters">
            <input
              type="text"
              placeholder="Search jobs..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = e.currentTarget.value.trim();
                  setLoading(true);
                  fetchJobs({ limit: 12, q }).then((list) => setJobs(Array.isArray(list) ? list : [])).finally(() => setLoading(false));
                }
              }}
            />
          </div> */}
          {loading ? (
            <div className="jobs-loading">Loading jobs...</div>
          ) : error ? (
            <div className="jobs-error">Failed to load jobs.</div>
          ) : jobs.length === 0 ? (
            <div className="jobs-empty">No jobs available.</div>
          ) : (
            <div className="jobs-grid">
              {jobs.slice(0, 12).map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div className="job-title">{job.title}</div>
                    <div className="job-company"><FaBuilding /> {job.company || "N/A"}</div>
                  </div>
                  <div className="job-meta">
                    <span><FaMapMarkerAlt /> {job.location || "Remote/Onsite"}</span>
                    <span><FaDollarSign /> Salary: {job.salary || "N/A"}</span>
                    {/* {job.bonus && <span><FaDollarSign /> Bonus: {job.bonus}</span>} */}
                  </div>
                  <div className="job-actions">
                    <Link
                      to={user ? `/job/${job.id}` : "/login"}
                      className="btn-view"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="jobs-viewall">
            <Link to={user ? "/dashboard" : "/login"} className="btn-viewall">View all jobs</Link>
          </div>
        </div>
      </section>

      {/* Top Jobs This Week */}
      <section className="topjobs-section">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Top Jobs</h1>
          <div className="toptabs">
            <button className={`toptab ${activeTopTab==='it'?'active':''}`} onClick={() => { setActiveTopTab('it'); setSearchParams({ tab: 'it' }); }}>
              IT Jobs <span className="count">{topIt.length}</span>
            </button>
            <button className={`toptab ${activeTopTab==='nonit'?'active':''}`} onClick={() => { setActiveTopTab('nonit'); setSearchParams({ tab: 'nonit' }); }}>
              Non‑IT Jobs <span className="count">{topNonIt.length}</span>
            </button>
          </div>
          <div className="topjobs-grid">
            {(activeTopTab==='it' ? topIt : topNonIt).slice(0,8).map(j => (
              <div key={`top-${j.id}`} className="topjob-item">
                <div className="topjob-title">{j.title}</div>
                <div className="topjob-sub">{j.company || 'N/A'} • {j.location || 'Remote/Onsite'}</div>
                <div className="topjob-tags">
                  {(Array.isArray(j.keywords) ? j.keywords.slice(0,3) : []).map(t => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                <div className="topjob-footer">
                  {/* <a className="chat-pill" href="https://m.me/anttechasia" target="_blank" rel="noreferrer">Chat</a> */}
                  {/* {parseUpTo(j.salary) ? (
                    <span className="salary-up">Up to ${parseUpTo(j.salary)}</span>
                  ) : (
                    <span className="salary-neg">Negotiable</span>
                  )} */}
                </div>
              </div>
            ))}
          </div>
          <div className="topjobs-more"><Link to={user ? "/dashboard" : "/login"}>See more jobs</Link></div>
        </div>
      </section>

      {/* Meet top headhunters */}
      {/* <section className="headhunter-section">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Meet Top Headhunters</h1>
          <div className="headhunter-grid">
            {["Harrison Yeong","Leena Vu","Huong Le","Jenny Ho","Tony Nguyen","Christine Le"].map((name, idx) => (
              <div key={name} className="headhunter-card">
                <div className="hh-header">
                  <img className="hh-avatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF5E62&color=fff`} alt="avatar" />
                  <div className="hh-name">{name}</div>
                </div>
                <div className="hh-roles">Specialties: {idx % 2 ? 'Sales, Marketing' : 'Software, Data'}</div>
                <div className="hh-actions"><Link to={user ? '/dashboard' : '/signup'} className="btn-view">Contact</Link></div>
              </div>
            ))}
          </div>
          <div className="headhunter-more"><Link to={user ? '/dashboard' : '/signup'}>See more headhunters</Link></div>
        </div>
      </section> */}

      {/* Blog and Clients */}
      <section className="about-section" id="about">
        <div className="homepage-container">
          <div className="about-content">
            <h1 className="hero-title">
              About the programm
            </h1>
            <div className="about-text">
              The Ant-Tech Collaborator Program is designed for anyone who wants to earn additional income by connecting great talent with the right job opportunities. You don’t need to be a professional recruiter – if you know talented people, you can become a collaborator with us.
              <div className="why-join"><h3>Why join?</h3></div>
              <p>Transparent and attractive commission for each successful placement</p>
              <p>Work flexibly, anytime and anywhere</p>
              <p>Access to training and continuous support from the Ant-Tech HR team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Solutions */}
      <section className="features-section" id="features">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Your Partner to Grow and Expand Anywhere</h1>
          <div className="features-grid">
            <div className="feature-item">
              <FaGlobe className="feature-icon" />
              <h3>Enter New Markets Fast</h3>
              <p>Operate without setting up a local entity — skip months of setup time.</p>
            </div>
            <div className="feature-item">
              <FaUsers className="feature-icon" />
              <h3>Hire Top Talent Anywhere</h3>
              <p>Leverage our headhunter network and talent database to find the right people.</p>
            </div>
            <div className="feature-item">
              <FaHeadset className="feature-icon" />
              <h3>All‑in‑One HR & Recruitment</h3>
              <p>From recruitment to admin and compliance — we handle it so you focus on growth.</p>
            </div>
            <div className="feature-item">
              <FaChartLine className="feature-icon" />
              <h3>Cost‑Effective & Scalable</h3>
              <p>Scale quickly with competitive pricing, built for startups and high‑growth teams.</p>
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
              <p>We learn your hiring needs, target roles, and markets you want to enter.</p>
            </div>
            <div className="process-item">
              <div className="process-number">2</div>
              <h3>Get a Customized Plan</h3>
              <p>We design a tailored solution for your needs and budget, aligned with your goals.</p>
            </div>
            <div className="process-item">
              <div className="process-number">3</div>
              <h3>Hire & Scale to New Market</h3>
              <p>Use our services to hire, operate, and ensure your objectives are met.</p>
            </div>
          </div>
        </div>
      </section>
{/*    
      <section className="hero" id="commission">
        <div className="homepage-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Commission Policy & Bonus
            </h1>
            <p className="hero-subtitle">

            We offer competitive commission rates for each role.
            Commission is calculated based on the position and contract type.
            Additional bonus schemes are available for top collaborators (e.g., bonus when you refer 3 successful candidates per month).
            Payouts are made on time, with full transparency via your collaborator dashboard.
            </p>
           
          </div>
        </div>
      </section> */}
  

      {/* Tools & Support */}
      {/* <section className="tools-section">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Tools & Support</h1>
          <div className="tools-content">
            <div className="tool-item">
              <FaChartLine className="tool-icon" />
              <h3>Dedicated Dashboard</h3>
              <p>Manage your job posts, track referrals, and monitor commissions all in one place.</p>
            </div>
            <div className="tool-item">
              <FaUsers className="tool-icon" />
              <h3>Exclusive Listings</h3>
              <p>Get access to top job opportunities from Ant-Tech Asia’s clients.</p>
            </div>
            <div className="tool-item">
              <FaHeadset className="tool-icon" />
              <h3>Continuous Support</h3>
              <p>Receive guidance and assistance from our HR consultants throughout the process.</p>
            </div>
          </div>
        </div>
      </section> */}



      {/* Success Stories */}
      {/* <section className="success-stories">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Success Stories</h1>
          <div className="testimonial">
            <p className="quote">
              “Through Ant-Tech Asia’s program, I was able to earn additional income while helping my network find amazing job opportunities. The process is simple, and the commission is always transparent.”
            </p>
            <div className="author">
              <FaStar className="author-icon" />
              <span>Top Collaborator</span>
            </div>
          </div>
        </div>
      </section> */}



      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="homepage-container">
          <h1 className="homepage-section-title">Frequently Asked Questions (FAQ)</h1>
          <div className="faq-content">
            <div className="faq-item">
              <h3>Who can join the collaborator program?</h3>
              <p>Anyone with a network of professionals looking for job opportunities. No recruitment background is required.</p>
            </div>
            <div className="faq-item">
              <h3>How do I earn commission?</h3>
              <p>You earn commission for every candidate you refer who is successfully hired.</p>
            </div>
            <div className="faq-item">
              <h3>When will I receive my payout?</h3>
              <p>Commissions are paid according to Ant-Tech Asia’s payout schedule, which is fully transparent in your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA button (bottom-right, under chat icons) */}
      <Link
        to="/signup"
        className="btn-cta-float cta-floating-right"
        title="Ready to start your journey as an Ant‑Tech Collaborator?"
      >
        Register Now <FaArrowRight />
      </Link>
 


      {/* Footer */}
      <footer className="footer">
        <div className="homepage-container">
          <div className="footer-content grid-3">
          

            <div className="footer-section links">
              <h4 className="footer-heading" style={{color: '#ffffff'}}>Legal</h4>
              <ul>
                <li> <Link to="/terms" style={{color: '#ffffff'}}>Term & Conditions</Link></li>
                <li> <Link to="" style={{color: '#ffffff'}}>Privacy policy</Link></li>
              </ul>
            </div>

            <div className="footer-section platform">
              <h4 className="footer-heading" style={{color: '#ffffff'}}>Headhunter Plattform ANT-TECH</h4>
              <p className="platform-text" style={{color: '#ffffff'}}>Ant-Tech Asia - Candidate Referral Program</p>
              <p className="platform-text" style={{color: '#ffffff'}}>(Headhunter Referral Program)</p>
            </div>
            <div className="testimonial">
            <p className="quote" style={{color: '#ffffff'}}>
              “Through Ant-Tech Asia’s program, I was able to earn additional income while helping my network find amazing job opportunities. The process is simple, and the commission is always transparent.”
            </p>
            <div className="author">
              <FaStar className="author-icon" />
              <span style={{color: '#ffffff'}}>Top Collaborator</span>
            </div>
          </div>
          </div>
          <div className="footer-divider1"></div>
          <div className="footer-bottom">
            <p style={{color: '#ffffff'}}>&copy; 2025 Ant-Tech. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* Floating Icons at Bottom Right */}
      <div className="floating-icons">
        <a href="https://m.me/anttechasia" className="floating-icon" title="Facebook Messenger">
          <img src={fbIcon} alt="" className="logo-img"/>
        </a>
        <a href=" https://t.me/anttechasia" className="floating-icon" title="Telegram group">
          <img src={teleIcon} alt="" className="logo-img"/>
        </a>
       
      </div>
    </div>
  );
}
// const deriveCaption = (src, index) => {
//   const banners_title = [
//     {
//       title: 'Welcome to Our Plattform. Ant-Tech Headhunting',
//       sub: 'We would like to work with you'
//     },
//     {
//       title:'You know someone who specialist at Ai, Security, Networking, or just a person that can solve real world problem in IT',
//       sub: 'Congratulation, this is a right place for you. Lets Refers And Earns'
//     },
//     {
//       title:'Or, you know someone that good at finance situation',
//       sub:'Lets work together. Refers and Earns'
//     },
//     {
//       title:'Even jobs, that are asked on market',
//       sub:'Lets explore our plattform for more informations'
//     }
//   ];

//   return banners_title[index] || banners_title[0];
// };

