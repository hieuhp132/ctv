import { Link, useSearchParams } from "react-router-dom";
import {
  FaStar,
} from "react-icons/fa";
import './Footer.css';

export default function Footer() {
    return (      
      <footer className="footer">
        <div className="homepage-container">
          <div className="footer-content grid-3">
            <div className="footer-section links">
              <h4 className="footer-heading" style={{ color: "#ffffff" }}>
                Legal
              </h4>
              <ul>
                <li>
                  {" "}
                  <Link to="/terms" style={{ color: "#ffffff" }}>
                    Term & Conditions
                  </Link>
                </li>
                <li>
                  {" "}
                  <Link to="" style={{ color: "#ffffff" }}>
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="footer-section platform">
              <h4 className="footer-heading" style={{ color: "#ffffff" }}>
                Headhunter Plattform ANT-TECH
              </h4>
              <p className="platform-text" style={{ color: "#ffffff" }}>
                Ant-Tech Asia - Candidate Referral Program
              </p>
              <p className="platform-text" style={{ color: "#ffffff" }}>
                (Headhunter Referral Program)
              </p>
            </div>
            {/* <div className="testimonial">
              <p className="quote" style={{ color: "#ffffff" }}>
                “Through Ant-Tech Asia’s program, I was able to earn additional
                income while helping my network find amazing job opportunities.
                The process is simple, and the commission is always
                transparent.”
              </p>
              <div className="author">
                <FaStar className="author-icon" />
                <span style={{ color: "#ffffff" }}>Top Collaborator</span>
              </div>
            </div> */}
          </div>
          <div className="footer-divider1"></div>
          <div className="footer-bottom">
            <p style={{ color: "#ffffff" }}>
              &copy; 2025 Ant-Tech. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  } 