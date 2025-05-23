import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import styles from './IndexPage.module.css';

const IndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleOpen = () => {
    navigate('/blogs');
  };

  return (
    <div className={`${styles.bookCover} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.spine}>
        <span>Thazhuthedath Family</span>
      </div>
      <div className={styles.coverContent}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Thazhuthedath Family</h1>
          <div className={styles.subtitle}>A Journey Through Generations</div>
        </div>
        <div className={styles.crest}>F</div>
        <div className={styles.year}>Est. 1900</div>
        <button onClick={handleOpen} className={styles.openButton}>
          Open Book
        </button>
      </div>
      <div className={styles.cornerDecoration}></div>
    </div>
  );
};

export default IndexPage;