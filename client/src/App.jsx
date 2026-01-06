import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

function AppContent() {
  const { user } = useAuth();
  const [signupData, setSignupData] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('signupData');
    if (data) {
      setSignupData(JSON.parse(data));
      sessionStorage.removeItem('signupData');
    }
  }, []);

  // Show signup page if signup data is present
  if (signupData && !user) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #00263A, #658494ff)",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <SignupPage
          email={signupData.email}
          school={signupData.school}
          state={signupData.state}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #00263A, #658494ff)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {user ? <DashboardPage /> : <LoginPage />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;