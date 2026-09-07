"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Box from "@cloudscape-design/components/box";
import Shell from "@/components/layout/Shell";

export default function ResolverPage() {
  return (
    <Shell
      breadcrumbs={[
        { text: "Route 53", href: "/hosted-zones" },
        { text: "Resolver", href: "/resolver" },
      ]}
    >
      <Container
        header={
          <Header variant="h1" description="Hybrid DNS resolver endpoints and outbound rules">
            Resolver
          </Header>
        }
      >
        <Box textAlign="center" padding="l">
          <StatusIndicator type="info">Coming Soon</StatusIndicator>
          <Box variant="p" color="text-body-secondary" margin={{ top: "xs" }}>
            The Resolver configuration feature is coming soon.
          </Box>
        </Box>
      </Container>
    </Shell>
  );
}
