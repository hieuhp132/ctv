export default function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        paddingTop: 16,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button type="button" onClick={onPrev} disabled={page <= 1}>
        Prev
      </button>

      <span style={{ fontWeight: 600 }}>
        Page {page} / {totalPages}
      </span>

      <button type="button" onClick={onNext} disabled={page >= totalPages}>
        Next
      </button>
    </div>
  );
}
