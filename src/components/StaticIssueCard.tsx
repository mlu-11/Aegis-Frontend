import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  BugReport,
  Task,
  Person,
  Schedule,
  MoreVert,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import type { Issue } from '../types';
import { useUserStore } from '../stores/userStore';
import { useSprintStore } from '../stores/sprintStore';

interface StaticIssueCardProps {
  issue: Issue;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issue: Issue) => void;
  onView?: (issue: Issue) => void;
  showActions?: boolean;
}

const StaticIssueCard: React.FC<StaticIssueCardProps> = ({
  issue,
  onEdit,
  onDelete,
  onView,
  showActions = true
}) => {
  const { getUserById } = useUserStore();
  const { getSprintById } = useSprintStore();
  const assignee = issue.assigneeId ? getUserById(issue.assigneeId) : null;
  const sprint = issue.sprintId ? getSprintById(issue.sprintId) : null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleView = (event: React.MouseEvent) => {
    event.stopPropagation();
    onView?.(issue);
    handleMenuClose();
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit?.(issue);
    handleMenuClose();
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.(issue);
    handleMenuClose();
  };

  const handleCardClick = () => {
    onView?.(issue);
  };

  const getTypeIcon = () => {
    switch (issue.type) {
      case 'BUG':
        return <BugReport fontSize="small" color="error" />;
      case 'USER_STORY':
        return <Person fontSize="small" color="primary" />;
      case 'TASK':
      default:
        return <Task fontSize="small" color="action" />;
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

  return (
    <Card
      className="mb-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        <Box className="flex items-start justify-between mb-2">
          <Box className="flex items-center gap-1">
            {getTypeIcon()}
            <Typography variant="caption" color="text.secondary">
              {issue.type.replace('_', ' ')}
            </Typography>
          </Box>
          <Box className="flex items-center gap-1">
            <Chip
              label={issue.priority}
              size="small"
              color={getPriorityColor(issue.priority) as any}
              variant="outlined"
            />
            {showActions && (
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                className="opacity-70 hover:opacity-100"
                sx={{ ml: 0.5 }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography variant="subtitle2" className="mb-2 font-medium">
          {issue.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          className="mb-3 line-clamp-2"
        >
          {issue.description}
        </Typography>

        {sprint && (
          <Box className="mb-2">
            <Chip
              label={`Sprint: ${sprint.name}`}
              size="small"
              variant="filled"
              color="secondary"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        )}

        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-1">
            {issue.estimatedHours && (
              <>
                <Schedule fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {issue.estimatedHours}h
                </Typography>
              </>
            )}
          </Box>

          {assignee && (
            <Avatar
              src={assignee.avatar}
              alt={assignee.name}
              sx={{ width: 24, height: 24 }}
              title={assignee.name}
            />
          )}
        </Box>
      </CardContent>

      {showActions && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => handleMenuClose()}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
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
      )}
    </Card>
  );
};

export default StaticIssueCard;