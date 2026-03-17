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
  count,
}) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className={`section-title ${color} flex items-center gap-2`}>
          {title}
          {count !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100/80 text-xs font-semibold text-gray-700 border border-gray-200/60 shadow-sm ml-2">
              {count}
            </span>
          )}
        </h2>
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
