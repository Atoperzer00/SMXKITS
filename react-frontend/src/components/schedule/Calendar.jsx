import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';

const Calendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventData, setEventData] = useState({});
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    notes: '',
    tags: 'event'
  });

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth: current.getMonth() === currentMonth,
        hasEvent: eventData[dateStr] && eventData[dateStr].length > 0
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (date, dateStr) => {
    setSelectedDate(date);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const handleAddEvent = () => {
    setShowEventCreator(true);
  };

  const handleCloseEventCreator = () => {
    setShowEventCreator(false);
    setEventForm({ name: '', date: '', notes: '', tags: 'event' });
  };

  const handleSaveEvent = () => {
    if (!eventForm.name || !eventForm.date) {
      alert('Please fill in event name and date');
      return;
    }

    const newEventData = { ...eventData };
    if (!newEventData[eventForm.date]) {
      newEventData[eventForm.date] = [];
    }

    newEventData[eventForm.date].push({
      name: eventForm.name,
      notes: eventForm.notes,
      tag: eventForm.tags
    });

    setEventData(newEventData);
    handleCloseEventCreator();
  };

  const handleFormChange = (e) => {
    setEventForm({
      ...eventForm,
      [e.target.name]: e.target.value
    });
  };

  const getEventsForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return eventData[dateStr] || [];
  };

  const goToPEDTraining = () => {
    localStorage.setItem('activeSection', 'screen-ped-training');
    navigate('/smxkits#screen-ped-training');
  };

  const goToOpsLog = () => {
    window.open('/opslog', '_blank');
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const calendarDays = generateCalendarDays();
  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="calendar-layout">
      {/* Sidebar */}
      <aside className="calendar-sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/SE66806_logo_orig.png" alt="SMXKITS Logo" className="logo" />
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-link">
            <span>🏠</span>Dashboard
          </a>
          <a href="#" onClick={goToPEDTraining} className="nav-link">
            <span>🛫</span>Live PED Exercise
          </a>
          <a href="/keyboard-training" className="nav-link">
            <span>⌨️</span>Keyboard Input Training
          </a>
          <a href="#" onClick={goToPEDTraining} className="nav-link">
            <span>🧑‍💻</span>Screener Training
          </a>
          <a href="/mission-links" className="nav-link">
            <span>📡</span>IA Training
          </a>
          <a href="#" onClick={goToOpsLog} className="nav-link">
            <span>📝</span>Grading
          </a>
          <a href="/calendar" className="nav-link active">
            <span>📅</span>Schedule
          </a>
          <a href="/feedback" className="nav-link">
            <span>💬</span>Feedback
          </a>
        </nav>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="calendar-main">
        <div className="calendar-header-section">
          <h1 className="calendar-title">Course Schedule</h1>
          <p className="calendar-subtitle">View your training schedule and upcoming events</p>
        </div>

        <div className="calendar-content">
          {/* Calendar Header */}
          <header className="calendar-header">
            <div className="calendar-controls">
              <div className="month-navigation">
                <button className="nav-btn prev" onClick={handlePrevMonth}>
                  <i className="fas fa-angle-left"></i>
                </button>
                <div className="month-display">
                  <span className="current-month">{months[currentMonth]}</span>
                  <span className="current-year">{currentYear}</span>
                </div>
                <button className="nav-btn next" onClick={handleNextMonth}>
                  <i className="fas fa-angle-right"></i>
                </button>
              </div>
              <button className="today-btn" onClick={handleToday}>
                TODAY
              </button>
            </div>
          </header>

          {/* Calendar Grid */}
          <div className="calendar-container">
            <div className="calendar-sidebar-panel">
              <button className="add-event-btn" onClick={handleAddEvent}>
                add event <i className="fas fa-plus"></i>
              </button>
              <div className="selected-day-display">
                <span className="day-number">{selectedDate.getDate()}</span>
                <span className="day-month">{months[selectedDate.getMonth()]}</span>
              </div>
              <div className="events-list">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event, index) => (
                    <div key={index} className={`event-item event-${event.tag}`}>
                      <div className="event-name">{event.name}</div>
                      {event.notes && <div className="event-notes">{event.notes}</div>}
                    </div>
                  ))
                ) : (
                  <div className="no-events">No events for this day</div>
                )}
              </div>
            </div>

            <div className="calendar-grid-container">
              <div className="calendar-grid">
                {/* Day headers */}
                <div className="calendar-row">
                  {daysOfWeek.map(day => (
                    <div key={day} className="calendar-header-cell">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                {Array.from({ length: 6 }, (_, weekIndex) => (
                  <div key={weekIndex} className="calendar-row">
                    {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`calendar-cell ${
                          !day.isCurrentMonth ? 'other-month' : ''
                        } ${
                          day.date.toDateString() === selectedDate.toDateString() ? 'selected' : ''
                        } ${
                          day.hasEvent ? 'has-event' : ''
                        }`}
                        onClick={() => handleDateClick(day.date, day.dateStr)}
                      >
                        <p>{day.date.getDate()}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Creator Modal */}
        {showEventCreator && (
          <div className="modal-overlay">
            <div className="event-creator">
              <button className="close-btn" onClick={handleCloseEventCreator}>
                CLOSE <i className="fas fa-times"></i>
              </button>
              <form className="event-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Event name"
                  value={eventForm.name}
                  onChange={handleFormChange}
                />
                <input
                  type="date"
                  name="date"
                  value={eventForm.date}
                  onChange={handleFormChange}
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  rows="10"
                  value={eventForm.notes}
                  onChange={handleFormChange}
                />
                <select
                  name="tags"
                  value={eventForm.tags}
                  onChange={handleFormChange}
                >
                  <option value="event">event</option>
                  <option value="important">important</option>
                  <option value="birthday">birthday</option>
                  <option value="festivity">festivity</option>
                </select>
              </form>
              <button className="save-btn" onClick={handleSaveEvent}>
                SAVE <i className="fas fa-save"></i>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Calendar;