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

  //fix save problem
  const handleSave = async (xml: string) => {
    if (!diagramId) return;

    setSaveStatus("saving");
    try {
      await updateDiagram(diagramId, { xml });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };
  // const handleSave = async (xml: string) => {
  //   if (!diagramId) return;

  //   setSaveStatus("saving");
  //   try {
  //     await updateDiagram(diagramId, { xml });
  //     setSaveStatus("saved");
  //     setTimeout(() => setSaveStatus("idle"), 2000);
  //   } catch (error) {
  //     console.error("Save failed:", error);
  //     setSaveStatus("error");
  //     setTimeout(() => setSaveStatus("idle"), 3000);
  //   }
  // };

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
