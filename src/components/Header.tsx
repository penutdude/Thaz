import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Header.module.css'; // Import CSS Module

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const getNavLinkStyle = ({ isActive }: { isActive: boolean }) => {
    return isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logoLink}>
          Thazhuthedath Family
        </Link>
        <ul className={styles.navList}>
          <li><NavLink to="/" className={getNavLinkStyle} end>Home</NavLink></li>
          <li><NavLink to="/gallery" className={getNavLinkStyle}>Gallery</NavLink></li>
          <li><NavLink to="/events" className={getNavLinkStyle}>Events</NavLink></li>
          <li><NavLink to="/blogs" className={getNavLinkStyle}>Blogs</NavLink></li>
          <li><NavLink to="/family-tree" className={getNavLinkStyle}>Family Tree</NavLink></li>
          <li><NavLink to="/about" className={getNavLinkStyle}>History</NavLink></li>
        </ul>
        <div className={styles.rightElementsContainer}> {/* New container for right-aligned elements */}
          {authLoading ? (
            <span className={styles.authLoading}>Loading...</span>
          ) : currentUser ? (
            <button onClick={handleLogout} className={`${styles.navButton} ${styles.logoutButton}`} title={`Logout (${currentUser.email?.split('@')[0]})`}>
              {/* Logout icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          ) : (
            <NavLink to="/login" className={getNavLinkStyle}>Login</NavLink>
          )}
          <div className={styles.themeToggleContainer}> {/* Container for Theme Toggle Button */}
             <button onClick={toggleTheme} title="Toggle Theme" className={`${styles.navButton} ${styles.themeToggleButton}`}>
              {theme === 'light' ? (
                // Moon icon for light mode (switch to dark)
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                // Sun icon for dark mode (switch to light)
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
              )}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
