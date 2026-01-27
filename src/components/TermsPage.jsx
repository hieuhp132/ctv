import React from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaFileContract, FaShieldAlt, FaHandshake, FaDollarSign, FaLock, FaUserTimes, FaExclamationTriangle } from "react-icons/fa";
import "./TermsPage.css";
import logoImg from "../assets/logo.jpeg";

export default function TermsPage() {
  return (
    <div className="terms-page">
      {/* Header */}
      <header className="terms-header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="back-btn">
              <FaArrowLeft /> Back to Home
            </Link>
            <div className="logo">
              <img src={logoImg} alt="Ant-Tech Asia" className="logo-img" />
              <span className="logo-text">Ant-Tech Asia</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="terms-content">
  <div className="terms-title-section">
    <h1 className="terms-title">
      <FaFileContract className="title-icon" />
      Ant-Tech Asia Collaborator Program – Terms & Conditions
    </h1>
    <p className="terms-subtitle">
      Please read these terms and conditions carefully before participating in our collaborator program.
    </p>
  </div>

  {/* --- 2 COLUMN LAYOUT --- */}
  <div className="terms-container">

    {/* LEFT COLUMN – Navigation */}
    <aside className="terms-nav">
      <h3>Contents</h3>
      <div className="nav-item">1. Scope of Collaboration</div>
      <div className="nav-item">2. Responsibilities of Collaborators</div>
      <div className="nav-item">3. Responsibilities of Ant-Tech Asia</div>
      <div className="nav-item">4. Commission & Payment Policy</div>
      <div className="nav-item">5. Confidentiality</div>
      <div className="nav-item">6. Non-Employment Relationship</div>
      <div className="nav-item">7. Termination</div>
    </aside>

    {/* RIGHT COLUMN – Terms Sections */}
    <div className="terms-right">

      {/* Section 1 */}
      <section className="terms-section">
        <h2 className="section-title">
          <FaHandshake className="section-icon" />
          1. Scope of Collaboration
        </h2>
        <div className="section-content">
          <p>The Collaborator Program allows individuals ("Collaborators") to introduce potential candidates to Ant-Tech Asia's recruitment team. Ant-Tech Asia will handle the recruitment process directly with the client and the candidate.</p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="terms-section">
        <h2 className="section-title">
          <FaUserTimes className="section-icon" />
          2. Responsibilities of Collaborators
        </h2>
        <div className="section-content">
          <ul className="responsibilities-list">
            <li>Share job openings provided by Ant-Tech Asia within their professional network</li>
            <li>Refer candidates by submitting accurate and up-to-date profiles (CVs, LinkedIn, or other supporting documents)</li>
            <li>Ensure that referred candidates are aware of the referral and consent to being contacted</li>
            <li>Collaborators are not allowed to misrepresent Ant-Tech Asia or commit to clients/candidates on behalf of the company</li>
          </ul>
        </div>
      </section>

      {/* Section 3 */}
      <section className="terms-section">
        <h2 className="section-title">
          <FaShieldAlt className="section-icon" />
          3. Responsibilities of Ant-Tech Asia
        </h2>
        <div className="section-content">
          <ul className="responsibilities-list">
            <li>Provide collaborators with updated job listings, guidelines, and referral tracking tools</li>
            <li>Conduct all recruitment, screening, and client communication</li>
            <li>Inform collaborators about the status of referred candidates</li>
            <li>Ensure fair and transparent commission calculation</li>
          </ul>
        </div>
      </section>

      {/* Section 4 */}
      <section className="terms-section">
        <h2 className="section-title">
          <FaDollarSign className="section-icon" />
          4. Commission & Payment Policy
        </h2>
        <div className="section-content">
          <ul className="responsibilities-list">
            <li>Collaborators will receive a commission for each candidate who is successfully hired through Ant-Tech Asia.</li>
            <li>Commission rates vary depending on the job position and will be communicated in advance</li>
            <li>Commission is only payable after the candidate passes the guarantee period (e.g., 1–3 months, depending on the client's policy).</li>
            <li>Payments are processed monthly and transferred to the collaborator's registered bank account or e-wallet.</li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section className="terms-section">
        <h2 className="section-title">
          <FaLock className="section-icon" />
          5. Confidentiality
        </h2>
        <div className="section-content">
          <ul className="responsibilities-list">
            <li>Collaborators must keep all job-related and client-related information strictly confidential.</li>
            <li>Candidate data should only be shared with Ant-Tech Asia for recruitment purposes.</li>
          </ul>
        </div>
      </section>

      {/* Section 6 */}
      <section className="terms-section">
        <h2 className="section-title">
          <FaUserTimes className="section-icon" />
          6. Non-Employment Relationship
        </h2>
        <div className="section-content">
          <ul className="responsibilities-list">
            <li>Collaborators are independent partners, not employees of Ant-Tech Asia</li>
            <li>This program does not establish any employer–employee relationship, social insurance, or labor contract.</li>
          </ul>
        </div>
      </section>

      {/* Section 7 */}
      <section className="terms-section">
        <h2 className="section-title">
          <FaExclamationTriangle className="section-icon" />
          7. Termination
        </h2>
        <div className="section-content">
          <ul className="responsibilities-list">
            <li>Either party may terminate the collaboration at any time with written notice.</li>
            <li>Ant-Tech Asia reserves the right to refuse collaboration if the collaborator breaches these terms.</li>
          </ul>
        </div>
      </section>

    </div>
  </div>

  {/* FULL WIDTH SECTIONS */}
  <div className="full-width-footer">

  {/* Contact Information */} 
  <section className="contact-section"> 
    <h2 className="section-title">Contact Information</h2> 
    <div className="contact-content"> 
      <p> If you have any questions about these Terms & Conditions, please contact us: </p> 
      <div className="contact-details"> <div className="contact-item"> 
        <strong>Email:</strong> recruit@ant-tech.asia </div> 
      <div className="contact-item"> 
        <strong>Hotline France:</strong> +33 7 67 87 08 30 <br/>
        <strong>Hotline Vietnam:</strong> +84 866545945 </div> 
      <div className="contact-item"> 
        <strong>Address Vietnam:</strong> 18E3 Chu Van An, Ward 26, Binh Thanh District, Ho Chi Minh city, Vietnam <br/>
        <strong>Address France:</strong> 3 chemin des barques, 69120 Vaulx-en-velin, Lyon, France </div> 
      <div className="contact-item"> <strong>Website:</strong> 
      <a href="https://ant-tech.asia/" style={{textDecoration:"underline"}}>https://ant-tech.asia/</a> 
      </div> </div> </div> 
    </section> {/* Agreement */} 
    
    <section className="agreement-section"> 
      <div className="agreement-box"> 
        <h3>Agreement</h3> 
        <p> By participating in the Ant-Tech Asia Collaborator Program, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. </p> 
        <div className="agreement-actions"> <Link to="/signup" className="btn-agree"> I Agree - Join Now </Link> <Link to="/" className="btn-decline"> Back to Home </Link> </div> </div> 
    </section> </div> 
    
    </main>


      {/* Footer */}
      <footer className="terms-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2024 Ant-Tech Asia. All rights reserved.</p>
            <p>Last updated: December 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

