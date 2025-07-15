import React from 'react';
import './Sidebar.css';
import logo from '../../assets/smx_kits.png';
import { 
    FaTachometerAlt, 
    FaInbox,
    FaGraduationCap,
    FaCalendarAlt,
    FaChalkboardTeacher,
    FaUserGraduate,
    FaStar,
    FaLightbulb,
    FaClipboardCheck,
    FaBroadcastTower,
    FaComments,
    FaSignOutAlt
} from 'react-icons/fa';

const AdminSidebar = () => {
    const handleRedirect = (url) => {
        window.location.href = url;
    };

    const handleLogout = () => {
        // replace with actual logout logic
        console.log('Logging out...');
    };

    return (
        <aside className="admin-sidebar">
            <img src={logo} alt="SMXKITS Logo" className="admin-logo" />
            <ul className="admin-nav">
                <li className="active">
                    <FaTachometerAlt /> Dashboard
                </li>
                <li onClick={() => handleRedirect('instructor-inbox.html')}>
                    <FaInbox /> Inbox
                </li>
                <li onClick={() => handleRedirect('dashboard.html')}>
                    <FaGraduationCap /> Student Training Hub
                </li>
                <li>
                    <FaCalendarAlt /> Calendar{' '}
                    <span style={{ fontSize: '0.7rem', color: '#f093fb', opacity: 0.8 }}>
                        (Needs link)
                    </span>
                </li>
                <li onClick={() => handleRedirect('add-class.html')}>
                    <FaChalkboardTeacher /> Classes
                </li>
                <li onClick={() => handleRedirect('add-student.html')}>
                    <FaUserGraduate /> Students
                </li>
                <li onClick={() => handleRedirect('instructor-grading.html')}>
                    <FaStar /> Student Grading
                </li>
                <li onClick={() => handleRedirect('lessons-learned.html')}>
                    <FaLightbulb /> Lessons Learned
                </li>
                <li onClick={() => handleRedirect('attendance.html')}>
                    <FaClipboardCheck /> Attendance
                </li>
                <li onClick={() => handleRedirect('mission-links.html')}>
                    <FaBroadcastTower /> Live Controls
                </li>
                <li onClick={() => handleRedirect('instructor-feedback.html')}>
                    <FaComments /> Feedback
                </li>
                <li onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                </li>
            </ul>
        </aside>
    );
};

export default AdminSidebar;
