import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useIssueStore } from '../stores/issueStore';
import { useProjectStore } from '../stores/projectStore';
import { useSprintStore } from '../stores/sprintStore';
import StaticIssueCard from '../components/StaticIssueCard';
import IssueForm from '../components/IssueForm';
import IssueDetailModal from '../components/IssueDetailModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import type { Issue } from '../types';

const BacklogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getBacklogIssues, addIssue, updateIssue, deleteIssue, updateIssueStatus } = useIssueStore();
  const { currentProject, setCurrentProject, getProjectById } = useProjectStore();
  const { getSprintsByProject } = useSprintStore();

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

  const backlogIssues = projectId ? getBacklogIssues(projectId) : [];
  const projectSprints = projectId ? getSprintsByProject(projectId) : [];

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
      setIsIssueFormOpen(false);
      setEditingIssue(null);
    } catch (error) {
      showSnackbar('An error occurred. Please try again.', 'error');
    }
  };

  const confirmDeleteIssue = () => {
    if (deletingIssue) {
      try {
        deleteIssue(deletingIssue.id);
        showSnackbar('Issue deleted successfully!', 'success');
        setDeletingIssue(null);
      } catch (error) {
        showSnackbar('An error occurred while deleting the issue.', 'error');
      }
    }
  };

  const handleIssueStatusChange = (issueId: string, newStatus: string) => {
    updateIssueStatus(issueId, newStatus as any);
    showSnackbar(`Issue status updated to ${newStatus.replace('_', ' ')}`, 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!currentProject) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Typography variant="h6">Project not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="py-8">
      <Box className="mb-6">
        <Typography variant="h4" component="h1" fontWeight="bold" className="mb-2">
          Backlog
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-4">
          Manage your project backlog and plan sprints
        </Typography>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Box>
          <Paper className="p-4">
            <Box className="flex items-center justify-between mb-4">
              <Typography variant="h6" component="h2">
                Product Backlog
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                size="small"
                onClick={handleCreateIssue}
              >
                Create Issue
              </Button>
            </Box>

            <Box className="space-y-3">
              {backlogIssues.map((issue) => (
                <StaticIssueCard
                  key={issue.id}
                  issue={issue}
                  onEdit={handleEditIssue}
                  onDelete={handleDeleteIssue}
                  onView={handleViewIssue}
                  showActions={true}
                />
              ))}
              {backlogIssues.length === 0 && (
                <Typography variant="body2" color="text.secondary" className="text-center py-8">
                  No issues in backlog. Create your first issue to get started.
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper className="p-4">
            <Box className="flex items-center justify-between mb-4">
              <Typography variant="h6" component="h2">
                Sprints
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                size="small"
                onClick={() => {
                  console.log('Create sprint');
                }}
              >
                Create Sprint
              </Button>
            </Box>

            <Box className="space-y-3">
              {projectSprints.map((sprint) => (
                <Paper key={sprint.id} className="p-3 border">
                  <Typography variant="subtitle1" fontWeight="medium">
                    {sprint.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mt-1">
                    {sprint.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="mt-2 block">
                    {sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}
                  </Typography>
                </Paper>
              ))}
              {projectSprints.length === 0 && (
                <Typography variant="body2" color="text.secondary" className="text-center py-8">
                  No sprints created yet. Create your first sprint to start planning.
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
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
    </Container>
  );
};

export default BacklogPage;