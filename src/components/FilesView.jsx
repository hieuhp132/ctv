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
        style={{ color: "#3b82f6", textDecoration: "underline" }}
      >
        {name || "No files"}
      </a>
    </div>
  );
}
