'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current) return;

      // Initialize mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
        },
      });

      try {
        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, chart);

        // Insert the SVG
        ref.current.innerHTML = svg;
      } catch (error) {
        console.error('Failed to render Mermaid diagram:', error);
        ref.current.innerHTML = '<p class="text-red-500">Failed to render diagram</p>';
      }
    };

    renderDiagram();
  }, [chart]);

  return <div ref={ref} className={className} />;
}
