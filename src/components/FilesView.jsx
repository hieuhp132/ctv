// src/components/FilesView.jsx
import React from "react";

export default function FilesView({ publicUrl, name, onDelete }) {
  if (!publicUrl) {
    return <p>No file available.</p>;
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(publicUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  const handleDelete = () => {
    if (!onDelete) return alert("Delete function not available");
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    onDelete();
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#3b82f6", textDecoration: "underline", flex: '1 1 auto', wordBreak: 'break-word', minWidth: '200px' }}
        >
           {name || "No files"}
        </a>
        <button
          onClick={handleDownload}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            flex: '0 0 auto'
          }}
          title="Download file"
        >
          Download
        </button>
        {onDelete && (
          <button
            onClick={handleDelete}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              flex: '0 0 auto'
            }}
            title="Delete file"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

