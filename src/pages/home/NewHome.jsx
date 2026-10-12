import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  Filter,
  Heart,
  Linkedin,
  MapPin,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import Ambient3DObject from "../../components/Ambient3DObject.jsx";
import "./NewHome.css";

const HOT_TAGS = [
  "Unity Developer",
  "Unreal Engine",
  "2D/3D Artist",
  "Game Designer",
  "Game Producer",
  "QA / Tester",
];

const LEVELS = ["Junior", "Middle", "Senior", "Lead / Manager"];

const COMPANIES = [
  { name: "VNG Games", initials: "VNG", city: "Ho Chi Minh City", jobs: 18, color: "violet" },
  { name: "Amanotes", initials: "AMA", city: "Ho Chi Minh City", jobs: 12, color: "rose" },
  { name: "Gameloft", initials: "GL", city: "Ho Chi Minh City & Hanoi", jobs: 9, color: "green" },
  { name: "Kong Studios", initials: "KONG", city: "Ho Chi Minh City", jobs: 5, color: "blue" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

function getSalaryValue(salary) {
  if (typeof salary === "number") return salary;
  const parsed = String(salary || "").replaceAll(",", "").match(/\d+(?:\.\d+)?/);
  return parsed ? Number(parsed[0]) : 0;
}

function getJobTags(job) {
  const tags = Array.isArray(job.keywords) ? job.keywords : [];
  return tags.filter(Boolean).slice(0, 4);
}

function getJobLevel(job) {
  const title = `${job.title || ""} ${job.level || ""}`.toLowerCase();
  if (/lead|manager|principal|director/.test(title)) return "Lead / Manager";
  if (/senior|sr\.?/.test(title)) return "Senior";
  if (/junior|jr\.?|entry/.test(title)) return "Junior";
  return "Middle";
}

function matchesJobTag(job, tag) {
  const patterns = {
    "Unity Developer": /unity/i,
    "Unreal Engine": /unreal/i,
    "2D/3D Artist": /artist|2d|3d/i,
    "Game Designer": /designer|design/i,
    "Game Producer": /producer/i,
    "QA / Tester": /\bqa\b|test|quality assurance/i,
  };
  const text = [
    job.title,
    ...(Array.isArray(job.keywords) ? job.keywords : []),
  ]
    .filter(Boolean)
    .join(" ");
  return patterns[tag]?.test(text) ?? text.toLowerCase().includes(tag.toLowerCase());
}

function JobCard({ job, index }) {
  const company = job.company || job.companyName || "Game Studio";
  const title = job.title || "Game Development Role";
  const tags = getJobTags(job);

  return (
    <article className="new-home__job-card">
      <div className={`new-home__company-avatar new-home__company-avatar--${index % 4}`}>
        {String(company).slice(0, 3).toUpperCase()}
      </div>
      <div className="new-home__job-main">
        <div className="new-home__job-title-row">
          <h3>{title}</h3>
          {index < 2 && <span className="new-home__job-badge">HOT</span>}
        </div>
        <div className="new-home__job-meta">
          <span><Building2 size={12} /> {company}</span>
          <span><MapPin size={12} /> {job.location || "Ho Chi Minh City"}</span>
          <span><Clock3 size={12} /> {job.type || "Full-time"}</span>
        </div>
        <div className="new-home__job-tags">
          {(tags.length ? tags : ["Game Development", "Full-time"]).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="new-home__job-action">
        <strong>{job.salary || "Negotiable"}</strong>
        <span>{getJobLevel(job)}</span>
        <div className="new-home__job-buttons">
          <button
            aria-label={`Save job: ${title}`}
            className="new-home__save-button"
            onClick={() => window.location.assign("/login")}
            type="button"
          >
            <Heart size={15} />
          </button>
          <a href="/recruiter/login" className="new-home__apply-button">
            Apply <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function NewHome() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [salaryMinimum, setSalaryMinimum] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [search, setSearch] = useState("");
  const [monthlySalary, setMonthlySalary] = useState(2000);
  const [commissionRate, setCommissionRate] = useState(20);
  const [currency, setCurrency] = useState("USDT (ERC20 / TRC20)");

  useEffect(() => {
    const apiBase =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://apih.ant-tech.asia";
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${apiBase}/local/jobs`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Unable to load jobs (HTTP ${response.status}).`);
        }
        const data = await response.json();
        if (!Array.isArray(data.jobs)) {
          throw new Error("The jobs response has an unexpected format.");
        }
        setJobs(data.jobs);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          console.error("Failed to load featured jobs", fetchError);
          setError(fetchError.message || "Unable to load the job listings.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadJobs();
    return () => controller.abort();
  }, []);

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      const text = [
        job.title,
        job.company,
        job.companyName,
        job.location,
        ...(Array.isArray(job.keywords) ? job.keywords : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = text.includes(search.trim().toLowerCase());
      const matchesTag =
        activeTag === "All" || matchesJobTag(job, activeTag);
      const matchesLevel =
        selectedLevels.length === 0 || selectedLevels.includes(getJobLevel(job));
      const matchesSalary =
        !salaryMinimum || getSalaryValue(job.salary) >= Number(salaryMinimum);
      return matchesSearch && matchesTag && matchesLevel && matchesSalary;
    });

    if (sortOrder === "salary") {
      result = [...result].sort(
        (first, second) =>
          getSalaryValue(second.salary) - getSalaryValue(first.salary),
      );
    }
    return result.slice(0, 7);
  }, [activeTag, jobs, salaryMinimum, search, selectedLevels, sortOrder]);

  const referralReward = monthlySalary * 12 * (commissionRate / 100);

  const toggleLevel = (level) => {
    setSelectedLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level],
    );
  };

  return (
    <main className="new-home">
      <section className="new-home__hero">
        <div className="new-home__hero-glow new-home__hero-glow--cyan" />
        <div className="new-home__hero-glow new-home__hero-glow--purple" />
        <Ambient3DObject className="ambient-3d-object--home" />
        <div className="new-home__hero-content">
          <span className="new-home__eyebrow">
            <span /> Global Creative &amp; Tech Headhunter Network
          </span>
          <h1>
            Where Top <span>Designers &amp; Artists</span>
            <br />
            Build the Future of Web3 &amp; AI
          </h1>
          <p>
            A premium hiring platform for{" "}
            <strong>UI/UX Leads, 3D Game Artists, Art Directors &amp; AI Creatives.</strong>{" "}
            Refer top talent and earn a bounty of up to{" "}
            <strong className="new-home__reward-highlight">$5,000 USDT / Placement.</strong>
          </p>
          <div className="new-home__hero-actions">
            <a className="new-home__primary-button" href="#explore-jobs">
              <BriefcaseBusiness size={15} />
              Explore $3K - $15K Jobs
              <ArrowRight size={15} />
            </a>
            <a className="new-home__secondary-button" href="#global-headhunter">
              <Users size={15} />
              Become a Headhunter Partner
            </a>
          </div>
          <div className="new-home__stats">
            <div><strong className="is-cyan">$2.4M+</strong><span>Bounties Paid to Recruiter</span></div>
            <div><strong className="is-green">450+</strong><span>Web3/AI Studio Partners</span></div>
            <div><strong className="is-pink">$8,500</strong><span>Avg Global Design Salary</span></div>
            <div><strong>98%</strong><span>Hire Retention Rate</span></div>
          </div>
          <a className="new-home__scroll-link" href="#bounty-calculator" aria-label="Scroll to the bounty calculator">
            <ArrowDown size={15} />
          </a>
        </div>
      </section>

      <section className="new-home__calculator-section" id="bounty-calculator">
        <div className="new-home__calculator">
          <div className="new-home__calculator-copy">
            <span className="new-home__section-kicker">
              <Sparkles size={12} /> Headhunter Reward Calculator
            </span>
            <h2>Calculate Your Designer Referral Reward</h2>
            <p>
              Know talented designers or artists? Connect them with companies
              hiring through Ant Tech and earn a referral bounty in crypto
              (USDT/USDC) or by bank transfer once your candidate is onboarded.
            </p>
            <ul>
              <li><CheckCircle2 size={14} /> Transparent payments via smart contract or bank transfer</li>
              <li><CheckCircle2 size={14} /> Refer as many candidates as you like</li>
              <li><CheckCircle2 size={14} /> Partner identity protection available on request</li>
            </ul>
          </div>

          <div className="new-home__calculator-panel">
            <div className="new-home__salary-heading">
              <label htmlFor="monthly-salary">Monthly salary for this role ($):</label>
              <strong>${formatCurrency(monthlySalary)} / month</strong>
            </div>
            <input
              id="monthly-salary"
              className="new-home__range"
              type="range"
              min="2000"
              max="20000"
              step="500"
              value={monthlySalary}
              onChange={(event) => setMonthlySalary(Number(event.target.value))}
              style={{ "--range-progress": `${((monthlySalary - 2000) / 18000) * 100}%` }}
            />
            <div className="new-home__range-labels"><span>$2,000</span><span>$10,000</span><span>$20,000+</span></div>

            <div className="new-home__calculator-selects">
              <label>
                Network bounty rate
                <span className="new-home__select-wrap">
                  <select
                    value={commissionRate}
                    onChange={(event) => setCommissionRate(Number(event.target.value))}
                  >
                    <option value="20">Senior/Lead placement (20%)</option>
                    <option value="25">Specialist placement (25%)</option>
                    <option value="30">Executive placement (30%)</option>
                  </select>
                  <ChevronDown size={14} />
                </span>
              </label>
              <label>
                Payout method
                <span className="new-home__select-wrap">
                  <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                    <option>USDT (ERC20 / TRC20)</option>
                    <option>USDC</option>
                    <option>Bank transfer</option>
                  </select>
                  <ChevronDown size={14} />
                </span>
              </label>
            </div>

            <div className="new-home__reward-result">
              <div>
                <span>Your estimated reward</span>
                <strong>{formatCurrency(referralReward)} {currency.startsWith("USDT") || currency === "USDC" ? currency.split(" ")[0] : "USD"}</strong>
                <small>* Estimate based on the selected salary and bounty rate</small>
              </div>
              <a href="/recruiter/signup">Get your referral link <ArrowRight size={13} /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home__jobs-section" id="explore-jobs">
        <div className="new-home__jobs-container">
          <div className="new-home__section-heading">
            <div>
              <span className="new-home__section-kicker"><BriefcaseBusiness size={13} /> New opportunities every day</span>
              <h2>Featured Jobs</h2>
              <p>Find your next role in gaming and technology.</p>
            </div>
            <label className="new-home__search">
              <Search size={16} />
              <input
                aria-label="Search jobs"
                placeholder="Search roles or companies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="new-home__hot-tags">
            <span><Sparkles size={13} /> Hot tags:</span>
            {["All", ...HOT_TAGS].map((tag) => (
              <button
                className={activeTag === tag ? "is-active" : ""}
                key={tag}
                onClick={() => setActiveTag(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="new-home__job-layout">
            <details className="new-home__filters" open>
              <summary><Filter size={15} /> Advanced filters <ChevronDown size={14} /></summary>
              <div className="new-home__filter-content">
                <fieldset>
                  <legend>Experience level</legend>
                  {LEVELS.map((level) => (
                    <label className="new-home__checkbox" key={level}>
                      <input
                        checked={selectedLevels.includes(level)}
                        onChange={() => toggleLevel(level)}
                        type="checkbox"
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="new-home__salary-filter">
                  Monthly salary (USD)
                  <span className="new-home__select-wrap">
                    <select value={salaryMinimum} onChange={(event) => setSalaryMinimum(event.target.value)}>
                      <option value="">Any salary</option>
                      <option value="1000">$1,000+</option>
                      <option value="2000">$2,000+</option>
                      <option value="3000">$3,000+</option>
                      <option value="5000">$5,000+</option>
                    </select>
                    <ChevronDown size={14} />
                  </span>
                </label>
                <div className="new-home__stack">
                  <span>Engine &amp; Tech Stack</span>
                  <div><span>Unity</span><span>Unreal 5</span><span>C#</span><span>C++</span><span>Blender</span><span>3D</span></div>
                </div>
                <a className="new-home__portfolio-promo" href="/recruiter/login">
                  <Coins size={20} />
                  <strong>CV Review cho Game Dev</strong>
                  <span>Get a free CV and portfolio review from tech leads at top studios.</span>
                  <b>Submit your portfolio</b>
                </a>
              </div>
            </details>

            <div className="new-home__job-results">
              <div className="new-home__results-toolbar">
                <span>
                  {loading
                    ? "Loading jobs..."
                    : `Showing ${filteredJobs.length} matching jobs`}
                </span>
                <label>
                  Sort:
                  <span className="new-home__select-wrap">
                    <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                      <option value="newest">Newest</option>
                      <option value="salary">Highest salary</option>
                    </select>
                    <ChevronDown size={14} />
                  </span>
                </label>
              </div>
              {error ? (
                <div className="new-home__empty-state" role="alert">{error}</div>
              ) : loading ? (
                <div className="new-home__empty-state">Loading job listings...</div>
              ) : filteredJobs.length ? (
                filteredJobs.map((job, index) => (
                  <JobCard key={job._id || job.id || `${job.title}-${index}`} index={index} job={job} />
                ))
              ) : (
                <div className="new-home__empty-state">No jobs match your current filters.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="new-home__companies-section" id="portfolio-showcase">
        <div className="new-home__companies-container">
          <div className="new-home__companies-heading">
            <span className="new-home__section-kicker"><Users size={13} /> Hiring partners</span>
            <h2>Leading Game Studios</h2>
            <p>Discover creative opportunities at some of the region's leading game studios.</p>
          </div>
          <div className="new-home__company-grid">
            {COMPANIES.map((company) => (
              <article className="new-home__studio-card" key={company.name}>
                <span className={`new-home__studio-mark new-home__studio-mark--${company.color}`}>
                  {company.initials}
                </span>
                <h3>{company.name}</h3>
                <p><MapPin size={12} /> {company.city}</p>
                <div><span>Team size: 200+</span><strong>{company.jobs} open jobs</strong></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home__partner-section" id="global-headhunter">
        <div>
          <span className="new-home__section-kicker"><Wallet size={13} /> Grow with Ant Tech</span>
          <h2>Connect great talent. Earn rewarding bounties.</h2>
          <p>Join our Headhunter Partner network and earn transparent rewards for every successful referral.</p>
          <a href="/recruiter/signup" className="new-home__primary-button">Become a Partner <ArrowRight size={15} /></a>
        </div>
        <Check aria-hidden="true" className="new-home__partner-check" />
      </section>

      <footer className="new-home__footer">
        <div className="new-home__footer-main">
          <section className="new-home__footer-about">
            <a className="new-home__footer-brand" href="/" aria-label="ANT TECH home">
              <span className="new-home__footer-mark"><Bug size={19} /></span>
              <strong>ANT TECH</strong>
            </a>
            <p>
              A leading tech headhunting platform connecting global Web3, AI, and fintech studios with exceptional creative talent.
            </p>
          </section>

          <nav className="new-home__footer-group" aria-label="Trending fields">
            <h2>Trending Fields</h2>
            <a href="#explore-jobs">AI &amp; Generative Art</a>
            <a href="#explore-jobs">Web3 UI/UX &amp; DeFi Interface</a>
            <a href="#explore-jobs">3D Game Character &amp; Environment</a>
            <a href="#explore-jobs">Fintech Design Systems</a>
          </nav>

          <nav className="new-home__footer-group" aria-label="For partners">
            <h2>For Partners</h2>
            <a href="#bounty-calculator">Bounty Calculator</a>
            <a href="#global-headhunter">Smart Contract Referrals</a>
            <a href="/recruiter/signup">Become a Global Scout</a>
            <a href="#bounty-calculator">USDT Payout Policy</a>
          </nav>

          <section className="new-home__footer-connect">
            <h2>Connect Globally</h2>
            <div className="new-home__footer-socials">
              <a href="https://t.me/anttechasia" target="_blank" rel="noreferrer" aria-label="ANT TECH on Telegram"><Send size={16} /></a>
              <a href="https://m.me/anttechasia" target="_blank" rel="noreferrer" aria-label="Message ANT TECH"><MessageCircle size={16} /></a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a>
            </div>
            <a className="new-home__footer-support" href="mailto:headhunter@anttech.io">
              Support 24/7: headhunter@anttech.io
            </a>
          </section>
        </div>

        <div className="new-home__footer-bottom">
          <span>© {new Date().getFullYear()} Ant Tech Global Headhunter Inc. All rights reserved.</span>
          <nav aria-label="Legal">
            <a href="/terms">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
