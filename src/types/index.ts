export type IssueType = "TASK" | "BUG" | "USER_STORY";
export type IssueStatus = "TO_DO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface LinkedBPMNElement {
  diagramId: string;
  elementId: string;
}

export interface CustomField {
  textField: string;
  description: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  assigneeId?: string;
  reporterId: string;
  projectId: string;
  sprintId?: string;
  estimatedHours?: number;
  progress?: number;
  linkedBPMNElements?: LinkedBPMNElement[];
  customFields?: CustomField[];
  dependencies?: IssueDependency[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueDependency {
  // dependencies...
  issueId: string; // referenced user story
  note?: string; // explanation / condition / "why first"
}

export interface Sprint {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  projectId: string;
  issueIds: string[];
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

//sprintsnapshot

export interface SprintSnapshot {
  sprintId: string;
  sprintName: string;
  sprintNumber?: number; // optional, we don't have it in backend yet
  takenAt: string; // ISO string from backend
  xml: string;
}

export interface BPMNDiagram {
  id: string;
  name: string;
  description: string;
  projectId: string;
  xml: string;
  lastCommittedXml?: string; // Stores the XML snapshot from the last completed sprint

  sprintSnapshots?: SprintSnapshot[]; // NEW: snapshots per completed sprint
  createdAt: Date;
  updatedAt: Date;
}

export interface BPMNElement {
  id: string;
  diagramId: string;
  elementId: string;
  type: "task" | "gateway" | "event" | "subprocess";
  name: string;
  linkedIssueIds: string[];
}

export interface BPMNElementStatus {
  elementId: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  progress: number;
  lastUpdated: Date;
}
