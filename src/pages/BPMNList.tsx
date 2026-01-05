import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete, Visibility, MoreVert } from "@mui/icons-material";
import { useBPMNStore } from "../stores/bpmnStore";
import { useProjectStore } from "../stores/projectStore";
import { getDefaultBPMNXML } from "../utils/bpmnUtils";
import { CompareArrows } from "@mui/icons-material"; //

const BPMNList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getDiagramsByProject, addDiagram, deleteDiagram, fetchDiagrams } =
    useBPMNStore();
  const { currentProject } = useProjectStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState("");
  const [newDiagramDescription, setNewDiagramDescription] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(
    null
  );

  const loadData = async () => {
    if (projectId) {
      await fetchDiagrams(projectId);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [projectId]);

  const diagrams = projectId ? getDiagramsByProject(projectId) : [];

  const handleCreateDiagram = async () => {
    if (!projectId || !newDiagramName.trim()) return;

    try {
      await addDiagram({
        name: newDiagramName.trim(),
        description: newDiagramDescription.trim(),
        projectId,
        xml: getDefaultBPMNXML(),
      });

      setNewDiagramName("");
      setNewDiagramDescription("");
      setCreateDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Failed to create diagram:", error);
    }
  };

  //
  const handleViewDiff = () => {
    if (selectedDiagramId) {
      navigate(`/project/${projectId}/bpmn/${selectedDiagramId}/diff`);
    }
    handleMenuClose();
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    diagramId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedDiagramId(diagramId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDiagramId(null);
  };

  const handleEditDiagram = () => {
    if (selectedDiagramId) {
      navigate(`/project/${projectId}/bpmn/${selectedDiagramId}`);
    }
    handleMenuClose();
  };

  const handleViewDiagram = () => {
    if (selectedDiagramId) {
      navigate(`/project/${projectId}/bpmn/${selectedDiagramId}/view`);
    }
    handleMenuClose();
  };

  const handleDeleteDiagram = async () => {
    if (selectedDiagramId) {
      try {
        await deleteDiagram(selectedDiagramId);
        await loadData();
      } catch (error) {
        console.error("Failed to delete diagram:", error);
      }
    }
    handleMenuClose();
  };

  if (!currentProject) {
    return (
      <Box className="p-6">
        <Typography variant="h6" color="error">
          Project not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1">
          BPMN Diagrams
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Diagram
        </Button>
      </Box>

      {diagrams.length === 0 ? (
        <Box className="text-center py-12">
          <Typography variant="h6" color="textSecondary" className="mb-4">
            No BPMN diagrams found
          </Typography>
          <Typography variant="body2" color="textSecondary" className="mb-6">
            Create your first BPMN diagram to start modeling your business
            processes
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Diagram
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {diagrams.map((diagram) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={diagram.id}>
              <Card className="h-full">
                <CardContent>
                  <Box className="flex justify-between items-start mb-2">
                    <Typography variant="h6" component="h2" className="flex-1">
                      {diagram.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, diagram.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    className="mb-3"
                  >
                    {diagram.description || "No description"}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Updated: {diagram.updatedAt.toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() =>
                      navigate(`/project/${projectId}/bpmn/${diagram.id}/view`)
                    }
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() =>
                      navigate(`/project/${projectId}/bpmn/${diagram.id}`)
                    }
                  >
                    Edit
                  </Button>
                  {diagram.lastCommittedXml && ( // ADD VIEW DIFF BUTTON
                    <Button
                      size="small"
                      startIcon={<CompareArrows />}
                      onClick={() =>
                        navigate(
                          `/project/${projectId}/bpmn/${diagram.id}/diff`
                        )
                      }
                    >
                      Diff
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDiagram}>
          <Visibility className="mr-2" />
          View
        </MenuItem>
        <MenuItem onClick={handleEditDiagram}>
          <Edit className="mr-2" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteDiagram} sx={{ color: "error.main" }}>
          <Delete className="mr-2" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New BPMN Diagram</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Diagram Name"
            fullWidth
            variant="outlined"
            value={newDiagramName}
            onChange={(e) => setNewDiagramName(e.target.value)}
            className="mb-4"
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newDiagramDescription}
            onChange={(e) => setNewDiagramDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDiagram}
            variant="contained"
            disabled={!newDiagramName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BPMNList;
