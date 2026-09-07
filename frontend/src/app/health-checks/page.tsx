"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Box from "@cloudscape-design/components/box";
import Shell from "@/components/layout/Shell";

export default function HealthChecksPage() {
  return (
    <Shell
      breadcrumbs={[
        { text: "Route 53", href: "/hosted-zones" },
        { text: "Health checks", href: "/health-checks" },
      ]}
    >
      <Container
        header={
          <Header variant="h1" description="Monitor resource availability and web endpoint health">
            Health checks
          </Header>
        }
      >
        <Box textAlign="center" padding="l">
          <StatusIndicator type="info">Coming Soon</StatusIndicator>
          <Box variant="p" color="text-body-secondary" margin={{ top: "xs" }}>
            The Health Checks feature is coming soon.
          </Box>
        </Box>
      </Container>
    </Shell>
  );
}
