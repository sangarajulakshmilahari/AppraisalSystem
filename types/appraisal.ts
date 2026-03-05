export type AppraisalStatus =
  | "goal_setting"
  | "self_assessment"
  | "manager_review"
  | "completed"
  | "inactive";

export interface AppraisalCycle {
  id: string;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  status: AppraisalStatus;
  currentPhase: string;
}

export interface Goal {
  id: string;
  no: number;
  area: string;
  description: string;
  metric: string;
  target: string;
  timeline: string;
  weight: number;
  status: "draft" | "submitted" | "approved";
}

export interface Evidence {
  id: string;
  month: string;
  description: string;
}

export interface SelfAssessment {
  goalId: string;
  selfAssessment: string;
  evidence: Evidence[];
  managerFeedback?: string;
  performanceRating?: number;
  submitted: boolean;
}

export interface Competency {
  id: string;
  area: string;
  expectedBehaviour: string;
  selfRating: number | null;
  managerFeedback?: string;
  managerRating?: number;
  submitted: boolean;
}

export interface DevelopmentEntry {
  id: string;
  area: "Technical" | "Domain" | "Soft Skill" | "Others";
  action: string;
  timeline: string;
  responsible: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "action";
  read: boolean;
  date: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  manager: string;
  joiningDate: string;
  employeeCode: string;
}