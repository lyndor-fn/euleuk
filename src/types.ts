export interface User {
  id: number;
  email: string;
  username: string;
  role: 'student' | 'coach';
  full_name: string;
}

export interface Profile {
  user_id: number;
  skills: string;
  hobbies: string;
  personality: string;
  favorite_subjects: string;
  goals: string;
  strengths: string;
  weaknesses: string;
}

export interface Recommendation {
  id: number;
  user_id: number;
  job_title: string;
  explanation: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
