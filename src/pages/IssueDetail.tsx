import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useIssueStore } from '../stores/issueStore';
import { useUserStore } from '../stores/userStore';

const IssueDetail: React.FC = () => {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>();
  const navigate = useNavigate();
  
  const { getIssueById } = useIssueStore();
  const { users } = useUserStore();

  const issue = issueId ? getIssueById(issueId) : undefined;
  const assignee = issue?.assigneeId ? users.find(u => u.id === issue.assigneeId) : undefined;
  const reporter = issue ? users.find(u => u.id === issue.reporterId) : undefined;

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BUG':
        return 'error';
      case 'TASK':
        return 'info';
      case 'USER_STORY':
        return 'success';
      default:
        return 'default';
    }
  };

  if (!issue) {
    return (
      <Box className="p-6">
        <Alert severity="error">Issue not found</Alert>
      </Box>
    );
  }

  return (
    <Box className="h-screen flex flex-col">
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate(`/project/${projectId}/issues`)}
            className="mr-2"
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" className="flex-1">
            {issue.title}
          </Typography>
          <Button
            startIcon={<EditIcon />}
            onClick={() => {
              console.log('Edit issue:', issue.id);
            }}
          >
            Edit
          </Button>
        </Toolbar>
      </AppBar>

      <Box className="flex-1 p-6 overflow-auto">
        <Card>
          <CardContent>
            <Box className="mb-4">
              <Typography variant="h4" className="mb-2">
                {issue.title}
              </Typography>
              <Box className="flex items-center gap-2 mb-4">
                <Chip 
                  label={issue.type} 
                  color={getTypeColor(issue.type) as any}
                  size="small"
                />
                <Chip 
                  label={issue.status} 
                  color={getStatusColor(issue.status) as any}
                  size="small"
                />
                <Chip 
                  label={issue.priority} 
                  color={getPriorityColor(issue.priority) as any}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Divider className="my-4" />

            <Box className="mb-4">
              <Typography variant="h6" className="mb-2">
                Description
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {issue.description || 'No description provided'}
              </Typography>
            </Box>

            <Divider className="my-4" />

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box>
                <Typography variant="subtitle2" className="mb-1">
                  Assignee
                </Typography>
                <Typography variant="body2">
                  {assignee ? assignee.name : 'Unassigned'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" className="mb-1">
                  Reporter
                </Typography>
                <Typography variant="body2">
                  {reporter ? reporter.name : 'Unknown'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" className="mb-1">
                  Estimated Hours
                </Typography>
                <Typography variant="body2">
                  {issue.estimatedHours ? `${issue.estimatedHours}h` : 'Not estimated'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" className="mb-1">
                  Issue ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {issue.id}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" className="mb-1">
                  Created
                </Typography>
                <Typography variant="body2">
                  {issue.createdAt.toLocaleDateString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" className="mb-1">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {issue.updatedAt.toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            {issue.linkedBPMNElements && issue.linkedBPMNElements.length > 0 && (
              <>
                <Divider className="my-4" />
                <Box>
                  <Typography variant="h6" className="mb-2">
                    Linked BPMN Elements
                  </Typography>
                  <Box className="flex flex-wrap gap-2">
                    {issue.linkedBPMNElements.map((elementId) => (
                      <Chip
                        key={elementId}
                        label={elementId}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          navigate(`/project/${projectId}/bpmn`);
                        }}
                        clickable
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default IssueDetail;
