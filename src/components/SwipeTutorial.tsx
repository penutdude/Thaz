import React, { useState, useEffect } from 'react';
import styles from './SwipeTutorial.module.css';

const TUTORIAL_SEEN_KEY = 'swipeTutorialSeen';

const SwipeTutorial: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(TUTORIAL_SEEN_KEY);
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles['swipe-tutorial-overlay']}>
      <div className={styles['swipe-tutorial-content']}>
        <h2>Welcome!</h2>
        <p>Swipe left or right to navigate between pages.</p>
        <button onClick={handleCloseTutorial}>Got it!</button>
      </div>
    </div>
  );
};

export default SwipeTutorial;
