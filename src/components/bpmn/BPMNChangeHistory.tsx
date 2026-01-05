import React, { useEffect } from 'react';
import { Box, List, ListItem, ListItemText, Typography, Paper } from '@mui/material';
import { useIssueStore } from '../../stores/issueStore';
import { useChangelogStore, type ChangeLog } from '../../stores/changelogStore';


interface BPMNChangeHistoryProps {
  diagramId?: string;
  refreshTrigger?: number;
}

const BPMNChangeHistory: React.FC<BPMNChangeHistoryProps> = ({
  diagramId,
  refreshTrigger = 0
}) => {
  const { getIssueById } = useIssueStore();
  const { fetchChangeLogs, getChangeLogsByDiagram, loading } = useChangelogStore();

  useEffect(() => {
    if (diagramId) {
      fetchChangeLogs(diagramId);
    }
  }, [diagramId, refreshTrigger, fetchChangeLogs]);

  const diagramChangeLogs = diagramId ? getChangeLogsByDiagram(diagramId) : [];

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return '#4caf50';
      case 'deleted':
        return '#f44336';
      case 'link':
        return '#2196f3';
      case 'unlink':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getChangeTypeText = (log: ChangeLog) => {
    switch (log.changeType) {
      case 'added':
        return `Added ${log.elementType} with name: ${log.elementName}`;
      case 'deleted':
        return `Deleted ${log.elementType} with name: ${log.elementName}`;
      case 'update':
        return `Updated ${log.elementType} with name: ${log.elementName}`;
      case 'link': {
        const issue = log.relatedIssueId ? getIssueById(log.relatedIssueId) : null;
        const issueName = issue ? issue.title : `Issue ${log.relatedIssueId}`;
        return `Link ${log.elementName} to ${issueName}`;
      }
      case 'unlink': {
        const issue = log.relatedIssueId ? getIssueById(log.relatedIssueId) : null;
        const issueName = issue ? issue.title : `Issue ${log.relatedIssueId}`;
        return `Unlink ${log.elementName} from ${issueName}`;
      }
      default:
        return `${log.changeType} ${log.elementName}`;
    }
  };
  return (
    <Paper 
      elevation={2} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '500px',
        padding: '16px',
        overflow: 'auto'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Change History
      </Typography>
      <List dense style={{
        maxHeight: '60vh',
        overflow: 'auto'
      }}>
        {diagramChangeLogs.map((log) => (
          <ListItem key={log._id} style={{ paddingLeft: 0 }}>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <Box
                    component="span"
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getChangeTypeColor(log.changeType),
                      marginRight: '8px'
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    style={{ 
                      color: getChangeTypeColor(log.changeType),
                      fontWeight: 'bold'
                    }}
                  >
                    {getChangeTypeText(log)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    {log.elementType} • {new Date(log.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
        {diagramChangeLogs.length === 0 && !loading && (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body2" color="textSecondary">
                  {loading ? 'Loading...' : 'No changes recorded yet'}
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default BPMNChangeHistory;
