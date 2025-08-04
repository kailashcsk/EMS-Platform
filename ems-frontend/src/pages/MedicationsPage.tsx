import React, { useState, useEffect } from "react";
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
import type { Medication, Department } from "../types";
import {
  Pill,
  Plus,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  Search,
  Activity,
} from "lucide-react";

const MedicationsPage: React.FC = () => {
  const { canWrite } = useAuth();
  const api = useAPI();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingMedication, setDeletingMedication] =
    useState<Medication | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    use_case: "",
    description_summary: "",
    department_id: "",
    file: null as File | null,
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [medicationsData, departmentsData] = await Promise.all([
        api.getMedications(),
        api.getDepartments(),
      ]);
      setMedications(medicationsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load medications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredMedications = medications.filter((medication) => {
    const matchesSearch =
      medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.use_case.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.description_summary
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" ||
      medication.department_id.toString() === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      use_case: "",
      description_summary: "",
      department_id: "",
      file: null,
    });
  };

  const handleCreateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite()) return;

    setFormLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("use_case", formData.use_case);
      formDataToSend.append(
        "description_summary",
        formData.description_summary
      );
      formDataToSend.append("department_id", formData.department_id);
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      await api.createMedication(formDataToSend);
      await fetchData();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create medication:", error);
      setError("Failed to create medication. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite() || !editingMedication) return;

    setFormLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("use_case", formData.use_case);
      formDataToSend.append(
        "description_summary",
        formData.description_summary
      );
      formDataToSend.append("department_id", formData.department_id);
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      await api.updateMedication(editingMedication.id, formDataToSend);
      await fetchData();
      setIsEditDialogOpen(false);
      setEditingMedication(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update medication:", error);
      setError("Failed to update medication. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMedication = async () => {
    if (!canWrite() || !deletingMedication) return;

    setFormLoading(true);
    try {
      await api.deleteMedication(deletingMedication.id);
      await fetchData();
      setIsDeleteDialogOpen(false);
      setDeletingMedication(null);
    } catch (error) {
      console.error("Failed to delete medication:", error);
      setError("Failed to delete medication. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (medication: Medication) => {
    setEditingMedication(medication);
    setFormData({
      name: medication.name,
      use_case: medication.use_case,
      description_summary: medication.description_summary,
      department_id: medication.department_id.toString(),
      file: null,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (medication: Medication) => {
    setDeletingMedication(medication);
    setIsDeleteDialogOpen(true);
  };

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
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
              <Pill className="h-8 w-8 text-green-600" />
              <span>Medications</span>
            </h1>
            <p className="text-muted-foreground">
              Manage emergency medications and drug information
            </p>
          </div>

          {canWrite() && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Medication</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Medication</DialogTitle>
                  <DialogDescription>
                    Add a new medication to the emergency drug database.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMedication} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Medication Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Epinephrine"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={formData.department_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, department_id: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem
                              key={dept.id}
                              value={dept.id.toString()}
                            >
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="use_case">Primary Use Case</Label>
                    <Input
                      id="use_case"
                      value={formData.use_case}
                      onChange={(e) =>
                        setFormData({ ...formData, use_case: e.target.value })
                      }
                      placeholder="e.g., Cardiac arrest, anaphylaxis"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Description & Instructions
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description_summary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_summary: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Brief description, contraindications, special notes..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="file">Medication Guide (Optional)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          file: e.target.files?.[0] || null,
                        })
                      }
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading ? "Adding..." : "Add Medication"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Medications</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, use case, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full md:w-64">
                <Label htmlFor="department-filter" className="mb-2">Filter by Department</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medications Grid/Table */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMedications.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Pill className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No medications found
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || selectedDepartment !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by adding your first medication"}
                  </p>
                  {canWrite() &&
                    !searchTerm &&
                    selectedDepartment === "all" && (
                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Medication
                      </Button>
                    )}
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredMedications.map((medication) => (
              <Card
                key={medication.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">
                        {medication.name}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {departments.find(
                        (d) => d.id === medication.department_id
                      )?.name || "Unknown"}
                    </Badge>
                  </div>
                  <CardDescription className="font-medium text-blue-600">
                    {medication.use_case}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {medication.description_summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      {medication.file_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={medication.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Guide
                          </a>
                        </Button>
                      )}
                    </div>

                    {canWrite() && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(medication)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(medication)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Updated:{" "}
                    {new Date(medication.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Medication</DialogTitle>
              <DialogDescription>
                Update the medication information and optionally replace the
                guide document.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditMedication} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Medication Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-use-case">Primary Use Case</Label>
                <Input
                  id="edit-use-case"
                  value={formData.use_case}
                  onChange={(e) =>
                    setFormData({ ...formData, use_case: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description">
                  Description & Instructions
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description_summary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description_summary: e.target.value,
                    })
                  }
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-file">
                  Replace Guide Document (Optional)
                </Label>
                <Input
                  id="edit-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                />
                {editingMedication?.file_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {editingMedication.file_name}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingMedication(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Updating..." : "Update Medication"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Medication</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingMedication?.name}"?
                This action cannot be undone and may affect related protocols.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingMedication(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMedication}
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MedicationsPage;
