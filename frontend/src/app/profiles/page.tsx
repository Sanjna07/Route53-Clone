"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Box from "@cloudscape-design/components/box";
import Shell from "@/components/layout/Shell";

export default function ProfilesPage() {
  return (
    <Shell
      breadcrumbs={[
        { text: "Route 53", href: "/hosted-zones" },
        { text: "Profiles", href: "/profiles" },
      ]}
    >
      <Container
        header={
          <Header variant="h1" description="Share DNS configurations across multiple VPCs">
            Profiles
          </Header>
        }
      >
        <Box textAlign="center" padding="l">
          <StatusIndicator type="info">Coming Soon</StatusIndicator>
          <Box variant="p" color="text-body-secondary" margin={{ top: "xs" }}>
            The Profiles feature is coming soon.
          </Box>
        </Box>
      </Container>
    </Shell>
  );
}
