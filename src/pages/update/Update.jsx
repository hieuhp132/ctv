import React, { useState, useEffect } from "react";
import { Zap, Server, RefreshCw, Github, Clock, CheckCircle2 } from "lucide-react";
import "./Update.css";

const Update = () => {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(0);

  useEffect(() => {
    const statuses = [
      "Initializing servers...",
      "Updating database...",
      "Deploying new features...",
      "Running tests...",
      "Finalizing updates..."
    ];

    const interval = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + Math.random() * 15 : prev));
      setCurrentStatus(prev => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="update-container">
      <div className="update-card">
        {/* Header with Icon */}
        <div className="update-header">
          <div className="icon-container">
            <div className="icon-background"></div>
            <Zap className="main-icon" size={48} />
          </div>
          <h1 className="update-title">Maintenance in Progress</h1>
          <p className="update-subtitle">We're working hard to bring you amazing new features!</p>
        </div>

        {/* Status Information */}
        <div className="status-section">
          <div className="status-item active">
            <div className="status-dot"></div>
            <div className="status-content">
              <p className="status-label">Current Status</p>
              <p className="status-value">System Update</p>
            </div>
          </div>
          <div className="status-item">
            <div className="status-dot"></div>
            <div className="status-content">
              <p className="status-label">Estimated Time</p>
              <p className="status-value">30 - 60 minutes</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Overall Progress</span>
            <span className="progress-percentage">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Update Steps */}
        <div className="updates-list">
          <h3 className="updates-title">What's New?</h3>
          <div className="update-items">
            <div className="update-item">
              <CheckCircle2 size={20} className="item-icon" />
              <div className="item-text">
                <p className="item-title">Performance Improvements</p>
                <p className="item-desc">Faster load times and smoother interactions</p>
              </div>
            </div>
            <div className="update-item">
              <CheckCircle2 size={20} className="item-icon" />
              <div className="item-text">
                <p className="item-title">New Features</p>
                <p className="item-desc">Exciting additions to enhance your experience</p>
              </div>
            </div>
            <div className="update-item">
              <CheckCircle2 size={20} className="item-icon" />
              <div className="item-text">
                <p className="item-title">Security Updates</p>
                <p className="item-desc">Enhanced protection for your data</p>
              </div>
            </div>
            <div className="update-item">
              <CheckCircle2 size={20} className="item-icon" />
              <div className="item-text">
                <p className="item-title">UI Improvements</p>
                <p className="item-desc">Better design and user experience</p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Information */}
        <div className="info-card">
          <div className="info-icon">
            <RefreshCw className="rotating-icon" />
          </div>
          <p className="info-text">Thanks for your patience!</p>
          <p className="info-subtext">We'll be back online shortly with great improvements</p>
        </div>

        {/* Footer Info */}
        <div className="footer-info">
          <div className="footer-item">
            <Server size={18} />
            <span>Servers Active</span>
          </div>
          <div className="footer-item">
            <Github size={18} />
            <span>Latest Build</span>
          </div>
          <div className="footer-item">
            <Clock size={18} />
            <span>Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Update;
