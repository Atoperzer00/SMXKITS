import React from 'react';
import PropTypes from 'prop-types';
import './UpcomingSessions.css'; // optional styles

export default function UpcomingSessions({ title, Icon, sessions }) {
  return (
    <section className="upcoming-sessions-widget">
      <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {Icon && <Icon />} {title}
      </h3>

      <div style={{ marginTop: '1.5rem' }}>
        {sessions.map((session, index) => (
          <div
            key={index}
            style={{
              padding: '1rem',
              borderLeft: `4px solid ${session.color}`,
              background: `${session.color}1A`,
              borderRadius: '0 10px 10px 0',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{session.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <i className="fas fa-calendar" style={{ marginRight: '0.5rem' }}></i>
              {session.date}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

UpcomingSessions.propTypes = {
  title: PropTypes.string,
  Icon: PropTypes.elementType, // A component, not a JSX element
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
};

UpcomingSessions.defaultProps = {
  title: 'Upcoming Sessions',
  Icon: null,
};
