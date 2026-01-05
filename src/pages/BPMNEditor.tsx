import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Alert,
} from "@mui/material";
import { ArrowBack, Visibility } from "@mui/icons-material";
// import BpmnViewer from "bpmn-js/lib/Viewer";
// import { diff } from "bpmn-js-differ";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "../styles/bpmn.css";
import BPMNModeler from "../components/bpmn/BPMNModeler";
//import BPMNChangeHistory from "../components/bpmn/BPMNChangeHistory";
import IssueLinkDrawer from "../components/bpmn/IssueLinkDrawer";
import { useBPMNStore } from "../stores/bpmnStore";
import { useBPMNSync } from "../hooks/useBPMNSync";
//import { api } from "../utils/api";

const BPMNEditor: React.FC = () => {
  const { projectId, diagramId } = useParams<{
    projectId: string;
    diagramId: string;
  }>();
  const navigate = useNavigate();

  const { diagrams, updateDiagram, elementStatuses } = useBPMNStore();

  useBPMNSync(projectId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [selectedElementName, setSelectedElementName] = useState<string>("");
  const [selectedElementType, setSelectedElementType] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [, setChangeHistoryRefresh] = useState(0);
  // const [rightPanelMode, setRightPanelMode] = useState<"history" | "diff">(
  //   "history"
  // );
  // const [previousSprintXml, setPreviousSprintXml] = useState<string | null>(
  //   null
  // );
  // const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  // const viewerOldContainerRef = useRef<HTMLDivElement>(null);
  // const viewerNewContainerRef = useRef<HTMLDivElement>(null);
  // const viewerOldRef = useRef<BpmnViewer | null>(null);
  //const viewerNewRef = useRef<BpmnViewer | null>(null);

  const diagram = diagrams.find((d) => d.id === diagramId);

  useEffect(() => {
    if (!diagram && diagramId) {
      navigate(`/project/${projectId}/bpmn`);
    }
  }, [diagram, diagramId, navigate, projectId]);

  // Fetch previous sprint snapshot when switching to diff mode
  // useEffect(() => {
  //   const fetchPreviousSnapshot = async () => {
  //     if (rightPanelMode === "diff" && diagramId && !previousSprintXml) {
  //       setLoadingSnapshot(true);
  //       try {
  //         const snapshot = await api.get(
  //           `/bpmn/diagrams/${diagramId}/previous-sprint-snapshot`
  //         );
  //         setPreviousSprintXml(snapshot.xml);
  //       } catch (error) {
  //         console.error("Failed to fetch previous sprint snapshot:", error);
  //         setPreviousSprintXml(null);
  //       } finally {
  //         setLoadingSnapshot(false);
  //       }
  //     }
  //   };

  //   fetchPreviousSnapshot();
  // }, [rightPanelMode, diagramId, previousSprintXml]);

  // Setup diff viewers when in diff mode with snapshot available
  // useEffect(() => {
  //   if (
  //     rightPanelMode === "diff" &&
  //     previousSprintXml &&
  //     diagram?.xml &&
  //     viewerOldContainerRef.current &&
  //     viewerNewContainerRef.current
  //   ) {
  //     // Clean up existing viewers
  //     if (viewerOldRef.current) {
  //       viewerOldRef.current.destroy();
  //       viewerOldRef.current = null;
  //     }
  //     if (viewerNewRef.current) {
  //       viewerNewRef.current.destroy();
  //       viewerNewRef.current = null;
  //     }

  //     // Create old viewer (left side - previous sprint)
  //     const viewerOld = new BpmnViewer({
  //       container: viewerOldContainerRef.current,
  //     });
  //     viewerOldRef.current = viewerOld;

  //     // Create new viewer (right side - current version)
  //     const viewerNew = new BpmnViewer({
  //       container: viewerNewContainerRef.current,
  //     });
  //     viewerNewRef.current = viewerNew;

  //     // Sync viewboxes between viewers (based on diff-ui-example)
  //     let changing = false;

  //     const syncViewbox = (sourceViewer: any, targetViewer: any) => {
  //       sourceViewer.on("canvas.viewbox.changed", (e: any) => {
  //         if (changing) {
  //           return;
  //         }
  //         changing = true;
  //         targetViewer.get("canvas").viewbox(e.viewbox);
  //         changing = false;
  //       });
  //     };

  //     // Import both XMLs and apply diff
  //     Promise.all([
  //       viewerOld.importXML(previousSprintXml),
  //       viewerNew.importXML(diagram.xml),
  //     ])
  //       .then(() => {
  //         const result = diff(
  //           viewerOld.getDefinitions(),
  //           viewerNew.getDefinitions()
  //         );

  //         // Apply markers to OLD viewer (shows removed, changed, layout-changed)
  //         const canvasOld = viewerOld.get("canvas") as any;
  //         const overlaysOld = viewerOld.get("overlays") as any;

  //         // Apply removed markers (red) on old viewer
  //         Object.keys(result._removed).forEach((elementId) => {
  //           try {
  //             canvasOld.addMarker(elementId, "diff-removed");
  //             overlaysOld.add(elementId, "diff", {
  //               position: { top: -12, right: 12 },
  //               html: '<span class="marker marker-removed">&minus;</span>',
  //             });
  //           } catch (e) {
  //             // Element might not be visual
  //           }
  //         });

  //         // Apply changed markers (orange) on old viewer
  //         Object.keys(result._changed).forEach((elementId) => {
  //           try {
  //             canvasOld.addMarker(elementId, "diff-changed");
  //             overlaysOld.add(elementId, "diff", {
  //               position: { top: -12, right: 12 },
  //               html: '<span class="marker marker-changed">&#9998;</span>',
  //             });
  //           } catch (e) {
  //             // Element might not be visual
  //           }
  //         });

  //         // Apply layout changed markers (blue) on old viewer
  //         Object.keys(result._layoutChanged).forEach((elementId) => {
  //           try {
  //             canvasOld.addMarker(elementId, "diff-layout-changed");
  //             overlaysOld.add(elementId, "diff", {
  //               position: { top: -12, right: 12 },
  //               html: '<span class="marker marker-layout-changed">&#8680;</span>',
  //             });
  //           } catch (e) {
  //             // Element might not be visual
  //           }
  //         });

  //         // Apply markers to NEW viewer (shows added, changed, layout-changed)
  //         const canvasNew = viewerNew.get("canvas") as any;
  //         const overlaysNew = viewerNew.get("overlays") as any;

  //         // Apply added markers (green) on new viewer
  //         Object.keys(result._added).forEach((elementId) => {
  //           try {
  //             canvasNew.addMarker(elementId, "diff-added");
  //             overlaysNew.add(elementId, "diff", {
  //               position: { top: -12, right: 12 },
  //               html: '<span class="marker marker-added">&#43;</span>',
  //             });
  //           } catch (e) {
  //             // Element might not be visual
  //           }
  //         });

  //         // Apply changed markers (orange) on new viewer
  //         Object.keys(result._changed).forEach((elementId) => {
  //           try {
  //             canvasNew.addMarker(elementId, "diff-changed");
  //             overlaysNew.add(elementId, "diff", {
  //               position: { top: -12, right: 12 },
  //               html: '<span class="marker marker-changed">&#9998;</span>',
  //             });
  //           } catch (e) {
  //             // Element might not be visual
  //           }
  //         });

  //         // Apply layout changed markers (blue) on new viewer
  //         Object.keys(result._layoutChanged).forEach((elementId) => {
  //           try {
  //             canvasNew.addMarker(elementId, "diff-layout-changed");
  //             overlaysNew.add(elementId, "diff", {
  //               position: { top: -12, right: 12 },
  //               html: '<span class="marker marker-layout-changed">&#8680;</span>',
  //             });
  //           } catch (e) {
  //             // Element might not be visual
  //           }
  //         });

  //         // Sync viewboxes initially
  //         const viewboxOld = canvasOld.viewbox();
  //         canvasNew.viewbox(viewboxOld);

  //         // Setup bidirectional viewbox synchronization
  //         syncViewbox(viewerOld, viewerNew);
  //         syncViewbox(viewerNew, viewerOld);
  //       })
  //       .catch((err: any) => {
  //         console.error("Failed to import BPMN for diff:", err);
  //       });
  //   }

  //   // Cleanup function
  //   return () => {
  //     if (viewerOldRef.current) {
  //       viewerOldRef.current.destroy();
  //       viewerOldRef.current = null;
  //     }
  //     if (viewerNewRef.current) {
  //       viewerNewRef.current.destroy();
  //       viewerNewRef.current = null;
  //     }
  //   };
  // }, [rightPanelMode, previousSprintXml, diagram?.xml]);

  const handleSave = (xml: string) => {
    if (!diagramId) return;

    setSaveStatus("saving");
    try {
      updateDiagram(diagramId, { xml });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleElementClick = (
    elementId: string,
    elementType: string,
    elementName: string
  ) => {
    setSelectedElementId(elementId);
    setSelectedElementName(elementName);
    setSelectedElementType(elementType);
    setDrawerOpen(true);
  };

  const handleChangesDetected = () => {
    setChangeHistoryRefresh((prev) => prev + 1);
  };

  if (!diagram) {
    return (
      <Box className="p-6">
        <Alert severity="error">Diagram not found</Alert>
      </Box>
    );
  }

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
            {diagram.name}
          </Typography>
          <Box className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <Chip label="Saving..." color="info" size="small" />
            )}
            {saveStatus === "saved" && (
              <Chip label="Saved" color="success" size="small" />
            )}
            {saveStatus === "error" && (
              <Chip label="Save Error" color="error" size="small" />
            )}
            <Button
              startIcon={<Visibility />}
              onClick={() =>
                navigate(`/project/${projectId}/bpmn/${diagramId}/view`)
              }
            >
              View Mode
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        className="flex-1"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <Box style={{ width: "100%" }}>
          <BPMNModeler
            xml={diagram.xml}
            onSave={handleSave}
            onElementClick={handleElementClick}
            onChangesDetected={handleChangesDetected}
            elementStatuses={elementStatuses}
            diagramId={diagramId}
            lastCommittedXml={diagram.lastCommittedXml}
          />
        </Box>
      </Box>

      <IssueLinkDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        elementId={selectedElementId || ""}
        elementName={selectedElementName}
        elementType={selectedElementType}
        projectId={projectId || ""}
        diagramId={diagramId || ""}
      />
    </Box>
  );
};

export default BPMNEditor;
