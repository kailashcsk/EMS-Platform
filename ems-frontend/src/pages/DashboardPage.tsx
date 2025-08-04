import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useAPI } from "../hooks/useAPI";
import { useAuth } from "../contexts/AuthContext";
import type {
  Department,
  Protocol,
  Medication,
  MedicationDose,
} from "../types";
import {
  Activity,
  FileText,
  Pill,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Plus,
  Edit,
  Trash2,
  Building2,
  Syringe,
  AlertCircle,
} from "lucide-react";

const DashboardPage: React.FC = () => {
  const { user, isAdmin, canWrite } = useAuth();
  const api = useAPI();

  const [stats, setStats] = useState({
    departments: 0,
    protocols: 0,
    medications: 0,
    totalDoses: 0,
  });

  const [recentData, setRecentData] = useState<{
    protocols: Protocol[];
    medications: Medication[];
  }>({
    protocols: [],
    medications: [],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [medicationDoses, setMedicationDoses] = useState<MedicationDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [isDoseDialogOpen, setIsDoseDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [editingDose, setEditingDose] = useState<MedicationDose | null>(null);

  const [deptFormData, setDeptFormData] = useState({
    name: "",
    description: "",
  });

  const [doseFormData, setDoseFormData] = useState({
    protocol_id: "",
    medication_id: "",
    amount: "",
    route: "",
    frequency: "",
    notes: "",
  });

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        departmentsData,
        protocolsData,
        medicationsData,
        dosesData,
        medicationDosesData,
      ] = await Promise.all([
        api.getDepartments(),
        api.getProtocols(),
        api.getMedications(),
        api.getMedicationDoses(),
        api.getMedicationDoses(),
      ]);

      setStats({
        departments: departmentsData.length,
        protocols: protocolsData.length,
        medications: medicationsData.length,
        totalDoses: dosesData.length,
      });

      setRecentData({
        protocols: protocolsData.slice(-5).reverse(),
        medications: medicationsData.slice(-5).reverse(),
      });

      setDepartments(departmentsData);
      setMedicationDoses(medicationDosesData.slice(0, 10));
      setProtocols(protocolsData);
      setMedications(medicationsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite()) return;

    setFormLoading(true);
    try {
      if (editingDepartment) {
        await api.updateDepartment(editingDepartment.id, deptFormData);
      } else {
        await api.createDepartment(deptFormData);
      }
      await fetchDashboardData();
      setIsDeptDialogOpen(false);
      setDeptFormData({ name: "", description: "" });
      setEditingDepartment(null);
    } catch (error) {
      console.error("Failed to save department:", error);
      setError("Failed to save department. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateMedicationDose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite()) return;

    setFormLoading(true);
    try {
      if (editingDose) {
        await api.updateMedicationDose(editingDose.id, {
          protocol_id: parseInt(doseFormData.protocol_id),
          medication_id: parseInt(doseFormData.medication_id),
          amount: doseFormData.amount,
          route: doseFormData.route,
          frequency: doseFormData.frequency,
          notes: doseFormData.notes,
        });
      } else {
        await api.createMedicationDose({
          protocol_id: parseInt(doseFormData.protocol_id),
          medication_id: parseInt(doseFormData.medication_id),
          amount: doseFormData.amount,
          route: doseFormData.route,
          frequency: doseFormData.frequency,
          notes: doseFormData.notes,
        });
      }
      await fetchDashboardData();
      setIsDoseDialogOpen(false);
      setDoseFormData({
        protocol_id: "",
        medication_id: "",
        amount: "",
        route: "",
        frequency: "",
        notes: "",
      });
      setEditingDose(null);
    } catch (error) {
      setError("Failed to save medication dose. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Departments",
      value: stats.departments,
      icon: Users,
      description: "Active medical departments",
    },
    {
      title: "Protocols",
      value: stats.protocols,
      icon: FileText,
      description: "Emergency medical protocols",
    },
    {
      title: "Medications",
      value: stats.medications,
      icon: Pill,
      description: "Available medications",
    },
    {
      title: "Medication Doses",
      value: stats.totalDoses,
      icon: TrendingUp,
      description: "Documented dosage records",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.displayName?.split(" ")[0] || "User"}
            </h1>
            <div className="flex items-center space-x-2">
              {isAdmin() && (
                <Badge variant="default">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
                </Badge>
              )}
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            {canWrite()
              ? "You have full access to view, create, edit, and manage all EMS data and protocols."
              : "You have read access to protocols, medications, and can query the AI assistant."}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Recent Protocols</span>
                  </CardTitle>
                </div>
                <CardDescription>
                  Latest emergency medical protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentData.protocols.length > 0 ? (
                    recentData.protocols.map((protocol) => (
                      <div
                        key={protocol.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {protocol.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {protocol.description_summary}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {protocol.department?.name}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No protocols available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span>Medical Departments</span>
                  </CardTitle>
                  {canWrite() && (
                    <Dialog
                      open={isDeptDialogOpen}
                      onOpenChange={(open) => {
                        setIsDeptDialogOpen(open);
                        if (!open) {
                          setEditingDepartment(null);
                          setDeptFormData({ name: "", description: "" });
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          {editingDepartment
                            ? "Edit Department"
                            : "Add Department"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingDepartment
                              ? "Edit Department"
                              : "Add New Department"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingDepartment
                              ? "Update the medical department details."
                              : "Create a new medical department for organizing protocols and medications."}
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleCreateDepartment}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="dept-name">Department Name</Label>
                            <Input
                              id="dept-name"
                              value={deptFormData.name}
                              onChange={(e) =>
                                setDeptFormData({
                                  ...deptFormData,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., Emergency Medicine"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="dept-description">
                              Description
                            </Label>
                            <Textarea
                              id="dept-description"
                              value={deptFormData.description}
                              onChange={(e) =>
                                setDeptFormData({
                                  ...deptFormData,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Brief description of the department..."
                              rows={3}
                              required
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDeptDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                              {formLoading
                                ? editingDepartment
                                  ? "Updating..."
                                  : "Creating..."
                                : editingDepartment
                                ? "Update Department"
                                : "Create Department"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <CardDescription>
                  Organizational units for medical protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departments.length > 0 ? (
                    departments.map((department) => (
                      <div
                        key={department.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {department.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {department.description}
                          </p>
                        </div>
                        {canWrite() && (
                          <div className="flex space-x-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingDepartment(department);
                                setDeptFormData({
                                  name: department.name,
                                  description: department.description,
                                });
                                setIsDeptDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={async () => {
                                if (
                                  confirm(
                                    `Delete department '${department.name}'?`
                                  )
                                ) {
                                  try {
                                    await api.deleteDepartment(department.id);
                                    await fetchDashboardData();
                                  } catch (error) {
                                    setError("Failed to delete department.");
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No departments available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5" />
                  <span>Recent Medications</span>
                </CardTitle>
                <CardDescription>Latest medication entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentData.medications.length > 0 ? (
                    recentData.medications.map((medication) => (
                      <div
                        key={medication.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {medication.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {medication.use_case}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {medication.department?.name}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No medications available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Syringe className="h-5 w-5 text-orange-600" />
                    <span>Medication Doses</span>
                  </CardTitle>
                  {canWrite() && (
                    <Dialog
                      open={isDoseDialogOpen}
                      onOpenChange={setIsDoseDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Dose
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Medication Dose</DialogTitle>
                          <DialogDescription>
                            Define dosage information for a specific protocol
                            and medication combination.
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleCreateMedicationDose}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="protocol">Protocol</Label>
                              <Select
                                value={doseFormData.protocol_id}
                                onValueChange={(value) =>
                                  setDoseFormData({
                                    ...doseFormData,
                                    protocol_id: value,
                                  })
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select protocol" />
                                </SelectTrigger>
                                <SelectContent>
                                  {protocols.map((protocol) => (
                                    <SelectItem
                                      key={protocol.id}
                                      value={protocol.id.toString()}
                                    >
                                      {protocol.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="medication">Medication</Label>
                              <Select
                                value={doseFormData.medication_id}
                                onValueChange={(value) =>
                                  setDoseFormData({
                                    ...doseFormData,
                                    medication_id: value,
                                  })
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select medication" />
                                </SelectTrigger>
                                <SelectContent>
                                  {medications.map((medication) => (
                                    <SelectItem
                                      key={medication.id}
                                      value={medication.id.toString()}
                                    >
                                      {medication.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="amount">Amount</Label>
                              <Input
                                id="amount"
                                value={doseFormData.amount}
                                onChange={(e) =>
                                  setDoseFormData({
                                    ...doseFormData,
                                    amount: e.target.value,
                                  })
                                }
                                placeholder="e.g., 1 mg"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="route">Route</Label>
                              <Select
                                value={doseFormData.route}
                                onValueChange={(value) =>
                                  setDoseFormData({
                                    ...doseFormData,
                                    route: value,
                                  })
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select route" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="IV">
                                    IV (Intravenous)
                                  </SelectItem>
                                  <SelectItem value="IM">
                                    IM (Intramuscular)
                                  </SelectItem>
                                  <SelectItem value="PO">PO (Oral)</SelectItem>
                                  <SelectItem value="SL">
                                    SL (Sublingual)
                                  </SelectItem>
                                  <SelectItem value="IO">
                                    IO (Intraosseous)
                                  </SelectItem>
                                  <SelectItem value="Nebulized">
                                    Nebulized
                                  </SelectItem>
                                  <SelectItem value="Intranasal">
                                    Intranasal
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="frequency">Frequency</Label>
                              <Input
                                id="frequency"
                                value={doseFormData.frequency}
                                onChange={(e) =>
                                  setDoseFormData({
                                    ...doseFormData,
                                    frequency: e.target.value,
                                  })
                                }
                                placeholder="e.g., Every 5 minutes"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="notes">Clinical Notes</Label>
                            <Textarea
                              id="notes"
                              value={doseFormData.notes}
                              onChange={(e) =>
                                setDoseFormData({
                                  ...doseFormData,
                                  notes: e.target.value,
                                })
                              }
                              placeholder="Special instructions, contraindications, monitoring requirements..."
                              rows={2}
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDoseDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                              {formLoading ? "Creating..." : "Create Dose"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <CardDescription>
                  Protocol-specific medication dosing guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {medicationDoses.length > 0 ? (
                    medicationDoses.map((dose) => (
                      <div
                        key={dose.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">
                              {dose.medication?.name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {dose.amount}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {dose.route}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {dose.protocol?.name} • {dose.frequency}
                          </p>
                          {dose.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {dose.notes}
                            </p>
                          )}
                        </div>
                        {canWrite() && (
                          <div className="flex space-x-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingDose(dose);
                                setDoseFormData({
                                  protocol_id: dose.protocol_id.toString(),
                                  medication_id: dose.medication_id.toString(),
                                  amount: dose.amount,
                                  route: dose.route,
                                  frequency: dose.frequency,
                                  notes: dose.notes || "",
                                });
                                setIsDoseDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={async () => {
                                if (
                                  confirm(
                                    `Delete dose for '${dose.medication?.name}'?`
                                  )
                                ) {
                                  try {
                                    await api.deleteMedicationDose(dose.id);
                                    await fetchDashboardData();
                                  } catch (error) {
                                    setError("Failed to delete dose.");
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No medication doses available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
