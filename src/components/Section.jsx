import Card from "./Card.jsx";
import Pagination from "./Pagination.jsx";

export default function Section({
  title,
  color,
  jobs,
  page,
  totalPages,
  onPrev,
  onNext,
  gridProps,
  action,
  role,
}) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className={`section-title ${color}`}>{title}</h2>
        {action && <div className="section-action">{action}</div>}
      </div>

      {/* GIỮ CHIỀU CAO CỐ ĐỊNH */}
      <div
        className="jobs-grid"
        style={{
          minHeight: 420, // 🔑 CỰC KỲ QUAN TRỌNG
        }}
      >
        {jobs.map((job) => (
          <Card key={job._id} job={job} {...gridProps} role={role}/>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </section>
  );
}
