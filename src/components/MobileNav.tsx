import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MobileNav.module.css';

const NAV_TABS = [
  { label: 'Home', icon: '🏠', route: '/' },
  { label: 'Gallery', icon: '📷', route: '/gallery' },
  { label: 'Events', icon: '📅', route: '/events' },
  { label: 'Blogs', icon: '📝', route: '/blogs' },
  { label: 'Family', icon: '🌳', route: '/family-tree' },
  { label: 'History', icon: '📖', route: '/about' },
];

const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className={styles.mobileBottomNav}>
      {NAV_TABS.map(tab => (
        <button
          key={tab.label}
          className={
            `${styles.mobileNavButton} ${location.pathname === tab.route ? styles.active : ''}`
          }
          onClick={() => navigate(tab.route)}
          aria-label={tab.label}
          type="button"
        >
          <span className={styles.mobileNavIcon}>{tab.icon}</span>
          <span className={styles.mobileNavLabel}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
