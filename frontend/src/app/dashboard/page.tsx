"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Box from "@cloudscape-design/components/box";
import Shell from "@/components/layout/Shell";

export default function DashboardPage() {
  return (
    <Shell
      breadcrumbs={[
        { text: "Route 53", href: "/hosted-zones" },
        { text: "Dashboard", href: "/dashboard" },
      ]}
    >
      <Container
        header={
          <Header variant="h1" description="Route 53 global metrics and overview">
            Dashboard
          </Header>
        }
      >
        <Box textAlign="center" padding="l">
          <StatusIndicator type="info">Coming Soon</StatusIndicator>
          <Box variant="p" color="text-body-secondary" margin={{ top: "xs" }}>
            The Route 53 Dashboard section is under active development.
          </Box>
        </Box>
      </Container>
    </Shell>
  );
}
