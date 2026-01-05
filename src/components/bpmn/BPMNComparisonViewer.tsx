import React from "react";
import { Box, Typography, Paper, Alert } from "@mui/material";
import BpmnDiffVisualizer from "./BpmnDiffVisualizer";
import type { ComparisonResult } from "./BpmnGreedyComparator";

//import { getDefaultBPMNXML } from "../../utils/bpmnUtils"; // <-- ADDED IMPORT

interface BPMNComparisonViewerProps {
  sourceXml: string;
  targetXml: string;
  diagramName: string;
}

const BPMNComparisonViewer: React.FC<BPMNComparisonViewerProps> = ({
  sourceXml,
  targetXml,
  //diagramName,
}) => {
  const [comparisonResult, setComparisonResult] =
    React.useState<ComparisonResult | null>(null);

  const handleComparisonResult = (result: ComparisonResult) => {
    setComparisonResult(result);
  };

  return (
    <Paper
      elevation={2}
      style={{
        width: "100%",
        height: "100%",
        padding: "16px",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Diff vs. Last Sprint Baseline
      </Typography>

      <Typography variant="caption" color="text.secondary" className="mb-2">
        This shows changes made since the last sprint completion. New elements
        are highlighted in green.
      </Typography>

      <Box style={{ flexGrow: 1, minHeight: "300px" }}>
        <BpmnDiffVisualizer
          sourceXml={sourceXml}
          targetXml={targetXml}
          onComparisonResult={handleComparisonResult}
          className="h-full"
        />
      </Box>

      {comparisonResult && (
        <Box className="mt-4 shrink-0">
          <Typography variant="subtitle1" gutterBottom>
            Summary
          </Typography>
          <Alert severity="info" className="mb-2">
            Cost: **{comparisonResult.penalty.toFixed(2)}** | Added: **
            {comparisonResult.addedSet.length}** | Deleted: **
            {comparisonResult.deletedSet.length}**
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default BPMNComparisonViewer;
