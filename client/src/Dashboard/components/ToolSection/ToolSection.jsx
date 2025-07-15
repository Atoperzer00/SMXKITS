import React from 'react';
import PropTypes from 'prop-types';
import { FaTools } from 'react-icons/fa';

import './ToolSection.css';

/**
 * Renders a titled section that displays a grid of tool "cards".
 *
 * @param {string}     title     Section heading
 * @param {string}     icon      Font-Awesome class for the heading icon
 * @param {ToolItem[]} tools     Array of tool objects (see PropTypes below)
 * @param {string[]}   extraCls  Extra class names to append to <section>
 */
export default function ToolSection({ title, icon, tools, extraCls = [] }) {
  return (
    <section className={['tool-section', ...extraCls].join(' ')}>
      <h2 className="section-title">
        <i>{icon}</i> {title}
      </h2>

      <div className="tools-grid">
        {tools.map(
          ({ id, title, description, icon, onClick, badge }) => (
            <div key={id} className="tool-card" onClick={onClick}>
              <div className="tool-icon">
                {icon}
              </div>

              <h3 className="tool-title">{title}</h3>
              <p className="tool-description">{description}</p>

              {badge && <div className="badge">{badge}</div>}
            </div>
          )
        )}
      </div>
    </section>
  );
}

ToolSection.propTypes = {
  title:    PropTypes.string.isRequired,
  icon:     PropTypes.string,
  tools:    PropTypes.arrayOf(
              PropTypes.shape({
                id:          PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                title:       PropTypes.string.isRequired,
                description: PropTypes.string.isRequired,
                icon:        PropTypes.func.isRequired,
                onClick:     PropTypes.func.isRequired,
                badge:       PropTypes.string,          // optional
              })
            ).isRequired,
  extraCls: PropTypes.arrayOf(PropTypes.string),
};

ToolSection.defaultProps = {
  icon: <FaTools />,
};
