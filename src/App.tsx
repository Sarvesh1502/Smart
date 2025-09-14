import React, { useState } from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { FacultyDashboard } from "./components/FacultyDashboard";
import { StudentDashboard } from "./components/StudentDashboard";

export type UserRole = "admin" | "faculty" | "student" | null;
export type Page = "landing" | "auth" | "dashboard";

export default function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("landing");
  const [userRole, setUserRole] = useState<UserRole>(null);

  const handleAuth = (role: UserRole) => {
    setUserRole(role);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentPage("landing");
  };

  const getUserName = () => {
    switch (userRole) {
      case "admin":
        return "Administrator";
      case "faculty":
        return "Dr. Sarah Johnson";
      case "student":
        return "Ram Kumar";
      default:
        return undefined;
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={setCurrentPage} />;
      case "auth":
        return (
          <AuthPage
            onAuth={handleAuth}
            onBack={() => setCurrentPage("landing")}
          />
        );
      case "dashboard":
        if (userRole === "admin") {
          return <AdminDashboard onLogout={handleLogout} />;
        } else if (userRole === "faculty") {
          return <FacultyDashboard onLogout={handleLogout} />;
        } else if (userRole === "student") {
          return <StudentDashboard onLogout={handleLogout} />;
        }
        return <LandingPage onNavigate={setCurrentPage} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <Header
          userRole={currentPage === "dashboard" ? userRole : null}
          userName={
            currentPage === "dashboard"
              ? getUserName()
              : undefined
          }
          onLogout={
            currentPage === "dashboard" ? handleLogout : undefined
          }
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
        <div>{renderCurrentPage()}</div>
      </div>
    </LanguageProvider>
  );
}