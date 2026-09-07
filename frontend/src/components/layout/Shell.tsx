"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import BreadcrumbGroup, { BreadcrumbGroupProps } from "@cloudscape-design/components/breadcrumb-group";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { useAuth } from "@/lib/providers";
import { usePathname, useRouter } from "next/navigation";

interface ShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbGroupProps.Item[];
  notifications?: FlashbarProps.MessageDefinition[];
}

const SunIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ThemeToggle = ({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: "54px",
        height: "28px",
        borderRadius: "14px",
        backgroundColor: isDark ? "#161e2e" : "#cbd5e1",
        border: isDark ? "1.5px solid #374151" : "1.5px solid #94a3b8",
        cursor: "pointer",
        userSelect: "none",
        boxSizing: "border-box",
        overflow: "hidden",
        verticalAlign: "middle",
        marginRight: "16px",
      }}
    >
      {/* Sun Icon (Left) */}
      <span
        style={{
          position: "absolute",
          left: "6px",
          top: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "16px",
          height: "16px",
          color: isDark ? "#4b5563" : "#d97706",
          zIndex: 1,
          transition: "color 0.25s ease",
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>

      {/* Moon Icon (Right) */}
      <span
        style={{
          position: "absolute",
          right: "6px",
          top: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "16px",
          height: "16px",
          color: isDark ? "#60a5fa" : "#64748b",
          zIndex: 1,
          transition: "color 0.25s ease",
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>

      {/* Sliding Knob */}
      <span
        style={{
          position: "absolute",
          top: "1.5px",
          left: isDark ? "27px" : "3px",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          backgroundColor: isDark ? "#ec7211" : "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
          transition: "left 0.22s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.22s ease",
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default function Shell({ children, breadcrumbs = [], notifications = [] }: ShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode");
    const prefersDark = savedTheme === "dark";
    setIsDarkMode(prefersDark);
    applyMode(prefersDark ? Mode.Dark : Mode.Light);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme_mode", newMode ? "dark" : "light");
    applyMode(newMode ? Mode.Dark : Mode.Light);
  };

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
    <div style={{ minHeight: "100vh" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header [class*="utilities"],
            header ul[class*="utility"] {
              gap: 24px !important;
            }
            header [class*="utility"]:first-child,
            header li:first-child[class*="utility"] {
              margin-right: 28px !important;
              padding-right: 12px !important;
            }
            header [class*="utility"]::before,
            header [class*="utility"]::after {
              display: none !important;
            }
          `,
        }}
      />
      <TopNavigation
        identity={{
          href: "/hosted-zones",
          title: "Amazon Route 53",
          logo: { src: "https://res.cloudinary.com/dx0r0pbgb/image/upload/v1788809671/aws_logo-removebg-preview_s6ddxb.png", alt: "AWS Logo" }
        }}
        utilities={[
          {
            type: "button",
            ariaLabel: isDarkMode ? "Switch to light mode" : "Switch to dark mode",
            iconSvg: (
              <div style={{ marginRight: "16px", paddingRight: "6px", display: "inline-flex", alignItems: "center" }}>
                <ThemeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />
              </div>
            ),
            onClick: toggleDarkMode,
          },
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
