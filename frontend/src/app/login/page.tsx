"use client";

import React, { useState } from "react";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Alert from "@cloudscape-design/components/alert";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useAuth } from "@/lib/providers";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f1b2a",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <form onSubmit={handleSubmit}>
          <Container
            header={
              <Header variant="h1" description="Sign in to your Amazon Route 53 account">
                AWS Route 53 Sign In
              </Header>
            }
          >
            <SpaceBetween size="l">
              {errorMsg && (
                <Alert type="error" dismissible onDismiss={() => setErrorMsg(null)}>
                  {errorMsg}
                </Alert>
              )}

              <FormField label="Username" description="Default admin user is seeded as 'admin'">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.detail.value)}
                  placeholder="Enter username"
                />
              </FormField>

              <FormField label="Password" description="Default password is 'admin123'">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.detail.value)}
                  type="password"
                  placeholder="Enter password"
                />
              </FormField>

              <Button
                variant="primary"
                loading={loading}
                ariaLabel="Sign in button"
                fullWidth
              >
                Sign In
              </Button>
            </SpaceBetween>
          </Container>
        </form>
      </div>
    </div>
  );
}
