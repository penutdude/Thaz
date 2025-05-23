import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Corrected import for useAuth
import styles from './AboutPage.module.css'; // Import CSS Module

const NAV_TABS = [
  { label: 'Blogs', icon: '📝', route: '/blogs' },
  { label: 'Gallery', icon: '📷', route: '/gallery' },
  { label: 'Events', icon: '📅', route: '/events' },
  { label: 'Family Tree', icon: '🌳', route: '/family-tree' },
  { label: 'History', icon: '📖', route: '/about' },
];

const AboutPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('History');
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  const handleTabClick = (tab: { label: string; route: string }) => {
    setActiveTab(tab.label);
    if (window.location.pathname !== tab.route) {
      navigate(tab.route);
    }
  };

  return (
    <div className={styles.bookLayout}>
      <aside className={styles.bookSpine}>
        <div className={styles.spineLogo} title="Family Crest">F</div>
        <nav className={styles.bookmarksNav}>
          {NAV_TABS.map(tab => (
            <button
              key={tab.label}
              className={
                activeTab === tab.label
                  ? `${styles.bookmarkTab} ${styles.active}`
                  : styles.bookmarkTab
              }
              onClick={() => handleTabClick(tab)}
              aria-label={tab.label}
              type="button"
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
          {currentUser ? (
            <button
              className={styles.logoutButton}
              onClick={async () => {
                if (window.confirm('Are you sure you want to log out?')) {
                  await logout();
                  navigate('/login');
                }
              }}
              type="button"
            >
              Log Out
            </button>
          ) : (
            <button
              className={styles.logoutButton}
              onClick={() => navigate('/login')}
              type="button"
            >
              Log In
            </button>
          )}
        </nav>
      </aside>
      <main className={styles.bookPage}>
        <header className={styles.bookHeader}>Family History</header>
        <div className={styles.marginNote}>"Remember our journey!"</div>
        <div className={styles.bookContent}>
          <div style={{textAlign: 'center', marginBottom: '1.2rem', zIndex: 1, position: 'relative'}}>
            <span style={{fontSize: '2.5rem', color: '#bfa76a', filter: 'drop-shadow(0 2px 2px #e2cfa3)'}}>📜</span>
            <div style={{fontFamily: 'EB Garamond, Georgia, serif', color: '#7c5a1a', fontSize: '1.15rem', marginTop: '0.3rem', letterSpacing: '1px'}}>A Chronicle of Our Family's Journey</div>
          </div>
          <h2>History</h2>
          <p>This is a place for our family to connect, share news, events, and precious memories. Explore the different sections to learn more about our family's journey.</p>
          <p>Welcome to the official online hub for the Thazhuthedath family! Our roots run deep, and this website serves as a digital gathering place to celebrate our heritage, share our stories, and keep our bonds strong across generations and geographies.</p>
          <p>Here, you'll find a gallery filled with cherished memories, a calendar of family events to keep everyone connected, and a blog where family members can share news, thoughts, and stories. We encourage everyone to participate, contribute, and help make this a vibrant space for all of us.</p>
          <p>Whether you're looking to reminisce over old photos, find out about the next family reunion, or catch up on the latest family news, you've come to the right place. This is more than just a website; it's a testament to our family's enduring spirit and connection.</p>
        </div>
        <footer className={styles.bookFooter}>Page 5 &mdash; Thazhuthedath Family</footer>
      </main>
    </div>
  );
};

export default AboutPage;
