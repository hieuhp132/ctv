// src/components/CandidateForm.js
import React, { useState } from "react";
import { submitCandidate } from "../api";

export default function CandidateForm() {
  const [name, setName] = useState("");
  const [jobId, setJobId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [suitability, setSuitability] = useState("");
  const [cv, setCv] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const res = await submitCandidate({
      name,
      jobId,
      email,
      phone,
      linkedin,
      portfolio,
      suitability,
      cv
    });
    alert("Candidate submitted: " + JSON.stringify(res));
  };

  return (
    <form onSubmit={submit}>
      <h2>Submit Candidate</h2>
      <input placeholder="Candidate Name" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Job ID" value={jobId} onChange={e=>setJobId(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
      <input placeholder="LinkedIn URL" value={linkedin} onChange={e=>setLinkedin(e.target.value)} />
      <input placeholder="Portfolio URL" value={portfolio} onChange={e=>setPortfolio(e.target.value)} />
      <input placeholder="Suitability" value={suitability} onChange={e=>setSuitability(e.target.value)} />
      <input type="file" onChange={e=>setCv(e.target.files[0])} />
      <button type="submit">Submit</button>
    </form>
  );
}
