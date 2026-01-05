import React, { useRef, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, Edit } from "@mui/icons-material";
import BpmnViewer from "bpmn-js/lib/Viewer";
import { diff } from "bpmn-js-differ";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "../styles/bpmn.css";

import { useBPMNStore } from "../stores/bpmnStore";
import { useSprintStore } from "../stores/sprintStore";

const BPMNDiffViewerPage: React.FC = () => {
  const { projectId, diagramId } = useParams<{
    projectId: string;
    diagramId: string;
  }>();
  const navigate = useNavigate();

  const { diagrams } = useBPMNStore();
  const { sprints, fetchSprints, loading: loadingSprints } = useSprintStore();

  const diagram = diagrams.find((d) => d.id === diagramId);

  const [selectedSprintId1, setSelectedSprintId1] = useState<string>("");
  const [selectedSprintId2, setSelectedSprintId2] = useState<string>("");
  const [compareMode, setCompareMode] = useState<
    "sprint-now" | "sprint-sprint"
  >("sprint-now");

  const viewerOldContainerRef = useRef<HTMLDivElement>(null);
  const viewerNewContainerRef = useRef<HTMLDivElement>(null);
  const viewerOldRef = useRef<BpmnViewer | null>(null);
  const viewerNewRef = useRef<BpmnViewer | null>(null);

  // Load sprints for this project
  useEffect(() => {
    if (!projectId) return;
    fetchSprints(projectId);
  }, [projectId, fetchSprints]);

  if (!diagram) {
    return (
      <Box className="p-6">
        <Alert severity="error">Diagram not found</Alert>
      </Box>
    );
  }

  // Only completed sprints are relevant for diff
  const completedSprints = useMemo(
    () =>
      sprints
        .filter((s) => s.projectId === projectId && s.status === "COMPLETED")
        .sort((a, b) => a.endDate.getTime() - b.endDate.getTime()),
    [sprints, projectId]
  );

  // Default selection = latest completed sprint
  useEffect(() => {
    if (!selectedSprintId1 && completedSprints.length > 0) {
      setSelectedSprintId1(completedSprints[completedSprints.length - 1].id);
    }
  }, [selectedSprintId1, completedSprints]);

  // Helper: get snapshot XML for a given sprint
  const getSnapshotXmlForSprint = (sprintId: string): string | null => {
    const snapshots = diagram.sprintSnapshots ?? [];
    const snap = snapshots.find((s) => s.sprintId === sprintId);
    return snap?.xml ?? null;
  };

  // Compute source/target XML based on compare mode
  const { sourceXml, targetXml, sourceLabel, targetLabel } = useMemo(() => {
    if (compareMode === "sprint-now") {
      // Compare selected sprint with current diagram
      if (!selectedSprintId1) {
        return {
          sourceXml: null,
          targetXml: null,
          sourceLabel: "",
          targetLabel: "",
        };
      }
      const sprint1 = completedSprints.find((s) => s.id === selectedSprintId1);
      const source = getSnapshotXmlForSprint(selectedSprintId1);
      const target = diagram.xml;
      return {
        sourceXml: source,
        targetXml: target,
        sourceLabel: `${sprint1?.name || "Sprint"} (Snapshot)`,
        targetLabel: "Current Version (Now)",
      };
    } else {
      // Compare two sprints
      if (!selectedSprintId1 || !selectedSprintId2) {
        return {
          sourceXml: null,
          targetXml: null,
          sourceLabel: "",
          targetLabel: "",
        };
      }
      const sprint1 = completedSprints.find((s) => s.id === selectedSprintId1);
      const sprint2 = completedSprints.find((s) => s.id === selectedSprintId2);
      const source = getSnapshotXmlForSprint(selectedSprintId1);
      const target = getSnapshotXmlForSprint(selectedSprintId2);
      return {
        sourceXml: source,
        targetXml: target,
        sourceLabel: `${sprint1?.name || "Sprint 1"} (Snapshot)`,
        targetLabel: `${sprint2?.name || "Sprint 2"} (Snapshot)`,
      };
    }
  }, [
    compareMode,
    selectedSprintId1,
    selectedSprintId2,
    completedSprints,
    diagram,
  ]);

  // Setup diff viewers
  useEffect(() => {
    if (
      !sourceXml ||
      !targetXml ||
      !viewerOldContainerRef.current ||
      !viewerNewContainerRef.current
    ) {
      return;
    }

    // Clean up existing viewers
    if (viewerOldRef.current) {
      viewerOldRef.current.destroy();
      viewerOldRef.current = null;
    }
    if (viewerNewRef.current) {
      viewerNewRef.current.destroy();
      viewerNewRef.current = null;
    }

    // Create old viewer (left side)
    const viewerOld = new BpmnViewer({
      container: viewerOldContainerRef.current,
    });
    viewerOldRef.current = viewerOld;

    // Create new viewer (right side)
    const viewerNew = new BpmnViewer({
      container: viewerNewContainerRef.current,
    });
    viewerNewRef.current = viewerNew;

    // Sync viewboxes between viewers
    let changing = false;

    const syncViewbox = (sourceViewer: any, targetViewer: any) => {
      sourceViewer.on("canvas.viewbox.changed", (e: any) => {
        if (changing) {
          return;
        }
        changing = true;
        targetViewer.get("canvas").viewbox(e.viewbox);
        changing = false;
      });
    };

    // Import both XMLs and apply diff
    Promise.all([
      viewerOld.importXML(sourceXml),
      viewerNew.importXML(targetXml),
    ])
      .then(() => {
        const result = diff(
          viewerOld.getDefinitions(),
          viewerNew.getDefinitions()
        );

        // Apply markers to OLD viewer (shows removed, changed, layout-changed)
        const canvasOld = viewerOld.get("canvas") as any;
        const overlaysOld = viewerOld.get("overlays") as any;

        // Apply removed markers (red) on old viewer
        Object.keys(result._removed).forEach((elementId) => {
          try {
            canvasOld.addMarker(elementId, "diff-removed");
            overlaysOld.add(elementId, "diff", {
              position: { top: -12, right: 12 },
              html: '<span class="marker marker-removed">&minus;</span>',
            });
          } catch (e) {
            // Element might not be visual
          }
        });

        // Apply changed markers (orange) on old viewer
        Object.keys(result._changed).forEach((elementId) => {
          try {
            canvasOld.addMarker(elementId, "diff-changed");
            overlaysOld.add(elementId, "diff", {
              position: { top: -12, right: 12 },
              html: '<span class="marker marker-changed">&#9998;</span>',
            });
          } catch (e) {
            // Element might not be visual
          }
        });

        // Apply layout changed markers (blue) on old viewer
        Object.keys(result._layoutChanged).forEach((elementId) => {
          try {
            canvasOld.addMarker(elementId, "diff-layout-changed");
            overlaysOld.add(elementId, "diff", {
              position: { top: -12, right: 12 },
              html: '<span class="marker marker-layout-changed">&#8680;</span>',
            });
          } catch (e) {
            // Element might not be visual
          }
        });

        // Apply markers to NEW viewer (shows added, changed, layout-changed)
        const canvasNew = viewerNew.get("canvas") as any;
        const overlaysNew = viewerNew.get("overlays") as any;

        // Apply added markers (green) on new viewer
        Object.keys(result._added).forEach((elementId) => {
          try {
            canvasNew.addMarker(elementId, "diff-added");
            overlaysNew.add(elementId, "diff", {
              position: { top: -12, right: 12 },
              html: '<span class="marker marker-added">&#43;</span>',
            });
          } catch (e) {
            // Element might not be visual
          }
        });

        // Apply changed markers (orange) on new viewer
        Object.keys(result._changed).forEach((elementId) => {
          try {
            canvasNew.addMarker(elementId, "diff-changed");
            overlaysNew.add(elementId, "diff", {
              position: { top: -12, right: 12 },
              html: '<span class="marker marker-changed">&#9998;</span>',
            });
          } catch (e) {
            // Element might not be visual
          }
        });

        // Apply layout changed markers (blue) on new viewer
        Object.keys(result._layoutChanged).forEach((elementId) => {
          try {
            canvasNew.addMarker(elementId, "diff-layout-changed");
            overlaysNew.add(elementId, "diff", {
              position: { top: -12, right: 12 },
              html: '<span class="marker marker-layout-changed">&#8680;</span>',
            });
          } catch (e) {
            // Element might not be visual
          }
        });

        // Sync viewboxes initially
        const viewboxOld = canvasOld.viewbox();
        canvasNew.viewbox(viewboxOld);

        // Setup bidirectional viewbox synchronization
        syncViewbox(viewerOld, viewerNew);
        syncViewbox(viewerNew, viewerOld);
      })
      .catch((err: any) => {
        console.error("Failed to import BPMN for diff:", err);
      });

    // Cleanup function
    return () => {
      if (viewerOldRef.current) {
        viewerOldRef.current.destroy();
        viewerOldRef.current = null;
      }
      if (viewerNewRef.current) {
        viewerNewRef.current.destroy();
        viewerNewRef.current = null;
      }
    };
  }, [sourceXml, targetXml]);

  // Guards
  if (loadingSprints) {
    return (
      <Box className="h-screen flex flex-col">
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => navigate(`/project/${projectId}/bpmn`)}
              className="mr-2"
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" className="flex-1">
              {diagram.name} (Diff View)
            </Typography>
            <Button
              startIcon={<Edit />}
              onClick={() =>
                navigate(`/project/${projectId}/bpmn/${diagramId}`)
              }
            >
              Edit Mode
            </Button>
          </Toolbar>
        </AppBar>
        <Box className="flex-1 flex items-center justify-center">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (completedSprints.length === 0) {
    return (
      <Box className="h-screen flex flex-col">
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => navigate(`/project/${projectId}/bpmn`)}
              className="mr-2"
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" className="flex-1">
              {diagram.name} (Diff View)
            </Typography>
            <Button
              startIcon={<Edit />}
              onClick={() =>
                navigate(`/project/${projectId}/bpmn/${diagramId}`)
              }
            >
              Edit Mode
            </Button>
          </Toolbar>
        </AppBar>
        <Box className="p-6">
          <Alert severity="info">
            There are no completed sprints yet. Complete at least one sprint to
            compare BPMN models.
          </Alert>
        </Box>
      </Box>
    );
  }

  const hasValidData = !!sourceXml && !!targetXml;

  return (
    <Box className="h-screen flex flex-col">
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate(`/project/${projectId}/bpmn`)}
            className="mr-2"
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" className="flex-1">
            {diagram.name} (Diff View)
          </Typography>
          <Button
            startIcon={<Edit />}
            onClick={() => navigate(`/project/${projectId}/bpmn/${diagramId}`)}
          >
            Edit Mode
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        className="flex-1 flex flex-col p-4 gap-3"
        style={{ overflow: "hidden" }}
      >
        {/* Sprint selection controls */}
        <Box className="flex items-center gap-4 flex-wrap">
          <FormControl size="small" style={{ minWidth: 200 }}>
            <InputLabel id="compare-mode-label">Compare Mode</InputLabel>
            <Select
              labelId="compare-mode-label"
              label="Compare Mode"
              value={compareMode}
              onChange={(e) =>
                setCompareMode(e.target.value as "sprint-now" | "sprint-sprint")
              }
            >
              <MenuItem value="sprint-now">Sprint vs. Now</MenuItem>
              <MenuItem value="sprint-sprint">Sprint vs. Sprint</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" style={{ minWidth: 250 }}>
            <InputLabel id="sprint1-label">
              {compareMode === "sprint-now"
                ? "Select Sprint"
                : "Sprint 1 (Baseline)"}
            </InputLabel>
            <Select
              labelId="sprint1-label"
              label={
                compareMode === "sprint-now"
                  ? "Select Sprint"
                  : "Sprint 1 (Baseline)"
              }
              value={selectedSprintId1}
              onChange={(e) => setSelectedSprintId1(e.target.value as string)}
            >
              {completedSprints.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}{" "}
                  {s.startDate &&
                    `(${s.startDate.toLocaleDateString()} - ${s.endDate.toLocaleDateString()})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {compareMode === "sprint-sprint" && (
            <FormControl size="small" style={{ minWidth: 250 }}>
              <InputLabel id="sprint2-label">Sprint 2 (Target)</InputLabel>
              <Select
                labelId="sprint2-label"
                label="Sprint 2 (Target)"
                value={selectedSprintId2}
                onChange={(e) => setSelectedSprintId2(e.target.value as string)}
              >
                {completedSprints.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}{" "}
                    {s.startDate &&
                      `(${s.startDate.toLocaleDateString()} - ${s.endDate.toLocaleDateString()})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Diff viewers or message */}
        {hasValidData ? (
          <Box
            className="flex-1"
            style={{ display: "flex", gap: "8px", minHeight: 0 }}
          >
            <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Typography
                variant="subtitle2"
                style={{
                  padding: "8px",
                  background: "#f5f5f5",
                  borderBottom: "1px solid #e0e0e0",
                  fontWeight: "bold",
                }}
              >
                {sourceLabel}
              </Typography>
              <div
                ref={viewerOldContainerRef}
                className="bpmn-container"
                style={{
                  flex: 1,
                  minHeight: "400px",
                  position: "relative",
                }}
              />
            </Box>
            <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Typography
                variant="subtitle2"
                style={{
                  padding: "8px",
                  background: "#f5f5f5",
                  borderBottom: "1px solid #e0e0e0",
                  fontWeight: "bold",
                }}
              >
                {targetLabel}
              </Typography>
              <div
                ref={viewerNewContainerRef}
                className="bpmn-container"
                style={{
                  flex: 1,
                  minHeight: "400px",
                  position: "relative",
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box className="flex-1 flex items-center justify-center">
            <Alert severity="info">
              {compareMode === "sprint-now"
                ? "Select a sprint to compare with the current diagram."
                : "Select two sprints to compare. No BPMN snapshots found for the selected sprint(s)."}
            </Alert>
          </Box>
        )}

        {/* Legend */}
        {hasValidData && (
          <Box
            className="p-4"
            style={{ background: "#f9f9f9", borderRadius: "4px" }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Diff Legend
            </Typography>
            <Box style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Box className="flex items-center gap-2">
                <span className="marker marker-added">+</span>
                <Typography variant="body2">
                  <strong style={{ color: "#54b415" }}>Added</strong>
                </Typography>
              </Box>
              <Box className="flex items-center gap-2">
                <span className="marker marker-removed">−</span>
                <Typography variant="body2">
                  <strong style={{ color: "#bb163f" }}>Removed</strong>
                </Typography>
              </Box>
              <Box className="flex items-center gap-2">
                <span className="marker marker-changed">✎</span>
                <Typography variant="body2">
                  <strong style={{ color: "#cd8318" }}>Changed</strong>
                </Typography>
              </Box>
              <Box className="flex items-center gap-2">
                <span className="marker marker-layout-changed">↯</span>
                <Typography variant="body2">
                  <strong style={{ color: "#185085" }}>Layout</strong>
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BPMNDiffViewerPage;
