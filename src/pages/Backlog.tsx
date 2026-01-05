import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Assignment,
  PlayArrow,
} from '@mui/icons-material';
import { useIssueStore } from '../stores/issueStore';
import { useSprintStore } from '../stores/sprintStore';
import { useProjectStore } from '../stores/projectStore';
import { useUserStore } from '../stores/userStore';
import type { Issue, Sprint } from '../types';
import IssueCard from '../components/IssueCard';
import IssueForm, { type IssueFormData } from '../components/IssueForm';
import IssueDetailModal from '../components/IssueDetailModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableIssueItem: React.FC<{
  issue: Issue;
  isSelected: boolean;
  onSelect: (issueId: string, selected: boolean) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
  onView: (issue: Issue) => void;
}> = ({ issue, isSelected, onSelect, onEdit, onDelete, onView }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      className={`p-4 ${isDragging ? 'shadow-lg' : ''}`}
      {...attributes}
    >
      <Box className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(issue.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <Box className="flex-1">
          <IssueCard
            issue={issue}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            showActions={true}
            enableDrag={true}
            dragListeners={listeners}
          />
        </Box>
      </Box>
    </Paper>
  );
};

const DroppableSprintArea: React.FC<{
  sprint: Sprint;
  issuesCount: number;
}> = ({ sprint, issuesCount }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `sprint-${sprint.id}`,
  });

  return (
    <Paper
      ref={setNodeRef}
      className={`p-4 border-2 border-dashed transition-colors ${
        isOver
          ? 'border-primary-main bg-primary-light'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <Box className="flex items-center gap-2 mb-2">
        {sprint.status === 'ACTIVE' && <PlayArrow fontSize="small" color="primary" />}
        <Typography variant="h6">{sprint.name}</Typography>
        <Chip
          label={`${issuesCount} issues`}
          size="small"
          color={sprint.status === 'ACTIVE' ? 'primary' : 'default'}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" className="mb-2">
        {sprint.description}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}
      </Typography>
      {isOver && (
        <Typography variant="body2" color="primary" className="mt-2">
          Drop issue here to assign to this sprint
        </Typography>
      )}
    </Paper>
  );
};

const Backlog: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    issues,
    getBacklogIssues,
    getIssuesByProject,
    addIssue,
    updateIssue,
    deleteIssue,
    fetchIssues
  } = useIssueStore();
  const { getSprintsByProject, fetchSprints } = useSprintStore();
  const { currentProject, setCurrentProject, getProjectById } = useProjectStore();
  const { users } = useUserStore();

  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [isAssignSprintOpen, setIsAssignSprintOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [orderedIssues, setOrderedIssues] = useState<Issue[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      setCurrentProject(project || null);
    }
  }, [projectId, getProjectById, setCurrentProject]);

  const loadData = async () => {
    if (projectId) {
      await Promise.all([
        fetchIssues(projectId),
        fetchSprints(projectId)
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    const backlogIssues = projectId ? getBacklogIssues(projectId) : [];
    setOrderedIssues(backlogIssues);
  }, [projectId, getBacklogIssues, issues]);

  const projectSprints = projectId ? getSprintsByProject(projectId) : [];
  const activeSprints = projectSprints.filter(sprint =>
    sprint.status === 'PLANNING' || sprint.status === 'ACTIVE'
  );

  const filteredIssues = orderedIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || issue.type === filterType;
    const matchesPriority = filterPriority === 'ALL' || issue.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'ALL' ||
                           (filterAssignee === 'UNASSIGNED' && !issue.assigneeId) ||
                           issue.assigneeId === filterAssignee;

    return matchesSearch && matchesType && matchesPriority && matchesAssignee;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = filteredIssues.find(i => i.id === active.id);
    setActiveIssue(issue || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveIssue(null);
      return;
    }

    if (typeof over.id === 'string' && over.id.startsWith('sprint-')) {
      const sprintId = over.id.replace('sprint-', '');
      if (active.id !== sprintId) {
        updateIssue(active.id as string, { sprintId });
        showSnackbar('Issue assigned to sprint!', 'success');
      }
      setActiveIssue(null);
      return;
    }

    if (active.id !== over.id) {
      setOrderedIssues((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      showSnackbar('Issue order updated!', 'info');
    }

    setActiveIssue(null);
  };

  const handleCreateIssue = () => {
    setEditingIssue(null);
    setIsIssueFormOpen(true);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setIsIssueFormOpen(true);
  };

  const handleViewIssue = (issue: Issue) => {
    setViewingIssue(issue);
  };

  const handleDeleteIssue = (issue: Issue) => {
    setDeletingIssue(issue);
  };

  const handleIssueFormSubmit = async (issueData: IssueFormData) => {
    try {
      // 转换 IssueFormData 为后端期望的格式
      const { dependencies, ...otherData } = issueData;
      const backendData = {
        ...otherData,
        dependencies: dependencies || [] // 确保 dependencies 是数组而不是 undefined
      };
      
      if (editingIssue) {
        await updateIssue(editingIssue.id, backendData as any);
        showSnackbar('Issue updated successfully!', 'success');
      } else {
        await addIssue(backendData as any);
        showSnackbar('Issue created successfully!', 'success');
      }
      setIsIssueFormOpen(false);
      setEditingIssue(null);
      await loadData();
    } catch (error) {
      showSnackbar('An error occurred. Please try again.', 'error');
    }
  };

  const confirmDeleteIssue = async () => {
    if (deletingIssue) {
      try {
        await deleteIssue(deletingIssue.id);
        showSnackbar('Issue deleted successfully!', 'success');
        setDeletingIssue(null);
        await loadData();
      } catch (error) {
        showSnackbar('An error occurred while deleting the issue.', 'error');
      }
    }
  };

  const handleIssueStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await updateIssue(issueId, { status: newStatus as any });
      showSnackbar('Issue status updated!', 'success');
      await loadData();
    } catch (error) {
      showSnackbar('An error occurred while updating the issue.', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleIssueSelect = (issueId: string, selected: boolean) => {
    if (selected) {
      setSelectedIssues([...selectedIssues, issueId]);
    } else {
      setSelectedIssues(selectedIssues.filter(id => id !== issueId));
    }
  };

  const handleSelectAll = () => {
    if (selectedIssues.length === filteredIssues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(filteredIssues.map(issue => issue.id));
    }
  };

  const handleAssignToSprint = () => {
    if (selectedIssues.length > 0) {
      setIsAssignSprintOpen(true);
    }
  };

  const confirmAssignToSprint = async () => {
    if (selectedSprint && selectedIssues.length > 0) {
      try {
        await Promise.all(
          selectedIssues.map(issueId => updateIssue(issueId, { sprintId: selectedSprint }))
        );
        setSelectedIssues([]);
        setSelectedSprint('');
        setIsAssignSprintOpen(false);
        showSnackbar(`${selectedIssues.length} issues assigned to sprint!`, 'success');
        await loadData();
      } catch (error) {
        showSnackbar('An error occurred while assigning issues.', 'error');
      }
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
          Backlog
        </Typography>
        <Box className="flex gap-2">
          {selectedIssues.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Assignment />}
              onClick={handleAssignToSprint}
              disabled={activeSprints.length === 0}
            >
              Assign to Sprint ({selectedIssues.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            color="primary"
            onClick={handleCreateIssue}
          >
            Create Issue
          </Button>
        </Box>
      </Box>

      {/* 过滤器和搜索 */}
      <Paper className="p-4 mb-6">
        <Box className="flex items-center gap-2 mb-4">
          <FilterList fontSize="small" />
          <Typography variant="subtitle1">Filters</Typography>
        </Box>

        <Box className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Box className="md:col-span-1">
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

          <Box className="flex items-center gap-2">
            <Checkbox
              checked={selectedIssues.length === filteredIssues.length && filteredIssues.length > 0}
              indeterminate={selectedIssues.length > 0 && selectedIssues.length < filteredIssues.length}
              onChange={handleSelectAll}
            />
            <Typography variant="body2">
              Select All ({filteredIssues.length} issues)
            </Typography>
          </Box>
        </Box>
      </Paper>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Main Layout: Left side Backlog, Right side Sprints */}
        <Box className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Backlog Issues */}
          <Box className="lg:col-span-8">
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">
                Backlog Issues ({filteredIssues.length})
              </Typography>

              <SortableContext items={filteredIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <Box className="space-y-3">
                  {filteredIssues.map((issue) => (
                    <SortableIssueItem
                      key={issue.id}
                      issue={issue}
                      isSelected={selectedIssues.includes(issue.id)}
                      onSelect={handleIssueSelect}
                      onEdit={handleEditIssue}
                      onDelete={handleDeleteIssue}
                      onView={handleViewIssue}
                    />
                  ))}
                </Box>
              </SortableContext>

              {filteredIssues.length === 0 && (
                <Box className="p-8 text-center">
                  <Typography variant="h6" color="text.secondary" className="mb-2">
                    {orderedIssues.length === 0 ? 'No issues in backlog' : 'No issues match your filters'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-4">
                    {orderedIssues.length === 0
                      ? 'Create your first issue to start organizing your work'
                      : 'Try adjusting your search criteria or filters'
                    }
                  </Typography>
                  {orderedIssues.length === 0 && (
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
          </Box>

          {/* Right: Sprint Drop Zones */}
          <Box className="lg:col-span-4">
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">
                Active Sprints
              </Typography>

              <Box className="space-y-4">
                {activeSprints.map((sprint) => {
                  const sprintIssuesCount = projectId ?
                    getIssuesByProject(projectId).filter(issue => issue.sprintId === sprint.id).length : 0;

                  return (
                    <DroppableSprintArea
                      key={sprint.id}
                      sprint={sprint}
                      issuesCount={sprintIssuesCount}
                    />
                  );
                })}

                {activeSprints.length === 0 && (
                  <Box className="p-4 text-center">
                    <Typography variant="body2" color="text.secondary">
                      No active sprints available
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Create a sprint to organize your issues
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeIssue ? (
            <Paper className="p-4 shadow-lg">
              <IssueCard
                issue={activeIssue}
                onEdit={() => {}}
                onDelete={() => {}}
                onView={() => {}}
                showActions={false}
                enableDrag={false}
              />
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 统计信息 */}
      <Paper className="p-4 mt-6">
        <Typography variant="subtitle1" className="mb-3">
          Backlog Summary
        </Typography>
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Box className="text-center">
            <Typography variant="h4" color="primary">
              {orderedIssues.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Issues
            </Typography>
          </Box>
          <Box className="text-center">
            <Typography variant="h4" color="error.main">
              {orderedIssues.filter(i => i.type === 'BUG').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bugs
            </Typography>
          </Box>
          <Box className="text-center">
            <Typography variant="h4" color="info.main">
              {orderedIssues.filter(i => i.priority === 'HIGH' || i.priority === 'URGENT').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High Priority
            </Typography>
          </Box>
          <Box className="text-center">
            <Typography variant="h4" color="warning.main">
              {orderedIssues.filter(i => !i.assigneeId).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unassigned
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Issue表单对话框 */}
      <IssueForm
        open={isIssueFormOpen}
        onClose={() => setIsIssueFormOpen(false)}
        onSubmit={handleIssueFormSubmit}
        initialData={editingIssue}
        mode={editingIssue ? 'edit' : 'create'}
        projectId={projectId || ''}
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

      {/* 分配Sprint对话框 */}
      <Dialog open={isAssignSprintOpen} onClose={() => setIsAssignSprintOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Issues to Sprint</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            Assign {selectedIssues.length} selected issues to a sprint:
          </Typography>

          <FormControl fullWidth className="mb-4">
            <InputLabel>Select Sprint</InputLabel>
            <Select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              label="Select Sprint"
            >
              {activeSprints.map((sprint) => (
                <MenuItem key={sprint.id} value={sprint.id}>
                  <Box className="flex items-center gap-2">
                    {sprint.status === 'ACTIVE' && <PlayArrow fontSize="small" color="primary" />}
                    <Box>
                      <Typography variant="body2">{sprint.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sprint.status} • {sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {activeSprints.length === 0 && (
            <Alert severity="info">
              No active or planning sprints available. Create a new sprint first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAssignSprintOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmAssignToSprint}
            variant="contained"
            disabled={!selectedSprint}
          >
            Assign Issues
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功/错误提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Backlog;