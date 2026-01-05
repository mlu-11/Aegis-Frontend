import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Chip,
  Avatar,
  AvatarGroup,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Assignment,
  DirectionsRun,
  CheckCircle,
  Group,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import { useProjectStore } from '../stores/projectStore';
import { useSprintStore } from '../stores/sprintStore';
import { useIssueStore } from '../stores/issueStore';
import { useUserStore } from '../stores/userStore';
import type { Issue } from '../types';
import IssueForm from '../components/IssueForm';
import IssueDetailModal from '../components/IssueDetailModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, setCurrentProject, getProjectById } = useProjectStore();
  const { getSprintsByProject, getActiveSprint } = useSprintStore();
  const { getIssuesByProject, addIssue, updateIssue, deleteIssue, updateIssueStatus } = useIssueStore();
  const { getUserById } = useUserStore();

  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
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

  if (!currentProject) {
    return (
      <Box className="py-8">
        <Typography variant="h6">Project not found</Typography>
      </Box>
    );
  }

  const projectSprints = getSprintsByProject(currentProject.id);
  const activeSprint = getActiveSprint(currentProject.id);
  const projectIssues = getIssuesByProject(currentProject.id);
  
  const completedSprints = projectSprints.filter(sprint => sprint.status === 'COMPLETED').length;
  const planningSprints = projectSprints.filter(sprint => sprint.status === 'PLANNING').length;
  
  const completedIssues = projectIssues.filter(issue => issue.status === 'DONE').length;
  const inProgressIssues = projectIssues.filter(issue => issue.status === 'IN_PROGRESS').length;
  const todoIssues = projectIssues.filter(issue => issue.status === 'TO_DO').length;

  const projectMembers = currentProject.memberIds.map(id => getUserById(id)).filter(Boolean);

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

  const handleIssueFormSubmit = (issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingIssue) {
        updateIssue(editingIssue.id, issueData);
        showSnackbar('Issue updated successfully!', 'success');
      } else {
        addIssue(issueData);
        showSnackbar('Issue created successfully!', 'success');
      }
    } catch (error) {
      showSnackbar('An error occurred. Please try again.', 'error');
    }
  };

  const confirmDeleteIssue = () => {
    if (deletingIssue) {
      try {
        deleteIssue(deletingIssue.id);
        showSnackbar('Issue deleted successfully!', 'success');
      } catch (error) {
        showSnackbar('An error occurred while deleting the issue.', 'error');
      }
    }
  };

  const handleIssueStatusChange = (issueId: string, newStatus: string) => {
    updateIssueStatus(issueId, newStatus as any);
    showSnackbar('Issue status updated!', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box className="mb-6">
        <Typography variant="body1" color="text.secondary" className="mb-4">
          {currentProject.description}
        </Typography>
        
        <Box className="flex items-center gap-4">
          <Box className="flex items-center gap-2">
            <Group fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {projectMembers.length} members
            </Typography>
            <AvatarGroup max={5} sx={{ ml: 1 }}>
              {projectMembers.map((member) => (
                <Avatar
                  key={member?.id}
                  src={member?.avatar}
                  alt={member?.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {member?.name?.charAt(0)}
                </Avatar>
              ))}
            </AvatarGroup>
          </Box>
        </Box>
      </Box>

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="text-center">
            <Assignment color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="primary">
              {projectIssues.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Issues
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center">
            <DirectionsRun color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="info.main">
              {projectSprints.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Sprints
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center">
            <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {completedIssues}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed Issues
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center">
            <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main">
              {projectIssues.length > 0 ? Math.round((completedIssues / projectIssues.length) * 100) : 0}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Paper className="p-4">
          <Typography variant="h6" className="mb-3 flex items-center gap-2">
            <DirectionsRun />
            Sprint Overview
          </Typography>
          
          {activeSprint ? (
            <Box className="mb-3">
              <Typography variant="subtitle2" className="mb-1">
                Active Sprint
              </Typography>
              <Box className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {activeSprint.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeSprint.startDate.toLocaleDateString()} - {activeSprint.endDate.toLocaleDateString()}
                  </Typography>
                </Box>
                <Chip label="ACTIVE" color="primary" size="small" />
              </Box>
            </Box>
          ) : (
            <Box className="mb-3 p-3 bg-gray-50 rounded text-center">
              <Typography variant="body2" color="text.secondary">
                No active sprint
              </Typography>
            </Box>
          )}

          <Box className="grid grid-cols-2 gap-4">
            <Box className="text-center">
              <Typography variant="h5" color="success.main">
                {completedSprints}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
            </Box>
            <Box className="text-center">
              <Typography variant="h5" color="info.main">
                {planningSprints}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Planning
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper className="p-4">
          <Typography variant="h6" className="mb-3 flex items-center gap-2">
            <Assignment />
            Issue Distribution
          </Typography>
          
          <Box className="space-y-3">
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                <Box className="w-3 h-3 bg-gray-400 rounded-full"></Box>
                <Typography variant="body2">To Do</Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {todoIssues}
              </Typography>
            </Box>
            
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                <Box className="w-3 h-3 bg-blue-500 rounded-full"></Box>
                <Typography variant="body2">In Progress</Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {inProgressIssues}
              </Typography>
            </Box>
            
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                <Box className="w-3 h-3 bg-green-500 rounded-full"></Box>
                <Typography variant="body2">Done</Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {completedIssues}
              </Typography>
            </Box>
          </Box>

          {projectIssues.length > 0 && (
            <Box className="mt-4">
              <Typography variant="body2" color="text.secondary" className="mb-2">
                Recent Issues:
              </Typography>
              <Box className="space-y-1">
                {projectIssues.slice(0, 3).map((issue) => (
                  <Box 
                    key={issue.id} 
                    className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => handleViewIssue(issue)}
                  >
                    <Typography variant="body2" className="truncate">
                      {issue.title}
                    </Typography>
                    <Chip 
                      label={issue.status.replace('_', ' ')} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      <Box className="mt-6">
        <Paper className="p-4">
          <Box className="flex justify-between items-center mb-3">
            <Typography variant="h6">
              Quick Actions
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
          <Typography variant="body2" color="text.secondary">
            Use the navigation tabs above to access Board, Backlog, and Sprints management.
          </Typography>
        </Paper>
      </Box>

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

export default ProjectDetail;
