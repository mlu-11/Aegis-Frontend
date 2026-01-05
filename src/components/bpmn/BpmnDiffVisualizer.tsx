import React, { useRef, useEffect, useState } from "react";
import BpmnViewer from "bpmn-js/lib/Viewer";
import "bpmn-js/dist/assets/diagram-js.module.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.module.css";
import "../../styles/bpmn.module.css";

import { Box, Alert, Typography } from "@mui/material";
import type { ComparisonResult } from "./BpmnGreedyComparator";
import { compareBpmnXml } from "./BpmnGreedyComparator";

interface BpmnDiffVisualizerProps {
  sourceXml: string;
  targetXml: string;
  className?: string;
  onComparisonResult?: (result: ComparisonResult) => void;
}

// Small helper: basic sanity check for BPMN XML
const looksLikeBpmn = (xml: string | null | undefined): boolean => {
  if (!xml || typeof xml !== "string") return false;
  return xml.includes("<bpmn:definitions") || xml.includes("<definitions");
};

// Marker application is a plain function, outside the component
function applyDiffMarkers(result: ComparisonResult, viewer: BpmnViewer) {
  try {
    const canvas = viewer.get("canvas") as any;

    // ADDED (green)
    result.addedSet.forEach((pair) => {
      const element = pair.second;
      if (element?.id) {
        try {
          canvas.addMarker(element.id, "bpmn-element-added");
        } catch {
          // ignore non-visual elements
        }
      }
    });

    // MODIFIED (orange)
    result.matchingSet
      .filter((pair) => pair.second && pair.differenceCost > 0)
      .forEach((pair) => {
        const element = pair.second!;
        if (element?.id) {
          try {
            canvas.addMarker(element.id, "bpmn-element-modified");
          } catch {
            // ignore non-visual elements
          }
        }
      });

    // Deleted elements cannot be shown on target diagram
  } catch (err) {
    console.error("Failed to apply diff markers:", err);
  }
}

const BpmnDiffVisualizer: React.FC<BpmnDiffVisualizerProps> = ({
  sourceXml,
  targetXml,
  className = "",
  onComparisonResult,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);

  useEffect(() => {
    if (!containerRef.current || !sourceXml || !targetXml) return;

    // Debug logging to diagnose root-0 problems
    console.log("[BPMN Diff] sourceXml length:", sourceXml.length);
    console.log("[BPMN Diff] targetXml length:", targetXml.length);
    console.log("[BPMN Diff] targetXml head:", targetXml.slice(0, 120));

    if (!looksLikeBpmn(targetXml)) {
      setError(
        "Target BPMN XML does not look like a BPMN <definitions> document."
      );
      return;
    }

    // Ensure container has a size
    if (
      containerRef.current.offsetWidth === 0 ||
      containerRef.current.offsetHeight === 0
    ) {
      containerRef.current.style.width = "100%";
      containerRef.current.style.height = "500px";
    }

    // Destroy existing viewer if it exists
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    // 1) Run comparison
    let result: ComparisonResult;
    try {
      result = compareBpmnXml(sourceXml, targetXml);
      setComparisonResult(result);
      onComparisonResult?.(result);
      setError(null);
    } catch (err: any) {
      console.error("Error running BPMN comparison:", err);
      setError(
        `Failed to compare BPMN diagrams: ${err?.message || "Unknown error"}`
      );
      return;
    }

    // 2) Initialize viewer for the TARGET XML
    viewerRef.current = new BpmnViewer({
      container: containerRef.current,
    });

    // 3) Import target XML & apply markers
    viewerRef.current
      .importXML(targetXml)
      .then((importResult: any) => {
        if (importResult.warnings && importResult.warnings.length > 0) {
          console.warn("BPMN import warnings:", importResult.warnings);
        }
        applyDiffMarkers(result, viewerRef.current!);
      })
      .catch((err: any) => {
        console.error("Error importing BPMN XML:", err);
        console.error(
          "[BPMN Diff] targetXml preview:",
          targetXml.slice(0, 200)
        );
        setError(
          `Failed to load BPMN diagram: ${err?.message || "Unknown error"}`
        );
      });

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [sourceXml, targetXml, onComparisonResult]);

  if (error) {
    return (
      <Box
        className={`w-full h-full flex items-center justify-center ${className}`}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      className={`w-full h-full ${className}`}
      style={{ minHeight: "500px" }}
    >
      <Typography variant="h6" component="h2" className="mb-2">
        BPMN Diff Visualizer (Target Model)
      </Typography>
      <Typography variant="body2" color="text.secondary" className="mb-4">
        Elements <strong>added</strong> since the baseline are highlighted in
        green. Elements <strong>modified</strong> are highlighted in orange.
        Deleted elements are not visible in the target model.
      </Typography>
      {comparisonResult && (
        <Alert severity="info" className="mb-4">
          Total Transformation Cost (Penalty):{" "}
          <strong>{comparisonResult.penalty.toFixed(2)}</strong> | Added:{" "}
          <strong>{comparisonResult.addedSet.length}</strong> | Deleted:{" "}
          <strong>{comparisonResult.deletedSet.length}</strong> | Matched:{" "}
          <strong>{comparisonResult.matchingSet.length}</strong>
        </Alert>
      )}
      <div
        ref={containerRef}
        className="bpmn-container w-full h-full"
        style={{
          minHeight: "500px",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      />
    </Box>
  );
};

export default BpmnDiffVisualizer;
