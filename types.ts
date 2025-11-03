export enum UserRole {
  EDUCATOR = 'educator',
  STUDENT = 'student',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Assignment {
  id:string;
  title: string;
  description: string;
  dueDate: string;
}

export interface Submission {
  studentId: string;
  assignmentId: string;
  content: string;
  submittedAt: string;
  grade?: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Can be markdown or plain text
  completedBy: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  educatorId: string;
  lessons: Lesson[];
  assignments: Assignment[];
  enrolledStudentIds: string[];
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  submissions: Submission[];
  overallGrade: number;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  isThinking?: boolean;
}

export enum ChatMode {
    FAST = 'Fast',
    STANDARD = 'Standard',
    DEEP_THOUGHT = 'Deep Thought',
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: {
        uri: string;
        title: string;
        placeAnswerSources?: {
            reviewSnippets: {
                uri: string;
                text: string;
            }[];
        }[]
    };
}