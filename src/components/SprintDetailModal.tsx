import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Close,
  PlayArrow,
  Stop,
  CheckCircle,
  CalendarToday,
  Assignment,
  TrendingUp,
} from '@mui/icons-material';
import { useIssueStore } from '../stores/issueStore';
import type { Sprint } from '../types';
import IssueCard from './IssueCard';

interface SprintDetailModalProps {
  open: boolean;
  onClose: () => void;
  sprint: Sprint | null;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
  onStatusChange: (sprintId: string, newStatus: string) => void;
  onEditIssue?: (issue: any) => void;
  onDeleteIssue?: (issue: any) => void;
  onViewIssue?: (issue: any) => void;
}

const SprintDetailModal: React.FC<SprintDetailModalProps> = ({
  open,
  onClose,
  sprint,
  onEdit,
  onDelete,
  onStatusChange,
  onEditIssue,
  onDeleteIssue,
  onViewIssue,
}) => {
  const { getIssuesBySprint } = useIssueStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
 
  if (!sprint) return null;

  const sprintIssues = getIssuesBySprint(sprint.id);
  const todoIssues = sprintIssues.filter(issue => issue.status === 'TO_DO');
  const inProgressIssues = sprintIssues.filter(issue => issue.status === 'IN_PROGRESS');
  const doneIssues = sprintIssues.filter(issue => issue.status === 'DONE');

  const totalIssues = sprintIssues.length;
  const completedIssues = doneIssues.length;
  const progress = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;

  const totalEstimatedHours = sprintIssues.reduce((sum, issue) => sum + (issue.estimatedHours || 0), 0);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(sprint);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(sprint);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'default';
      case 'ACTIVE':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return <PlayArrow fontSize="small" />;
      case 'ACTIVE':
        return <Stop fontSize="small" />;
      case 'COMPLETED':
        return <CheckCircle fontSize="small" />;
      default:
        return null;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(sprint.id, newStatus);
  };

  const calculateSprintDays = () => {
    const diffTime = sprint.endDate.getTime() - sprint.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const diffTime = sprint.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const canStart = sprint.status === 'PLANNING';
  const canComplete = sprint.status === 'ACTIVE';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box className="flex items-start justify-between">
          <Box className="flex items-center gap-3 flex-1">
            {getStatusIcon(sprint.status)}
            <Box>
              <Typography variant="h5" component="div" className="mb-1">
                {sprint.name}
              </Typography>
              <Chip
                label={sprint.status}
                color={getStatusColor(sprint.status) as any}
                size="small"
                variant="outlined"
              />
            </Box>
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
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="outlined">
              <CardContent className="text-center">
                <Typography variant="h4" color="primary" className="mb-1">
                  {totalIssues}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Issues
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent className="text-center">
                <Typography variant="h4" color="success.main" className="mb-1">
                  {completedIssues}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent className="text-center">
                <Typography variant="h4" color="info.main" className="mb-1">
                  {totalEstimatedHours}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hours
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent className="text-center">
                <Typography variant="h4" color="warning.main" className="mb-1">
                  {getDaysRemaining()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Days Remaining
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Box className="flex items-center justify-between mb-2">
              <Typography variant="subtitle1" className="flex items-center gap-1">
                <TrendingUp fontSize="small" />
                Sprint Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedIssues}/{totalIssues} issues ({progress.toFixed(0)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              className="rounded h-2"
              sx={{ height: 8 }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" className="mb-3 flex items-center gap-1">
              <CalendarToday fontSize="small" />
              Sprint Information
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1" className="mt-1">
                  {sprint.description || 'No description provided'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Duration</Typography>
                <Typography variant="body1" className="mt-1">
                  {calculateSprintDays()} days ({sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()})
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" className="mb-3 flex items-center gap-1">
              <Assignment fontSize="small" />
              Issues ({sprintIssues.length})
            </Typography>

            {sprintIssues.length === 0 ? (
              <Alert severity="info">
                No issues assigned to this sprint yet. You can assign issues from the backlog.
              </Alert>
            ) : (
              <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Box>
                  <Typography variant="subtitle2" className="mb-2 flex items-center justify-between">
                    To Do
                    <Chip label={todoIssues.length} size="small" />
                  </Typography>
                  <Box className="space-y-2 max-h-64 overflow-y-auto">
                    {todoIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onEdit={onEditIssue}
                        onDelete={onDeleteIssue}
                        onView={onViewIssue}
                        showActions={false}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" className="mb-2 flex items-center justify-between">
                    In Progress
                    <Chip label={inProgressIssues.length} size="small" color="primary" />
                  </Typography>
                  <Box className="space-y-2 max-h-64 overflow-y-auto">
                    {inProgressIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onEdit={onEditIssue}
                        onDelete={onDeleteIssue}
                        onView={onViewIssue}
                        showActions={false}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" className="mb-2 flex items-center justify-between">
                    Done
                    <Chip label={doneIssues.length} size="small" color="success" />
                  </Typography>
                  <Box className="space-y-2 max-h-64 overflow-y-auto">
                    {doneIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onEdit={onEditIssue}
                        onDelete={onDeleteIssue}
                        onView={onViewIssue}
                        showActions={false}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" className="mb-2">
              Quick Actions
            </Typography>
            <Box className="flex gap-2">
              {canStart && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={() => handleStatusChange('ACTIVE')}
                >
                  Start Sprint
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleStatusChange('COMPLETED')}
                >
                  Complete Sprint
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEdit}
              >
                Edit Sprint
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Sprint</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Sprint</ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default SprintDetailModal;