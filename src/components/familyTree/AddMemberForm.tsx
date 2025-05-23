import React, { useState } from 'react';
// Timestamp import might not be needed here if dates are passed as strings/Dates to addFamilyMember
// import { Timestamp } from 'firebase/firestore';
import { addFamilyMember, type NewFamilyMemberData } from '../../firebase/familyTree'; // Import updated add function and type
import styles from './AddMemberForm.module.css'; // Import CSS Module

interface AddMemberFormProps {
  onMemberAdded: () => void; // Callback to refresh the tree after adding
  onCancel: () => void; // Callback to close the form
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onMemberAdded, onCancel }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(''); // Using string for input value
  const [deathDate, setDeathDate] = useState(''); // Using string for input value
  const [photoFile, setPhotoFile] = useState<File | null>(null); // State for photo file
  const [generation, setGeneration] = useState(''); // State for generation
  const [gender, setGender] = useState(''); // State for gender
  const [memberLocation, setMemberLocation] = useState(''); // State for location
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    } else {
      setPhotoFile(null);
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

      const memberInput: NewFamilyMemberData = {
        name: name.trim(),
        // Pass dates as strings or Date objects; addFamilyMember will convert to Timestamps
        // Cast to any to satisfy NewFamilyMemberData's inherited Timestamp type for dates
        birthDate: birthDate ? new Date(birthDate) as any : undefined,
        deathDate: deathDate ? new Date(deathDate) as any : undefined,
        generation: (parsedGeneration !== undefined && !isNaN(parsedGeneration)) ? parsedGeneration : undefined,
        photoFile: photoFile,
        gender: gender || undefined, // Include gender in the input
        location: memberLocation || undefined, // Include location in the input
        // Default empty arrays for relationships, position will be handled by layout or default in addFamilyMember
        parents: [],
        children: [],
        spouses: [],
        position: undefined, // Or null, let addFamilyMember handle default
      };

      await addFamilyMember(memberInput);
      onMemberAdded(); // Call callback to refresh tree
      // Reset form
      setName('');
      setBirthDate('');
      setDeathDate('');
      setPhotoFile(null);
      const photoFileInput = document.getElementById('member-photo-file') as HTMLInputElement;
      if (photoFileInput) photoFileInput.value = '';
      setGeneration('');
      setGender(''); // Reset gender
      setMemberLocation(''); // Reset location
    } catch (err: any) {
      console.error("Error adding family member:", err);
      setError(err.message || 'Failed to add family member.');
    }
    setIsLoading(false);
  };

  return (
    // The parent div with inline styles is removed as .formContainer from FamilyTreePage.module.css handles it.
    // If this form is used elsewhere without that parent, it might need its own .addMemberForm root class.
    // For now, assuming it's always wrapped by .formContainer from the page.
    <div className={styles.addMemberForm}>
      <h3>Add New Family Member</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.formLabel}>Name:</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birthDate" className={styles.formLabel}>Birth Date:</label>
          <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="deathDate" className={styles.formLabel}>Death Date:</label>
          <input type="date" id="deathDate" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="member-photo-file" className={styles.formLabel}>Photo:</label>
          <input type="file" id="member-photo-file" accept="image/*" onChange={handlePhotoFileChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="generation" className={styles.formLabel}>Generation:</label>
          <input type="number" id="generation" value={generation} onChange={(e) => setGeneration(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="gender" className={styles.formLabel}>Gender:</label>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="memberLocation" className={styles.formLabel}>Location:</label>
          <input type="text" id="memberLocation" value={memberLocation} onChange={(e) => setMemberLocation(e.target.value)} />
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <div className={styles.buttonContainer}>
          <button type="submit" disabled={isLoading} className={`${styles.addMemberSubmitButton} btn`}> {/* Add addMemberSubmitButton class */}
            {isLoading ? 'Adding...' : 'Add Member'}
          </button>
          <button type="button" onClick={onCancel} disabled={isLoading} className={`${styles.addMemberCancelButton} btn btn-secondary`}> {/* Add addMemberCancelButton class */}
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMemberForm;
