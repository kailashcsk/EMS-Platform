import React, { useState, useEffect, useRef } from "react";
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
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useAPI } from "../hooks/useAPI";
import { useAuth } from "../contexts/AuthContext";
import type { AIResponse } from "../types";
import {
  Bot,
  Send,
  Loader2,
  MessageSquare,
  Lightbulb,
  Database,
  FileText,
  Clock,
  CheckCircle,
  Copy,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  data?: any[];
  insight?: string;
  sql?: string;
  hasDocuments?: boolean;
  count?: number;
}

const AIQueryPage: React.FC = () => {
  const { user } = useAuth();
  const api = useAPI();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleQueries, setSampleQueries] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSampleQueries();
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      type: "ai",
      content: `Hello ${
        user?.displayName?.split(" ")[0] || "there"
      }! I'm your EMS AI assistant. I can help you find information about protocols, medications, dosages, and medical procedures. Try asking me something like "What is the epinephrine dose for adult cardiac arrest?" or "Show me all IV medications."`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSampleQueries = async () => {
    try {
      const response = await api.getSampleQueries();
      setSampleQueries(response.samples || []);
    } catch (error) {
      console.error("Failed to fetch sample queries:", error);
    }
  };

  // Determine if query likely involves documents
  const shouldUseDocuments = (query: string): boolean => {
    const documentKeywords = [
      "contraindication",
      "side effect",
      "interaction",
      "precaution",
      "protocol detail",
      "procedure",
      "instruction",
      "guideline",
      "document",
      "file",
      "pdf",
      "attachment",
    ];

    return documentKeywords.some((keyword) =>
      query.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const query = inputQuery.trim();
    setInputQuery("");
    setError(null);
    setLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Choose endpoint based on query content
      const useDocuments = shouldUseDocuments(query);
      const response: AIResponse = useDocuments
        ? await api.queryAIWithDocs(query)
        : await api.queryAI(query);

      console.log("AI Response:", response); // Debug log

      // Add AI response - use the insight as the main content
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content:
          response.insight ||
          response.query ||
          "I found some information for you.",
        timestamp: new Date(),
        data: response.data || [],
        insight: response.insight,
        sql: response.sql,
        hasDocuments: response.has_documents,
        count: response.count || 0,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI query failed:", error);
      setError("Failed to process your query. Please try again.");

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "ai",
        content:
          "I apologize, but I encountered an error processing your request. Please try rephrasing your question or try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleQuery = (sample: string) => {
    setInputQuery(sample);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderDataTable = (data: any[], count: number) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
      <div className="mt-4 rounded-md border">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Query Results</span>
          </div>
          <Badge variant="secondary">
            {count} result{count !== 1 ? "s" : ""}
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="capitalize">
                  {column.replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 5).map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column === "file_url" && row[column] ? (
                      <a
                        href={row[column]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>View Document</span>
                      </a>
                    ) : typeof row[column] === "object" ? (
                      JSON.stringify(row[column])
                    ) : (
                      String(row[column] || "-")
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data.length > 5 && (
          <div className="p-3 text-sm text-muted-foreground border-t bg-muted/30">
            Showing first 5 of {data.length} results
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span>AI Medical Assistant</span>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </h1>
          <p className="text-muted-foreground">
            Ask questions about protocols, medications, dosages, and emergency
            procedures in natural language
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Chat Interface - Main Column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Chat Messages */}
            <Card className="min-h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Conversation</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 p-0">
                <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-4 ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === "ai" && (
                            <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>

                            {/* Data Table */}
                            {message.data &&
                              message.data.length > 0 &&
                              renderDataTable(message.data, message.count || 0)}

                            {/* No Results Message */}
                            {message.data &&
                              message.data.length === 0 &&
                              message.count === 0 && (
                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                                  <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                                      No matching records found in the database,
                                      but I provided clinical guidance above.
                                    </span>
                                  </div>
                                </div>
                              )}

                            {/* SQL Query */}
                            {message.sql && (
                              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Database className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                      Generated SQL Query
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      copyToClipboard(message.sql!)
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <code className="text-xs text-muted-foreground block overflow-x-auto whitespace-pre">
                                  {message.sql}
                                </code>
                              </div>
                            )}

                            {/* Document Badge */}
                            {message.hasDocuments && (
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Includes document analysis
                                </Badge>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-5 w-5 text-blue-600" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">
                            Analyzing your query...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input Form */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmitQuery} className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      ref={inputRef}
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="Ask about protocols, medications, dosages..."
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !inputQuery.trim()}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Quick Examples</span>
                </CardTitle>
                <CardDescription>
                  Click to try these sample queries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sampleQueries.length > 0 ? (
                  sampleQueries.map((sample, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                      onClick={() => handleSampleQuery(sample)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{sample}</span>
                    </Button>
                  ))
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                      onClick={() =>
                        handleSampleQuery(
                          "What is the epinephrine dose for adult cardiac arrest?"
                        )
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">
                        What is the epinephrine dose for adult cardiac arrest?
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                      onClick={() =>
                        handleSampleQuery("Show me all IV medications")
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">
                        Show me all IV medications
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                      onClick={() =>
                        handleSampleQuery(
                          "List protocols for emergency medicine department"
                        )
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">
                        List protocols for emergency medicine department
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                      onClick={() =>
                        handleSampleQuery(
                          "What are the contraindications for atropine?"
                        )
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">
                        What are the contraindications for atropine?
                      </span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    Ask about specific medications, doses, or routes of
                    administration
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    Request protocol information for specific conditions or
                    departments
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    Compare different treatment options or medication routes
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    Get statistics and analysis of medication usage patterns
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Queries sent:</span>
                    <span className="font-medium">
                      {messages.filter((m) => m.type === "user").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Responses received:</span>
                    <span className="font-medium">
                      {
                        messages.filter(
                          (m) => m.type === "ai" && m.id !== "welcome"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data results:</span>
                    <span className="font-medium">
                      {messages
                        .filter((m) => m.data && m.data.length > 0)
                        .reduce((acc, m) => acc + (m.count || 0), 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIQueryPage;