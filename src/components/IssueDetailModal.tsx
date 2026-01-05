import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  Close,
  BugReport,
  Task as TaskIcon,
  Person,
  Schedule,
  CalendarToday,
  Assignment,
  AccountTree,
  Visibility,
  OpenInNew,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useUserStore } from "../stores/userStore";
import { useSprintStore } from "../stores/sprintStore";
import { useBPMNStore } from "../stores/bpmnStore";
import type { Issue } from "../types";

interface IssueDetailModalProps {
  open: boolean;
  onClose: () => void;
  issue: Issue | null;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
  onStatusChange: (issueId: string, newStatus: string) => void;
  onViewDependency?: (issue: Issue) => void;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  open,
  onClose,
  issue,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDependency,
}) => {
  const navigate = useNavigate();
  const { getUserById } = useUserStore();
  const { getSprintById } = useSprintStore();
  const { diagrams } = useBPMNStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!issue) return null;

  const assignee = issue.assigneeId ? getUserById(issue.assigneeId) : null;
  const reporter = getUserById(issue.reporterId);
  const sprint = issue.sprintId ? getSprintById(issue.sprintId) : null;

  const linkedBPMNElements = issue.linkedBPMNElements || [];
  const linkedDiagrams = linkedBPMNElements.reduce((acc, element) => {
    const diagram = diagrams.find((d) => d.id === element.diagramId);
    if (diagram && !acc.some((d) => d.id === diagram.id)) {
      acc.push(diagram);
    }
    return acc;
  }, [] as typeof diagrams);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(issue);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(issue);
    handleMenuClose();
  };

  const getTypeIcon = () => {
    switch (issue.type) {
      case "BUG":
        return <BugReport fontSize="small" color="error" />;
      case "USER_STORY":
        return <Person fontSize="small" color="primary" />;
      case "TASK":
      default:
        return <TaskIcon fontSize="small" color="action" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "error";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "info";
      case "LOW":
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TO_DO":
        return "default";
      case "IN_PROGRESS":
        return "primary";
      case "DONE":
        return "success";
      default:
        return "default";
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(issue.id, newStatus);
  };

  const handleViewBPMNDiagram = (diagramId: string) => {
    navigate(`/project/${issue.projectId}/bpmn/${diagramId}/view`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box className="flex items-start justify-between">
          <Box className="flex items-center gap-2 flex-1">
            {getTypeIcon()}
            <Typography variant="h6" component="div" className="flex-1">
              {issue.title}
            </Typography>
          </Box>
          <Box className="flex items-center gap-1">
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box className="space-y-6">
          <Box className="flex items-center gap-4 flex-wrap">
            <Box className="flex items-center gap-2">
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Chip
                label={issue.status.replace("_", " ")}
                color={getStatusColor(issue.status) as any}
                size="small"
                onClick={() => {
                  const statuses = ["TO_DO", "IN_PROGRESS", "DONE"];
                  const currentIndex = statuses.indexOf(issue.status);
                  const nextStatus =
                    statuses[(currentIndex + 1) % statuses.length];
                  handleStatusChange(nextStatus);
                }}
                className="cursor-pointer"
              />
            </Box>

            <Box className="flex items-center gap-2">
              <Typography variant="body2" color="text.secondary">
                Priority:
              </Typography>
              <Chip
                label={issue.priority}
                color={getPriorityColor(issue.priority) as any}
                size="small"
                variant="outlined"
              />
            </Box>

            <Box className="flex items-center gap-2">
              <Typography variant="body2" color="text.secondary">
                Type:
              </Typography>
              <Chip
                label={issue.type.replace("_", " ")}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" className="mb-2">
              Description
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              className="whitespace-pre-wrap"
            >
              {issue.description || "No description provided."}
            </Typography>
          </Box>

          {issue.customFields && issue.customFields.length > 0 && (
            <Box>
              <Typography variant="subtitle2" className="mb-2">
                Custom Fields
              </Typography>
              <Box className="space-y-3">
                {issue.customFields.map((field, index) => (
                  <Card key={index} variant="outlined" className="p-3">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      className="mb-1 font-medium"
                    >
                      {field.description}
                    </Typography>
                    <Typography variant="body1" className="whitespace-pre-wrap">
                      {field.textField}
                    </Typography>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          <Divider />

          {issue.type === "USER_STORY" &&
            issue.dependencies &&
            issue.dependencies.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  className="mb-2 flex items-center gap-2"
                >
                  <LinkIcon fontSize="small" />
                  Dependencies ({issue.dependencies.length})
                </Typography>

                <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {issue.dependencies.map((dep: any) => {
                    // dep.issueId might be a string ID or a populated issue object
                    const depIssue =
                      typeof dep.issueId === "string" ? null : dep.issueId;

                    const depId =
                      typeof dep.issueId === "string"
                        ? dep.issueId
                        : dep.issueId?.id ?? dep.issueId?._id;

                    return (
                      <Card
                        key={String(depId)}
                        variant="outlined"
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          if (depIssue) onViewDependency?.(depIssue);
                        }}
                      >
                        <CardContent className="pb-2">
                          <Box className="flex items-start justify-between mb-2">
                            <Typography
                              variant="subtitle2"
                              className="font-medium"
                            >
                              {depIssue?.title ?? String(depId)}
                            </Typography>

                            {depIssue && (
                              <Box className="flex gap-1">
                                <Chip
                                  label={depIssue.type.replace("_", " ")}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={depIssue.status.replace("_", " ")}
                                  size="small"
                                  color={getStatusColor(depIssue.status) as any}
                                />
                              </Box>
                            )}
                          </Box>

                          {depIssue && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              className="mb-2"
                            >
                              Priority: {depIssue.priority}
                            </Typography>
                          )}

                          {/* ✅ show dependency note */}
                          {dep.note && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              className="block mb-2"
                            >
                              <strong>Note:</strong> {dep.note}
                            </Typography>
                          )}

                          {depIssue?.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              className="line-clamp-2"
                            >
                              {depIssue.description}
                            </Typography>
                          )}

                          {!depIssue && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              (Dependency details not populated)
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            )}

          <Box>
            <Typography variant="subtitle2" className="mb-2">
              Quick Actions
            </Typography>
            <Box className="flex gap-2">
              <Button
                size="small"
                variant={issue.status === "TO_DO" ? "contained" : "outlined"}
                onClick={() => handleStatusChange("TO_DO")}
                disabled={issue.status === "TO_DO"}
              >
                To Do
              </Button>
              <Button
                size="small"
                variant={
                  issue.status === "IN_PROGRESS" ? "contained" : "outlined"
                }
                onClick={() => handleStatusChange("IN_PROGRESS")}
                disabled={issue.status === "IN_PROGRESS"}
              >
                In Progress
              </Button>
              <Button
                size="small"
                variant={issue.status === "DONE" ? "contained" : "outlined"}
                color="success"
                onClick={() => handleStatusChange("DONE")}
                disabled={issue.status === "DONE"}
              >
                Done
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button onClick={handleEdit} variant="outlined" startIcon={<Edit />}>
          Edit Issue
        </Button>
      </DialogActions>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Issue</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Issue</ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default IssueDetailModal;
