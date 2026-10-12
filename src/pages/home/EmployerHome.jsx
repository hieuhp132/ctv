import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardList, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import "./EmployerHome.css";

const benefits = [
  {
    icon: ClipboardList,
    title: "Manage your hiring workflow",
    description: "Keep job, candidate, and progress details together in one workspace.",
  },
  {
    icon: UsersRound,
    title: "Track candidates with ease",
    description: "Stay up to date on every application and collaborate with your hiring team.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Built for in-house teams",
    description: "Create an employee account and start building your own hiring pipeline.",
  },
];

export default function EmployerHome() {
  return (
    <main className="employer-home">
      <section className="employer-home__hero">
        <span className="employer-home__eyebrow">EMPLOYEE WORKSPACE</span>
        <h1>
          Find the right people,
          <br />
          <span>build great teams.</span>
        </h1>
        <p>
          A dedicated workspace for employees to manage job openings, track candidates,
          and collaborate throughout the hiring process.
        </p>
        <div className="employer-home__actions">
          <Link to="/employee/signup">
            Create an employee account <ArrowRight size={16} />
          </Link>
          <Link to="/employee/login">Log in</Link>
        </div>
        <div className="employer-home__dashboard" aria-label="Recruitment workspace preview">
          <div className="employer-home__dashboard-head">
            <span><BriefcaseBusiness size={16} /> Recruitment workspace</span>
            <span className="employer-home__status"><i /> Active</span>
          </div>
          <div className="employer-home__dashboard-content">
            <div className="employer-home__metric">
              <span>Open positions</span><strong>All in one place</strong>
            </div>
            <div className="employer-home__pipeline">
              {["New applicants", "In review", "Interview", "Hired"].map((stage, index) => (
                <div key={stage}>
                  <span>{index + 1}</span>
                  <strong>{stage}</strong>
                  <i className={index === 3 ? "is-complete" : ""} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="employer-home__benefits">
        <div className="employer-home__section-heading">
          <span>TOOLS FOR EMPLOYEES</span>
          <h2>Everything you need to hire, all in one place</h2>
        </div>
        <div className="employer-home__benefit-grid">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article key={title}>
              <span><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <CheckCircle2 size={16} className="employer-home__check" />
            </article>
          ))}
        </div>
        <div className="employer-home__switch">
          <span>Are you an independent recruiter?</span>
          <Link to="/freelancer">Explore the Freelance Recruiter portal <ArrowRight size={14} /></Link>
        </div>
      </section>
    </main>
  );
}
