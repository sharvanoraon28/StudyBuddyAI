
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRenderedChart = useRef<string | null>(null);

  useEffect(() => {
    if (containerRef.current && chart && chart !== lastRenderedChart.current) {
        containerRef.current.innerHTML = chart;
        containerRef.current.removeAttribute('data-processed');
        
        try {
            mermaid.run({
                nodes: [containerRef.current],
            });
            lastRenderedChart.current = chart;
        } catch(e) {
            console.error("Mermaid rendering error:", e);
            if (containerRef.current) {
                containerRef.current.innerHTML = `<div class="text-red-400 p-4">Error rendering diagram. The generated syntax might be invalid.</div>`;
            }
        }
    }
  }, [chart]);

  return (
    <div className="p-4 w-full h-full flex items-center justify-center">
        <div ref={containerRef} className="mermaid w-full h-full">
            {chart}
        </div>
    </div>
  );
};

export default MermaidDiagram;
