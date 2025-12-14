function formatSuitability(suitability) {
  const points = suitability.split(/\d+\.\s+/).filter(Boolean);
  return (
    <ul>
      {points.map((point, index) => (
        <li key={index}>{point.trim()}</li>
      ))}
    </ul>
  );
}

export default function MyCandidates({ candidates }) {
  return (
    <div className="candidate-list">
      {candidates.map(candidate => (
        <div key={candidate.id} className="candidate-item">
          <h3>{candidate.name}</h3>
          <p><strong>Job:</strong> {candidate.job}</p>
          <p><strong>Salary:</strong> {candidate.salary}</p>
          <p><strong>Status:</strong> {candidate.status}</p>
          <p><strong>Bonus:</strong> {candidate.bonus}</p>
          <p><strong>Email:</strong> {candidate.email}</p>
          <p><strong>Phone:</strong> {candidate.phone}</p>
          <p><strong>CV:</strong> <a href={candidate.cvLink}>View CV</a></p>
          <p><strong>Suitability:</strong> {formatSuitability(candidate.suitability)}</p>
        </div>
      ))}
    </div>
  );
}