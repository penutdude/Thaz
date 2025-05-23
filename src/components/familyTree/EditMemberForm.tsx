import React, { useState, useEffect } from 'react';
// Timestamp might not be needed directly if passing Dates/strings to updateFamilyMember
// import { Timestamp } from 'firebase/firestore';
import { updateFamilyMember, deleteFamilyMember, type UpdateFamilyMemberData } from '../../firebase/familyTree'; // Import updated function and type
import type { FamilyMember } from '../../types';
import styles from './EditMemberForm.module.css'; // Import CSS Module

interface EditMemberFormProps {
  member: FamilyMember;
  onMemberUpdated: () => void;
  onCancel: () => void;
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({ member, onMemberUpdated, onCancel }) => {
  const [name, setName] = useState(member.name);
  const [birthDate, setBirthDate] = useState(member.birthDate?.toDate().toISOString().split('T')[0] || '');
  const [deathDate, setDeathDate] = useState(member.deathDate?.toDate().toISOString().split('T')[0] || '');
  const [generation, setGeneration] = useState(member.generation?.toString() || '');
  const [gender, setGender] = useState(member.gender || ''); // State for gender, initialize with member's gender
  const [memberLocation, setMemberLocation] = useState(member.location || ''); // State for location, initialize with member's location

  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState<boolean>(false);
  // To display the current photo or a preview of the new one
  const [currentPhotoDisplayUrl, setCurrentPhotoDisplayUrl] = useState<string | null>(member.photoUrl || null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(member.name);
    setBirthDate(member.birthDate?.toDate().toISOString().split('T')[0] || '');
    setDeathDate(member.deathDate?.toDate().toISOString().split('T')[0] || '');
    setGeneration(member.generation?.toString() || '');
    setGender(member.gender || ''); // Initialize gender state
    setMemberLocation(member.location || ''); // Initialize location state
    setCurrentPhotoDisplayUrl(member.photoUrl || null);
    setNewPhotoFile(null); // Reset file input if member changes
    setRemoveCurrentImage(false);
  }, [member]);

  const handleNewPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhotoFile(e.target.files[0]);
      setCurrentPhotoDisplayUrl(URL.createObjectURL(e.target.files[0])); // Show preview
      setRemoveCurrentImage(false); // If new file is chosen, don't remove current one (it will be replaced)
    } else {
      setNewPhotoFile(null);
      setCurrentPhotoDisplayUrl(member.photoUrl || null); // Revert to original if selection cleared
    }
  };

  const handleRemoveCurrentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemoveCurrentImage(e.target.checked);
    if (e.target.checked) {
      setNewPhotoFile(null); // Cannot remove and upload new at same time
      setCurrentPhotoDisplayUrl(null); // Clear display if removing
      const photoFileInput = document.getElementById('edit-member-photo-file') as HTMLInputElement;
      if (photoFileInput) photoFileInput.value = ''; // Clear file input
    } else {
        setCurrentPhotoDisplayUrl(member.photoUrl || null); // Revert to original if unchecking remove
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError('Name is required.');
      setIsLoading(false);
      return;
    }

    try {
      const parsedGeneration = generation ? parseInt(generation, 10) : undefined;

      const updatePayload: UpdateFamilyMemberData = {
        name: name.trim(),
        birthDate: birthDate ? new Date(birthDate) as any : (member.birthDate !== undefined ? null : undefined),
        deathDate: deathDate ? new Date(deathDate) as any : (member.deathDate !== undefined ? null : undefined),
        generation: (parsedGeneration !== undefined && !isNaN(parsedGeneration)) ? parsedGeneration : (member.generation !== undefined ? null : undefined),
        // other fields like position, parents, children, spouses are not typically edited here
        // but if they were, they'd be added to updatePayload if changed.
      };

      // Include gender only if it has changed
      if (gender !== (member.gender || '')) {
        updatePayload.gender = gender || null;
      }

      // Include location only if it has changed
      if (memberLocation !== (member.location || '')) {
        updatePayload.location = memberLocation || null;
      }


      if (newPhotoFile) {
        updatePayload.photoFile = newPhotoFile;
      } else if (removeCurrentImage) {
        updatePayload.removePhoto = true;
      }
      // If neither newPhotoFile nor removeCurrentImage, existing photo remains unchanged by not sending photo-related fields.

      await updateFamilyMember(member.id, updatePayload);
      onMemberUpdated();
    } catch (err: any) {
      console.error(`Error updating family member ${member.id}:`, err);
      setError(err.message || 'Failed to update family member.');
    }
    setIsLoading(false);
  };

  return (
    // The parent div with inline styles is removed as .formContainer from FamilyTreePage.module.css handles it.
    <div className={styles.editMemberForm}>
      <h3>Edit Family Member: {member.name}</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="edit-name" className={styles.formLabel}>Name:</label>
          <input type="text" id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="edit-birthDate" className={styles.formLabel}>Birth Date:</label>
          <input type="date" id="edit-birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="edit-deathDate" className={styles.formLabel}>Death Date:</label>
          <input type="date" id="edit-deathDate" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
        </div>
        
        <div className={`${styles.formGroup} ${styles.currentPhotoContainer}`}>
          <label className={styles.formLabel}>Current Photo:</label>
          {currentPhotoDisplayUrl ? (
            <img src={currentPhotoDisplayUrl} alt="Current" className={styles.currentPhoto} />
          ) : (
            <p className={styles.noPhotoText}>No photo uploaded.</p>
          )}
          <div>
            <input 
              type="checkbox" 
              id="edit-remove-photo" 
              checked={removeCurrentImage} 
              onChange={handleRemoveCurrentImageChange} 
              disabled={!!newPhotoFile}
            />
            <label htmlFor="edit-remove-photo" className={styles.removePhotoLabel}>Remove current photo</label>
          </div>
        </div>

        {!removeCurrentImage && (
          <div className={styles.formGroup}>
            <label htmlFor="edit-member-photo-file" className={styles.formLabel}>Change Photo:</label>
            <input type="file" id="edit-member-photo-file" accept="image/*" onChange={handleNewPhotoFileChange} />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="edit-generation" className={styles.formLabel}>Generation:</label>
          <input type="number" id="edit-generation" value={generation} onChange={(e) => setGeneration(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="edit-gender" className={styles.formLabel}>Gender:</label>
          <select id="edit-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="edit-memberLocation" className={styles.formLabel}>Location:</label>
          <input type="text" id="edit-memberLocation" value={memberLocation} onChange={(e) => setMemberLocation(e.target.value)} />
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <div className={styles.buttonContainer}>
          <button type="submit" disabled={isLoading} className="btn"> {/* Using global .btn style */}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onCancel} disabled={isLoading} className="btn btn-secondary"> {/* Example secondary button */}
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={isLoading} className="btn btn-danger"> {/* Add delete button */}
            Delete Member
          </button>
        </div>
      </form>
    </div>
  );

  async function handleDelete() {
    if (window.confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
      setIsLoading(true);
      setError(null);
      try {
        await deleteFamilyMember(member.id);
        onMemberUpdated();
      } catch (err: any) {
        console.error(`Error deleting family member ${member.id}:`, err);
        setError(err.message || 'Failed to delete family member.');
      }
      setIsLoading(false);
    }
  }
};

export default EditMemberForm;
