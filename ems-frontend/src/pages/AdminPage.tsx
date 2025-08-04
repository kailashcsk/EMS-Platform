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
} from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useAPI } from "../hooks/useAPI";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield,
  Users,
  Crown,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react";

interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  disabled: boolean;
  customClaims: {
    role?: "admin" | "patient";
    permissions?: {
      read: boolean;
      write: boolean;
      ai_query: boolean;
      user_management: boolean;
    };
  };
}

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const api = useAPI();

  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.uid);
    try {
      await api.promoteUser(selectedUser.uid, "admin");
      await fetchUsers();
      setIsPromoteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to promote user:", error);
      setError("Failed to promote user. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.uid);
    try {
      await api.revokeAdminPrivileges(selectedUser.uid);
      await fetchUsers();
      setIsRevokeDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to revoke admin privileges:", error);
      setError("Failed to revoke admin privileges. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const openPromoteDialog = (user: FirebaseUser) => {
    setSelectedUser(user);
    setIsPromoteDialogOpen(true);
  };

  const openRevokeDialog = (user: FirebaseUser) => {
    setSelectedUser(user);
    setIsRevokeDialogOpen(true);
  };

  const getUserRole = (user: FirebaseUser): "admin" | "patient" => {
    return user.customClaims?.role || "patient";
  };

  const isUserAdmin = (user: FirebaseUser): boolean => {
    return getUserRole(user) === "admin";
  };

  if (!isAdmin()) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-center">
                You need administrator privileges to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const adminUsers = users.filter((user) => isUserAdmin(user));
  const patientUsers = users.filter((user) => !isUserAdmin(user));

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Shield className="h-8 w-8 text-red-600" />
            <span>User Management</span>
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions for the EMS data portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administrators
              </CardTitle>
              <Crown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientUsers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No users found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.displayName || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              isUserAdmin(user) ? "default" : "secondary"
                            }
                          >
                            {isUserAdmin(user) ? (
                              <>
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Patient
                              </>
                            )}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.customClaims?.permissions?.read && (
                              <Badge variant="outline" className="text-xs">
                                Read
                              </Badge>
                            )}
                            {user.customClaims?.permissions?.write && (
                              <Badge variant="outline" className="text-xs">
                                Write
                              </Badge>
                            )}
                            {user.customClaims?.permissions?.ai_query && (
                              <Badge variant="outline" className="text-xs">
                                AI Query
                              </Badge>
                            )}
                            {user.customClaims?.permissions
                              ?.user_management && (
                              <Badge variant="outline" className="text-xs">
                                User Mgmt
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              user.disabled ? "destructive" : "secondary"
                            }
                          >
                            {user.disabled ? "Disabled" : "Active"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {!isUserAdmin(user) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPromoteDialog(user)}
                                disabled={actionLoading === user.uid}
                              >
                                <Crown className="h-4 w-4 mr-1" />
                                Promote
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRevokeDialog(user)}
                                disabled={actionLoading === user.uid}
                                className="text-destructive hover:text-destructive"
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Demote
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Promote Dialog */}
        <Dialog
          open={isPromoteDialogOpen}
          onOpenChange={setIsPromoteDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote to Administrator</DialogTitle>
              <DialogDescription>
                Are you sure you want to promote "
                {selectedUser?.displayName || selectedUser?.email}" to
                administrator? This will grant them full access to create, edit,
                and delete all data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPromoteDialogOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePromoteUser}
                disabled={actionLoading !== null}
              >
                {actionLoading ? "Promoting..." : "Promote to Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Dialog */}
        <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Administrator Privileges</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke administrator privileges from "
                {selectedUser?.displayName || selectedUser?.email}"? They will
                only have read access and AI query capabilities.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRevokeDialogOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevokeAdmin}
                disabled={actionLoading !== null}
              >
                {actionLoading ? "Revoking..." : "Revoke Privileges"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminPage;
