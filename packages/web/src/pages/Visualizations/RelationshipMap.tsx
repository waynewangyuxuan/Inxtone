/**
 * RelationshipMap
 *
 * Force-directed graph of character relationships using d3-force + React SVG.
 * Data source: existing /characters and /relationships APIs.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3-force';
import { useCharacters } from '../../hooks/useCharacters';
import { useRelationships } from '../../hooks/useRelationships';
import { useFactions } from '../../hooks/useFactions';
import { useStoryBibleStore } from '../../stores/useStoryBibleStore';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Character, CharacterId, Relationship, RelationshipType } from '@inxtone/core';
import styles from './RelationshipMap.module.css';

// ─── Graph node/link types ───────────────────────────────────────────────────

interface GraphNode extends d3.SimulationNodeDatum {
  id: CharacterId;
  character: Character;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationship: Relationship;
}

// ─── Visual constants ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  main: 'var(--color-accent)',
  supporting: '#6b8cba',
  antagonist: 'var(--color-danger)',
  mentioned: 'var(--color-text-secondary)',
};

// Faction colors — assigned by index so each faction gets a distinct hue
const FACTION_PALETTE = [
  'var(--color-accent)', // gold
  '#6b8cba', // blue
  '#4ade80', // green
  '#a78bfa', // purple
  '#f59e0b', // amber
  '#f472b6', // pink
  '#38bdf8', // sky
];

const LINK_COLORS: Record<RelationshipType, string> = {
  companion: '#4ade80',
  rival: '#f59e0b',
  enemy: '#ef4444',
  mentor: '#a78bfa',
  confidant: '#38bdf8',
  lover: '#f472b6',
};

const LINK_DASH: Record<RelationshipType, string> = {
  companion: 'none',
  rival: '6 3',
  enemy: '4 2',
  mentor: 'none',
  confidant: '8 4',
  lover: 'none',
};

const NODE_RADIUS = 20;
const RELATIONSHIP_FILTERS: Array<{ value: RelationshipType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'companion', label: 'Companion' },
  { value: 'rival', label: 'Rival' },
  { value: 'enemy', label: 'Enemy' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'confidant', label: 'Confidant' },
  { value: 'lover', label: 'Lover' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function RelationshipMap(): React.ReactElement {
  const navigate = useNavigate();
  const { data: characters = [], isLoading: charsLoading } = useCharacters();
  const { data: relationships = [], isLoading: relsLoading } = useRelationships();
  const { data: factions = [] } = useFactions();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulation state stored in refs to avoid re-renders
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);

  // React state for rendering
  const [nodePositions, setNodePositions] = useState<GraphNode[]>([]);
  const [linkPositions, setLinkPositions] = useState<GraphLink[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  // Ref so the simulation effect can read current dimensions without re-triggering on resize
  const dimensionsRef = useRef(dimensions);
  dimensionsRef.current = dimensions;

  // Interaction state
  const [hoveredId, setHoveredId] = useState<CharacterId | null>(null);
  const [selectedId, setSelectedId] = useState<CharacterId | null>(null);
  const nodeDraggedRef = useRef(false); // true if mouse moved during last node mousedown
  const [filter, setFilter] = useState<RelationshipType | 'all'>('all');
  const [colorMode, setColorMode] = useState<'role' | 'faction'>('faction');

  // Build character → faction color map.
  // Primary: character.factionId (direct membership).
  // Fallback: faction.leaderId — covers characters whose factionId hasn't been set yet,
  // ensuring faction leaders always receive a faction color.
  const factionColorMap = useMemo(() => {
    const factionColors = new Map<string, string>();
    factions.forEach((faction, i) => {
      factionColors.set(
        faction.id,
        FACTION_PALETTE[i % FACTION_PALETTE.length] ?? FACTION_PALETTE[0]!
      );
    });
    const map = new Map<CharacterId, string>();
    // Fallback: colour faction leaders
    factions.forEach((faction) => {
      if (faction.leaderId) {
        const color = factionColors.get(faction.id);
        if (color) map.set(faction.leaderId, color);
      }
    });
    // Primary: overwrite with direct factionId (more accurate)
    characters.forEach((c) => {
      if (c.factionId) {
        const color = factionColors.get(c.factionId);
        if (color) map.set(c.id, color);
      }
    });
    return map;
  }, [factions, characters]);

  const getNodeColor = useCallback(
    (character: Character): string => {
      if (colorMode === 'faction') {
        return (
          factionColorMap.get(character.id) ??
          ROLE_COLORS[character.role] ??
          'var(--color-text-secondary)'
        );
      }
      return ROLE_COLORS[character.role] ?? 'var(--color-text-secondary)';
    },
    [colorMode, factionColorMap]
  );

  // Pan/zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isDraggingCanvas = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // ─── Resize observer ────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      // Skip 0×0 reports that occur when the panel is hidden (display:none)
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ─── Build & run simulation ──────────────────────────────────────────────

  useEffect(() => {
    if (!characters.length) return;

    const filteredLinks = relationships.filter((r) => filter === 'all' || r.type === filter);

    const nodes: GraphNode[] = characters.map((c) => ({
      id: c.id,
      character: c,
      x: dimensionsRef.current.width / 2 + (Math.random() - 0.5) * 200,
      y: dimensionsRef.current.height / 2 + (Math.random() - 0.5) * 200,
    }));

    const links: GraphLink[] = filteredLinks.map((r) => ({
      source: r.sourceId,
      target: r.targetId,
      relationship: r,
    }));

    nodesRef.current = nodes;
    linksRef.current = links;

    // Stop previous simulation
    simulationRef.current?.stop();

    const sim = d3
      .forceSimulation<GraphNode, GraphLink>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(120)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(-300))
      .force(
        'center',
        d3.forceCenter(dimensionsRef.current.width / 2, dimensionsRef.current.height / 2)
      )
      .force('collision', d3.forceCollide<GraphNode>(NODE_RADIUS + 10))
      .on('tick', () => {
        setNodePositions([...nodesRef.current]);
        setLinkPositions([...linksRef.current]);
      })
      .on('end', () => {
        setNodePositions([...nodesRef.current]);
        setLinkPositions([...linksRef.current]);
      });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [characters, relationships, filter]);

  // Update center force position on resize — without recreating nodes or restarting from scratch
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    const sim = simulationRef.current;
    if (!sim) return;
    const centerForce = sim.force<d3.ForceCenter<GraphNode>>('center');
    if (centerForce) {
      centerForce.x(dimensions.width / 2).y(dimensions.height / 2);
      sim.alpha(0.1).restart();
    }
  }, [dimensions.width, dimensions.height]);

  // ─── Node drag ──────────────────────────────────────────────────────────

  const handleNodeDragStart = useCallback(
    (e: React.MouseEvent, node: GraphNode) => {
      e.stopPropagation();
      const sim = simulationRef.current;
      if (!sim) return;
      nodeDraggedRef.current = false;
      sim.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;

      const onMove = (me: MouseEvent) => {
        const svgEl = svgRef.current;
        if (!svgEl) return;
        nodeDraggedRef.current = true;
        const rect = svgEl.getBoundingClientRect();
        node.fx = (me.clientX - rect.left - transform.x) / transform.k;
        node.fy = (me.clientY - rect.top - transform.y) / transform.k;
      };
      const onUp = () => {
        sim.alphaTarget(0);
        node.fx = null;
        node.fy = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [transform]
  );

  // ─── Canvas pan ─────────────────────────────────────────────────────────

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingCanvas.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingCanvas.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    isDraggingCanvas.current = false;
  }, []);

  // ─── Scroll zoom ─────────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      setTransform((prev) => {
        const newK = Math.min(3, Math.max(0.2, prev.k * delta));
        const newX = cx - ((cx - prev.x) / prev.k) * newK;
        const newY = cy - ((cy - prev.y) / prev.k) * newK;
        return { x: newX, y: newY, k: newK };
      });
    },
    [dimensions.width, dimensions.height]
  );

  // ─── Parallel-edge offsets ──────────────────────────────────────────────
  // For each link, compute a perpendicular offset so that multiple edges
  // between the same node pair are rendered as parallel straight lines.

  const linkParallelOffsets = useMemo(() => {
    // Use relationship.sourceId/targetId (always plain strings, never d3-resolved objects)
    const pairCount = new Map<string, number>();
    linkPositions.forEach((link) => {
      const key = [link.relationship.sourceId, link.relationship.targetId].sort().join('||');
      pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
    });
    const pairSeen = new Map<string, number>();
    return linkPositions.map((link) => {
      const key = [link.relationship.sourceId, link.relationship.targetId].sort().join('||');
      const count = pairCount.get(key) ?? 1;
      const idx = pairSeen.get(key) ?? 0;
      pairSeen.set(key, idx + 1);
      // Evenly spread: centre the group around 0, 14px apart
      return count === 1 ? 0 : (idx - (count - 1) / 2) * 14;
    });
  }, [linkPositions]);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const isHighlighted = (nodeId: CharacterId): boolean => {
    if (!hoveredId && !selectedId) return true;
    const activeId = hoveredId ?? selectedId;
    if (nodeId === activeId) return true;
    return linksRef.current.some((l) => {
      const src = (l.source as GraphNode).id ?? l.source;
      const tgt = (l.target as GraphNode).id ?? l.target;
      return (src === activeId && tgt === nodeId) || (tgt === activeId && src === nodeId);
    });
  };

  const isLinkHighlighted = (link: GraphLink): boolean => {
    if (!hoveredId && !selectedId) return true;
    const activeId = hoveredId ?? selectedId;
    const src = (link.source as GraphNode).id ?? link.source;
    const tgt = (link.target as GraphNode).id ?? link.target;
    return src === activeId || tgt === activeId;
  };

  // ─── Loading / Empty states ──────────────────────────────────────────────

  if (charsLoading || relsLoading) return <LoadingSpinner text="Loading characters..." />;
  if (!characters.length) {
    return (
      <EmptyState
        title="No characters yet"
        description="Add characters in Story Bible to see the relationship map."
      />
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        {RELATIONSHIP_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant="ghost"
            size="sm"
            className={filter === f.value ? styles.filterActive : ''}
            onClick={() => setFilter(f.value)}
          >
            {f.value !== 'all' && (
              <span className={styles.filterDot} style={{ background: LINK_COLORS[f.value] }} />
            )}
            {f.label}
          </Button>
        ))}
        <span className={styles.filterStats}>
          {characters.length} characters · {linkPositions.length} relationships
        </span>
        <div className={styles.colorModeToggle}>
          <Button
            variant="ghost"
            size="sm"
            className={colorMode === 'faction' ? styles.colorModeBtnActive : ''}
            onClick={() => setColorMode('faction')}
          >
            By Faction
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={colorMode === 'role' ? styles.colorModeBtnActive : ''}
            onClick={() => setColorMode('role')}
          >
            By Role
          </Button>
        </div>
      </div>

      {/* SVG canvas */}
      <div
        ref={containerRef}
        className={styles.canvas}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <polygon points="0 0, 8 4, 0 8" fill="context-stroke" />
            </marker>
          </defs>

          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
            {/* Links */}
            {linkPositions.map((link, i) => {
              const src = link.source as GraphNode;
              const tgt = link.target as GraphNode;
              if (src.x == null || tgt.x == null || src.y == null || tgt.y == null) return null;

              // Shorten line to node edge
              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const x1 = src.x + (dx / dist) * NODE_RADIUS;
              const y1 = src.y + (dy / dist) * NODE_RADIUS;
              const x2 = tgt.x - (dx / dist) * NODE_RADIUS;
              const y2 = tgt.y - (dy / dist) * NODE_RADIUS;

              const color = LINK_COLORS[link.relationship.type];
              const dash = LINK_DASH[link.relationship.type];
              const highlighted = isLinkHighlighted(link);

              // Perpendicular offset for parallel edges.
              // When two links go A→B and B→A, their dx/dy flip sign, so naively
              // applying the offset puts both lines on the same side. Fix: always
              // apply the perpendicular in the canonical (sorted-ID) direction so
              // opposite-direction edges end up on opposite sides.
              const rawOffset = linkParallelOffsets[i] ?? 0;
              const isCanonical = link.relationship.sourceId <= link.relationship.targetId;
              const offset = rawOffset * (isCanonical ? 1 : -1);
              const perpX = -(dy / dist) * offset;
              const perpY = (dx / dist) * offset;
              const ox1 = x1 + perpX;
              const oy1 = y1 + perpY;
              const ox2 = x2 + perpX;
              const oy2 = y2 + perpY;

              return (
                <g key={link.relationship.id} opacity={highlighted ? 1 : 0.15}>
                  <line
                    x1={ox1}
                    y1={oy1}
                    x2={ox2}
                    y2={oy2}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray={dash}
                    markerEnd="url(#arrowhead)"
                  />
                  {/* Relationship type label at midpoint */}
                  <text
                    x={(ox1 + ox2) / 2}
                    y={(oy1 + oy2) / 2 - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill={color}
                    className={styles.linkLabel}
                  >
                    {link.relationship.type}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodePositions.map((node) => {
              if (node.x == null || node.y == null) return null;
              const color = getNodeColor(node.character);
              const highlighted = isHighlighted(node.id);
              const isSelected = selectedId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  opacity={highlighted ? 1 : 0.2}
                  style={{ cursor: 'grab' }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onMouseDown={(e) => handleNodeDragStart(e, node)}
                  onClick={() => {
                    // Ignore clicks that were actually a drag
                    if (nodeDraggedRef.current) return;
                    if (selectedId === node.id) {
                      // Second click → navigate to Story Bible
                      const store = useStoryBibleStore.getState();
                      store.setTab('characters');
                      store.select(node.id);
                      navigate('/bible');
                    } else {
                      setSelectedId(node.id);
                    }
                  }}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      r={NODE_RADIUS + 5}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      opacity={0.7}
                    />
                  )}
                  {/* Node circle */}
                  <circle
                    r={NODE_RADIUS}
                    fill="var(--color-bg-elevated)"
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {/* Character initial */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    fontWeight="600"
                    fill={color}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.character.name.charAt(0)}
                  </text>
                  {/* Name label */}
                  <text
                    y={NODE_RADIUS + 12}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--color-text)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.character.name}
                  </text>
                  {/* Role badge */}
                  <text
                    y={NODE_RADIUS + 23}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--color-text-secondary)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.character.role}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className={styles.zoomControls}>
          <Button
            variant="ghost"
            size="sm"
            className={styles.zoomBtn}
            onClick={() => {
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              setTransform((p) => {
                const newK = Math.min(3, p.k * 1.2);
                return {
                  x: cx - ((cx - p.x) / p.k) * newK,
                  y: cy - ((cy - p.y) / p.k) * newK,
                  k: newK,
                };
              });
            }}
          >
            +
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={styles.zoomBtn}
            onClick={() => {
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              setTransform((p) => {
                const newK = Math.max(0.2, p.k * 0.8);
                return {
                  x: cx - ((cx - p.x) / p.k) * newK,
                  y: cy - ((cy - p.y) / p.k) * newK,
                  k: newK,
                };
              });
            }}
          >
            −
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={styles.zoomBtn}
            onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
            title="Reset view"
          >
            ⊙
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {colorMode === 'faction' ? (
          <>
            <span className={styles.legendTitle}>Factions</span>
            {factions.map((faction, i) => (
              <span key={faction.id} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: FACTION_PALETTE[i % FACTION_PALETTE.length] }}
                />
                {faction.name}
              </span>
            ))}
            {factions.length === 0 && (
              <span className={styles.legendItem} style={{ color: 'var(--color-text-secondary)' }}>
                No factions — showing role colors
              </span>
            )}
          </>
        ) : (
          <>
            <span className={styles.legendTitle}>Roles</span>
            {Object.entries(ROLE_COLORS).map(([role, color]) => (
              <span key={role} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                {role}
              </span>
            ))}
          </>
        )}
        <span className={styles.legendDivider} />
        <span className={styles.legendTitle}>Types</span>
        {Object.entries(LINK_COLORS).map(([type, color]) => (
          <span key={type} className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
