const express = require('express');
const router = express.Router();
const {
  getLoginCountByUser,
  getLoginByDate,
  getLoginByHour,
  getPeakLoginTimes,
  getUserLoginFrequency,
  getUniqueUsersCount,
  getTotalLoginCount,
  generateLoginReport
} = require('../utils/loginAnalytics');

/**
 * GET /analytics/login/report
 * Get comprehensive login report
 */
router.get('/login/report', (req, res) => {
  try {
    const report = generateLoginReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating login report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate login report',
      message: error.message
    });
  }
});

/**
 * GET /analytics/login/users
 * Get login count by user
 */
router.get('/login/users', (req, res) => {
  try {
    const userStats = getLoginCountByUser();
    const sorted = Object.values(userStats).sort((a, b) => b.count - a.count);
    
    res.json({
      success: true,
      data: {
        totalUniqueUsers: sorted.length,
        users: sorted
      }
    });
  } catch (error) {
    console.error('Error fetching user login stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user login stats',
      message: error.message
    });
  }
});

/**
 * GET /analytics/login/by-date
 * Get login statistics by date
 */
router.get('/login/by-date', (req, res) => {
  try {
    const dateStats = getLoginByDate();
    
    res.json({
      success: true,
      data: dateStats
    });
  } catch (error) {
    console.error('Error fetching date-based login stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch date-based login stats',
      message: error.message
    });
  }
});

/**
 * GET /analytics/login/by-hour
 * Get login statistics by hour
 */
router.get('/login/by-hour', (req, res) => {
  try {
    const hourStats = getLoginByHour();
    
    res.json({
      success: true,
      data: hourStats
    });
  } catch (error) {
    console.error('Error fetching hour-based login stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hour-based login stats',
      message: error.message
    });
  }
});

/**
 * GET /analytics/login/peak-times
 * Get peak login times (most active hours)
 */
router.get('/login/peak-times', (req, res) => {
  try {
    const peakTimes = getPeakLoginTimes();
    
    res.json({
      success: true,
      data: {
        peakLoginTimes: peakTimes
      }
    });
  } catch (error) {
    console.error('Error fetching peak login times:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch peak login times',
      message: error.message
    });
  }
});

/**
 * GET /analytics/login/frequency
 * Get user login frequency
 */
router.get('/login/frequency', (req, res) => {
  try {
    const frequency = getUserLoginFrequency();
    
    res.json({
      success: true,
      data: {
        userLoginFrequency: frequency
      }
    });
  } catch (error) {
    console.error('Error fetching login frequency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch login frequency',
      message: error.message
    });
  }
});

/**
 * GET /analytics/login/summary
 * Get summary statistics
 */
router.get('/login/summary', (req, res) => {
  try {
    const totalLogins = getTotalLoginCount();
    const uniqueUsers = getUniqueUsersCount();
    const averageLoginsPerUser = (totalLogins / uniqueUsers).toFixed(2);
    
    res.json({
      success: true,
      data: {
        totalLogins,
        uniqueUsers,
        averageLoginsPerUser,
        reportGeneratedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary',
      message: error.message
    });
  }
});

/**
 * GET /analytics/login/user/:email
 * Get specific user login details
 */
router.get('/login/user/:email', (req, res) => {
  try {
    const { email } = req.params;
    const userStats = getLoginCountByUser();
    const user = userStats[email];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
      message: error.message
    });
  }
});

module.exports = router;
