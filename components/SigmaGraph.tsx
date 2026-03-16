"use client";

import { useEffect, useMemo, useRef } from "react";
import Sigma from "sigma";
import { createGraphFromDTO } from "@/lib/graph";
import { KnowledgeGraphDTO } from "@/types/graph";

type SigmaGraphProps = {
  data: KnowledgeGraphDTO;
};

export function SigmaGraph({ data }: SigmaGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graph = useMemo(() => createGraphFromDTO(data), [data]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const renderer = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelDensity: 1,
      labelGridCellSize: 80,
      labelRenderedSizeThreshold: 8,
      defaultNodeColor: "#38bdf8",
      defaultEdgeColor: "#334155",
      allowInvalidContainer: false,
    });

    return () => {
      renderer.kill();
    };
  }, [graph]);

  return <div ref={containerRef} className="h-[540px] w-full rounded-lg border border-slate-700 bg-slate-900" />;
}
