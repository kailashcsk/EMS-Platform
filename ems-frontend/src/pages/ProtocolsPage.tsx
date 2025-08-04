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
import type { Protocol, Department } from "../types";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  Search,
} from "lucide-react";

const ProtocolsPage: React.FC = () => {
  const { canWrite } = useAuth();
  const api = useAPI();

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProtocol, setDeletingProtocol] = useState<Protocol | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState({
    name: "",
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
      const [protocolsData, departmentsData] = await Promise.all([
        api.getProtocols(),
        api.getDepartments(),
      ]);
      setProtocols(protocolsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load protocols. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProtocols = (protocols || []).filter((protocol) => {
    const matchesSearch =
      protocol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.description_summary
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" ||
      protocol.department_id.toString() === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });
  const resetForm = () => {
    setFormData({
      name: "",
      description_summary: "",
      department_id: "",
      file: null,
    });
  };

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite()) return;

    setFormLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append(
        "description_summary",
        formData.description_summary
      );
      formDataToSend.append("department_id", formData.department_id);
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      await api.createProtocol(formDataToSend);
      await fetchData();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create protocol:", error);
      setError("Failed to create protocol. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite() || !editingProtocol) return;

    setFormLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append(
        "description_summary",
        formData.description_summary
      );
      formDataToSend.append("department_id", formData.department_id);
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      await api.updateProtocol(editingProtocol.id, formDataToSend);
      await fetchData();
      setIsEditDialogOpen(false);
      setEditingProtocol(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update protocol:", error);
      setError("Failed to update protocol. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProtocol = async () => {
    if (!canWrite() || !deletingProtocol) return;

    setFormLoading(true);
    try {
      await api.deleteProtocol(deletingProtocol.id);
      await fetchData();
      setIsDeleteDialogOpen(false);
      setDeletingProtocol(null);
    } catch (error) {
      console.error("Failed to delete protocol:", error);
      setError("Failed to delete protocol. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setFormData({
      name: protocol.name,
      description_summary: protocol.description_summary,
      department_id: protocol.department_id.toString(),
      file: null,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (protocol: Protocol) => {
    setDeletingProtocol(protocol);
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
              <FileText className="h-8 w-8 text-primary" />
              <span>Emergency Protocols</span>
            </h1>
            <p className="text-muted-foreground">
              Manage medical protocols and emergency procedures
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
                  <span>Add Protocol</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Protocol</DialogTitle>
                  <DialogDescription>
                    Add a new emergency medical protocol to the database.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProtocol} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Protocol Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
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
                    <Label htmlFor="description">Description</Label>
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
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="file">Protocol Document (Optional)</Label>
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
                      {formLoading ? "Creating..." : "Create Protocol"}
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
                <Label htmlFor="search">Search Protocols</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or description..."
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

        {/* Protocols Table */}
        <Card>
          <CardHeader>
            <CardTitle>Protocols ({filteredProtocols.length})</CardTitle>
            <CardDescription>
              {canWrite()
                ? "View, edit, and manage emergency protocols"
                : "View emergency protocols"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Last Updated</TableHead>
                    {canWrite() && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProtocols.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canWrite() ? 6 : 5}
                        className="text-center py-8"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No protocols found
                          </p>
                          {searchTerm || selectedDepartment !== "all" ? (
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your search or filter criteria
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProtocols.map((protocol) => (
                      <TableRow key={protocol.id}>
                        <TableCell className="font-medium">
                          {protocol.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {departments.find(
                              (d) => d.id === protocol.department_id
                            )?.name || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">
                            {protocol.description_summary}
                          </p>
                        </TableCell>
                        <TableCell>
                          {protocol.file_url ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={protocol.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                {protocol.file_name}
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No document
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(protocol.updated_at).toLocaleDateString()}
                        </TableCell>
                        {canWrite() && (
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(protocol)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(protocol)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Protocol</DialogTitle>
              <DialogDescription>
                Update the protocol information and optionally replace the
                document.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProtocol} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Protocol Name</Label>
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
                <Label htmlFor="edit-description">Description</Label>
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
                <Label htmlFor="edit-file">Replace Document (Optional)</Label>
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
                {editingProtocol?.file_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {editingProtocol.file_name}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingProtocol(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Updating..." : "Update Protocol"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Protocol</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingProtocol?.name}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingProtocol(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProtocol}
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

export default ProtocolsPage;
