import { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { useProjectStore } from '../stores/projectStore';
import { useSprintStore } from '../stores/sprintStore';
import { useIssueStore } from '../stores/issueStore';
import { useBPMNStore } from '../stores/bpmnStore';
import { 
  mockUsers, 
  mockProjects, 
  mockSprints, 
  mockIssues,
  mockBPMNDiagrams,
  mockBPMNElements,
  mockBPMNElementStatuses
} from '../data/mockData';

const DataInitializer: React.FC = () => {
  const { setUsers } = useUserStore();
  const { projects, addProject } = useProjectStore();
  const { sprints, addSprint } = useSprintStore();
  const { issues, addIssue } = useIssueStore();
  const { diagrams, addDiagram, addElement, updateElementStatus } = useBPMNStore();

  useEffect(() => {
    if (projects.length === 0) {
      setUsers(mockUsers);
      
      mockProjects.forEach(project => {
        addProject({
          name: project.name,
          description: project.description,
          ownerId: project.ownerId,
          memberIds: project.memberIds,
        });
      });
    }
  }, [projects.length, setUsers, addProject]);

  useEffect(() => {
    if (sprints.length === 0 && projects.length > 0) {
      mockSprints.forEach(sprint => {
        addSprint({
          name: sprint.name,
          description: sprint.description,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          projectId: sprint.projectId,
          issueIds: sprint.issueIds,
          status: sprint.status,
        });
      });
    }
  }, [sprints.length, projects.length, addSprint]);

  useEffect(() => {
    if (issues.length === 0 && projects.length > 0) {
      mockIssues.forEach(issue => {
        addIssue({
          title: issue.title,
          description: issue.description,
          type: issue.type,
          status: issue.status,
          priority: issue.priority,
          assigneeId: issue.assigneeId,
          reporterId: issue.reporterId,
          projectId: issue.projectId,
          sprintId: issue.sprintId,
          estimatedHours: issue.estimatedHours,
        });
      });
    }
  }, [issues.length, projects.length, addIssue]);

  useEffect(() => {
    if (diagrams.length === 0 && projects.length > 0) {
      mockBPMNDiagrams.forEach(diagram => {
        addDiagram({
          name: diagram.name,
          description: diagram.description,
          projectId: diagram.projectId,
          xml: diagram.xml,
        });
      });

      mockBPMNElements.forEach(element => {
        addElement({
          diagramId: element.diagramId,
          elementId: element.elementId,
          type: element.type,
          name: element.name,
          linkedIssueIds: element.linkedIssueIds,
        });
      });

      mockBPMNElementStatuses.forEach(status => {
        updateElementStatus(status.elementId, {
          status: status.status,
          progress: status.progress,
          lastUpdated: status.lastUpdated,
        });
      });
    }
  }, [diagrams.length, projects.length, addDiagram, addElement, updateElementStatus]);

  return null;
};

export default DataInitializer;
