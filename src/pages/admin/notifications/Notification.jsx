import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Check,
  Clock3,
  FileText,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { API_BASE } from "../../../services/api.js";
import "./Notification.css";

const ACTIVITY_ICONS = {
  comment: MessageCircle,
  reply: MessageCircle,
  job_created: BriefcaseBusiness,
  job_updated: BriefcaseBusiness,
  job_deleted: BriefcaseBusiness,
  job_status_changed: BriefcaseBusiness,
  referral_created: UsersRound,
  referral_updated: UsersRound,
  referral_deleted: UsersRound,
  candidate_updated: UserRound,
  candidate_status_changed: UserRound,
  create: FileText,
  edit: FileText,
  delete: X,
  submit: FileText,
  approve: Check,
  reject: X,
  upload: FileText,
  download: FileText,
  status_change: Activity,
};

const getActivityIcon = (type) => ACTIVITY_ICONS[type] || Bell;

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function Notification() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadActivities = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/comments/activities?limit=100`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load notifications.");
      }
      setActivities(Array.isArray(data.activities) ? data.activities : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return (
    <div className="admin-notifications">
      <header className="admin-notifications__header">
        <div className="admin-notifications__title-icon" aria-hidden="true">
          <Bell size={20} />
        </div>
        <div>
          <p className="admin-notifications__eyebrow">ADMIN WORKSPACE</p>
          <h1>Notifications</h1>
          <p>Recent activity across jobs, candidates and your workspace.</p>
        </div>
        <button
          className="admin-notifications__refresh"
          type="button"
          onClick={() => loadActivities({ silent: true })}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "is-spinning" : ""} />
          Refresh
        </button>
      </header>

      <section className="admin-notifications__panel" aria-label="Recent activity">
        <div className="admin-notifications__panel-heading">
          <div>
            <h2>Recent activity</h2>
            <span>{activities.length} {activities.length === 1 ? "update" : "updates"}</span>
          </div>
          <Activity size={18} aria-hidden="true" />
        </div>

        {error && (
          <div className="admin-notifications__state admin-notifications__state--error" role="alert">
            <ShieldAlert size={19} />
            <span>{error}</span>
            <button type="button" onClick={() => loadActivities()}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="admin-notifications__state" role="status">
            <RefreshCw size={18} className="is-spinning" />
            Loading notifications…
          </div>
        ) : !error && activities.length === 0 ? (
          <div className="admin-notifications__state">
            <Bell size={20} />
            No notifications yet. New workspace activity will appear here.
          </div>
        ) : (
          <ol className="admin-notifications__list">
            {activities.map((item, index) => {
              const Icon = getActivityIcon(item.type);
              return (
                <li className="admin-notifications__item" key={item.id || `${item.timestamp}-${index}`}>
                  <span className="admin-notifications__item-icon" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  <div className="admin-notifications__item-content">
                    <p>{item.description || "Workspace activity"}</p>
                    {item.metadata?.details && <span>{item.metadata.details}</span>}
                    <time dateTime={item.timestamp || undefined}>
                      <Clock3 size={12} aria-hidden="true" />
                      {formatTimestamp(item.timestamp)}
                    </time>
                  </div>
                  <span className="admin-notifications__type">
                    {String(item.type || "activity").replaceAll("_", " ")}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
