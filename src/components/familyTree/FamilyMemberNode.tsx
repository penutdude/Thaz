import React from 'react';
import { Handle, Position } from 'reactflow'; // Import Handle and Position
import type { NodeProps } from 'reactflow'; // Import NodeProps type
import type { FamilyMember } from '../../types'; // Import the FamilyMember type
import styles from './FamilyMemberNode.module.css';

// Define the data structure for our custom node
interface FamilyMemberNodeData extends FamilyMember {
  isDarkMode?: boolean; // Add isDarkMode to the node data type
}

const FamilyMemberNode: React.FC<NodeProps<FamilyMemberNodeData>> = ({ data }) => {
  const { isDarkMode } = data; // Destructure isDarkMode

  // Safely format dates
  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  };

  // Determine gender class for color coding
  let genderClass = '';
  if (data.gender) {
    if (data.gender.toLowerCase() === 'male') genderClass = styles.male;
    else if (data.gender.toLowerCase() === 'female') genderClass = styles.female;
    else genderClass = styles.other;
  }

  const handleStyle = {
    background: isDarkMode ? '#777' : '#555',
  };
  
  const invisibleHandleStyle = { background: 'transparent', border: 'none', width: '1px', height: '1px' };

  return (
    <div className={[
      styles.scrapbookNode,
      isDarkMode ? styles.dark : '',
      genderClass
    ].filter(Boolean).join(' ')}>
      {/* Tape accents */}
      <div className={styles.tape + ' ' + styles['top-left']} />
      <div className={styles.tape + ' ' + styles['top-right']} />
      {/* Leaf stickers for scrapbook effect */}
      <div className={styles.leaf + ' ' + styles['top-left']} />
      <div className={styles.leaf + ' ' + styles['bottom-right']} />
      {/* Pin accent */}
      <div className={styles.pin + ' ' + styles['top-center']} />
      {/* Doodle accent */}
      <div className={styles.doodle + ' ' + styles['bottom-right']} />
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="handle-left-target" style={{ ...invisibleHandleStyle, top: '50%' }} />
      <Handle type="source" position={Position.Right} id="handle-right-source" style={{ ...invisibleHandleStyle, top: '50%' }} />
      {data.photoUrl && (
        <img src={data.photoUrl} alt={data.name} className={styles.img} />
      )}
      <div className={styles.name}>{data.name}</div>
      {data.gender && <div className={styles.gender}>Gender: {data.gender}</div>}
      {data.birthDate && <div className={styles.dates}>Born: {formatDate(data.birthDate)}</div>}
      {data.deathDate && <div className={styles.dates}>Died: {formatDate(data.deathDate)}</div>}
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
    </div>
  );
};

export default FamilyMemberNode;
