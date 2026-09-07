"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Shell from "@/components/layout/Shell";
import { apiFetch, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

interface HostedZone {
  id: number;
  name: string;
  comment: string | null;
  is_private: bool;
  record_count: number;
  created_at: string;
  updated_at: string;
}

interface HostedZoneListResponse {
  items: HostedZone[];
  total: number;
  page: number;
  limit: number;
}

export default function HostedZonesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  const [notifications, setNotifications] = useState<FlashbarProps.MessageDefinition[]>([]);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form Fields
  const [domainName, setDomainName] = useState("");
  const [comment, setComment] = useState("");
  const [zoneTypeOption, setZoneTypeOption] = useState<{ label: string; value: string }>({
    label: "Public hosted zone",
    value: "public",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Form Fields
  const [editComment, setEditComment] = useState("");

  const limit = 10;

  // Query Hosted Zones
  const { data, isLoading, isError, refetch } = useQuery<HostedZoneListResponse>({
    queryKey: ["hosted-zones", search, currentPage],
    queryFn: () => apiFetch<HostedZoneListResponse>(`/hosted-zones?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${limit}`),
  });

  const addNotification = (type: "success" | "error" | "info", content: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [
      {
        type,
        content,
        dismissible: true,
        id,
        onDismiss: () => setNotifications((n) => n.filter((item) => item.id !== id)),
      },
    ]);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch<HostedZone>("/hosted-zones", {
        method: "POST",
        body: JSON.stringify({
          name: domainName,
          comment: comment || null,
          is_private: zoneTypeOption.value === "private",
        }),
      });
    },
    onSuccess: (newZone) => {
      queryClient.invalidateQueries({ queryKey: ["hosted-zones"] });
      setCreateModalOpen(false);
      setDomainName("");
      setComment("");
      setFormError(null);
      addNotification("success", `Successfully created hosted zone '${newZone.name}'`);
    },
    onError: (err: ApiError) => {
      setFormError(err.message);
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItems[0]) return;
      return await apiFetch<HostedZone>(`/hosted-zones/${selectedItems[0].id}`, {
        method: "PUT",
        body: JSON.stringify({
          comment: editComment,
        }),
      });
    },
    onSuccess: (updatedZone) => {
      queryClient.invalidateQueries({ queryKey: ["hosted-zones"] });
      setEditModalOpen(false);
      setSelectedItems([]);
      addNotification("success", `Successfully updated hosted zone '${updatedZone?.name}'`);
    },
    onError: (err: ApiError) => {
      addNotification("error", `Failed to update hosted zone: ${err.message}`);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItems[0]) return;
      return await apiFetch<{ message: string }>(`/hosted-zones/${selectedItems[0].id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosted-zones"] });
      const deletedName = selectedItems[0]?.name;
      setDeleteModalOpen(false);
      setSelectedItems([]);
      addNotification("success", `Successfully deleted hosted zone '${deletedName}'`);
    },
    onError: (err: ApiError) => {
      setDeleteModalOpen(false);
      addNotification("error", `Failed to delete hosted zone: ${err.message}`);
    },
  });

  const selectedZone = selectedItems[0] || null;

  return (
    <Shell
      breadcrumbs={[
        { text: "Route 53", href: "/hosted-zones" },
        { text: "Hosted zones", href: "/hosted-zones" },
      ]}
      notifications={notifications}
    >
      <SpaceBetween size="l">
        <Table
          columnDefinitions={[
            {
              id: "name",
              header: "Domain name",
              cell: (item) => (
                <Link
                  variant="primary"
                  fontSize="body-m"
                  ariaLabel={`Hosted zone ${item.name}`}
                  onFollow={(e) => {
                    e.preventDefault();
                    router.push(`/hosted-zones/${item.id}`);
                  }}
                >
                  {item.name}
                </Link>
              ),
              sortingField: "name",
            },
            {
              id: "type",
              header: "Type",
              cell: (item) => (item.is_private ? "Private" : "Public"),
            },
            {
              id: "records",
              header: "Record count",
              cell: (item) => item.record_count || 0,
            },
            {
              id: "comment",
              header: "Description",
              cell: (item) => item.comment || "-",
            },
            {
              id: "created_at",
              header: "Created at",
              cell: (item) => new Date(item.created_at).toLocaleString(),
            },
          ]}
          items={data?.items || []}
          loading={isLoading}
          loadingText="Loading hosted zones..."
          selectionType="single"
          selectedItems={selectedItems}
          onSelectionChange={(e) => setSelectedItems(e.detail.selectedItems)}
          trackBy="id"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No hosted zones</b>
              <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                No hosted zones found matching your search.
              </Box>
              <Button onClick={() => setCreateModalOpen(true)}>Create hosted zone</Button>
            </Box>
          }
          header={
            <Header
              variant="h1"
              description="A hosted zone contains information about how you want to route traffic on the internet for a domain."
              counter={`(${data?.total || 0})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => refetch()} iconName="refresh" ariaLabel="Refresh table" />
                  <Button
                    disabled={!selectedZone}
                    onClick={() => {
                      if (selectedZone) {
                        setEditComment(selectedZone.comment || "");
                        setEditModalOpen(true);
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    disabled={!selectedZone}
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    Delete
                  </Button>
                  <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                    Create hosted zone
                  </Button>
                </SpaceBetween>
              }
            >
              Hosted zones
            </Header>
          }
          filter={
            <TextFilter
              filteringText={search}
              filteringPlaceholder="Find hosted zone"
              onChange={(e) => {
                setSearch(e.detail.filteringText);
                setCurrentPage(1);
              }}
            />
          }
          pagination={
            <Pagination
              currentPage={currentPage}
              pagesCount={Math.ceil((data?.total || 0) / limit) || 1}
              onChange={(e) => setCurrentPage(e.detail.currentPage)}
            />
          }
        />
      </SpaceBetween>

      {/* Create Hosted Zone Modal */}
      <Modal
        visible={createModalOpen}
        onDismiss={() => {
          setCreateModalOpen(false);
          setFormError(null);
        }}
        header="Create hosted zone"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                Create hosted zone
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="l">
          {formError && <Alert type="error">{formError}</Alert>}

          <FormField
            label="Domain name"
            description="Enter the name of the domain, such as example.com"
          >
            <Input
              value={domainName}
              onChange={(e) => setDomainName(e.detail.value)}
              placeholder="example.com"
            />
          </FormField>

          <FormField label="Description - optional" description="Enter an optional comment">
            <Input
              value={comment}
              onChange={(e) => setComment(e.detail.value)}
              placeholder="Primary domain for my app"
            />
          </FormField>

          <FormField label="Type" description="Choose Public or Private hosted zone">
            <Select
              selectedOption={zoneTypeOption}
              onChange={(e) => setZoneTypeOption(e.detail.selectedOption as any)}
              options={[
                { label: "Public hosted zone", value: "public" },
                { label: "Private hosted zone", value: "private" },
              ]}
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Edit Hosted Zone Modal */}
      <Modal
        visible={editModalOpen}
        onDismiss={() => setEditModalOpen(false)}
        header={`Edit hosted zone - ${selectedZone?.name || ""}`}
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={editMutation.isPending}
                onClick={() => editMutation.mutate()}
              >
                Save changes
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Description / Comment">
          <Input
            value={editComment}
            onChange={(e) => setEditComment(e.detail.value)}
            placeholder="Updated description"
          />
        </FormField>
      </Modal>

      {/* Delete Hosted Zone Confirmation Modal */}
      <Modal
        visible={deleteModalOpen}
        onDismiss={() => setDeleteModalOpen(false)}
        header={`Delete hosted zone ${selectedZone?.name || ""}`}
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="warning">
            Deleting this hosted zone will permanently delete all associated DNS records and values inside it. This action cannot be undone.
          </Alert>
          <Box variant="p">
            Are you sure you want to delete <b>{selectedZone?.name}</b>?
          </Box>
        </SpaceBetween>
      </Modal>
    </Shell>
  );
}
