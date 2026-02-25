// src/components/FilesView.jsx
import React from "react";

export default function FilesView({ publicUrl, name }) {
  if (!publicUrl) {
    return <p>No file available.</p>;
  }

  return (
    <div style={{ marginTop: 12 }}>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="file-link"
        title={name || publicUrl}
        style={{
          color: "#3b82f6",
          textDecoration: "underline",
          display: "inline-block",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          verticalAlign: "bottom",
        }}
      >
        {name || "No files"}
      </a>
    </div>
  );
}
