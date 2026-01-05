import React, { useEffect } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { useProjectStore } from '../stores/projectStore';
import ProjectNavigation from '../components/ProjectNavigation';

const ProjectContainer: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject, setCurrentProject, getProjectById, fetchProjects } = useProjectStore();

  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        let project = getProjectById(projectId);

        if (!project) {
          await fetchProjects();
          project = getProjectById(projectId);
        }

        setCurrentProject(project || null);

        if (!project) {
          navigate('/');
          return;
        }
      }
    };

    loadProject();
  }, [projectId, getProjectById, setCurrentProject, navigate, fetchProjects]);

  const handleBackToProjects = () => {
    navigate('/');
  };

  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path.includes('/board')) return 'Board';
    if (path.includes('/backlog')) return 'Backlog';
    if (path.includes('/issues')) return 'Issues';
    if (path.includes('/sprints')) return 'Sprints';
    if (path.match(/^\/project\/[^\/]+$/)) return 'Overview';
    return 'Project';
  };

  if (!currentProject) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Typography variant="h6">Loading project...</Typography>
      </Container>
    );
  }

  return (
    <Box>
      <Container maxWidth="xl" className="py-4">
        <Box className="flex items-center justify-between mb-4">
          <Box className="flex items-center gap-2">
            <IconButton
              onClick={handleBackToProjects}
              size="small"
              color="primary"
            >
              <ArrowBack />
            </IconButton>
            
            <Breadcrumbs aria-label="breadcrumb">
              <Link
                underline="hover"
                color="inherit"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleBackToProjects();
                }}
                className="flex items-center gap-1"
              >
                <Home fontSize="small" />
                Projects
              </Link>
              <Typography color="text.primary" fontWeight="medium">
                {currentProject.name}
              </Typography>
              {getCurrentPageName() !== 'Overview' && (
                <Typography color="text.secondary">
                  {getCurrentPageName()}
                </Typography>
              )}
            </Breadcrumbs>
          </Box>
        </Box>

        <ProjectNavigation />
        
        <Box className="mt-4">
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
};

export default ProjectContainer;
