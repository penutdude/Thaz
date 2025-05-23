import React, { useState, useEffect } from 'react';
import { fetchFamilyMembers, updateFamilyMember } from '../../firebase/familyTree'; // Import functions
import type { FamilyMember } from '../../types'; // Import the type
import styles from './AddRelationshipForm.module.css'; // Import CSS Module

interface AddRelationshipFormProps {
  onRelationshipAdded: () => void; // Callback to refresh the tree
  onCancel: () => void; // Callback to close the form
}

const AddRelationshipForm: React.FC<AddRelationshipFormProps> = ({ onRelationshipAdded, onCancel }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember1, setSelectedMember1] = useState('');
  const [selectedMember2, setSelectedMember2] = useState('');
  const [relationshipType, setRelationshipType] = useState<'parent-child' | 'spouse'>('parent-child');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);


  useEffect(() => {
    const loadMembers = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const fetchedMembers = await fetchFamilyMembers();
        setMembers(fetchedMembers);
      } catch (err: any) {
        console.error("Error fetching members for relationship form:", err);
        setFetchError('Failed to load members.');
      }
      setFetchLoading(false);
    };
    loadMembers();
  }, []); // Fetch members when the component mounts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!selectedMember1 || !selectedMember2) {
      setError('Please select two members.');
      setIsLoading(false);
      return;
    }

    if (selectedMember1 === selectedMember2) {
        setError('Please select two different members.');
        setIsLoading(false);
        return;
    }

    try {
      if (relationshipType === 'parent-child') {
        // Assuming selectedMember1 is the parent and selectedMember2 is the child
        // Update parent's children list and child's parents list
        const member1 = members.find(m => m.id === selectedMember1);
        const member2 = members.find(m => m.id === selectedMember2);

        if (member1 && member2) {
            // Update parent (member1)
            const updatedParentChildren = [...(member1.children || []), selectedMember2];
            await updateFamilyMember(selectedMember1, { children: updatedParentChildren });

            // Update child (member2)
            const updatedChildParents = [...(member2.parents || []), selectedMember1];
            await updateFamilyMember(selectedMember2, { parents: updatedChildParents });
        }

      } else if (relationshipType === 'spouse') {
        // Update both members' spouses lists
        const member1 = members.find(m => m.id === selectedMember1);
        const member2 = members.find(m => m.id === selectedMember2);

        if (member1 && member2) {
            // Update member1
            const updatedMember1Spouses = [...(member1.spouses || []), selectedMember2];
            await updateFamilyMember(selectedMember1, { spouses: updatedMember1Spouses });

            // Update member2
            const updatedMember2Spouses = [...(member2.spouses || []), selectedMember1];
            await updateFamilyMember(selectedMember2, { spouses: updatedMember2Spouses });
        }
      }

      onRelationshipAdded(); // Call callback to refresh tree
      // Reset form
      setSelectedMember1('');
      setSelectedMember2('');
      setRelationshipType('parent-child');

    } catch (err: any) {
      console.error("Error adding relationship:", err);
      setError('Failed to add relationship: ' + err.message);
    }
    setIsLoading(false);
  };

  if (fetchLoading) {
      return <p className={styles.loadingMessage}>Loading members for relationships...</p>;
  }

  if (fetchError) {
      return <p className={styles.errorMessage}>{fetchError}</p>;
  }

  if (members.length < 2) {
      return <p className={styles.infoMessage}>Add at least two family members to define relationships.</p>;
  }


  return (
    // The parent div with inline styles is removed as .formContainer from FamilyTreePage.module.css handles it.
    <div className={styles.addRelationshipForm}>
      <h3>Add Relationship</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="member1" className={styles.formLabel}>Member 1 ({relationshipType === 'parent-child' ? 'Parent' : 'Spouse 1'}):</label>
          <select id="member1" value={selectedMember1} onChange={(e) => setSelectedMember1(e.target.value)} required>
            <option value="">Select Member</option>
            {members.filter(m => m.id !== selectedMember2).map(member => ( // Prevent selecting same member
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="relationshipType" className={styles.formLabel}>Relationship Type:</label>
          <select id="relationshipType" value={relationshipType} onChange={(e) => setRelationshipType(e.target.value as 'parent-child' | 'spouse')} required>
            <option value="parent-child">Parent - Child</option>
            <option value="spouse">Spouse</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="member2" className={styles.formLabel}>Member 2 ({relationshipType === 'parent-child' ? 'Child' : 'Spouse 2'}):</label>
          <select id="member2" value={selectedMember2} onChange={(e) => setSelectedMember2(e.target.value)} required>
            <option value="">Select Member</option>
            {members.filter(m => m.id !== selectedMember1).map(member => ( // Prevent selecting same member
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <div className={styles.buttonContainer}>
          <button type="submit" disabled={isLoading} className={`${styles.addRelationshipSubmitButton} btn`}> {/* Add addRelationshipSubmitButton class */}
            {isLoading ? 'Adding...' : 'Add Relationship'}
          </button>
          <button type="button" onClick={onCancel} disabled={isLoading} className={`${styles.addRelationshipCancelButton} btn btn-secondary`}> {/* Add addRelationshipCancelButton class */}
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRelationshipForm;
