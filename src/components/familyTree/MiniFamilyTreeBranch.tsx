import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, BackgroundVariant } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { fetchFamilyMembers } from '../../firebase/familyTree';
import type { FamilyMember } from '../../types';
import FamilyMemberNode from './FamilyMemberNode';

interface MiniFamilyTreeBranchProps {
  member: FamilyMember;
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

const MiniFamilyTreeBranch: React.FC<MiniFamilyTreeBranchProps> = ({ member }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamilyMembers().then(setMembers).finally(() => setLoading(false));
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!member) return { nodes: [], edges: [] };
    // Find spouses and children
    const spouseIds = member.spouses || [];
    const childIds = member.children || [];
    const spouseNodes = members.filter(m => spouseIds.includes(m.id));
    const childNodes = members.filter(m => childIds.includes(m.id));
    // Build nodes
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    // Main member node always at center top
    const mainX = 200;
    const mainY = 100;
    nodes.push({
      id: member.id,
      type: 'familyMember',
      position: { x: mainX, y: mainY },
      data: { ...member },
    });
    // Spouse nodes: arrange left/right of main member
    spouseNodes.forEach((spouse, i) => {
      const offset = (i % 2 === 0 ? 1 : -1) * (120 + Math.floor(i / 2) * 120);
      nodes.push({
        id: spouse.id,
        type: 'familyMember',
        position: { x: mainX + offset, y: mainY },
        data: { ...spouse },
      });
      edges.push({
        id: `spouse-${member.id}-${spouse.id}`,
        source: member.id,
        target: spouse.id,
        type: 'smoothstep',
        style: { stroke: '#FFA500', strokeWidth: 2 },
      });
    });
    // Children nodes: arrange below, spaced evenly
    const total = childNodes.length;
    childNodes.forEach((child, i) => {
      const childX = mainX - ((total - 1) * 90) / 2 + i * 90;
      nodes.push({
        id: child.id,
        type: 'familyMember',
        position: { x: childX, y: mainY + 160 },
        data: { ...child },
      });
      edges.push({
        id: `parent-${member.id}-child-${child.id}`,
        source: member.id,
        target: child.id,
        type: 'smoothstep',
        style: { stroke: '#008000', strokeWidth: 2 },
      });
      // Also connect spouse to child if spouse is parent
      child.parents?.forEach(pid => {
        if (spouseIds.includes(pid)) {
          edges.push({
            id: `parent-${pid}-child-${child.id}`,
            source: pid,
            target: child.id,
            type: 'smoothstep',
            style: { stroke: '#008000', strokeWidth: 2 },
          });
        }
      });
    });
    return { nodes, edges };
  }, [member, members]);

  if (loading) return <div>Loading family branch...</div>;
  if (nodes.length === 0) return <div>No family branch data.</div>;

  return (
    <div style={{ width: '100%', height: 350, background: 'none', margin: '2rem 0' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Lines} gap={16} size={0.3} color={'#e2c48d'} />
      </ReactFlow>
    </div>
  );
};

export default MiniFamilyTreeBranch;
