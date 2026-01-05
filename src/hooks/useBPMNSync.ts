import { useEffect } from 'react';
import { useIssueStore } from '../stores/issueStore';
import { useBPMNStore } from '../stores/bpmnStore';
import { calculateElementStatus } from '../utils/bpmnUtils';

export const useBPMNSync = (projectId?: string) => {
  const { issues } = useIssueStore();
  const { updateElementStatusesFromIssues, updateElementStatus } = useBPMNStore();

  useEffect(() => {
    if (!projectId) return;

    const projectIssues = issues.filter(issue => issue.projectId === projectId);
    updateElementStatusesFromIssues(projectIssues);
  }, [issues, projectId, updateElementStatusesFromIssues]);

  const syncElementStatus = (elementId: string) => {
    if (!projectId) return;

    const projectIssues = issues.filter(issue => issue.projectId === projectId);
    const linkedIssues = projectIssues.filter(issue => 
      issue.linkedBPMNElements?.some(element => element.elementId === elementId)
    );

    if (linkedIssues.length > 0) {
      const elementStatus = calculateElementStatus(elementId, linkedIssues);
      updateElementStatus(elementId, {
        status: elementStatus.status,
        progress: elementStatus.progress,
        lastUpdated: new Date(),
      });
    }
  };

  return { syncElementStatus };
};
