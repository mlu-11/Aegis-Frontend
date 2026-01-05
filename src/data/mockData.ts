import type { 
  User, 
  Project, 
  Sprint, 
  Issue, 
  BPMNDiagram, 
  BPMNElement, 
  BPMNElementStatus 
} from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://mui.com/static/images/avatar/1.jpg',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://mui.com/static/images/avatar/2.jpg',
  },
  {
    id: 'user-3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    avatar: 'https://mui.com/static/images/avatar/3.jpg',
  },
  {
    id: 'user-4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    avatar: 'https://mui.com/static/images/avatar/4.jpg',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test project for BPMN color rendering',
    ownerId: 'user-1',
    memberIds: ['user-1', 'user-2'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
];

export const mockSprints: Sprint[] = [
 
];

export const mockIssues: Issue[] = [
  
];

export const mockBPMNDiagrams: BPMNDiagram[] = [
  {
    id: 'bpmn-1',
    name: 'Test Workflow',
    description: 'Test workflow for color rendering',
    projectId: 'project-1',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1" name="Start">
      <bpmn2:outgoing>Flow_1</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:task id="Task_1" name="Completed Task">
      <bpmn2:incoming>Flow_1</bpmn2:incoming>
      <bpmn2:outgoing>Flow_2</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:task id="Task_2" name="In Progress Task">
      <bpmn2:incoming>Flow_2</bpmn2:incoming>
      <bpmn2:outgoing>Flow_3</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:task id="Task_3" name="Todo Task">
      <bpmn2:incoming>Flow_3</bpmn2:incoming>
      <bpmn2:outgoing>Flow_4</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:task id="Task_4" name="Partially Complete Task">
      <bpmn2:incoming>Flow_4</bpmn2:incoming>
      <bpmn2:outgoing>Flow_5</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:endEvent id="EndEvent_1" name="End">
      <bpmn2:incoming>Flow_5</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Task_2" />
    <bpmn2:sequenceFlow id="Flow_3" sourceRef="Task_2" targetRef="Task_3" />
    <bpmn2:sequenceFlow id="Flow_4" sourceRef="Task_3" targetRef="Task_4" />
    <bpmn2:sequenceFlow id="Flow_5" sourceRef="Task_4" targetRef="EndEvent_1" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="79" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1" bpmnElement="Task_1">
        <dc:Bounds x="270" y="57" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_2" bpmnElement="Task_2">
        <dc:Bounds x="420" y="57" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_3" bpmnElement="Task_3">
        <dc:Bounds x="570" y="57" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_4" bpmnElement="Task_4">
        <dc:Bounds x="720" y="57" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="872" y="79" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="97" />
        <di:waypoint x="270" y="97" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="370" y="97" />
        <di:waypoint x="420" y="97" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="520" y="97" />
        <di:waypoint x="570" y="97" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="670" y="97" />
        <di:waypoint x="720" y="97" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="820" y="97" />
        <di:waypoint x="872" y="97" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
];

export const mockBPMNElements: BPMNElement[] = [
  {
    id: 'element-1',
    diagramId: 'bpmn-1',
    elementId: 'Task_1',
    type: 'task',
    name: 'Completed Task',
    linkedIssueIds: ['issue-1'],
  },
  {
    id: 'element-2',
    diagramId: 'bpmn-1',
    elementId: 'Task_2',
    type: 'task',
    name: 'In Progress Task',
    linkedIssueIds: ['issue-2'],
  },
  {
    id: 'element-3',
    diagramId: 'bpmn-1',
    elementId: 'Task_3',
    type: 'task',
    name: 'Todo Task',
    linkedIssueIds: ['issue-3'],
  },
  {
    id: 'element-4',
    diagramId: 'bpmn-1',
    elementId: 'Task_4',
    type: 'task',
    name: 'Partially Complete Task',
    linkedIssueIds: ['issue-4', 'issue-5'],
  },
];

export const mockBPMNElementStatuses: BPMNElementStatus[] = [

];

export const initializeData = () => {
  return {
    users: mockUsers,
    projects: mockProjects,
    sprints: mockSprints,
    issues: mockIssues,
    bpmnDiagrams: mockBPMNDiagrams,
    bpmnElements: mockBPMNElements,
    bpmnElementStatuses: mockBPMNElementStatuses,
  };
};