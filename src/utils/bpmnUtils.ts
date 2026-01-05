import type { Issue, BPMNElementStatus } from '../types';

export const calculateElementStatus = (
  elementId: string,
  linkedIssues: Issue[]
): BPMNElementStatus => {
  if (linkedIssues.length === 0) {
    return {
      elementId,
      status: 'not_started',
      progress: 0,
      lastUpdated: new Date(),
    };
  }

  const doneCount = linkedIssues.filter((issue) => issue.status === 'DONE').length;
  const inProgressCount = linkedIssues.filter(
    (issue) => issue.status === 'IN_PROGRESS'
  ).length;

  const progress = (doneCount / linkedIssues.length) * 100;

  if (doneCount === linkedIssues.length) {
    return {
      elementId,
      status: 'completed',
      progress: 100,
      lastUpdated: new Date(),
    };
  } else if (inProgressCount > 0 || doneCount > 0) {
    return {
      elementId,
      status: 'in_progress',
      progress,
      lastUpdated: new Date(),
    };
  } else {
    return {
      elementId,
      status: 'not_started',
      progress: 0,
      lastUpdated: new Date(),
    };
  }
};

export const getElementColors = (status: BPMNElementStatus['status']) => {
  const colors = {
    not_started: { stroke: '#ff9800', fill: '#fff3e0' },
    in_progress: { stroke: '#2196f3', fill: '#e3f2fd' },
    completed: { stroke: '#4caf50', fill: '#e8f5e9' },
    blocked: { stroke: '#f44336', fill: '#ffebee' },
  };

  return colors[status];
};

export const getDefaultBPMNXML = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
             xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" 
             xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" 
             id="definitions" 
             targetNamespace="http://www.example.org/bpmn">
  <process id="process">
    <startEvent id="startEvent"/>
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="process">
      <bpmndi:BPMNShape id="BPMNShape_startEvent" bpmnElement="startEvent">
        <omgdc:Bounds x="100" y="100" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
};
