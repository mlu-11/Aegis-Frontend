import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
} from "@mui/material";
import { ArrowBack, Edit } from "@mui/icons-material";
import BPMNViewer from "../components/bpmn/BPMNViewer";
import IssueLinkDrawer from "../components/bpmn/IssueLinkDrawer";
import { useBPMNStore } from "../stores/bpmnStore";
import { useBPMNSync } from "../hooks/useBPMNSync";

const BPMNViewerPage: React.FC = () => {
  const { projectId, diagramId } = useParams<{
    projectId: string;
    diagramId: string;
  }>();
  const navigate = useNavigate();

  const { diagrams, elementStatuses } = useBPMNStore();

  useBPMNSync(projectId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [selectedElementName, setSelectedElementName] = useState<string>("");
  const [selectedElementType, setSelectedElementType] = useState<string>("");

  const diagram = diagrams.find((d) => d.id === diagramId);

  const handleElementClick = (
    elementId: string,
    elementType: string,
    elementName: string
  ) => {
    console.log("BPMN Element clicked:", {
      elementId,
      elementType,
      elementName,
    });
    setSelectedElementId(elementId);
    setSelectedElementName(elementName);
    setSelectedElementType(elementType);
    setDrawerOpen(true);
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
            {diagram.name} (View Mode)
          </Typography>
          <Button
            startIcon={<Edit />}
            onClick={() => navigate(`/project/${projectId}/bpmn/${diagramId}`)}
          >
            Edit Mode
          </Button>
        </Toolbar>
      </AppBar>

      <Box className="flex-1">
        <BPMNViewer
          xml={diagram.xml}
          onElementClick={handleElementClick}
          elementStatuses={elementStatuses}
          diagramId={diagramId}
        />
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

export default BPMNViewerPage;
