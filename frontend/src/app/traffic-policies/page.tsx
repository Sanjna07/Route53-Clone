"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Box from "@cloudscape-design/components/box";
import Shell from "@/components/layout/Shell";

export default function TrafficPoliciesPage() {
  return (
    <Shell
      breadcrumbs={[
        { text: "Route 53", href: "/hosted-zones" },
        { text: "Traffic policies", href: "/traffic-policies" },
      ]}
    >
      <Container
        header={
          <Header variant="h1" description="Manage multi-region traffic routing policies">
            Traffic policies
          </Header>
        }
      >
        <Box textAlign="center" padding="l">
          <StatusIndicator type="info">Coming Soon</StatusIndicator>
          <Box variant="p" color="text-body-secondary" margin={{ top: "xs" }}>
            The Traffic Policies feature is coming soon.
          </Box>
        </Box>
      </Container>
    </Shell>
  );
}
