import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  BugReport,
  Task,
  Person,
  Schedule,
} from "@mui/icons-material";
import { useIssueStore } from "../stores/issueStore";
import { useProjectStore } from "../stores/projectStore";
import { useUserStore } from "../stores/userStore";
import { useSprintStore } from "../stores/sprintStore";
import type { Issue } from "../types";
import IssueForm, { type IssueFormData } from "../components/IssueForm";
import IssueDetailModal from "../components/IssueDetailModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";

const IssueList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    getIssuesByProject,
    addIssue,
    updateIssue,
    deleteIssue,
    fetchIssues,
  } = useIssueStore();
  const { currentProject, setCurrentProject, getProjectById } =
    useProjectStore();
  const { users, getUserById } = useUserStore();
  const { getSprintById } = useSprintStore();

  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<{
    [key: string]: HTMLElement | null;
  }>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterAssignee, setFilterAssignee] = useState<string>("ALL");

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      setCurrentProject(project || null);
    }
  }, [projectId, getProjectById, setCurrentProject]);

  const loadData = async () => {
    if (projectId) {
      await fetchIssues(projectId);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const projectIssues = projectId ? getIssuesByProject(projectId) : [];

  const filteredIssues = projectIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "ALL" || issue.type === filterType;
    const matchesPriority =
      filterPriority === "ALL" || issue.priority === filterPriority;
    const matchesStatus =
      filterStatus === "ALL" || issue.status === filterStatus;
    const matchesAssignee =
      filterAssignee === "ALL" ||
      (filterAssignee === "UNASSIGNED" && !issue.assigneeId) ||
      issue.assigneeId === filterAssignee;

    return (
      matchesSearch &&
      matchesType &&
      matchesPriority &&
      matchesStatus &&
      matchesAssignee
    );
  });

  const handleCreateIssue = () => {
    setEditingIssue(null);
    setIsIssueFormOpen(true);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setIsIssueFormOpen(true);
    handleMenuClose(issue.id);
  };

  const handleViewIssue = (issue: Issue) => {
    setViewingIssue(issue);
    handleMenuClose(issue.id);
  };

  const handleDeleteIssue = (issue: Issue) => {
    setDeletingIssue(issue);
    handleMenuClose(issue.id);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    issueId: string
  ) => {
    event.stopPropagation();
    setMenuAnchorEl({ ...menuAnchorEl, [issueId]: event.currentTarget });
  };

  const handleMenuClose = (issueId: string) => {
    setMenuAnchorEl({ ...menuAnchorEl, [issueId]: null });
  };

  const handleIssueFormSubmit = async (issueData: IssueFormData) => {
    try {
      // 转换 IssueFormData 为后端期望的格式
      const { dependencies, ...otherData } = issueData;
      const backendData = {
        ...otherData,
        dependencies: dependencies || [], // 确保 dependencies 是数组而不是 undefined
      };

      if (editingIssue) {
        await updateIssue(editingIssue.id, backendData as any);
        showSnackbar("Issue updated successfully!", "success");
      } else {
        await addIssue(backendData as any);
        showSnackbar("Issue created successfully!", "success");
      }
      setIsIssueFormOpen(false);
      setEditingIssue(null);
      await loadData();
    } catch (error) {
      showSnackbar("An error occurred. Please try again.", "error");
    }
  };

  const confirmDeleteIssue = async () => {
    if (deletingIssue) {
      try {
        await deleteIssue(deletingIssue.id);
        showSnackbar("Issue deleted successfully!", "success");
        setDeletingIssue(null);
        await loadData();
      } catch (error) {
        showSnackbar("An error occurred while deleting the issue.", "error");
      }
    }
  };

  const handleIssueStatusChange = async (
    issueId: string,
    newStatus: string
  ) => {
    try {
      await updateIssue(issueId, { status: newStatus as any });
      showSnackbar("Issue status updated!", "success");
      await loadData();
    } catch (error) {
      showSnackbar("An error occurred while updating the issue.", "error");
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUG":
        return <BugReport fontSize="small" color="error" />;
      case "USER_STORY":
        return <Person fontSize="small" color="primary" />;
      case "TASK":
      default:
        return <Task fontSize="small" color="action" />;
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
      case "TODO":
        return "default";
      case "IN_PROGRESS":
        return "primary";
      case "IN_REVIEW":
        return "secondary";
      case "DONE":
        return "success";
      default:
        return "default";
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
          Issues
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          color="primary"
          onClick={handleCreateIssue}
        >
          Create Issue
        </Button>
      </Box>

      {/* 过滤器和搜索 */}
      <Paper className="p-4 mb-6">
        <Box className="flex items-center gap-2 mb-4">
          <FilterList fontSize="small" />
          <Typography variant="subtitle1">Filters</Typography>
        </Box>

        <Box className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <Box className="md:col-span-2">
            <TextField
              fullWidth
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Box>

          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="TASK">Task</MenuItem>
                <MenuItem value="BUG">Bug</MenuItem>
                <MenuItem value="USER_STORY">User Story</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="ALL">All Priorities</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="TODO">To Do</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="IN_REVIEW">In Review</MenuItem>
                <MenuItem value="DONE">Done</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>
              <Select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                label="Assignee"
              >
                <MenuItem value="ALL">All Assignees</MenuItem>
                <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Issues 表格 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Sprint</TableCell>
                <TableCell>Estimated Hours</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIssues.map((issue) => {
                const assignee = issue.assigneeId
                  ? getUserById(issue.assigneeId)
                  : null;
                const sprint = issue.sprintId
                  ? getSprintById(issue.sprintId)
                  : null;

                return (
                  <TableRow
                    key={issue.id}
                    hover
                    onClick={() => handleViewIssue(issue)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        {getTypeIcon(issue.type)}
                        <Typography variant="caption">
                          {issue.type.replace("_", " ")}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" className="font-medium">
                        {issue.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        className="line-clamp-1"
                      >
                        {issue.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={issue.status.replace("_", " ")}
                        size="small"
                        color={getStatusColor(issue.status) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={issue.priority}
                        size="small"
                        color={getPriorityColor(issue.priority) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {assignee ? (
                        <Box className="flex items-center gap-2">
                          <Avatar
                            src={assignee.avatar}
                            alt={assignee.name}
                            sx={{ width: 24, height: 24 }}
                          />
                          <Typography variant="body2">
                            {assignee.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {sprint ? (
                        <Chip
                          label={sprint.name}
                          size="small"
                          variant="filled"
                          color="secondary"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No Sprint
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {issue.estimatedHours ? (
                        <Box className="flex items-center gap-1">
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            {issue.estimatedHours}h
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, issue.id)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                      <Menu
                        anchorEl={menuAnchorEl[issue.id]}
                        open={Boolean(menuAnchorEl[issue.id])}
                        onClose={() => handleMenuClose(issue.id)}
                      >
                        <MenuItem onClick={() => handleViewIssue(issue)}>
                          <ListItemIcon>
                            <Visibility fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>View Details</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => handleEditIssue(issue)}>
                          <ListItemIcon>
                            <Edit fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Edit Issue</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => handleDeleteIssue(issue)}>
                          <ListItemIcon>
                            <Delete fontSize="small" color="error" />
                          </ListItemIcon>
                          <ListItemText>Delete Issue</ListItemText>
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredIssues.length === 0 && (
          <Box className="p-8 text-center">
            <Typography variant="h6" color="text.secondary" className="mb-2">
              {projectIssues.length === 0
                ? "No issues found"
                : "No issues match your filters"}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              {projectIssues.length === 0
                ? "Create your first issue to start tracking work"
                : "Try adjusting your search criteria or filters"}
            </Typography>
            {projectIssues.length === 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateIssue}
              >
                Create First Issue
              </Button>
            )}
          </Box>
        )}
      </Paper>

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

      {/* 删除确认对话框 */}
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

export default IssueList;
