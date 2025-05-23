import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import styles from './Layout.module.css'; // Import CSS Module
import { useTheme } from '../contexts/ThemeContext';
import useWindowWidth from '../hooks/useWindowWidth'; // Adjust path if needed

const Layout: React.FC = () => {
  const { theme } = useTheme();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const windowWidth = useWindowWidth(); // Use the hook

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]); // Added isInitialLoad to dependency array

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  return (
    <div className={styles.layout}>
      {windowWidth >= 700 ? <Header /> : <MobileNav />}
      <main className={`${styles.mainContent} ${isInitialLoad ? styles.initialWidth : ''}`}>
        <Outlet /> {/* Page content will be rendered here */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
