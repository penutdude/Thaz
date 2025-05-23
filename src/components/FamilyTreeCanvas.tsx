import React, { useEffect, useCallback } from 'react'; // Remove unused useState
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  type Connection, // Use type-only import
  type Edge, // Use type-only import
  type Node, // Use type-only import
  useNodesState,
  useEdgesState,
  BackgroundVariant, // Import BackgroundVariant type
  Position, // Import Position for handles
  type NodeProps, // Import NodeProps type
  Handle, // Import Handle component
} from 'reactflow';

import 'reactflow/dist/style.css';

import { useTheme } from '../contexts/ThemeContext'; // Import useTheme
import { fetchFamilyMembers, updateFamilyMember } from '../firebase/familyTree'; // Import fetch and update functions
import type { FamilyMember } from '../types'; // Import FamilyMember type
import FamilyMemberNode from './familyTree/FamilyMemberNode'; // Import custom node component

// Define a component for the intermediate marriage node (can be invisible)
const MarriageNode: React.FC<NodeProps<{ parent1Id: string, parent2Id: string }>> = () => {
    // Make handles effectively invisible
    const invisibleHandleStyle = { background: 'transparent', border: 'none', width: '1px', height: '1px' };
    return (
        <>
            <Handle type="target" position={Position.Left} id="left" style={{ ...invisibleHandleStyle, top: '50%' }} />
            <Handle type="target" position={Position.Right} id="right" style={{ ...invisibleHandleStyle, top: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={invisibleHandleStyle} />
        </>
    );
};

// Define node types for React Flow (defined outside the component)
const nodeTypes = {
  familyMember: FamilyMemberNode,
  marriage: MarriageNode,
};

// Define props for FamilyTreeCanvas
interface FamilyTreeCanvasProps {
    onNodeClick: (member: FamilyMember) => void; // Handler for node click
}

const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({ onNodeClick }) => {
  const { theme } = useTheme(); // Get theme status
  const isDarkMode = theme === 'dark'; // Determine if dark mode is active

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildFlowData = useCallback((members: FamilyMember[]) => {
    const flowNodes: Node<FamilyMember & { isDarkMode?: boolean } | { type: 'marriage', parent1Id: string, parent2Id: string }>[] = [];
    const flowEdges: Edge<any>[] = [];
    const memberMap = new Map<string, FamilyMember>();
    const processedCouples = new Set<string>(); // For marriage nodes
    const addedMarriageToChildEdges = new Set<string>(); // To track marriage-to-child edges

    // Group members by generation
    const generations: { [key: number]: FamilyMember[] } = {};
    members.forEach(member => {
      const gen = member.generation ?? 0; // Default to generation 0 if undefined/null
      if (!generations[gen]) {
        generations[gen] = [];
      }
      generations[gen].push(member);
      memberMap.set(member.id, member);
    });

    // Create person nodes with generation-based layout
    const generationYOffset = 400;
    const memberXOffset = 500;

    Object.keys(generations).sort((a, b) => parseInt(a) - parseInt(b)).forEach(genKey => {
      const gen = parseInt(genKey);
      const membersInGeneration = generations[gen];
      membersInGeneration.forEach((member, index) => {
        const x = member.position?.x ?? index * memberXOffset;
        const y = member.position?.y ?? gen * generationYOffset;
        flowNodes.push({
          id: member.id,
          position: { x, y },
          data: { ...member, isDarkMode }, // Pass isDarkMode to FamilyMemberNode data
          type: 'familyMember',
        });
      });
    });

    // Process relationships to create edges and intermediate nodes
    members.forEach(member => {
      const memberNode = flowNodes.find(n => n.id === member.id);
      if (!memberNode) return;

      // Reinstate spouse edges
      member.spouses?.forEach(spouseId => {
        if (member.id < spouseId && memberMap.has(spouseId)) {
          const spouseNode = flowNodes.find(n => n.id === spouseId);
          if (spouseNode) {
            flowEdges.push({
              id: `e-${member.id}-${spouseId}-spouse`,
              source: member.id,
              target: spouseId,
              type: 'smoothstep', // Ensure this is smoothstep
              sourceHandle: 'handle-right-source',
              targetHandle: 'handle-left-target',
              style: { stroke: '#FFA500', strokeWidth: 3 }, // Increased thickness
              data: { type: 'spouse' },
            });
          }
        }
      });

      // Process children to create intermediate marriage nodes
      member.children?.forEach(childId => {
        const child = memberMap.get(childId);
        const childNode = flowNodes.find(n => n.id === childId);
        if (!child || !childNode) return;

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
            const parent1Node = flowNodes.find(n => n.id === parent1Id);
            const parent2Node = flowNodes.find(n => n.id === parent2Id);
            let marriageNodePosition = { x: 0, y: 0 };
            if (parent1Node?.position && parent2Node?.position) {
              marriageNodePosition = {
                x: (parent1Node.position.x + parent2Node.position.x) / 2,
                y: Math.max(parent1Node.position.y, parent2Node.position.y) + 120,
              };
            } else {
              const gen = member.generation ?? 0;
              marriageNodePosition = { x: (generations[gen]?.length || 0) * memberXOffset / 2, y: gen * generationYOffset + 120 };
            }
            flowNodes.push({
              id: coupleId,
              position: marriageNodePosition,
              data: { type: 'marriage', parent1Id, parent2Id },
              type: 'marriage',
              draggable: true,
              style: { width: 10, height: 10, background: 'transparent', border: 'none' },
            });
            processedCouples.add(coupleId);

            flowEdges.push({
              id: `e-${parent1Id}-${coupleId}`, source: parent1Id, target: coupleId, type: 'smoothstep',
              sourceHandle: 'bottom', targetHandle: 'left', style: { stroke: '#FFA500', strokeWidth: 2.5 }, data: { type: 'parent-to-marriage' }, // Increased thickness
            });
            flowEdges.push({
              id: `e-${parent2Id}-${coupleId}`, source: parent2Id, target: coupleId, type: 'smoothstep',
              sourceHandle: 'bottom', targetHandle: 'right', style: { stroke: '#FFA500', strokeWidth: 2.5 }, data: { type: 'parent-to-marriage' }, // Increased thickness
            });
          }

          // Add edge from the intermediate node to the child, ensuring it's unique
          const marriageToChildEdgeId = `e-${coupleId}-${childId}`;
          if (!addedMarriageToChildEdges.has(marriageToChildEdgeId)) {
            flowEdges.push({
              id: marriageToChildEdgeId,
              source: coupleId,
              target: childId,
              type: 'smoothstep',
              sourceHandle: 'bottom',
              targetHandle: 'top',
              style: { stroke: '#FFA500', strokeWidth: 2.5 }, // Increased thickness
              data: { type: 'marriage-to-child' },
            });
            addedMarriageToChildEdges.add(marriageToChildEdgeId);
          }
        } else { // Child has one parent or parents are not spouses
          const directParentChildEdgeId = `e-${member.id}-${childId}-direct`;
          if (!flowEdges.some(edge => edge.id === directParentChildEdgeId)) {
            flowEdges.push({
              id: directParentChildEdgeId,
              source: member.id,
              target: childId,
              type: 'smoothstep',
              sourceHandle: 'bottom',
              targetHandle: 'top',
              style: { stroke: '#FFA500', strokeWidth: 2.5 }, // Increased thickness
              data: { type: 'parent-child' },
            });
          }
        }
      });
    });

    return { flowNodes, flowEdges };
  }, [isDarkMode]); // Add isDarkMode to dependency array

  useEffect(() => {
    const loadFamilyTree = async () => {
      try {
        const members = await fetchFamilyMembers();
        console.log("Fetched members from Firebase:", members);
        const { flowNodes, flowEdges } = buildFlowData(members);
        console.log("Generated flow nodes:", flowNodes);
        console.log("Generated flow edges:", flowEdges);
        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error("Failed to load family tree:", error);
      }
    };
    loadFamilyTree();
  }, [buildFlowData, setNodes, setEdges, isDarkMode]); // Add isDarkMode to dependencies

  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node<FamilyMember & { isDarkMode?: boolean }>) => {
    console.log('Node dragged:', node);
    if (node.data && node.position && node.type === 'familyMember') {
        const member = node.data;
        const currentGeneration = member.generation ?? 0;
        const generationYOffset = 400; // Must match the value in buildFlowData

        // Calculate the correct Y position for this node's generation
        const correctYPosition = currentGeneration * generationYOffset;

        const newPosition = {
            x: node.position.x,
            y: correctYPosition, // Enforce the generation's Y position
        };

        // Update local React Flow state immediately to snap the node back vertically
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? { ...n, position: newPosition }
              : n
          )
        );

        try {
            await updateFamilyMember(node.id, { position: newPosition });
            console.log(`Position updated for ${node.id} to x: ${newPosition.x}, y: ${newPosition.y}`);
        } catch (error) {
            console.error(`Failed to update position for ${node.id}:`, error);
            // Optionally, revert local state if Firebase update fails
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? { ...n, position: node.position } // Revert to original dragged position
                  : n
              )
            );
        }
    } else if (node.type === 'marriage' && node.position) {
        // Optionally save position of marriage nodes too, or make them non-draggable
        // For now, let's allow marriage nodes to be dragged freely if draggable: true
        // Or, if they should also be locked, calculate their Y based on parent generations.
        // This part is more complex for marriage nodes.
        // Let's assume for now we only strictly lock familyMember nodes.
        // If marriage nodes are draggable, their position will be saved as is by default if we add that logic.
        // The current `updateFamilyMember` is for FamilyMember type, not marriage nodes.
        console.log('Marriage node dragged, position not saved by this handler yet.');
    }
  }, [setNodes]); // Added setNodes to dependency array

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge(params, eds));
    console.log('New edge connected:', params);
  }, [setEdges]);

  return (
    <div style={{ width: '100%', height: '600px', background: 'none', position: 'relative', zIndex: 2 }}>
      {/* Scrapbook border overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        border: '8px dashed #a67c52',
        borderRadius: '24px',
        zIndex: 3,
        opacity: 0.5
      }} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_event, node) => {
          if (node.type === 'familyMember' && node.data) {
            onNodeClick(node.data as FamilyMember);
          }
        }}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        {/* Scrapbook grid background */}
        <Background variant={BackgroundVariant.Lines} gap={16} size={0.3} color={isDarkMode ? '#bfa77a' : '#e2c48d'} />
      </ReactFlow>
    </div>
  );
};

export default FamilyTreeCanvas;
