const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get events for a class within date range
router.get('/class/:classId/events', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { start, end, type, status } = req.query;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if user has access to this class
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     classDoc.students.includes(req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const events = await Event.getClassEvents(classId, startDate, endDate, { type, status });

    // Filter events based on visibility and user role
    const filteredEvents = events.filter(event => {
      if (req.user.role === 'admin' || classDoc.instructors.includes(req.user.id)) {
        return true; // Instructors and admins see all events
      }
      return event.visibility !== 'private'; // Students don't see private events
    });

    res.json(filteredEvents);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get upcoming events for a class
router.get('/class/:classId/upcoming', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 10 } = req.query;

    // Verify access to class
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

    const events = await Event.getUpcoming(classId, parseInt(limit));

    // Filter based on visibility
    const filteredEvents = events.filter(event => {
      if (req.user.role === 'admin' || classDoc.instructors.includes(req.user.id)) {
        return true;
      }
      return event.visibility !== 'private';
    });

    res.json(filteredEvents);
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// Get today's events for a class
router.get('/class/:classId/today', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify access to class
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

    const events = await Event.getTodaysEvents(classId);

    // Filter based on visibility
    const filteredEvents = events.filter(event => {
      if (req.user.role === 'admin' || classDoc.instructors.includes(req.user.id)) {
        return true;
      }
      return event.visibility !== 'private';
    });

    res.json(filteredEvents);
  } catch (error) {
    console.error('Failed to fetch today\'s events:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s events' });
  }
});

// Create a new event (instructors and admins only)
router.post('/events', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      allDay,
      classId,
      location,
      virtualMeeting,
      reminders,
      color,
      priority,
      visibility,
      recurring
    } = req.body;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const event = new Event({
      title,
      description,
      type,
      startDate: start,
      endDate: end,
      allDay,
      classId,
      createdBy: req.user.id,
      location,
      virtualMeeting,
      reminders,
      color,
      priority,
      visibility,
      recurring
    });

    await event.save();
    await event.populate('createdBy', 'name');

    // Notify students via Socket.IO
    if (req.io && visibility !== 'private') {
      req.io.to(`class-${classId}`).emit('new-event', {
        event: event.toObject(),
        createdBy: event.createdBy.name
      });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update an event
router.put('/events/:eventId', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify access
    const classDoc = await Class.findById(event.classId);
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     event.createdBy.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate dates if they're being updated
    if (updates.startDate || updates.endDate) {
      const startDate = new Date(updates.startDate || event.startDate);
      const endDate = new Date(updates.endDate || event.endDate);
      
      if (startDate >= endDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }

    Object.assign(event, updates);
    event.updatedAt = new Date();
    
    await event.save();
    await event.populate('createdBy', 'name');

    // Notify students via Socket.IO
    if (req.io && event.visibility !== 'private') {
      req.io.to(`class-${event.classId}`).emit('event-updated', {
        event: event.toObject(),
        updatedBy: event.createdBy.name
      });
    }

    res.json(event);
  } catch (error) {
    console.error('Failed to update event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete an event
router.delete('/events/:eventId', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify access
    const classDoc = await Class.findById(event.classId);
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     event.createdBy.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Event.findByIdAndDelete(eventId);

    // Notify students via Socket.IO
    if (req.io && event.visibility !== 'private') {
      req.io.to(`class-${event.classId}`).emit('event-deleted', {
        eventId,
        title: event.title
      });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Failed to delete event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get event details
router.get('/events/:eventId', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('createdBy', 'name');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify access
    const classDoc = await Class.findById(event.classId);
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     classDoc.students.includes(req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check visibility for students
    if (req.user.role === 'student' && event.visibility === 'private') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    console.error('Failed to fetch event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Update event status
router.patch('/events/:eventId/status', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'in-progress', 'completed', 'cancelled', 'postponed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify access
    const classDoc = await Class.findById(event.classId);
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     event.createdBy.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    event.status = status;
    await event.save();

    // Notify students via Socket.IO
    if (req.io && event.visibility !== 'private') {
      req.io.to(`class-${event.classId}`).emit('event-status-changed', {
        eventId,
        title: event.title,
        status,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Event status updated successfully', status });
  } catch (error) {
    console.error('Failed to update event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// Get calendar summary for instructor dashboard
router.get('/class/:classId/summary', auth(['instructor', 'admin']), async (req, res) => {
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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get various event counts and lists
    const [
      todaysEvents,
      upcomingEvents,
      activeEvents,
      totalEvents
    ] = await Promise.all([
      Event.getTodaysEvents(classId),
      Event.getUpcoming(classId, 5),
      Event.find({ 
        classId, 
        startDate: { $lte: now }, 
        endDate: { $gte: now },
        status: 'in-progress'
      }),
      Event.countDocuments({ classId })
    ]);

    // Get events by type for the next 30 days
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const eventsByType = await Event.aggregate([
      {
        $match: {
          classId: classDoc._id,
          startDate: { $gte: now, $lte: thirtyDaysFromNow }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      summary: {
        todaysEventsCount: todaysEvents.length,
        upcomingEventsCount: upcomingEvents.length,
        activeEventsCount: activeEvents.length,
        totalEventsCount: totalEvents
      },
      todaysEvents,
      upcomingEvents,
      activeEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Failed to fetch calendar summary:', error);
    res.status(500).json({ error: 'Failed to fetch calendar summary' });
  }
});

module.exports = router;