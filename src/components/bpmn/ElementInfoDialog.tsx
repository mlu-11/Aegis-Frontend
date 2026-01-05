import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import {
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { useIssueStore } from '../../stores/issueStore';
import { useBPMNStore } from '../../stores/bpmnStore';
import type { Issue } from '../../types';

interface ElementInfoDialogProps {
  open: boolean;
  onClose: () => void;
  elementId: string;
  elementName: string;
  projectId: string;
  onNavigateToIssue?: (issueId: string) => void;
}

const ElementInfoDialog: React.FC<ElementInfoDialogProps> = ({
  open,
  onClose,
  elementId,
  elementName,
  onNavigateToIssue,
}) => {
  const { getIssuesByBPMNElement } = useIssueStore();
  const { getElementStatus } = useBPMNStore();

  const linkedIssues = getIssuesByBPMNElement(elementId);
  const elementStatus = getElementStatus(elementId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TO_DO':
        return 'default';
      case 'IN_PROGRESS':
        return 'primary';
      case 'DONE':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      case 'URGENT':
        return 'error';
      default:
        return 'default';
    }
  };

  const getElementStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'default';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatElementStatus = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Unknown';
    }
  };

  const handleIssueClick = (issue: Issue) => {
    if (onNavigateToIssue) {
      onNavigateToIssue(issue.id);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6" component="div">
            BPMN Element Information
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {elementName} ({elementId})
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box className="mb-4">
          <Typography variant="subtitle1" className="mb-2">
            Element Status
          </Typography>
          <Box className="flex items-center gap-2">
            <Chip 
              label={elementStatus ? formatElementStatus(elementStatus.status) : 'No Status'} 
              color={elementStatus ? getElementStatusColor(elementStatus.status) as any : 'default'}
            />
            {elementStatus && (
              <Typography variant="body2" color="textSecondary">
                Progress: {elementStatus.progress}% • Last updated: {elementStatus.lastUpdated.toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider className="my-4" />

        <Box>
          <Typography variant="subtitle1" className="mb-2">
            Linked Issues ({linkedIssues.length})
          </Typography>
          
          {linkedIssues.length === 0 ? (
            <Box className="text-center py-8">
              <Typography variant="body2" color="textSecondary">
                No issues are linked to this element
              </Typography>
            </Box>
          ) : (
            <List dense>
              {linkedIssues.map((issue) => (
                <ListItem key={issue.id} divider>
                  <ListItemText
                    primary={
                      <Box className="flex items-center gap-2">
                        <Typography variant="body2" fontWeight="medium">
                          {issue.title}
                        </Typography>
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
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {issue.type} • {issue.id}
                        </Typography>
                        {issue.description && (
                          <Typography variant="body2" color="textSecondary" className="mt-1">
                            {issue.description.length > 100 
                              ? `${issue.description.substring(0, 100)}...` 
                              : issue.description
                            }
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleIssueClick(issue)}
                      color="primary"
                      size="small"
                      title="View Issue Details"
                    >
                      <OpenIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ElementInfoDialog;
