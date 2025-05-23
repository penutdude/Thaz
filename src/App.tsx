import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AboutPage from './pages/AboutPage';
import FamilyTreePage from './pages/FamilyTreePage';
import LoginPage from './pages/LoginPage';
import GalleryPage from './pages/GalleryPage';
import BlogsPage from './pages/BlogsPage';
import SinglePostPage from './pages/SinglePostPage';
import EventsPage from './pages/EventsPage';
import SingleEventPage from './pages/SingleEventPage';
import IndexPage from './pages/IndexPage';
import MemberPage from './components/familyTree/MemberPage';
import SwipeTutorial from './components/SwipeTutorial';
import MobileNav from './components/MobileNav';
import type { FamilyMember } from './types';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/family-tree" element={<FamilyTreePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/blogs/:postId" element={<SinglePostPage />} />
            <Route path="/events/:eventId" element={<SingleEventPage />} />
            <Route path="/family-tree/member/:memberId" element={<MemberPageWrapper />} />
          </Routes>
          <MobileNav />
          <SwipeTutorial />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

// Wrapper to fetch member by ID from params and pass to MemberPage
const MemberPageWrapper: React.FC = () => {
  const { memberId } = useParams();
  const [member, setMember] = React.useState<FamilyMember | null>(null);
  React.useEffect(() => {
    if (memberId) {
      import('./firebase/familyTree').then(({ fetchFamilyMembers }) => {
        fetchFamilyMembers().then(members => {
          setMember(members.find(m => m.id === memberId) || null);
        });
      });
    }
  }, [memberId]);
  if (!member) return <div>Loading member...</div>;
  return <MemberPage member={member} onClose={() => window.history.back()} />;
};

export default App;
