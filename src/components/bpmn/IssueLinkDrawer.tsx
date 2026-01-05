import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Divider,
  Alert,
  ListItemButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import CustomDrawer from "../ui/CustomDrawer";
import IssueDetailModal from "../IssueDetailModal";
import IssueForm from "../IssueForm";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import { useIssueStore } from "../../stores/issueStore";
import { useBPMNStore } from "../../stores/bpmnStore";
import { useChangelogStore } from "../../stores/changelogStore";
import type { Issue } from "../../types";

interface IssueLinkDrawerProps {
  open: boolean;
  onClose: () => void;
  elementId: string;
  elementName: string;
  elementType: string;
  projectId: string;
  diagramId: string;
}

const IssueLinkDrawer: React.FC<IssueLinkDrawerProps> = ({
  open,
  onClose,
  elementId,
  elementName,
  elementType,
  projectId,
  diagramId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const {
    getIssuesByProject,
    getIssuesByBPMNElement,
    linkIssueToBPMN,
    unlinkIssueFromBPMN,
    addIssue,
    updateIssue,
    deleteIssue,
    updateIssueStatus,
  } = useIssueStore();
  const { linkIssueToElement, unlinkIssueFromElement } = useBPMNStore();
  const { addChangeLog } = useChangelogStore();

  const allIssues = getIssuesByProject(projectId);
  const linkedIssues = getIssuesByBPMNElement(elementId);

  const filteredIssues = allIssues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableIssues = filteredIssues.filter(
    (issue) => !linkedIssues.some((linked) => linked.id === issue.id)
  );

  const handleLinkIssue = async (issue: Issue) => {
    linkIssueToBPMN(issue.id, diagramId, elementId);
    linkIssueToElement(elementId, issue.id);

    // Record link operation using store
    try {
      await addChangeLog({
        elementId,
        elementName,
        elementType,
        changeType: "link",
        relatedIssueId: issue.id,
        diagramId,
      });
    } catch (error) {
      console.error("Failed to record link operation:", error);
    }
  };

  const handleUnlinkIssue = async (issue: Issue) => {
    unlinkIssueFromBPMN(issue.id, diagramId, elementId);
    unlinkIssueFromElement(elementId, issue.id);

    // Record unlink operation using store
    try {
      await addChangeLog({
        elementId,
        elementName,
        elementType,
        changeType: "unlink",
        relatedIssueId: issue.id,
        diagramId,
      });
    } catch (error) {
      console.error("Failed to record unlink operation:", error);
    }
  };

  const handleViewIssue = (issue: Issue) => {
    setViewingIssue(issue);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setIsIssueFormOpen(true);
    setViewingIssue(null);
  };

  const handleDeleteIssue = (issue: Issue) => {
    setDeletingIssue(issue);
    setViewingIssue(null);
  };

  const confirmDeleteIssue = () => {
    if (deletingIssue) {
      deleteIssue(deletingIssue.id);
      setDeletingIssue(null);
    }
  };

  const handleIssueFormSubmit = (issueData: any) => {
    if (editingIssue) {
      updateIssue(editingIssue.id, issueData);
    } else {
      addIssue(issueData);
    }
    setIsIssueFormOpen(false);
    setEditingIssue(null);
  };

  const handleIssueStatusChange = (issueId: string, newStatus: string) => {
    updateIssueStatus(issueId, newStatus as any);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "info";
      case "URGENT":
        return "error";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "TASK":
        return "primary";
      case "BUG":
        return "error";
      case "USER_STORY":
        return "success";
      default:
        return "default";
    }
  };

  const getElementTypeDisplay = (type: string) => {
    if (type.includes("Task")) return "Task";
    if (type.includes("Gateway")) return "Gateway";
    if (type.includes("Event")) return "Event";
    return "Element";
  };

  return (
    <CustomDrawer open={open} onClose={onClose} width={400}>
      <Box className="h-full flex flex-col">
        <Box className="p-4 border-b">
          <Box className="flex items-center justify-between mb-2">
            <Typography variant="h6">Link Issues</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box className="flex items-center gap-2 mb-2">
            <InfoIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              {getElementTypeDisplay(elementType)}: {elementName}
            </Typography>
          </Box>

          <Typography variant="caption" color="textSecondary" className="block">
            Element ID: {elementId}
          </Typography>
        </Box>

        <Box className="p-4 border-b">
          <TextField
            fullWidth
            size="small"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box className="flex-1 overflow-auto">
          {linkedIssues.length > 0 && (
            <Box className="p-4">
              <Typography
                variant="subtitle2"
                className="mb-2 flex items-center gap-1"
              >
                <LinkIcon fontSize="small" />
                Linked Issues ({linkedIssues.length})
              </Typography>
              <List dense>
                {linkedIssues.map((issue) => (
                  <ListItem key={issue.id} className="px-0" disablePadding>
                    <ListItemButton
                      onClick={() => handleViewIssue(issue)}
                      className="flex-1 mr-2"
                    >
                      <ListItemText
                        primary={
                          <Box className="flex items-center gap-2 mb-1">
                            <Typography variant="body2" fontWeight="medium">
                              {issue.title}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box className="flex items-center gap-1">
                            <Chip
                              label={issue.status}
                              size="small"
                              color={getStatusColor(issue.status) as any}
                            />
                            <Chip
                              label={issue.priority}
                              size="small"
                              color={getPriorityColor(issue.priority) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Box className="flex gap-1">
                      <IconButton
                        onClick={() => handleViewIssue(issue)}
                        size="small"
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleUnlinkIssue(issue)}
                        color="error"
                        size="small"
                        title="Unlink Issue"
                      >
                        <UnlinkIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {linkedIssues.length > 0 && <Divider />}

          <Box className="p-4">
            <Typography variant="subtitle2" className="mb-2">
              Available Issues ({availableIssues.length})
            </Typography>

            {availableIssues.length === 0 ? (
              <Alert severity="info" className="mt-2">
                {searchTerm
                  ? "No issues match your search"
                  : "No available issues to link"}
              </Alert>
            ) : (
              <List dense>
                {availableIssues.map((issue) => (
                  <ListItem key={issue.id} className="px-0" disablePadding>
                    <ListItemButton
                      onClick={() => handleViewIssue(issue)}
                      className="flex-1 mr-2"
                    >
                      <ListItemText
                        primary={
                          <Box className="flex items-center gap-2 mb-1">
                            <Typography variant="body2" fontWeight="medium">
                              {issue.title}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box className="flex items-center gap-1 mb-1">
                            <Chip
                              label={issue.status}
                              size="small"
                              color={getStatusColor(issue.status) as any}
                            />
                            <Chip
                              label={issue.priority}
                              size="small"
                              color={getPriorityColor(issue.priority) as any}
                              variant="outlined"
                            />
                            <Chip
                              label={issue.type}
                              size="small"
                              color={getTypeColor(issue.type) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Box className="flex gap-1">
                      <IconButton
                        onClick={() => handleViewIssue(issue)}
                        size="small"
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <Button
                        size="small"
                        startIcon={<LinkIcon />}
                        onClick={() => handleLinkIssue(issue)}
                        color="primary"
                        variant="outlined"
                      >
                        Link
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>

        <Box className="p-4 border-t">
          <Button fullWidth variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>

      <IssueDetailModal
        open={Boolean(viewingIssue)}
        onClose={() => setViewingIssue(null)}
        issue={viewingIssue}
        onEdit={handleEditIssue}
        onDelete={handleDeleteIssue}
        onStatusChange={handleIssueStatusChange}
      />

      <IssueForm
        open={isIssueFormOpen}
        onClose={() => setIsIssueFormOpen(false)}
        onSubmit={handleIssueFormSubmit}
        initialData={editingIssue}
        mode={editingIssue ? "edit" : "create"}
        projectId={projectId}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingIssue)}
        onClose={() => setDeletingIssue(null)}
        onConfirm={confirmDeleteIssue}
        title="Delete Issue"
        message={`Are you sure you want to delete "${deletingIssue?.title}"?`}
        warningMessage="This action cannot be undone."
      />
    </CustomDrawer>
  );
};

export default IssueLinkDrawer;
