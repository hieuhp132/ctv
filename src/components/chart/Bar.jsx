function BarChart({ title, data }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>

      <div className="bar-chart">
        {data.map((d, i) => (
          <div key={i} className="bar-item">
            <div
              className="bar"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
            <span className="bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
