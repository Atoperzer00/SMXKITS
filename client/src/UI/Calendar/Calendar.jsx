import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // needed for select
import './Calendar.css';

function Calendar({ classEvents = [], showNotification = () => {} }) {
  const calendarRef = useRef(null);

  const handleDateSelect = (info) => {
    const eventTitle = prompt('📅 Add new event:');
    if (eventTitle) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.addEvent({
        title: eventTitle,
        start: info.startStr,
        end: info.endStr,
        allDay: true,
        color: '#8bc34a',
        textColor: '#fff',
      });
      showNotification('✅ Event added successfully!', 'success');
      // TODO: Save to backend
    }
  };

  const handleEventClick = (info) => {
    const event = info.event;
    const props = event.extendedProps;
    let details = `📚 ${event.title}\n📅 ${event.start.toDateString()}`;
    if (props.instructor) details += `\n👨‍🏫 Instructor: ${props.instructor}`;
    if (props.students) details += `\n👥 Students: ${props.students}`;

    alert(details);
  };

  const handleEventMount = (info) => {
    const el = info.el;
    el.style.borderRadius = '8px';
    el.style.border = 'none';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    el.style.transition = 'all 0.3s ease';

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.02)';
      el.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
  };

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        selectable={true}
        events={classEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDidMount={handleEventMount}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek',
        }}
      />
    </div>
  );
}

export default Calendar;
