import React from 'react';
import { useParams, useLocation, Link } from 'react-router';
import {
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Dashboard, 
  ViewKanban, 
  List, 
  BugReport, 
  DirectionsRun,
  AccountTree 
} from '@mui/icons-material';
import { useProjectStore } from '../stores/projectStore';

const ProjectNavigation: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { currentProject } = useProjectStore();

  const getTabValue = () => {
    const path = location.pathname;
    if (path.includes('/board')) return 'board';
    if (path.includes('/backlog')) return 'backlog';
    if (path.includes('/issues')) return 'issues';
    if (path.includes('/sprints')) return 'sprints';
    if (path.includes('/bpmn')) return 'bpmn';
    if (path.match(/^\/project\/[^\/]+$/)) return 'overview';
    return false;
  };

  const isProjectPage = projectId && currentProject;

  if (!isProjectPage) {
    return null;
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={getTabValue()}
        aria-label="project navigation tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 48 }}
      >
        <Tab
          icon={<Dashboard />}
          label="Overview"
          value="overview"
          component={Link}
          to={`/project/${projectId}`}
          iconPosition="start"
        />
        <Tab
          icon={<ViewKanban />}
          label="Board"
          value="board"
          component={Link}
          to={`/project/${projectId}/board`}
          iconPosition="start"
        />
        <Tab
          icon={<List />}
          label="Backlog"
          value="backlog"
          component={Link}
          to={`/project/${projectId}/backlog`}
          iconPosition="start"
        />
        <Tab
          icon={<BugReport />}
          label="Issues"
          value="issues"
          component={Link}
          to={`/project/${projectId}/issues`}
          iconPosition="start"
        />
        <Tab
          icon={<DirectionsRun />}
          label="Sprints"
          value="sprints"
          component={Link}
          to={`/project/${projectId}/sprints`}
          iconPosition="start"
        />
        <Tab
          icon={<AccountTree />}
          label="BPMN"
          value="bpmn"
          component={Link}
          to={`/project/${projectId}/bpmn`}
          iconPosition="start"
        />
      </Tabs>
    </Box>
  );
};

export default ProjectNavigation;
