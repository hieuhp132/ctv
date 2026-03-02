import React, { useState } from "react";
import {uploadFile} from "../services/api";

export default function FileUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if(!file) return;
    setLoading(true);
    try {
      const result = await uploadFile(file);
      if(onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch(err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}

