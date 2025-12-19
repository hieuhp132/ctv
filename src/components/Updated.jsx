import React from "react";

const Updated = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f0f4f8",
      color: "#333",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      textAlign: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "30px 40px",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        maxWidth: "500px",
        animation: "fadeIn 1s ease-in-out"
      }}>
        <h1 style={{ color: "#ff4d4f", marginBottom: "15px" }}>⚠️ Stop!</h1>
        <p style={{ fontSize: "18px", lineHeight: "1.5" }}>
          We are currently updating and will come back to you soon.
          <br />
          Thanks for being patient! 🙏
        </p>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default Updated;
