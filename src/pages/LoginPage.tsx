import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react'; // Correct type-only import for FormEvent
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css'; // Import CSS Module

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false); // To toggle between login and register
  
  const { login, register, error, loading, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/'); // Redirect if already logged in
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (isRegistering) {
      await register(email, password);
    } else {
      await login(email, password);
    }
    // Navigation on success is handled by the useEffect above or can be done here
    // if (user) navigate('/'); 
  };

  return (
    <div className={styles.loginContainer}>
      <h2 className={styles.formTitle}>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            // className={styles.formInput} // Uses global input styles
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.formLabel}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            // className={styles.formInput} // Uses global input styles
          />
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <button 
          type="submit" 
          disabled={loading} 
          className="btn" // Using global .btn style
        >
          {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
        </button>
      </form>
      <button 
        onClick={() => setIsRegistering(!isRegistering)} 
        disabled={loading}
        className={`${styles.toggleButton} btn`} // Combine for base button styles + specific toggle styles
      >
        {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
      </button>
    </div>
  );
};

export default LoginPage;
