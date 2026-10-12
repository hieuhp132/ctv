import { ArrowRight, BriefcaseBusiness, Network, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import "./HomePortalSelector.css";

const portals = [
  {
    title: "Freelance Recruiter",
    description:
      "Connect talented candidates with employers and earn rewards for successful referrals.",
    detail: "Flexible · Independent work · Performance-based rewards",
    icon: UsersRound,
    home: "/freelancer",
    login: "/recruiter/login",
    signup: "/recruiter/signup",
    tone: "freelancer",
  },
  {
    title: "Employee",
    description:
      "Manage hiring needs, track candidates, and collaborate with your team in one place.",
    detail: "For in-house teams · Centralized recruitment management",
    icon: BriefcaseBusiness,
    home: "/company",
    login: "/employee/login",
    signup: "/employee/signup",
    tone: "company",
  },
];

export default function HomePortalSelector() {
  return (
    <main className="portal-selector">
      <div className="portal-selector__glow" aria-hidden="true" />
      <div className="portal-selector__content">
        <Link className="portal-selector__brand" to="/" aria-label="ANT TECH home">
          <span><Network size={20} /></span>
          ANT <strong>TECH</strong>
        </Link>

        <span className="portal-selector__eyebrow">A NETWORK THAT CONNECTS GREAT TALENT</span>
        <h1>
          How would you like to <span>work with talent?</span>
        </h1>
        <p className="portal-selector__intro">
          Choose the workspace that fits your role. Each portal has its own home,
          sign-in, and registration experience.
        </p>

        <div className="portal-selector__cards">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <article
                className={`portal-selector__card portal-selector__card--${portal.tone}`}
                key={portal.tone}
              >
                <span className="portal-selector__icon"><Icon size={22} /></span>
                <h2>{portal.title}</h2>
                <p>{portal.description}</p>
                <span className="portal-selector__detail">{portal.detail}</span>
                <div className="portal-selector__actions">
                  <Link className="portal-selector__primary" to={portal.home}>
                    Explore portal <ArrowRight size={16} />
                  </Link>
                  <div>
                    <Link to={portal.login}>Log in</Link>
                    <Link to={portal.signup}>Create account</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="portal-selector__note">
          Already have an account? Choose the right portal to continue to your workspace.
        </p>
      </div>
    </main>
  );
}
