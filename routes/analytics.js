const express = require('express');
const router = express.Router();
const { StudentActivity, ClassAnalytics } = require('../models/Analytics');
const Class = require('../models/Class');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

// Log student activity
router.post('/activity', auth(['student', 'instructor', 'admin']), async (req, res) => {
  try {
    const {
      classId,
      sessionId,
      activityType,
      details,
      ipAddress,
      userAgent,
      location
    } = req.body;

    // Verify access to class
    if (classId) {
      const classDoc = await Class.findById(classId);
      if (!classDoc) {
        return res.status(404).json({ error: 'Class not found' });
      }

      const hasAccess = req.user.role === 'admin' || 
                       classDoc.instructors.includes(req.user.id) ||
                       classDoc.students.includes(req.user.id);

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const activity = await StudentActivity.logActivity({
      studentId: req.user.id,
      classId,
      sessionId,
      activityType,
      details,
      ipAddress,
      userAgent,
      location
    });

    // Broadcast real-time activity to instructors
    if (req.io && classId) {
      req.io.to(`instructor-${classId}`).emit('student-activity-logged', {
        studentId: req.user.id,
        studentName: req.user.name,
        activityType,
        timestamp: activity.timestamp,
        details
      });
    }

    res.status(201).json({ message: 'Activity logged successfully', activityId: activity._id });
  } catch (error) {
    console.error('Failed to log activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get class analytics dashboard
router.get('/class/:classId/dashboard', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { period = 'daily', days = 30 } = req.query;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current analytics
    const currentAnalytics = await ClassAnalytics.getPerformanceMetrics(classId, period);
    
    // Get engagement trends
    const engagementTrends = await ClassAnalytics.getEngagementTrends(classId, parseInt(days));
    
    // Get recent student activity
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const recentActivity = await StudentActivity.getClassActivity(classId, null, startDate, endDate);
    
    // Get class statistics
    const totalStudents = classDoc.students.length;
    const totalAssignments = await Assignment.countDocuments({ classId });
    const totalSubmissions = await Submission.countDocuments({ classId });
    
    // Calculate active students (logged in within last 7 days)
    const activeStudentIds = new Set(
      recentActivity
        .filter(activity => activity.activityType === 'login')
        .map(activity => activity.studentId._id.toString())
    );
    
    // Get at-risk students
    const atRiskStudents = currentAnalytics?.studentMetrics?.filter(
      student => student.riskLevel === 'high'
    ) || [];

    // Compile dashboard data
    const dashboard = {
      overview: {
        totalStudents,
        activeStudents: activeStudentIds.size,
        totalAssignments,
        totalSubmissions,
        engagementRate: totalStudents > 0 ? (activeStudentIds.size / totalStudents * 100).toFixed(1) : 0,
        averageGrade: currentAnalytics?.metrics?.averageGrade || 0,
        atRiskCount: atRiskStudents.length
      },
      currentMetrics: currentAnalytics?.metrics || {},
      engagementTrends: engagementTrends.map(trend => ({
        date: trend.date,
        activeStudents: trend.metrics.activeStudents,
        sessionDuration: trend.metrics.averageSessionDuration,
        engagement: trend.metrics.totalSessions
      })),
      activityPatterns: currentAnalytics?.activityPatterns || {},
      atRiskStudents: atRiskStudents.map(student => ({
        studentId: student.studentId,
        riskLevel: student.riskLevel,
        lastActive: student.lastActive,
        participationScore: student.participationScore
      })),
      recentActivity: recentActivity.slice(0, 20).map(activity => ({
        studentName: activity.studentId.name,
        activityType: activity.activityType,
        timestamp: activity.timestamp,
        details: activity.details
      }))
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Failed to fetch analytics dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch analytics dashboard' });
  }
});

// Get student performance analytics
router.get('/class/:classId/students', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, sortBy = 'name', order = 'asc' } = req.query;

    // Verify access to class
    const classDoc = await Class.findById(classId).populate('students', 'name email');
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get analytics for each student
    const studentAnalytics = await Promise.all(
      classDoc.students.map(async (student) => {
        // Get student activities
        const activities = await StudentActivity.getStudentActivity(student._id, classId, start, end);
        
        // Get student submissions
        const submissions = await Submission.find({
          studentId: student._id,
          classId,
          createdAt: { $gte: start, $lte: end }
        }).populate('assignmentId', 'title points');

        // Calculate metrics
        const loginCount = activities.filter(a => a.activityType === 'login').length;
        const totalSessionTime = activities
          .filter(a => a.details?.timeSpent)
          .reduce((total, a) => total + a.details.timeSpent, 0);
        
        const assignmentSubmissions = submissions.length;
        const totalPoints = submissions.reduce((total, sub) => total + (sub.grade || 0), 0);
        const maxPoints = submissions.reduce((total, sub) => total + (sub.assignmentId?.points || 0), 0);
        const averageGrade = maxPoints > 0 ? (totalPoints / maxPoints * 100) : 0;

        // Calculate participation score
        const participationActivities = activities.filter(a => 
          ['chat-message', 'whiteboard-edit', 'exercise-participate', 'quiz-complete'].includes(a.activityType)
        ).length;
        
        const participationScore = Math.min(participationActivities * 10, 100); // Max 100

        // Determine risk level
        let riskLevel = 'low';
        let riskScore = 0;
        
        if (loginCount < 5) riskScore += 2;
        if (totalSessionTime < 1800) riskScore += 2; // Less than 30 minutes
        if (assignmentSubmissions < 2) riskScore += 3;
        if (averageGrade < 70) riskScore += 3;
        if (participationScore < 30) riskScore += 2;
        
        const daysSinceLastActivity = activities.length > 0 ? 
          (new Date() - activities[0].timestamp) / (1000 * 60 * 60 * 24) : 999;
        if (daysSinceLastActivity > 7) riskScore += 3;
        
        if (riskScore >= 8) riskLevel = 'high';
        else if (riskScore >= 4) riskLevel = 'medium';

        return {
          studentId: student._id,
          name: student.name,
          email: student.email,
          metrics: {
            loginCount,
            totalSessionTime: Math.round(totalSessionTime / 60), // in minutes
            assignmentSubmissions,
            averageGrade: Math.round(averageGrade * 100) / 100,
            participationScore,
            lastActive: activities.length > 0 ? activities[0].timestamp : null,
            riskLevel,
            riskScore
          },
          recentActivities: activities.slice(0, 10).map(a => ({
            type: a.activityType,
            timestamp: a.timestamp,
            details: a.details
          }))
        };
      })
    );

    // Sort students
    studentAnalytics.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'grade':
          aValue = a.metrics.averageGrade;
          bValue = b.metrics.averageGrade;
          break;
        case 'participation':
          aValue = a.metrics.participationScore;
          bValue = b.metrics.participationScore;
          break;
        case 'risk':
          aValue = a.metrics.riskScore;
          bValue = b.metrics.riskScore;
          break;
        case 'lastActive':
          aValue = a.metrics.lastActive || new Date(0);
          bValue = b.metrics.lastActive || new Date(0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (order === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    res.json(studentAnalytics);
  } catch (error) {
    console.error('Failed to fetch student analytics:', error);
    res.status(500).json({ error: 'Failed to fetch student analytics' });
  }
});

// Get content analytics
router.get('/class/:classId/content', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get material download analytics
    const materialDownloads = await StudentActivity.aggregate([
      {
        $match: {
          classId: classDoc._id,
          activityType: 'material-download',
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$details.materialId',
          downloads: { $sum: 1 },
          uniqueStudents: { $addToSet: '$studentId' }
        }
      },
      {
        $project: {
          materialId: '$_id',
          downloads: 1,
          uniqueStudents: { $size: '$uniqueStudents' }
        }
      },
      { $sort: { downloads: -1 } },
      { $limit: 10 }
    ]);

    // Get video watch analytics
    const videoAnalytics = await StudentActivity.aggregate([
      {
        $match: {
          classId: classDoc._id,
          activityType: 'video-watch',
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$details.videoId',
          totalWatchTime: { $sum: '$details.watchTime' },
          views: { $sum: 1 },
          uniqueViewers: { $addToSet: '$studentId' }
        }
      },
      {
        $project: {
          videoId: '$_id',
          totalWatchTime: 1,
          views: 1,
          uniqueViewers: { $size: '$uniqueViewers' },
          averageWatchTime: { $divide: ['$totalWatchTime', '$views'] }
        }
      },
      { $sort: { totalWatchTime: -1 } },
      { $limit: 10 }
    ]);

    // Get assignment performance analytics
    const assignmentAnalytics = await Assignment.aggregate([
      { $match: { classId: classDoc._id } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'assignmentId',
          as: 'submissions'
        }
      },
      {
        $project: {
          title: 1,
          points: 1,
          dueDate: 1,
          submissionCount: { $size: '$submissions' },
          averageGrade: { $avg: '$submissions.grade' },
          onTimeSubmissions: {
            $size: {
              $filter: {
                input: '$submissions',
                cond: { $lte: ['$$this.submittedAt', '$dueDate'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ['$submissionCount', classDoc.students.length] },
              100
            ]
          },
          onTimeRate: {
            $multiply: [
              { $divide: ['$onTimeSubmissions', '$submissionCount'] },
              100
            ]
          }
        }
      },
      { $sort: { averageGrade: 1 } }
    ]);

    res.json({
      materialDownloads,
      videoAnalytics,
      assignmentAnalytics,
      summary: {
        totalMaterialDownloads: materialDownloads.reduce((sum, item) => sum + item.downloads, 0),
        totalVideoWatchTime: videoAnalytics.reduce((sum, item) => sum + item.totalWatchTime, 0),
        averageAssignmentGrade: assignmentAnalytics.reduce((sum, item) => sum + (item.averageGrade || 0), 0) / assignmentAnalytics.length,
        averageCompletionRate: assignmentAnalytics.reduce((sum, item) => sum + (item.completionRate || 0), 0) / assignmentAnalytics.length
      }
    });
  } catch (error) {
    console.error('Failed to fetch content analytics:', error);
    res.status(500).json({ error: 'Failed to fetch content analytics' });
  }
});

// Generate daily analytics report
router.post('/class/:classId/generate-report', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.body;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reportDate = date ? new Date(date) : new Date();
    const analytics = await ClassAnalytics.generateDailyReport(classId, reportDate);

    res.json({
      message: 'Analytics report generated successfully',
      analytics
    });
  } catch (error) {
    console.error('Failed to generate analytics report:', error);
    res.status(500).json({ error: 'Failed to generate analytics report' });
  }
});

// Get real-time class activity
router.get('/class/:classId/realtime', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get activities from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const realtimeActivity = await StudentActivity.getClassActivity(classId, null, oneHourAgo, new Date());

    // Get currently active students (activity in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeStudents = await StudentActivity.aggregate([
      {
        $match: {
          classId: classDoc._id,
          timestamp: { $gte: fiveMinutesAgo }
        }
      },
      {
        $group: {
          _id: '$studentId',
          lastActivity: { $max: '$timestamp' },
          activityCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $project: {
          studentId: '$_id',
          studentName: { $arrayElemAt: ['$student.name', 0] },
          lastActivity: 1,
          activityCount: 1
        }
      }
    ]);

    res.json({
      realtimeActivity: realtimeActivity.slice(0, 50).map(activity => ({
        studentName: activity.studentId.name,
        activityType: activity.activityType,
        timestamp: activity.timestamp,
        details: activity.details
      })),
      activeStudents,
      summary: {
        totalActivities: realtimeActivity.length,
        activeStudentCount: activeStudents.length,
        mostActiveStudent: activeStudents.length > 0 ? 
          activeStudents.reduce((prev, current) => 
            prev.activityCount > current.activityCount ? prev : current
          ) : null
      }
    });
  } catch (error) {
    console.error('Failed to fetch real-time analytics:', error);
    res.status(500).json({ error: 'Failed to fetch real-time analytics' });
  }
});

// Export analytics data
router.get('/class/:classId/export', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all data for export
    const [activities, analytics, students] = await Promise.all([
      StudentActivity.getClassActivity(classId, null, start, end),
      ClassAnalytics.getEngagementTrends(classId, 30),
      User.find({ _id: { $in: classDoc.students } }, 'name email')
    ]);

    const exportData = {
      classInfo: {
        id: classDoc._id,
        name: classDoc.name,
        description: classDoc.description,
        studentCount: classDoc.students.length
      },
      dateRange: { start, end },
      students: students.map(s => ({ id: s._id, name: s.name, email: s.email })),
      activities: activities.map(a => ({
        studentId: a.studentId._id,
        studentName: a.studentId.name,
        activityType: a.activityType,
        timestamp: a.timestamp,
        details: a.details
      })),
      analytics: analytics.map(a => ({
        date: a.date,
        metrics: a.metrics,
        activityPatterns: a.activityPatterns
      })),
      exportedAt: new Date(),
      exportedBy: req.user.name
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = activities.map(a => 
        `${a.studentId.name},${a.activityType},${a.timestamp.toISOString()},${JSON.stringify(a.details)}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="class-${classId}-analytics.csv"`);
      res.send(`Student,Activity Type,Timestamp,Details\n${csv}`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="class-${classId}-analytics.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Failed to export analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

module.exports = router;