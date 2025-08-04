import type { Department, Protocol, Medication, MedicationDose, AIResponse } from '../types';

class APIService {
  private baseURL: string;
  private getAuthToken: () => Promise<string | null>;

  constructor(getAuthToken: () => Promise<string | null>) {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.getAuthToken = getAuthToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data;
    }
    
    return responseData;
  }

  async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/departments');
  }

  async getDepartment(id: number): Promise<Department> {
    return this.request<Department>(`/departments/${id}`);
  }

  async createDepartment(data: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    return this.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    return this.request<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: number): Promise<void> {
    return this.request<void>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getProtocols(): Promise<Protocol[]> {
    return this.request<Protocol[]>('/protocols');
  }

  async getProtocol(id: number): Promise<Protocol> {
    return this.request<Protocol>(`/protocols/${id}`);
  }

  async createProtocol(formData: FormData): Promise<Protocol> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseURL}/protocols`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create protocol: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData?.data || responseData;
  }

  async updateProtocol(id: number, formData: FormData): Promise<Protocol> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseURL}/protocols/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update protocol: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData?.data || responseData;
  }

  async deleteProtocol(id: number): Promise<void> {
    return this.request<void>(`/protocols/${id}`, {
      method: 'DELETE',
    });
  }

  async getMedications(): Promise<Medication[]> {
    return this.request<Medication[]>('/medications');
  }

  async getMedication(id: number): Promise<Medication> {
    return this.request<Medication>(`/medications/${id}`);
  }

  async createMedication(formData: FormData): Promise<Medication> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseURL}/medications`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create medication: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData?.data || responseData;
  }

  async updateMedication(id: number, formData: FormData): Promise<Medication> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseURL}/medications/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update medication: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData?.data || responseData;
  }

  async deleteMedication(id: number): Promise<void> {
    return this.request<void>(`/medications/${id}`, {
      method: 'DELETE',
    });
  }

  async getMedicationDoses(): Promise<MedicationDose[]> {
    return this.request<MedicationDose[]>('/medication-doses');
  }

  async getMedicationDose(id: number): Promise<MedicationDose> {
    return this.request<MedicationDose>(`/medication-doses/${id}`);
  }

  async createMedicationDose(data: Omit<MedicationDose, 'id' | 'created_at' | 'updated_at'>): Promise<MedicationDose> {
    return this.request<MedicationDose>('/medication-doses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedicationDose(id: number, data: Partial<MedicationDose>): Promise<MedicationDose> {
    return this.request<MedicationDose>(`/medication-doses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMedicationDose(id: number): Promise<void> {
    return this.request<void>(`/medication-doses/${id}`, {
      method: 'DELETE',
    });
  }

  async getMedicationDosesByProtocol(protocolId: number): Promise<MedicationDose[]> {
    return this.request<MedicationDose[]>(`/medication-doses/protocol/${protocolId}`);
  }

  async getMedicationDosesByMedication(medicationId: number): Promise<MedicationDose[]> {
    return this.request<MedicationDose[]>(`/medication-doses/medication/${medicationId}`);
  }

  async searchMedicationDoses(query: string): Promise<MedicationDose[]> {
    return this.request<MedicationDose[]>(`/medication-doses/search?q=${encodeURIComponent(query)}`);
  }

  async getRouteAnalysis(): Promise<any> {
    return this.request<any>('/medication-doses/analysis/routes');
  }

  async getProtocolWithMedications(protocolId: number): Promise<any> {
    return this.request<any>(`/relationships/protocols/${protocolId}/medications`);
  }

  async getMedicationWithProtocols(medicationId: number): Promise<any> {
    return this.request<any>(`/relationships/medications/${medicationId}/protocols`);
  }

  async getDepartmentOverview(departmentId: number): Promise<any> {
    return this.request<any>(`/relationships/departments/${departmentId}/overview`);
  }

  async queryAI(query: string): Promise<AIResponse> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ query }),
    };

    const response = await fetch(`${this.baseURL}/ai/query`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Raw AI Response:', responseData);
    return responseData;
  }

  async queryAIWithDocs(query: string): Promise<AIResponse> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ query }),
    };

    const response = await fetch(`${this.baseURL}/ai/query-with-docs`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Raw AI with Docs Response:', responseData); 
    return responseData;
  }

  async getSampleQueries(): Promise<{ samples: string[] }> {
    const response = await this.request<any>('/ai/samples');
    
    if (response && typeof response === 'object' && 'samples' in response) {
      return response;
    }
    
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    
    return response;
  }

  async getAIHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/ai/health');
  }

  async getUsers(): Promise<any[]> {
    return this.request<any[]>('/admin/users');
  }

  async promoteUser(uid: string, role: 'admin' | 'patient'): Promise<{ message: string; customClaims: any }> {
    return this.request<{ message: string; customClaims: any }>('/admin/users/promote', {
      method: 'POST',
      body: JSON.stringify({ uid, role }),
    });
  }

  async revokeAdminPrivileges(uid: string): Promise<{ message: string; customClaims: any }> {
    return this.request<{ message: string; customClaims: any }>('/admin/users/revoke', {
      method: 'POST',
      body: JSON.stringify({ uid }),
    });
  }
}

export default APIService;