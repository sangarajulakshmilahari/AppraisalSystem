"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    window.location.href = "/api/auth/login";
  }, []);

  if (!mounted) return null; 
  return (
    <div className="loader-container">
      <div className="spinner" />
      <p className="loading-text">
        Loading<span className="dots" />
      </p>

      <style jsx>{`
        .loader-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #ffffff;
          color: #000000;
          font-family: system-ui, sans-serif;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .loading-text {
          font-size: 1.1rem;
          letter-spacing: 0.05em;
        }

        .dots::after {
          content: "";
          animation: dots 1.5s steps(3, end) infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes dots {
          0% {
            content: "";
          }
          33% {
            content: ".";
          }
          66% {
            content: "..";
          }
          100% {
            content: "...";
          }
        }
      `}</style>
    </div>
  );
}
