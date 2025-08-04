export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserClaims {
  role: 'admin' | 'patient';
  permissions: {
    read: boolean;
    write: boolean;
    ai_query: boolean;
    user_management: boolean;
  };
}

export interface AuthContextType {
  user: User | null;
  userClaims: UserClaims | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  isAdmin: () => boolean;
  canWrite: () => boolean;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Protocol {
  id: number;
  department_id: number;
  name: string;
  description_summary: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Medication {
  id: number;
  department_id: number;
  name: string;
  use_case: string;
  description_summary: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface MedicationDose {
  id: number;
  protocol_id: number;
  medication_id: number;
  amount: string;
  route: string;
  frequency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  protocol?: Protocol;
  medication?: Medication;
}

export interface AIResponse {
  success: boolean;
  query: string;
  sql?: string;
  data: any[];
  insight: string;
  count: number;
  has_documents: boolean;
  timestamp: string;
}