import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAPI } from "../hooks/useAPI";
import { useAuth } from "../contexts/AuthContext";
import type { Department, Protocol, Medication } from "../types";
import {
  Activity,
  FileText,
  Pill,
  Users,
  TrendingUp,
  Clock,
  Shield,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [departments, protocols, medications, doses] = await Promise.all([
          api.getDepartments(),
          api.getProtocols(),
          api.getMedications(),
          api.getMedicationDoses(),
        ]);

        setStats({
          departments: departments.length,
          protocols: protocols.length,
          medications: medications.length,
          totalDoses: doses.length,
        });

        setRecentData({
          protocols: protocols.slice(-5).reverse(),
          medications: medications.slice(-5).reverse(),
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        {/* Welcome Header */}
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

        {/* Stats Grid */}
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

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Protocols */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Protocols</span>
              </CardTitle>
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

          {/* Recent Medications */}
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
        </div>

      </div>
    </Layout>
  );
};

export default DashboardPage;
