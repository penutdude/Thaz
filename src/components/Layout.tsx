import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import styles from './Layout.module.css'; // Import CSS Module
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC = () => {
  const { theme } = useTheme();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  return (
    <div className={styles.layout}>
      <Header />
      <main className={`${styles.mainContent} ${isInitialLoad ? styles.initialWidth : ''}`}>
        <Outlet /> {/* Page content will be rendered here */}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Layout;
