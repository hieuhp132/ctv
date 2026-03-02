import Card from "./Card";

export default function Grid({
  jobs,
  isInactive,
  onEdit,
  onDelete,
  onToggleStatus,
  onSaveToggle,
}) {
  return (
    <div className="jobs-grid">
      {jobs.map((job) => (
        <Card
          key={job._id}
          job={job}
          isInactive={isInactive}
          onEdit={() => onEdit(job)}
          onDelete={() => onDelete(job)}
          onToggleStatus={() => onToggleStatus(job)}
          onSaveToggle={() => onSaveToggle(job)}
        />
      ))}
    </div>
  );
}
