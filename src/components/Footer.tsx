import React from 'react';
import styles from './Footer.module.css'; // Import CSS Module

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <p>&copy; {new Date().getFullYear()} Thazhuthedath Family. All rights reserved.</p>
      {/* You can add more footer content here if needed */}
    </footer>
  );
};

export default Footer;
