import React, { useEffect, useState, useMemo } from "react";
import { useBPMNStore } from "../stores/bpmnStore"; //
import { useParams } from "react-router";
import {
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add,
  PlayArrow,
  Stop,
  CheckCircle,
  Visibility,
} from "@mui/icons-material";
import { Gantt, ViewMode, type Task } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { useSprintStore } from "../stores/sprintStore";
import { useProjectStore } from "../stores/projectStore";
import { useIssueStore } from "../stores/issueStore";
import type { Sprint } from "../types";
import SprintForm from "../components/SprintForm";
import SprintDetailModal from "../components/SprintDetailModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import IssueForm from "../components/IssueForm";
import IssueDetailModal from "../components/IssueDetailModal";
import { useChangelogStore } from "../stores/changelogStore";

const SprintList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    getSprintsByProject,
    addSprint,
    updateSprint,
    deleteSprint,
    canStartSprint,
    fetchSprints,
  } = useSprintStore();
  const { currentProject, setCurrentProject, getProjectById } =
    useProjectStore();
  const { getIssuesBySprint, fetchIssues } = useIssueStore();
  //
  const { clearChangeLogsByDiagram } = useChangelogStore(); // <-- DESTRUCTURE NEW ACTION
  //
  const { getDiagramsByProject, updateDiagramLastCommittedXml } =
    useBPMNStore();

  const [isSprintFormOpen, setIsSprintFormOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [viewingSprint, setViewingSprint] = useState<Sprint | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);
  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [viewingIssue, setViewingIssue] = useState<any>(null);
  const [deletingIssue, setDeletingIssue] = useState<any>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });

  const { deleteIssue } = useIssueStore();

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      setCurrentProject(project || null);
    }
  }, [projectId, getProjectById, setCurrentProject]);

  const loadData = async () => {
    if (projectId) {
      await Promise.all([fetchSprints(projectId), fetchIssues(projectId)]);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const projectSprints = projectId ? getSprintsByProject(projectId) : [];

  const handleCreateSprint = () => {
    setEditingSprint(null);
    setIsSprintFormOpen(true);
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setIsSprintFormOpen(true);
  };

  const handleViewSprint = (sprint: Sprint) => {
    console.log("view sprint");
    setViewingSprint(sprint);
  };

  const handleDeleteSprint = (sprint: Sprint) => {
    setDeletingSprint(sprint);
  };

  const handleSprintFormSubmit = async (
    sprintData: Omit<Sprint, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (editingSprint) {
        await updateSprint(editingSprint.id, sprintData);
        showSnackbar("Sprint updated successfully!", "success");
      } else {
        await addSprint(sprintData);

        if (sprintData.issueIds && sprintData.issueIds.length > 0) {
          const { assignIssueToSprint } = useIssueStore.getState();
          const allSprints = getSprintsByProject(projectId || "");
          const newSprint = allSprints.find(
            (s) =>
              s.name === sprintData.name && s.projectId === sprintData.projectId
          );

          if (newSprint) {
            await Promise.all(
              sprintData.issueIds.map((issueId) =>
                assignIssueToSprint(issueId, newSprint.id)
              )
            );
          }
        }

        showSnackbar(
          `Sprint created successfully with ${
            sprintData.issueIds?.length || 0
          } issues!`,
          "success"
        );
      }
      setIsSprintFormOpen(false);
      setEditingSprint(null);
      await loadData();
    } catch (error) {
      showSnackbar("An error occurred. Please try again.", "error");
    }
  };

  const confirmDeleteSprint = async () => {
    if (deletingSprint) {
      try {
        const sprintIssues = getIssuesBySprint(deletingSprint.id);
        await Promise.all(
          sprintIssues.map((issue) => {
            const { assignIssueToSprint } = useIssueStore.getState();
            return assignIssueToSprint(issue.id, undefined);
          })
        );

        await deleteSprint(deletingSprint.id);
        showSnackbar(
          "Sprint deleted successfully! All issues moved back to backlog.",
          "success"
        );
        setDeletingSprint(null);
        await loadData();
      } catch (error) {
        showSnackbar("An error occurred while deleting the sprint.", "error");
      }
    }
  };
  //..............................
  const handleSprintStatusChange = async (
    sprintId: string,
    newStatus: string
  ) => {
    if (newStatus === "ACTIVE" && projectId && !canStartSprint(projectId)) {
      showSnackbar(
        "Cannot start sprint: Another sprint is already active",
        "error"
      );
      return;
    }

    // try {
    //   //Commit BPMN Diagrams when the sprint is completed
    //   if (newStatus === "COMPLETED" && projectId) {
    //     // <-- NEW LOGIC
    //     const diagrams = getDiagramsByProject(projectId);
    //     await Promise.all(
    //       diagrams.map(async (diagram) => {
    //         if (diagram.xml) {
    //           await updateDiagramLastCommittedXml(diagram.id, diagram.xml);
    //         }
    //       })
    //     );
    //   }

    try {
      // Step 1: Commit BPMN Diagrams and clear change history when the sprint is completed
      if (newStatus === "COMPLETED" && projectId) {
        const diagrams = getDiagramsByProject(projectId);

        await Promise.all(
          diagrams.map(async (diagram) => {
            if (diagram.xml) {
              try {
                // 1. Save the XML snapshot (This marks the start of the next iteration's work)
                await updateDiagramLastCommittedXml(diagram.id, diagram.xml);

                // 2. Clear all change logs for this diagram (Resets the history)
                await clearChangeLogsByDiagram(diagram.id);
              } catch (error) {
                console.error(
                  `Failed to complete BPMN commit/clear for diagram ${diagram.name} (${diagram.id}):`,
                  error
                );
                // Continue despite failure, as the sprint status change is more critical
              }
            }
          })
        );
      }
      //  Update Sprint Status
      await updateSprint(sprintId, { status: newStatus as any });
      setViewingSprint(null);

      let message = "";
      switch (newStatus) {
        case "ACTIVE":
          message = "Sprint started successfully!";
          break;
        case "COMPLETED":
          message = "Sprint completed successfully!";
          break;
        default:
          message = "Sprint status updated!";
      }
      showSnackbar(message, "success");
      await loadData();
    } catch (error) {
      showSnackbar("An error occurred while updating sprint status.", "error");
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEditIssue = (issue: any) => {
    setEditingIssue(issue);
    setIsIssueFormOpen(true);
  };

  const handleDeleteIssue = (issue: any) => {
    setDeletingIssue(issue);
  };

  const handleViewIssue = (issue: any) => {
    setViewingIssue(issue);
  };

  const confirmDeleteIssue = async () => {
    if (deletingIssue) {
      try {
        await deleteIssue(deletingIssue.id);
        showSnackbar("Issue deleted successfully!", "success");
        setDeletingIssue(null);
        await loadData();
      } catch (error) {
        showSnackbar("Failed to delete issue", "error");
      }
    }
  };

  const handleIssueFormSubmit = async (issueData: any) => {
    try {
      const { updateIssue, addIssue } = useIssueStore.getState();
      if (editingIssue) {
        await updateIssue(editingIssue.id, issueData);
        showSnackbar("Issue updated successfully!", "success");
      } else {
        await addIssue(issueData);
        showSnackbar("Issue created successfully!", "success");
      }
      setIsIssueFormOpen(false);
      setEditingIssue(null);
      await loadData();
    } catch (error) {
      showSnackbar("An error occurred. Please try again.", "error");
    }
  };

  const handleIssueStatusChange = async (
    issueId: string,
    newStatus: string
  ) => {
    try {
      const { updateIssueStatus } = useIssueStore.getState();
      await updateIssueStatus(issueId, newStatus as any);
      showSnackbar("Issue status updated!", "success");
      await loadData();
    } catch (error) {
      showSnackbar("Failed to update issue status", "error");
    }
  };

  const getSprintProgress = (sprintId: string) => {
    const sprintIssues = getIssuesBySprint(sprintId);
    if (sprintIssues.length === 0) return 0;

    const completedIssues = sprintIssues.filter(
      (issue) => issue.status === "DONE"
    ).length;
    return (completedIssues / sprintIssues.length) * 100;
  };

  const ganttTasks: Task[] = useMemo(() => {
    return projectSprints.map((sprint) => {
      const progress = getSprintProgress(sprint.id);
      const sprintIssues = getIssuesBySprint(sprint.id);

      return {
        start: sprint.startDate,
        end: sprint.endDate,
        name: `${sprint.name} (${sprintIssues.length} issues)`,
        id: sprint.id,
        type: "task",
        progress: progress,
        isDisabled: false,
        styles: {
          progressColor:
            sprint.status === "COMPLETED"
              ? "#4caf50"
              : sprint.status === "ACTIVE"
              ? "#2196f3"
              : "#ff9800",
          progressSelectedColor:
            sprint.status === "COMPLETED"
              ? "#388e3c"
              : sprint.status === "ACTIVE"
              ? "#1976d2"
              : "#f57c00",
        },
      };
    });
  }, [projectSprints, getIssuesBySprint]);

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isGanttView, setIsGanttView] = useState(false); // remove ganttview option

  const handleTaskClick = (task: Task) => {
    console.log("task clicked");
    const sprint = projectSprints.find((s) => s.id === task.id);
    if (sprint) {
      handleViewSprint(sprint);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "default";
      case "ACTIVE":
        return "primary";
      case "COMPLETED":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PLANNING":
        return <PlayArrow fontSize="small" />;
      case "ACTIVE":
        return <Stop fontSize="small" />;
      case "COMPLETED":
        return <CheckCircle fontSize="small" />;
      default:
        return null;
    }
  };

  if (!currentProject) {
    return (
      <Box className="py-8">
        <Typography variant="h6">Project not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1" fontWeight="bold">
          Sprints Timeline
        </Typography>
        <Box className="flex gap-2 items-center">
          {/* <Button
            variant={isGanttView ? "contained" : "outlined"}
            size="small"
            onClick={() => setIsGanttView(true)}
          >
            Gantt View
          </Button> */}
          {/* <Button
            variant={!isGanttView ? "contained" : "outlined"}
            size="small"
            onClick={() => setIsGanttView(false)}
          >
            List View
          </Button> */}
          {/* {isGanttView && (
            <>
              <Button
                variant={viewMode === ViewMode.Day ? "contained" : "outlined"}
                size="small"
                onClick={() => setViewMode(ViewMode.Day)}
              >
                Day
              </Button>
              <Button
                variant={viewMode === ViewMode.Week ? "contained" : "outlined"}
                size="small"
                onClick={() => setViewMode(ViewMode.Week)}
              >
                Week
              </Button>
              <Button
                variant={viewMode === ViewMode.Month ? "contained" : "outlined"}
                size="small"
                onClick={() => setViewMode(ViewMode.Month)}
              >
                Month
              </Button>
            </>
          )} */}
          <Button
            variant="contained"
            startIcon={<Add />}
            color="primary"
            onClick={handleCreateSprint}
          >
            Create Sprint
          </Button>
        </Box>
      </Box>

      {isGanttView ? (
        <Card className="mb-6">
          <CardContent className="p-0">
            {ganttTasks.length > 0 ? (
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                onClick={handleTaskClick}
                columnWidth={
                  viewMode === ViewMode.Month
                    ? 300
                    : viewMode === ViewMode.Week
                    ? 100
                    : 65
                }
                rowHeight={50}
                listCellWidth="250px"
              />
            ) : (
              <Box className="p-8 text-center">
                <Typography
                  variant="h6"
                  color="text.secondary"
                  className="mb-2"
                >
                  No sprints to display
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first sprint to see the timeline
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box className="space-y-4">
          {projectSprints.map((sprint) => {
            const sprintIssues = getIssuesBySprint(sprint.id);
            const progress = getSprintProgress(sprint.id);

            return (
              <Box key={sprint.id}>
                <Paper className="p-4 hover:shadow-md transition-shadow">
                  <Box className="flex items-start justify-between mb-3">
                    <Box>
                      <Typography variant="h6" component="h2" className="mb-1">
                        {sprint.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="mb-2"
                      >
                        {sprint.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sprint.startDate.toLocaleDateString()} -{" "}
                        {sprint.endDate.toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Box className="flex items-center gap-2">
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(progress)}%
                      </Typography>
                      <Chip
                        icon={getStatusIcon(sprint.status) || undefined}
                        label={sprint.status}
                        color={getStatusColor(sprint.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Box className="mb-3">
                    <Box className="flex items-center justify-between mb-1">
                      <Typography variant="body2" color="text.secondary">
                        Progress: {Math.round(progress)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {
                          sprintIssues.filter(
                            (issue) => issue.status === "DONE"
                          ).length
                        }{" "}
                        / {sprintIssues.length} issues completed
                      </Typography>
                    </Box>
                    <Box className="w-full bg-gray-200 rounded-full h-2">
                      <Box
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                          backgroundColor:
                            sprint.status === "COMPLETED"
                              ? "#4caf50"
                              : sprint.status === "ACTIVE"
                              ? "#2196f3"
                              : "#ff9800",
                        }}
                      />
                    </Box>
                  </Box>

                  <Box className="flex items-center justify-between">
                    <Typography variant="body2" color="text.secondary">
                      {sprintIssues.length} issues • Duration:{" "}
                      {Math.ceil(
                        (sprint.endDate.getTime() -
                          sprint.startDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </Typography>

                    <Box className="flex gap-2">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSprint(sprint)}
                        title="View Details"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewSprint(sprint)}
                      >
                        View Details
                      </Button>

                      {sprint.status === "PLANNING" && (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={
                            projectId ? !canStartSprint(projectId) : false
                          }
                          onClick={() =>
                            handleSprintStatusChange(sprint.id, "ACTIVE")
                          }
                          title={
                            projectId && !canStartSprint(projectId)
                              ? "Another sprint is already active"
                              : ""
                          }
                        >
                          Start Sprint
                        </Button>
                      )}
                      {sprint.status === "ACTIVE" && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() =>
                            handleSprintStatusChange(sprint.id, "COMPLETED")
                          }
                        >
                          Complete Sprint
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}

      {projectSprints.length === 0 && !isGanttView && (
        <Paper className="p-8 text-center">
          <Typography variant="h6" color="text.secondary" className="mb-2">
            No sprints created yet
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            Create your first sprint to start organizing your work
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateSprint}
          >
            Create First Sprint
          </Button>
        </Paper>
      )}

      {/* Sprint表单对话框 */}
      <SprintForm
        open={isSprintFormOpen}
        onClose={() => setIsSprintFormOpen(false)}
        onSubmit={handleSprintFormSubmit}
        initialData={editingSprint}
        mode={editingSprint ? "edit" : "create"}
        projectId={projectId || ""}
      />

      {/* Sprint详情模态框 */}
      <SprintDetailModal
        open={Boolean(viewingSprint)}
        onClose={() => setViewingSprint(null)}
        sprint={viewingSprint}
        onEdit={handleEditSprint}
        onDelete={handleDeleteSprint}
        onStatusChange={handleSprintStatusChange}
        onEditIssue={handleEditIssue}
        onDeleteIssue={handleDeleteIssue}
        onViewIssue={handleViewIssue}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={Boolean(deletingSprint)}
        onClose={() => setDeletingSprint(null)}
        onConfirm={confirmDeleteSprint}
        title="Delete Sprint"
        message={`Are you sure you want to delete "${deletingSprint?.name}"?`}
        warningMessage="All issues assigned to this sprint will be moved back to the backlog."
      />

      {/* Issue表单对话框 */}
      <IssueForm
        open={isIssueFormOpen}
        onClose={() => setIsIssueFormOpen(false)}
        onSubmit={handleIssueFormSubmit}
        initialData={editingIssue}
        mode={editingIssue ? "edit" : "create"}
        projectId={projectId || ""}
      />

      {/* Issue详情模态框 */}
      <IssueDetailModal
        open={Boolean(viewingIssue)}
        onClose={() => setViewingIssue(null)}
        issue={viewingIssue}
        onEdit={handleEditIssue}
        onDelete={handleDeleteIssue}
        onStatusChange={handleIssueStatusChange}
      />

      {/* Issue删除确认对话框 */}
      <DeleteConfirmDialog
        open={Boolean(deletingIssue)}
        onClose={() => setDeletingIssue(null)}
        onConfirm={confirmDeleteIssue}
        title="Delete Issue"
        message={`Are you sure you want to delete "${deletingIssue?.title}"?`}
        warningMessage="This action cannot be undone."
      />

      {/* 成功/错误提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SprintList;
