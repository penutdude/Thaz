import React, { useState, useEffect } from 'react';
import type { FamilyMember } from '../../types';
import styles from './MemberPage.module.css';
import { useTheme } from '../../contexts/ThemeContext';
import { updateFamilyMember, fetchFamilyMembers } from '../../firebase/familyTree'; // Assuming you have an update function
import ReactFlow, { Background, Controls, BackgroundVariant, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import FamilyMemberNode from './FamilyMemberNode'; // Import FamilyMemberNode

interface MemberPageProps {
  member: FamilyMember;
  onClose: () => void;
}

const MemberPage: React.FC<MemberPageProps> = ({ member, onClose }) => {
  const { theme } = useTheme();
  const [location, setLocation] = useState(member.location || '');
  const [phoneNumber, setPhoneNumber] = useState(member.phoneNumber || '');
  const [facebookUsername, setFacebookUsername] = useState(member.facebookUsername || '');
  const [twitterUsername, setTwitterUsername] = useState(member.twitterUsername || '');
  const [instagramUsername, setInstagramUsername] = useState(member.instagramUsername || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]); // Add state for all family members
  const [treeNodes, setTreeNodes] = useState<any[]>([]); // Add state for React Flow nodes
  const [treeEdges, setTreeEdges] = useState<any[]>([]); // Add state for React Flow edges


  useEffect(() => {
    setLocation(member.location || '');
    setPhoneNumber(member.phoneNumber || '');
    setFacebookUsername(member.facebookUsername || '');
    setTwitterUsername(twitterUsername || '');
    setInstagramUsername(member.instagramUsername || '');
    setSaveError(null);
    setSaveSuccess(false);
  }, [member]);

  useEffect(() => {
    fetchFamilyMembers().then(setFamilyMembers);
  }, [member]);

  useEffect(() => {
    if (!familyMembers.length || !member) return; // Ensure member is also available
    const nodes: any[] = [];
    const edges: any[] = [];
    const memberMap = new Map<string, FamilyMember>();
    familyMembers.forEach(m => memberMap.set(m.id, m));

    const processedCouples = new Set<string>(); // To track marriage nodes
    const addedMarriageToChildEdges = new Set<string>(); // To track marriage-to-child edges

    // Spacing values from main tree (FamilyTreeCanvas.tsx)
    const generationYOffset = 400;
    const memberXOffset = 500;
    const marriageNodeVerticalOffset = 120;

    // Simplified positioning for mini-tree based on main tree spacing
    const memberX = 400; // Central X position for the member
    const memberY = 100; // Y position for the member and spouses
    const childrenY = memberY + generationYOffset; // Y position for children based on generation offset

    // Main member node
    nodes.push({
      id: member.id,
      position: { x: memberX, y: memberY },
      data: { ...member, isDarkMode: theme === 'dark' },
      type: 'familyMember',
    });

    // Spouse nodes and edges
    (member.spouses || []).forEach((spouseId, i) => {
      const spouse = memberMap.get(spouseId);
      if (spouse) {
        nodes.push({
          id: spouse.id,
          position: { x: memberX + (i + 1) * memberXOffset, y: memberY }, // Use memberXOffset for horizontal spacing
          data: { ...spouse, isDarkMode: theme === 'dark' },
          type: 'familyMember',
        });
        edges.push({
          id: `e-${member.id}-${spouse.id}-spouse`,
          source: member.id,
          target: spouse.id,
          type: 'smoothstep',
          sourceHandle: 'handle-right-source', // Use specific handles
          targetHandle: 'handle-left-target', // Use specific handles
          style: { stroke: '#FFA500', strokeWidth: 2.5 }, // Match main tree spouse edge style
          data: { type: 'spouse' },
        });
      }
    });

    // Process children to create intermediate marriage nodes and edges
    (member.children || []).forEach((childId, i) => {
      const child = memberMap.get(childId);
      if (!child) return;

      let otherParentId: string | undefined;
      if (member.spouses && member.spouses.length > 0) {
        for (const spouseId of member.spouses) {
          const spouse = memberMap.get(spouseId);
          if (spouse && spouse.children?.includes(childId)) {
            otherParentId = spouseId;
            break;
          }
        }
      }

      if (otherParentId) {
        const parent1Id = member.id < otherParentId ? member.id : otherParentId;
        const parent2Id = member.id < otherParentId ? otherParentId : member.id;
        const coupleId = `marriage-${parent1Id}-${parent2Id}`;

        if (!processedCouples.has(coupleId)) {
          const parent1Node = nodes.find(n => n.id === parent1Id);
          const parent2Node = nodes.find(n => n.id === parent2Id);
          let marriageNodePosition = { x: 0, y: 0 };
          if (parent1Node?.position && parent2Node?.position) {
            marriageNodePosition = {
              x: (parent1Node.position.x + parent2Node.position.x) / 2,
              y: Math.max(parent1Node.position.y, parent2Node.position.y) + marriageNodeVerticalOffset, // Use marriageNodeVerticalOffset
            };
          } else {
             // Fallback positioning if parent nodes not found (shouldn't happen in mini-tree)
             marriageNodePosition = { x: memberX + memberXOffset / 2, y: memberY + marriageNodeVerticalOffset }; // Use memberXOffset and marriageNodeVerticalOffset
          }
          nodes.push({
            id: coupleId,
            position: marriageNodePosition,
            data: { type: 'marriage', parent1Id, parent2Id },
            type: 'marriage',
            draggable: false, // Marriage nodes should not be draggable
            style: { width: 10, height: 10, background: 'transparent', border: 'none' }, // Keep marriage node invisible
          });
          processedCouples.add(coupleId);

          edges.push({
            id: `e-${parent1Id}-${coupleId}`, source: parent1Id, target: coupleId, type: 'smoothstep',
            sourceHandle: 'bottom', targetHandle: 'left', style: { stroke: '#FFA500', strokeWidth: 2.5 }, data: { type: 'parent-to-marriage' }, // Match main tree style
          });
          edges.push({
            id: `e-${parent2Id}-${coupleId}`, source: parent2Id, target: coupleId, type: 'smoothstep',
            sourceHandle: 'bottom', targetHandle: 'right', style: { stroke: '#FFA500', strokeWidth: 2.5 }, data: { type: 'parent-to-marriage' }, // Match main tree style
          });
        }

        // Add edge from the intermediate node to the child, ensuring it's unique
        const marriageToChildEdgeId = `e-${coupleId}-${childId}`;
        if (!addedMarriageToChildEdges.has(marriageToChildEdgeId)) {
           nodes.push({
              id: child.id,
              position: { x: memberX + i * memberXOffset - ((member.children?.length || 0) - 1) * memberXOffset / 2, y: childrenY }, // Use memberXOffset for horizontal spacing
              data: { ...child, isDarkMode: theme === 'dark' },
              type: 'familyMember',
            });
          edges.push({
            id: marriageToChildEdgeId,
            source: coupleId,
            target: childId,
            type: 'smoothstep',
            sourceHandle: 'bottom',
            targetHandle: 'top',
            style: { stroke: '#FFA500', strokeWidth: 2.5 }, // Match main tree style
            data: { type: 'marriage-to-child' },
          });
          addedMarriageToChildEdges.add(marriageToChildEdgeId);
        }
      } else { // Child has one parent or parents are not spouses - direct connection
         nodes.push({
            id: child.id,
            position: { x: memberX + i * memberXOffset - ((member.children?.length || 0) - 1) * memberXOffset / 2, y: childrenY }, // Use memberXOffset for horizontal spacing
            data: { ...child, isDarkMode: theme === 'dark' },
            type: 'familyMember',
          });
        const directParentChildEdgeId = `e-${member.id}-${childId}-direct`;
        if (!edges.some(edge => edge.id === directParentChildEdgeId)) { // Check if edge already exists
          edges.push({
            id: directParentChildEdgeId,
            source: member.id,
            target: childId,
            type: 'smoothstep',
            sourceHandle: 'bottom',
            targetHandle: 'top',
            style: { stroke: '#FFA500', strokeWidth: 2.5 }, // Match main tree style
            data: { type: 'parent-child' },
          });
        }
      }
    });

    setTreeNodes(nodes);
    setTreeEdges(edges);
  }, [familyMembers, member, theme]);

  const onNodeDragStop = async (_event: React.MouseEvent, node: Node<FamilyMember & { isDarkMode?: boolean }>) => {
    console.log('Node dragged:', node);
    if (node.data && node.position && node.type === 'familyMember') {
        const newPosition = {
            x: node.position.x,
            y: node.position.y,
        };

        try {
            await updateFamilyMember(node.id, { position: newPosition });
            console.log(`Position updated for ${node.id} to x: ${newPosition.x}, y: ${newPosition.y}`);
        } catch (error) {
            console.error(`Failed to update position for ${node.id}:`, error);
            // Optionally, revert local state if Firebase update fails
            // This would require access to setTreeNodes here, which is not ideal.
            // For simplicity in the mini-tree, we might not revert on failure immediately.
        }
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateFamilyMember(member.id, {
        location,
        phoneNumber,
        facebookUsername,
        twitterUsername,
        instagramUsername,
      });
      // Optimistically update state after successful save
      setLocation(location);
      setPhoneNumber(phoneNumber);
      setFacebookUsername(facebookUsername);
      setTwitterUsername(twitterUsername);
      setInstagramUsername(instagramUsername);
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating member:", error);
      setSaveError(error.message || 'Failed to save changes.');
    }
  };

  const memberPageStyle = {
    color: theme === 'dark' ? '#e0e0e0' : '#212529',
    padding: '20px',
    borderRadius: '5px',
    border: theme === 'dark' ? '1px solid #000' : '1px solid transparent', // Add border
  };

  return (
    <div style={memberPageStyle} className={styles.memberPage}>
      <h2>{member.name}</h2>
      <p>Birth Date: {member.birthDate ? member.birthDate.toDate().toLocaleDateString() : 'N/A'}</p>

      {isEditing ? (
        <>
          <div>
            <label htmlFor="location">Location:</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="phoneNumber">Phone Number:</label>
            <input
              id="phoneNumber"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="facebookUsername">Facebook Username:</label>
            <input
              id="facebookUsername"
              type="text"
              value={facebookUsername}
              onChange={(e) => setFacebookUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="twitterUsername">Twitter Username:</label>
            <input
              id="twitterUsername"
              type="text"
              value={twitterUsername}
              onChange={(e) => setTwitterUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="instagramUsername">Instagram Username:</label>
            <input
              id="instagramUsername"
              type="text"
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value)}
            />
          </div>
          {saveError && <p style={{ color: 'red' }}>{saveError}</p>}
          {saveSuccess && <p style={{ color: 'green' }}>Changes saved successfully!</p>}
          
        </>
      ) : (
        <>
          <p>Location: {member.location || 'N/A'}</p>
          <p>Phone Number: {member.phoneNumber || 'N/A'}</p>
        </>
      )}

      <div className={styles.socialIconsContainer}>
        {member.instagramUsername && (
          <p>
            <a href={`https://www.instagram.com/${member.instagramUsername}`} target="_blank" rel="noopener noreferrer" className={styles.socialIconLink}>
              <img src="/—Pngtree—instagram icon instagram logo_3584852.png" alt="Instagram" />
            </a>
          </p>
        )}
        {member.facebookUsername && (
          <p>
            <a href={member.facebookUsername.includes('profile.php?id=') ? member.facebookUsername : `https://www.facebook.com/search/top/?q=${encodeURIComponent(member.facebookUsername)}`} target="_blank" rel="noopener noreferrer" className={styles.socialIconLink}>
              <img src="—Pngtree—facebook  icon png round_3562016.png" alt="Facebook" />
            </a>
          </p>
        )}
        {member.twitterUsername && (
          <p>
            <a href={`https://twitter.com/${member.twitterUsername}`} target="_blank" rel="noopener noreferrer" className={styles.socialIconLink}>
              <img src="/twitter.png" alt="Twitter" />
            </a>
          </p>
        )}
      </div>

      {/* Family Branch Tree */}
      <div style={{ width: '100%', height: 350, margin: '32px 0' }}>
        <ReactFlow
          nodes={treeNodes}
          edges={treeEdges}
          nodeTypes={{ familyMember: FamilyMemberNode }} // Register custom node type
          fitView
          style={{ background: 'none' }}
          onNodeDragStop={onNodeDragStop} // Add onNodeDragStop handler
        >
          <Controls />
          <Background variant={BackgroundVariant.Lines} gap={16} size={0.3} color={theme === 'dark' ? '#bfa77a' : '#e2c48d'} />
        </ReactFlow>
      </div>

      <div className={styles.buttonContainer}>
        {isEditing ? (
          <>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)}>Edit Details</button>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default MemberPage;
