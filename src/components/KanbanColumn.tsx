import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { Issue, IssueStatus } from '../types';
import IssueCard from './IssueCard';

interface KanbanColumnProps {
  title: string;
  status: IssueStatus;
  issues: Issue[];
  count: number;
  onEditIssue?: (issue: Issue) => void;
  onDeleteIssue?: (issue: Issue) => void;
  onViewIssue?: (issue: Issue) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  issues,
  count,
  onEditIssue,
  onDeleteIssue,
  onViewIssue,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const getColumnColor = (status: IssueStatus) => {
    switch (status) {
      case 'TO_DO':
        return '#f5f5f5';
      case 'IN_PROGRESS':
        return '#e3f2fd';
      case 'DONE':
        return '#e8f5e8';
      default:
        return '#f5f5f5';
    }
  };

  return (
    <Paper
      ref={setNodeRef}
      className="p-4 min-h-[500px] lg:min-h-[600px] flex flex-col"
      sx={{
        backgroundColor: isOver ? getColumnColor(status) : 'white',
        border: isOver ? '2px dashed #1976d2' : '1px solid #e0e0e0',
        transition: 'all 0.2s ease',
      }}
    >
      <Box className="flex items-center justify-between mb-4 shrink-0">
        <Typography variant="h6" component="h3" fontWeight="medium">
          {title}
        </Typography>
        <Chip
          label={count}
          size="small"
          variant="outlined"
          color="primary"
        />
      </Box>

      <Box className="space-y-3 flex-1 overflow-y-auto scrollbar-thin">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onEdit={onEditIssue}
            onDelete={onDeleteIssue}
            onView={onViewIssue}
            showActions={true}
            enableDrag={true}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default KanbanColumn;