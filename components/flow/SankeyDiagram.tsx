'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Transaction } from '@/hooks/useOnChainData';

interface SankeyNode {
  name: string;
  color: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function SankeyDiagram({ transactions }: { transactions: Transaction[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, links } = useMemo(() => {
    if (transactions.length === 0) {
      return { nodes: [], links: [] };
    }

    const nodeMap = new Map<string, number>();
    const nodesArr: SankeyNode[] = [];
    const linksArr: SankeyLink[] = [];

    // Helper to get or create node index
    const getNodeIndex = (name: string, color: string): number => {
      if (nodeMap.has(name)) return nodeMap.get(name)!;
      const idx = nodesArr.length;
      nodeMap.set(name, idx);
      nodesArr.push({ name, color });
      return idx;
    };

    // Central treasury node
    const treasuryIdx = getNodeIndex('Treasury', '#F54E00');

    // Aggregate inflows by source
    const inflowMap = new Map<string, number>();
    const outflowMap = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.type === 'inflow') {
        const key = shortenAddress(tx.from);
        inflowMap.set(key, (inflowMap.get(key) || 0) + parseFloat(tx.value));
      } else {
        const key = shortenAddress(tx.to);
        outflowMap.set(key, (outflowMap.get(key) || 0) + parseFloat(tx.value));
      }
    }

    // Create source nodes → Treasury links
    for (const [source, value] of inflowMap.entries()) {
      if (value <= 0) continue;
      const srcIdx = getNodeIndex(source, '#77B96C');
      linksArr.push({ source: srcIdx, target: treasuryIdx, value });
    }

    // Create Treasury → destination links
    for (const [dest, value] of outflowMap.entries()) {
      if (value <= 0) continue;
      const destIdx = getNodeIndex(dest, '#F54E00');
      linksArr.push({ source: treasuryIdx, target: destIdx, value });
    }

    return { nodes: nodesArr, links: linksArr };
  }, [transactions]);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(400, nodes.length * 40);

    // Manual Sankey layout (no d3-sankey dependency issues)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const nodeWidth = 20;
    const nodePadding = 12;
    const margin = { left: 120, right: 120, top: 20, bottom: 20 };

    // Classify nodes into columns
    const sourceIndices = new Set(links.map(l => l.source));
    const targetIndices = new Set(links.map(l => l.target));

    // Column assignment: sources (left), treasury (center), destinations (right)
    const columns: number[][] = [[], [], []];
    nodes.forEach((_, i) => {
      const isSource = sourceIndices.has(i) && !targetIndices.has(i);
      const isTarget = targetIndices.has(i) && !sourceIndices.has(i);
      if (isSource) columns[0].push(i);
      else if (isTarget) columns[2].push(i);
      else columns[1].push(i); // treasury (both)
    });

    const colX = [margin.left, width / 2 - nodeWidth / 2, width - margin.right - nodeWidth];

    // Compute node heights
    const totalValue = links.reduce((sum, l) => sum + l.value, 0) || 1;
    const availableHeight = height - margin.top - margin.bottom;

    const nodePositions: { x: number; y: number; h: number }[] = new Array(nodes.length);

    for (let col = 0; col < 3; col++) {
      const nodeIds = columns[col];
      if (nodeIds.length === 0) continue;

      const nodeValues = nodeIds.map(id => {
        const linksIn = links.filter(l => l.target === id).reduce((s, l) => s + l.value, 0);
        const linksOut = links.filter(l => l.source === id).reduce((s, l) => s + l.value, 0);
        return Math.max(linksIn, linksOut);
      });

      const totalNodeValue = nodeValues.reduce((s, v) => s + v, 0) || 1;
      const totalPadding = (nodeIds.length - 1) * nodePadding;
      const usableHeight = availableHeight - totalPadding;

      let y = margin.top;
      nodeIds.forEach((id, i) => {
        const h = Math.max(8, (nodeValues[i] / totalNodeValue) * usableHeight);
        nodePositions[id] = { x: colX[col], y, h };
        y += h + nodePadding;
      });
    }

    // Draw links
    links.forEach(link => {
      const src = nodePositions[link.source];
      const tgt = nodePositions[link.target];
      if (!src || !tgt) return;

      const linkHeight = Math.max(2, (link.value / totalValue) * (availableHeight * 0.5));
      const srcY = src.y + src.h / 2;
      const tgtY = tgt.y + tgt.h / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX = (src.x + nodeWidth + tgt.x) / 2;
      const d = `M${src.x + nodeWidth},${srcY} C${midX},${srcY} ${midX},${tgtY} ${tgt.x},${tgtY}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', nodes[link.source].color);
      path.setAttribute('stroke-width', String(Math.max(2, linkHeight)));
      path.setAttribute('stroke-opacity', '0.25');
      path.setAttribute('class', 'sankey-link');

      // Animate
      const length = path.getTotalLength?.() || 500;
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.animation = `sankey-draw 1.5s ease forwards`;

      svg.appendChild(path);
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const pos = nodePositions[i];
      if (!pos) return;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(pos.x));
      rect.setAttribute('y', String(pos.y));
      rect.setAttribute('width', String(nodeWidth));
      rect.setAttribute('height', String(Math.max(8, pos.h)));
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', node.color);
      rect.setAttribute('fill-opacity', '0.9');
      rect.setAttribute('class', 'sankey-node');
      svg.appendChild(rect);

      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const isLeft = pos.x < width / 2;
      text.setAttribute('x', String(isLeft ? pos.x - 8 : pos.x + nodeWidth + 8));
      text.setAttribute('y', String(pos.y + Math.max(8, pos.h) / 2 + 4));
      text.setAttribute('text-anchor', isLeft ? 'end' : 'start');
      text.setAttribute('class', 'sankey-label');
      text.textContent = node.name;
      svg.appendChild(text);
    });

    // Add animation keyframes
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      @keyframes sankey-draw {
        to { stroke-dashoffset: 0; }
      }
    `;
    svg.appendChild(style);

    container.innerHTML = '';
    container.appendChild(svg);

    return () => {
      container.innerHTML = '';
    };
  }, [nodes, links]);

  if (transactions.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 400 }}>
        <div style={{ marginBottom: 16, opacity: 0.8 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 32C8 32 16 24 24 32C32 40 40 24 48 32C56 40 64 32 64 32" stroke="url(#flow_grad_sm)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 48C0 48 8 40 16 48C24 56 32 40 40 48C48 56 56 40 64 48" stroke="url(#flow_grad_sm_2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="flow_grad_sm" x1="8" y1="24" x2="64" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1D4AFF" />
                <stop offset="1" stopColor="#7091FF" />
              </linearGradient>
              <linearGradient id="flow_grad_sm_2" x1="0" y1="40" x2="64" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1D4AFF" stopOpacity="0.5" />
                <stop offset="1" stopColor="#7091FF" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h3 className="empty-state-title">No Flow Data Yet</h3>
        <p className="empty-state-text">
          Send or receive USDC on Arc Testnet to see your money flow visualized as a Sankey diagram.
          Each transaction becomes a flowing river between sources and destinations.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="sankey-container"
      style={{ minHeight: 400, width: '100%' }}
    />
  );
}
