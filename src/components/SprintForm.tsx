import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Checkbox,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { Assignment, BugReport, AccountTree } from '@mui/icons-material';
import { useIssueStore } from '../stores/issueStore';
import type { Sprint, IssueType } from '../types';

interface SprintFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Sprint | null;
  mode: 'create' | 'edit';
  projectId: string;
}

const SprintForm: React.FC<SprintFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  projectId,
}) => {
  const { getIssuesByProject } = useIssueStore();
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00.000Z');
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: formatDateForInput(new Date()),
    endDate: formatDateForInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    projectId: projectId,
    issueIds: [] as string[],
    status: 'PLANNING' as 'PLANNING' | 'ACTIVE' | 'COMPLETED',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        startDate: formatDateForInput(initialData.startDate),
        endDate: formatDateForInput(initialData.endDate),
        projectId: initialData.projectId,
        issueIds: initialData.issueIds,
        status: initialData.status,
      });
    } else if (mode === 'create') {
      const now = new Date();
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      setFormData({
        name: '',
        description: '',
        startDate: formatDateForInput(now),
        endDate: formatDateForInput(twoWeeksLater),
        projectId: projectId,
        issueIds: [],
        status: 'PLANNING',
      });
    }
    setErrors({});
  }, [initialData, mode, projectId, open]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Sprint name is required';
    }

    const startDate = parseInputDate(formData.startDate);
    const endDate = parseInputDate(formData.endDate);

    if (startDate >= endDate) {
      newErrors.startDate = 'Start date must be before end date';
      newErrors.endDate = 'End date must be after start date';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today && mode === 'create') {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) {
      newErrors.endDate = 'Sprint must be at least 1 day long';
    } else if (diffDays > 30) {
      newErrors.endDate = 'Sprint cannot be longer than 30 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: parseInputDate(formData.startDate),
      endDate: parseInputDate(formData.endDate),
      projectId: formData.projectId,
      issueIds: formData.issueIds,
      status: formData.status,
    });

    handleClose();
  };

  const handleClose = () => {
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    setFormData({
      name: '',
      description: '',
      startDate: formatDateForInput(now),
      endDate: formatDateForInput(twoWeeksLater),
      projectId: projectId,
      issueIds: [],
      status: 'PLANNING',
    });
    setErrors({});
    onClose();
  };

  const calculateDuration = () => {
    const startDate = parseInputDate(formData.startDate);
    const endDate = parseInputDate(formData.endDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAvailableIssues = () => {
    const allIssues = getIssuesByProject(projectId);
    return allIssues.filter(issue => !issue.sprintId || (mode === 'edit' && formData.issueIds.includes(issue.id)));
  };

  const getIssueTypeIcon = (type: IssueType) => {
    switch (type) {
      case 'BUG':
        return <BugReport fontSize="small" color="error" />;
      case 'USER_STORY':
        return <AccountTree fontSize="small" color="primary" />;
      case 'TASK':
      default:
        return <Assignment fontSize="small" color="action" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
      default:
        return 'default';
    }
  };

  const handleIssueToggle = (issueId: string) => {
    const currentIssueIds = [...formData.issueIds];
    const index = currentIssueIds.indexOf(issueId);
    
    if (index > -1) {
      currentIssueIds.splice(index, 1);
    } else {
      currentIssueIds.push(issueId);
    }
    
    setFormData({ ...formData, issueIds: currentIssueIds });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {mode === 'create' ? 'Create New Sprint' : 'Edit Sprint'}
          </DialogTitle>

          <DialogContent>
            <Box className="space-y-4 pt-2">
              <TextField
                fullWidth
                label="Sprint Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={!!errors.name}
                helperText={errors.name}
                variant="outlined"
                placeholder="e.g., Sprint 1 - User Authentication"
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                variant="outlined"
                placeholder="Describe the goals and objectives of this sprint..."
              />

              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>

              {mode === 'edit' && (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PLANNING' | 'ACTIVE' | 'COMPLETED' })}
                    label="Status"
                  >
                    <MenuItem value="PLANNING">Planning</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Box>
                <Typography variant="h6" className="mb-3">
                  Select Issues for Sprint
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-3">
                  Choose issues from the backlog to include in this sprint. Selected: {formData.issueIds.length}
                </Typography>
                
                {getAvailableIssues().length > 0 ? (
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                      {getAvailableIssues().map((issue, index) => (
                        <Box key={issue.id}>
                          <ListItem
                            onClick={() => handleIssueToggle(issue.id)}
                            sx={{ py: 1, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                          >
                            <ListItemIcon>
                              <Checkbox
                                checked={formData.issueIds.includes(issue.id)}
                                tabIndex={-1}
                                disableRipple
                              />
                            </ListItemIcon>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {getIssueTypeIcon(issue.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box className="flex items-center gap-2">
                                  <Typography variant="body2" className="flex-1">
                                    {issue.title}
                                  </Typography>
                                  <Chip
                                    label={issue.priority}
                                    size="small"
                                    color={getPriorityColor(issue.priority) as any}
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {issue.type.replace('_', ' ')} • {issue.status.replace('_', ' ')}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < getAvailableIssues().length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Alert severity="info">
                    No available issues to assign. All issues are either already assigned to other sprints or completed.
                  </Alert>
                )}
              </Box>

              <Alert severity="info" className="mt-4">
                <Box>
                  <Typography variant="body2" className="mb-1">
                    <strong>Sprint Duration:</strong> {calculateDuration()} days
                  </Typography>
                  <Typography variant="body2" className="mb-1">
                    <strong>Period:</strong> {parseInputDate(formData.startDate).toLocaleDateString()} - {parseInputDate(formData.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Selected Issues:</strong> {formData.issueIds.length}
                  </Typography>
                </Box>
              </Alert>

              {mode === 'create' && (
                <Typography variant="body2" color="text.secondary" className="mt-2">
                  <strong>Note:</strong> New sprints are created in "Planning" status. You can start the sprint later and assign issues from the backlog.
                </Typography>
              )}
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!formData.name.trim()}
            >
              {mode === 'create' ? 'Create Sprint' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
    </Dialog>
  );
};

export default SprintForm;