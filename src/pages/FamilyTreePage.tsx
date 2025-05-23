import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { ReactFlowProvider } from 'reactflow'; // Import ReactFlowProvider
import { useTheme } from '../contexts/ThemeContext'; // Import useTheme
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { fetchFamilyMembers } from '../firebase/familyTree'; // Import fetchFamilyMembers
import FamilyTreeCanvas from '../components/FamilyTreeCanvas'; // Import the FamilyTreeCanvas component
import AddMemberForm from '../components/familyTree/AddMemberForm';
import AddRelationshipForm from '../components/familyTree/AddRelationshipForm';
import EditMemberForm from '../components/familyTree/EditMemberForm';
import type { FamilyMember } from '../types';
import styles from './FamilyTreePage.module.css'; // Import CSS Module

const NAV_TABS = [
  { label: 'Blogs', icon: '📝', route: '/blogs' },
  { label: 'Gallery', icon: '📷', route: '/gallery' },
  { label: 'Events', icon: '📅', route: '/events' },
  { label: 'Family Tree', icon: '🌳', route: '/family-tree' },
  { label: 'History', icon: '📖', route: '/about' },
];

const FamilyTreePage: React.FC = () => {
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showAddRelationshipForm, setShowAddRelationshipForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Family Tree');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Filter members based on search query
  const filteredMembers = familyMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleDataChange = () => {
    console.log("Family tree data changed. Triggering refresh in canvas...");
  };

  const handleMemberAdded = () => {
    setShowAddMemberForm(false);
    handleDataChange(); // Trigger data refresh
  };

  const handleRelationshipAdded = () => {
    setShowAddRelationshipForm(false);
    handleDataChange(); // Trigger data refresh
  };

  const handleNodeClick = (member: FamilyMember) => {
    console.log("Node clicked:", member); // Add console log
    setEditingMember(member); // Set the member to be edited
    setShowAddMemberForm(false);
    setShowAddRelationshipForm(false);
  };

  const handleMemberUpdated = () => {
    setEditingMember(null); // Close edit form
    handleDataChange(); // Trigger data refresh
  };

  const handleCancelEdit = () => {
    setEditingMember(null); // Close edit form
  };

  const navigate = useNavigate();

  const handleTabClick = (tab: { label: string; route: string }) => {
    setActiveTab(tab.label);
    if (window.location.pathname !== tab.route) {
      navigate(tab.route);
    }
  };

  // Fetch family members when component mounts
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const members = await fetchFamilyMembers();
        setFamilyMembers(members);
      } catch (error) {
        console.error('Error loading family members:', error);
      }
    };
    loadMembers();
  }, []);

  const calculateAge = (birthDate: Date | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
        <header className={styles.bookHeader}>Family Tree</header>
        <div className={styles.marginNote}>"Our roots run deep!"</div>
        <div className={styles.bookContent}>
          <div className={`${styles.familyTreePageContainer} ${theme === 'dark' ? 'dark' : ''}`}>
            <div className={styles.familyCrest} />
            <div className={styles.sticker + ' ' + styles.left} />
            <div className={styles.sticker + ' ' + styles.right} />
            <div className={styles.familyTreeHeader}>
              <h2 className={`${styles.pageTitle} ${styles.familyTreeHeading}`}>Family Tree</h2>
              <div className={styles.controlsContainer}>
                <button className={`${styles.familyTreeButton} btn`} onClick={() => { setShowAddMemberForm(!showAddMemberForm); setEditingMember(null); setShowAddRelationshipForm(false); }}>
                  {showAddMemberForm ? 'Cancel Add Member' : 'Add New Member'}
                </button>
                <button className={`${styles.familyTreeButton} btn`} onClick={() => { setShowAddRelationshipForm(!showAddRelationshipForm); setEditingMember(null); setShowAddMemberForm(false); }}>
                  {showAddRelationshipForm ? 'Cancel Add Relationship' : 'Add Relationship'}
                </button>
              </div>
            </div>
            <div className={styles.sectionDivider} />
            <p className={styles.introText}>
              Our family tree is a living scrapbook—each member a cherished photo or note, lovingly taped and pinned to our shared story. Explore your heritage below!
            </p>

            {showAddMemberForm && (
              <div className={styles.formContainer}>
                <AddMemberForm onMemberAdded={handleMemberAdded} onCancel={() => setShowAddMemberForm(false)} />
              </div>
            )}
            {showAddRelationshipForm && (
              <div className={styles.formContainer}>
                <AddRelationshipForm onRelationshipAdded={handleRelationshipAdded} onCancel={() => setShowAddRelationshipForm(false)} />
              </div>
            )}
            {editingMember && (
              <div className={styles.formContainer}>
                <EditMemberForm member={editingMember} onMemberUpdated={handleMemberUpdated} onCancel={handleCancelEdit} />
              </div>
            )}

            {editingMember && (
              <div className={styles.selectedMemberDetails}>
                <h3>Selected Member Details</h3>
                <p><strong>Name:</strong> {editingMember.name}</p>
                {editingMember.location && <p><strong>Location:</strong> {editingMember.location}</p>}
              </div>
            )}

            <ReactFlowProvider>
              <div id="react-flow-family-tree-container" className={styles.canvasContainer}>
                <FamilyTreeCanvas onNodeClick={handleNodeClick} />
              </div>
            </ReactFlowProvider>            <div className={styles.membersList}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search members..."
                  className={styles.membersListSearch}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <h2 className={styles.membersListHeader}>Family Members</h2>
              {filteredMembers.map(member => {
                const age = member.birthDate ? calculateAge(member.birthDate.toDate()) : null;
                return (
                  <div 
                    key={member.id} 
                    className={styles.memberItem}
                    onClick={() => navigate('/family-tree/member/' + member.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.memberName}>{member.name}</div>
                    {age !== null && (
                      <div className={styles.memberAge}>Age: {age}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <footer className={styles.bookFooter}>Page 4 &mdash; Thazhuthedath Family</footer>
      </main>
    </div>
  );
};

export default FamilyTreePage;
