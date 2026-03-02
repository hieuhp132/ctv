const fs = require('fs');
const path = require('path');

const LOGIN_LOG_PATH = path.join(__dirname, '../logs/login.log');

/**
 * Parse login log file (NDJSON format)
 */
function parseLoginLog() {
  try {
    if (!fs.existsSync(LOGIN_LOG_PATH)) {
      return [];
    }
    
    const content = fs.readFileSync(LOGIN_LOG_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.error('Error parsing login log line:', e);
        return null;
      }
    }).filter(entry => entry !== null);
  } catch (error) {
    console.error('Error reading login log:', error);
    return [];
  }
}

/**
 * Get login count by user (userId or email)
 */
function getLoginCountByUser() {
  const logs = parseLoginLog();
  const userStats = {};
  
  logs.forEach(log => {
    const key = log.email || log.userId;
    if (!userStats[key]) {
      userStats[key] = {
        email: log.email,
        userId: log.userId,
        count: 0,
        firstLogin: log.time || log.timestamp,
        lastLogin: log.time || log.timestamp,
        logins: []
      };
    }
    userStats[key].count++;
    userStats[key].lastLogin = log.time || log.timestamp;
    userStats[key].logins.push({
      time: log.time || log.timestamp,
      ip: log.ip,
      userAgent: log.userAgent
    });
  });
  
  return userStats;
}

/**
 * Get login statistics by date
 */
function getLoginByDate() {
  const logs = parseLoginLog();
  const dateStats = {};
  
  logs.forEach(log => {
    const timeStr = log.time || log.timestamp;
    const date = new Date(timeStr).toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (!dateStats[date]) {
      dateStats[date] = {
        date,
        count: 0,
        uniqueUsers: new Set(),
        logins: []
      };
    }
    dateStats[date].count++;
    dateStats[date].uniqueUsers.add(log.email || log.userId);
    dateStats[date].logins.push({
      email: log.email,
      time: timeStr
    });
  });
  
  // Convert Set to array and sort by date
  const result = {};
  Object.keys(dateStats).sort().forEach(date => {
    result[date] = {
      date: dateStats[date].date,
      totalLogins: dateStats[date].count,
      uniqueUsers: Array.from(dateStats[date].uniqueUsers),
      uniqueUserCount: dateStats[date].uniqueUsers.size,
      logins: dateStats[date].logins
    };
  });
  
  return result;
}

/**
 * Get login statistics by hour
 */
function getLoginByHour() {
  const logs = parseLoginLog();
  const hourStats = {};
  
  logs.forEach(log => {
    const timeStr = log.time || log.timestamp;
    const date = new Date(timeStr);
    const hour = `${date.toLocaleDateString('en-CA')} ${String(date.getHours()).padStart(2, '0')}:00`;
    
    if (!hourStats[hour]) {
      hourStats[hour] = {
        hour,
        count: 0,
        uniqueUsers: new Set(),
        logins: []
      };
    }
    hourStats[hour].count++;
    hourStats[hour].uniqueUsers.add(log.email || log.userId);
    hourStats[hour].logins.push({
      email: log.email,
      time: timeStr
    });
  });
  
  // Convert Set to array and sort by hour
  const result = {};
  Object.keys(hourStats).sort().forEach(hour => {
    result[hour] = {
      hour: hourStats[hour].hour,
      totalLogins: hourStats[hour].count,
      uniqueUsers: Array.from(hourStats[hour].uniqueUsers),
      uniqueUserCount: hourStats[hour].uniqueUsers.size,
      logins: hourStats[hour].logins
    };
  });
  
  return result;
}

/**
 * Get peak login times
 */
function getPeakLoginTimes() {
  const logs = parseLoginLog();
  const hourMap = {};
  
  logs.forEach(log => {
    const timeStr = log.time || log.timestamp;
    const hour = new Date(timeStr).getHours();
    if (!hourMap[hour]) {
      hourMap[hour] = 0;
    }
    hourMap[hour]++;
  });
  
  return Object.entries(hourMap)
    .map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      count
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get user login frequency (how often users log in)
 */
function getUserLoginFrequency() {
  const userStats = getLoginCountByUser();
  
  return Object.values(userStats)
    .map(user => ({
      email: user.email,
      userId: user.userId,
      loginCount: user.count,
      firstLogin: user.firstLogin,
      lastLogin: user.lastLogin,
      daysSinceFirstLogin: Math.floor((new Date(user.lastLogin) - new Date(user.firstLogin)) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.loginCount - a.loginCount);
}

/**
 * Get unique users count
 */
function getUniqueUsersCount() {
  const logs = parseLoginLog();
  const uniqueUsers = new Set(logs.map(log => log.email || log.userId));
  return uniqueUsers.size;
}

/**
 * Get total login count
 */
function getTotalLoginCount() {
  return parseLoginLog().length;
}

/**
 * Generate comprehensive login report
 */
function generateLoginReport() {
  const totalLogins = getTotalLoginCount();
  const uniqueUsers = getUniqueUsersCount();
  const userStats = getLoginCountByUser();
  const peakTimes = getPeakLoginTimes();
  const loginByDate = getLoginByDate();
  
  return {
    summary: {
      totalLogins,
      uniqueUsers,
      averageLoginsPerUser: (totalLogins / uniqueUsers).toFixed(2),
      reportGeneratedAt: new Date().toISOString()
    },
    userStats: Object.values(userStats).sort((a, b) => b.count - a.count),
    peakLoginTimes,
    loginByDate,
    topUsers: Object.values(userStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  };
}

module.exports = {
  parseLoginLog,
  getLoginCountByUser,
  getLoginByDate,
  getLoginByHour,
  getPeakLoginTimes,
  getUserLoginFrequency,
  getUniqueUsersCount,
  getTotalLoginCount,
  generateLoginReport
};
