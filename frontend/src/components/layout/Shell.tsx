"use client";

import React, { useState } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import BreadcrumbGroup, { BreadcrumbGroupProps } from "@cloudscape-design/components/breadcrumb-group";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import { useAuth } from "@/lib/providers";
import { usePathname, useRouter } from "next/navigation";

interface ShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbGroupProps.Item[];
  notifications?: FlashbarProps.MessageDefinition[];
}

export default function Shell({ children, breadcrumbs = [], notifications = [] }: ShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [navigationOpen, setNavigationOpen] = useState(true);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const sideNavItems = [
    { type: "link", text: "Dashboard", href: "/dashboard" },
    { type: "link", text: "Hosted zones", href: "/hosted-zones" },
    { type: "divider" },
    { type: "link", text: "Traffic policies", href: "/traffic-policies" },
    { type: "link", text: "Health checks", href: "/health-checks" },
    { type: "link", text: "Resolver", href: "/resolver" },
    { type: "link", text: "Profiles", href: "/profiles" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f2f3f3" }}>
      <TopNavigation
        identity={{
          href: "/hosted-zones",
          title: "Amazon Route 53",
          logo: { src: "https://d1.awsstatic.com/logos/aws-logo-lockups/poweredbyaws/pbAWS_logo_RGB_REV.png", alt: "AWS Logo" }
        }}
        utilities={[
          {
            type: "menu-dropdown",
            text: user?.username || "Account",
            iconName: "user-profile",
            items: [
              { id: "signout", text: "Sign out" }
            ],
            onItemClick: (e) => {
              if (e.detail.id === "signout") {
                logout();
              }
            }
          }
        ]}
        i18nStrings={{
          searchIconAriaLabel: "Search",
          searchDismissIconAriaLabel: "Dismiss search",
          overflowMenuTriggerText: "More",
          overflowMenuTitleText: "All",
        }}
      />
      <AppLayout
        navigationOpen={navigationOpen}
        onNavigationChange={(e) => setNavigationOpen(e.detail.open)}
        navigation={
          <SideNavigation
            activeHref={pathname}
            header={{ href: "/hosted-zones", text: "Route 53" }}
            items={sideNavItems as any}
            onFollow={(e) => {
              e.preventDefault();
              router.push(e.detail.href);
            }}
          />
        }
        breadcrumbs={
          breadcrumbs.length > 0 ? (
            <BreadcrumbGroup
              items={breadcrumbs}
              onFollow={(e) => {
                e.preventDefault();
                router.push(e.detail.href);
              }}
            />
          ) : undefined
        }
        notifications={notifications.length > 0 ? <Flashbar items={notifications} /> : undefined}
        content={children}
        toolsHide={true}
      />
    </div>
  );
}
