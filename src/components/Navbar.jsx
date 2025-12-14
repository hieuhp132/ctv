import React, { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./Navbar.css"
import { listNotifications, getBalances, resetDemoData, fetchJobs } from "../api"
 import logoImg from "../assets/logo.png"

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [openNotif, setOpenNotif] = useState(false)
  const [readNotifIds, setReadNotifIds] = useState([])
  const [allNotifs, setAllNotifs] = useState([])
  const [balances, setBalances] = useState({ adminCredit: 0, ctvBonusById: {} })
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    listNotifications().then(setAllNotifs)
    getBalances().then(setBalances)
  }, [])

  useEffect(() => {
    if (searchText.trim() === "") {
      setSearchResults([])
      return
    }
    // Debounce search
    const delayDebounce = setTimeout(() => {
      fetchJobs({ q: searchText }).then(data => {
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
        setSearchResults(items)
      })
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchText])

  const notifications = useMemo(() => {
    if (!user) return []
    return allNotifs
      .filter(n => n.role === user.role || n.role === "all")
    // Recruiter balance (total earned)
    const ctvBalance = useMemo(() => {
      if (!user || user.role !== "CTV") return 0
      const id = user.email || user.id || "CTV"
      return balances.ctvBonusById?.[id] || 0
    }, [balances, user])
      .sort((a,b) => b.createdAt - a.createdAt)
  }, [user, allNotifs])

  const storageKey = useMemo(() => (user ? `readNotif:${user.email || user.id}` : null), [user])

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]")
      if (Array.isArray(saved)) setReadNotifIds(saved)
    } catch {}
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(readNotifIds))
    } catch {}
  }, [readNotifIds, storageKey])

  const unreadCount = useMemo(() => notifications.filter(n => !readNotifIds.includes(n.id)).length, [notifications, readNotifIds])

  const timeAgo = (ts) => {
    const diffMs = Date.now() - ts
    const mins = Math.floor(diffMs / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  const ctvBonus = useMemo(() => {
    if (!user || user.role !== "CTV") return 0
    const id = user.email || user.id || "CTV"
    return balances.ctvBonusById?.[id] || 0
  }, [balances, user])

  const handleLogout = () => { logout(); navigate("/login") }
  const handleReset = () => { resetDemoData(); window.location.reload() }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchResults.length > 0) {
      navigate(`/job/${searchResults[0].id}`)
      setSearchText("")
      setSearchResults([])
      setShowSearch(false)
    }
  }

  const handleResultClick = (jobId) => {
    navigate(`/job/${jobId}`)
    setSearchText("")
    setSearchResults([])
    setShowSearch(false)
  }

  const isActive = (path) => location.pathname === path
  const homePath = user?.role === 'admin' ? '/admin' : '/dashboard'
  const goHome = () => navigate(homePath)

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="logo-btn" onClick={goHome} title="Home">
          <img src={logoImg} alt="Logo" className="logo-img" />
          <span className="logo">Ant-Tech Asia</span>
        </button>
      </div>

      <div className="navbar-right">
        {!user ? (
          <nav>
            <Link to="/home" className="nav-btn">Home</Link>
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/signup" className="nav-btn">Register</Link>
          </nav>
        ) : (
          <div className="profile-dropdown" onMouseLeave={() => setOpen(false)}>
            {/* <div className="search-container">
              {!showSearch ? (
                <button onClick={() => setShowSearch(true)} className="nav-icon-btn" title="Search">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
              ) : (
                <form onSubmit={handleSearchSubmit} className="search-form">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{borderRadius: 10, height: 30, width: 200, padding: '0 8px' }}
                    autoFocus
                    onBlur={() => setTimeout(() => {
                      if (!document.querySelector(".search-results:hover")) {
                         setShowSearch(false);
                      }
                    }, 200)}
                  />
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(job => (
                        <div key={job.id} className="search-result-item" onMouseDown={() => handleResultClick(job.id)}>
                          {job.title}
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              )}
            </div> */}

            {/* <div className="notif" onClick={() => { setOpenNotif(!openNotif); const ids = notifications.map(n => n.id); setReadNotifIds(prev => Array.from(new Set([...prev, ...ids]))) }}>
              <span className="bell">🔔</span>
              {notifications.length > 0 && (<span className={`dot ${unreadCount === 0 ? "gray" : ""}`}></span>)}
              {openNotif && (
                <div className="notif-menu" onMouseLeave={() => setOpenNotif(false)}>
                  {notifications.length === 0 && (<div className="notif-item">No notifications</div>)}
                  {notifications.map(n => (
                    <div key={n.id} className="notif-item">
                      <span>🛈</span>
                      <span>{n.message}</span>
                      <span className="notif-time">{timeAgo(n.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
            {user.role === "admin" && (<span className="stat-pill">Credit: {balances.adminCredit}$</span>)}
            {user.role === "CTV" && (<span className="stat-pill">Bonus: {ctvBonus}$</span>)}
            <div className="profile-box" onClick={() => setOpen(!open)}>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=FF5E62&color=fff`} alt="avatar" className="avatar" />
              <span className="username">{user.name || "CTV"}</span>
            </div>
            {open && (
              <ul className="dropdown-menu">
                {user.role === "CTV" && (
                  <li className="stat-pill" style={{marginBottom:8,background:'#e6f7ff',color:'#1890ff'}}>
                    {`Balance: {ctvBalance}$`}
                  </li>
                )}
                <li className={isActive('/profile') ? 'active' : ''} onClick={() => navigate("/profile")}>View profile</li>
                <div className="dropdown-divider"></div>
                <li className={isActive(homePath) ? 'active' : ''} onClick={goHome}>Home</li>
                <li className={isActive('/my-brand') ? 'active' : ''} onClick={() => navigate("/my-brand")}>My brand</li>
                {user.role === "admin"
                  ? <li className={isActive('/candidate-management') ? 'active' : ''} onClick={() => navigate("/candidate-management")}>My candidates</li>
                  : <li className={isActive('/my-candidates') ? 'active' : ''} onClick={() => navigate("/my-candidates")}>My candidates</li>
                }
                {user.role === 'admin'
                  ? <li className={isActive('/admin/saved-jobs') ? 'active' : ''} onClick={() => navigate("/admin/saved-jobs")}>Saved jobs</li>
                  : <li className={isActive('/saved-jobs') ? 'active' : ''} onClick={() => navigate("/saved-jobs")}>Saved jobs</li>
                }
                <div className="dropdown-divider"></div>
                <li onClick={handleLogout}>Logout</li>
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
