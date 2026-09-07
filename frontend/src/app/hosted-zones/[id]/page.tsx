"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import Select from "@cloudscape-design/components/select";
import Pagination from "@cloudscape-design/components/pagination";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Container from "@cloudscape-design/components/container";
import Badge from "@cloudscape-design/components/badge";
import Tabs from "@cloudscape-design/components/tabs";
import { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Shell from "@/components/layout/Shell";
import { apiFetch, ApiError } from "@/lib/api";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import ExportZoneModal from "@/components/records/ExportZoneModal";
import ImportZoneModal from "@/components/records/ImportZoneModal";

interface HostedZone {
  id: number;
  name: string;
  comment: string | null;
  is_private: boolean;
  record_count: number;
  created_at: string;
  updated_at: string;
}

interface DNSRecord {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: string;
  ttl: number;
  values: string[];
  routing_policy: string;
  created_at: string;
  updated_at: string;
}

interface DNSRecordListResponse {
  items: DNSRecord[];
  total: number;
  page: number;
  limit: number;
}

const RECORD_TYPES = [
  { label: "A - IPv4 address", value: "A", placeholder: "192.0.2.1", desc: "Each value must be a valid IPv4 address." },
  { label: "AAAA - IPv6 address", value: "AAAA", placeholder: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", desc: "Each value must be a valid IPv6 address." },
  { label: "CNAME - Canonical name", value: "CNAME", placeholder: "example.net", desc: "Exactly one domain name. CNAME cannot coexist with other records of the same name." },
  { label: "MX - Mail exchange", value: "MX", placeholder: "10 mail.example.com", desc: "<int priority> <hostname>, e.g., '10 mailserver.com'" },
  { label: "TXT - Text", value: "TXT", placeholder: "v=spf1 include:_spf.google.com ~all", desc: "Free-form text string up to 255 characters per line." },
  { label: "NS - Name server", value: "NS", placeholder: "ns1.awsdns-01.com", desc: "Host name of a name server." },
  { label: "PTR - Pointer", value: "PTR", placeholder: "www.example.com", desc: "Domain name pointer." },
  { label: "SRV - Service locator", value: "SRV", placeholder: "10 60 5060 bigbox.example.com", desc: "<priority> <weight> <port> <target>" },
  { label: "CAA - Certification Authority Authorization", value: "CAA", placeholder: "0 issue \"letsencrypt.org\"", desc: "<flags> <tag> <value>" },
];

export default function ZoneDetailsPage() {
  const params = useParams();
  const zoneId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedTypeOption, setSelectedTypeOption] = useState<{ label: string; value: string }>({
    label: "All types",
    value: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<DNSRecord[]>([]);
  const [notifications, setNotifications] = useState<FlashbarProps.MessageDefinition[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Form Fields
  const [recordName, setRecordName] = useState("");
  const [recordTypeOption, setRecordTypeOption] = useState<{ label: string; value: string }>(RECORD_TYPES[0]);
  const [recordValuesText, setRecordValuesText] = useState("");
  const [ttl, setTtl] = useState("300");
  const [routingPolicy, setRoutingPolicy] = useState("simple");
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Fields
  const [editValuesText, setEditValuesText] = useState("");
  const [editTtl, setEditTtl] = useState("300");

  const limit = 10;

  // Fetch Zone Metadata
  const { data: zone } = useQuery<HostedZone>({
    queryKey: ["hosted-zone", zoneId],
    queryFn: () => apiFetch<HostedZone>(`/hosted-zones/${zoneId}`),
  });

  // Fetch Records
  const { data: recordsData, isLoading, refetch } = useQuery<DNSRecordListResponse>({
    queryKey: ["dns-records", zoneId, search, selectedTypeOption.value, currentPage],
    queryFn: () =>
      apiFetch<DNSRecordListResponse>(
        `/hosted-zones/${zoneId}/records?search=${encodeURIComponent(search)}&type=${selectedTypeOption.value}&page=${currentPage}&limit=${limit}`
      ),
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

  const [createRecordSubmitting, setCreateRecordSubmitting] = useState(false);

  const handleCreateRecordSubmit = async () => {
    if (createRecordSubmitting) return;
    setCreateRecordSubmitting(true);
    setFormError(null);

    try {
      const valuesArray = recordValuesText
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);

      const newRec = await apiFetch<DNSRecord>(`/hosted-zones/${zoneId}/records`, {
        method: "POST",
        body: JSON.stringify({
          name: recordName,
          type: recordTypeOption.value,
          ttl: parseInt(ttl, 10) || 300,
          values: valuesArray,
          routing_policy: routingPolicy,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["dns-records", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["hosted-zone", zoneId] });
      setCreateModalOpen(false);
      setRecordName("");
      setRecordValuesText("");
      setFormError(null);
      addNotification("success", `Successfully created ${newRec.type} record for '${newRec.name}'`);
    } catch (err: any) {
      setFormError(err.message || "Failed to create DNS record");
    } finally {
      setCreateRecordSubmitting(false);
    }
  };

  // Edit Record Mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItems[0]) return;
      const valuesArray = editValuesText
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);

      return await apiFetch<DNSRecord>(`/hosted-zones/${zoneId}/records/${selectedItems[0].id}`, {
        method: "PUT",
        body: JSON.stringify({
          ttl: parseInt(editTtl, 10) || 300,
          values: valuesArray,
        }),
      });
    },
    onSuccess: (updatedRec) => {
      queryClient.invalidateQueries({ queryKey: ["dns-records", zoneId] });
      setEditModalOpen(false);
      setSelectedItems([]);
      addNotification("success", `Successfully updated record '${updatedRec?.name}'`);
    },
    onError: (err: ApiError) => {
      addNotification("error", `Failed to update record: ${err.message}`);
    },
  });

  // Delete Record Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItems[0]) return;
      return await apiFetch<{ message: string }>(`/hosted-zones/${zoneId}/records/${selectedItems[0].id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dns-records", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["hosted-zone", zoneId] });
      const recName = selectedItems[0]?.name;
      setDeleteModalOpen(false);
      setSelectedItems([]);
      addNotification("success", `Successfully deleted record '${recName}'`);
    },
    onError: (err: ApiError) => {
      setDeleteModalOpen(false);
      addNotification("error", `Failed to delete record: ${err.message}`);
    },
  });

  const selectedRecord = selectedItems[0] || null;
  const currentTypeInfo = RECORD_TYPES.find((t) => t.value === recordTypeOption.value) || RECORD_TYPES[0];

  return (
    <Shell
      breadcrumbs={[
        { text: "Route 53", href: "/hosted-zones" },
        { text: "Hosted zones", href: "/hosted-zones" },
        { text: zone?.name || `Zone #${zoneId}`, href: `/hosted-zones/${zoneId}` },
      ]}
      notifications={notifications}
    >
      <KeyboardShortcuts
        onCreate={() => setCreateModalOpen(true)}
        onRefresh={() => refetch()}
        onEscape={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          setDeleteModalOpen(false);
          setExportModalOpen(false);
          setImportModalOpen(false);
        }}
      />

      <SpaceBetween size="l">
        {/* Hosted Zone Header Details */}
        <Container
          header={
            <Header variant="h2" description="Hosted zone overview">
              {zone?.name || "Hosted Zone"}
            </Header>
          }
        >
          <KeyValuePairs
            columns={4}
            items={[
              { label: "Hosted zone name", value: zone?.name || "-" },
              { label: "Type", value: zone?.is_private ? "Private" : "Public" },
              { label: "Total records", value: zone?.record_count || 0 },
              { label: "Description", value: zone?.comment || "-" },
            ]}
          />
        </Container>

        {/* AWS Route 53 Tabs */}
        <Tabs
          tabs={[
            {
              id: "records",
              label: "Records",
              content: (
                <Table
                  columnDefinitions={[
                    {
                      id: "name",
                      header: "Record name",
                      cell: (item) => <Box fontWeight="bold">{item.name}</Box>,
                      sortingField: "name",
                    },
                    {
                      id: "type",
                      header: "Type",
                      cell: (item) => <Badge color="blue">{item.type}</Badge>,
                    },
                    {
                      id: "value",
                      header: "Value / Route traffic to",
                      cell: (item) => (
                        <Box>
                          {item.values.map((v, i) => (
                            <div key={i}>{v}</div>
                          ))}
                        </Box>
                      ),
                    },
                    {
                      id: "ttl",
                      header: "TTL (seconds)",
                      cell: (item) => item.ttl,
                    },
                    {
                      id: "routing_policy",
                      header: "Routing policy",
                      cell: (item) => item.routing_policy || "Simple",
                    },
                  ]}
                  items={recordsData?.items || []}
                  loading={isLoading}
                  loadingText="Loading DNS records..."
                  selectionType="single"
                  selectedItems={selectedItems}
                  onSelectionChange={(e) => setSelectedItems(e.detail.selectedItems)}
                  trackBy="id"
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No records</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        No DNS records match the selected filter.
                      </Box>
                      <Button onClick={() => setCreateModalOpen(true)}>Create record</Button>
                    </Box>
                  }
                  header={
                    <Header
                      variant="h2"
                      counter={`(${recordsData?.total || 0})`}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => refetch()} iconName="refresh" ariaLabel="Refresh records" />
                          <Button onClick={() => setImportModalOpen(true)}>Import BIND file</Button>
                          <Button onClick={() => setExportModalOpen(true)}>Export zone</Button>
                          <Button
                            disabled={!selectedRecord}
                            onClick={() => {
                              if (selectedRecord) {
                                setEditValuesText(selectedRecord.values.join("\n"));
                                setEditTtl(selectedRecord.ttl.toString());
                                setEditModalOpen(true);
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button disabled={!selectedRecord} onClick={() => setDeleteModalOpen(true)}>
                            Delete
                          </Button>
                          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                            Create record
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Records
                    </Header>
                  }
                  filter={
                    <SpaceBetween direction="horizontal" size="xs">
                      <div style={{ flexGrow: 1, minWidth: "240px" }}>
                        <TextFilter
                          filteringText={search}
                          filteringPlaceholder="Find record by name"
                          onChange={(e) => {
                            setSearch(e.detail.filteringText);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                      <div style={{ width: "200px" }}>
                        <Select
                          selectedOption={selectedTypeOption}
                          onChange={(e) => {
                            setSelectedTypeOption(e.detail.selectedOption as any);
                            setCurrentPage(1);
                          }}
                          options={[
                            { label: "All types", value: "" },
                            ...RECORD_TYPES.map((r) => ({ label: r.value, value: r.value })),
                          ]}
                        />
                      </div>
                    </SpaceBetween>
                  }
                  pagination={
                    <Pagination
                      currentPageIndex={currentPage}
                      pagesCount={Math.ceil((recordsData?.total || 0) / limit) || 1}
                      onChange={(e) => setCurrentPage(e.detail.currentPageIndex)}
                    />
                  }
                />
              ),
            },
            {
              id: "details",
              label: "Hosted zone details",
              content: (
                <Container header={<Header variant="h2">Hosted Zone Configuration</Header>}>
                  <KeyValuePairs
                    columns={2}
                    items={[
                      { label: "Zone ID", value: zone?.id?.toString() || "-" },
                      { label: "Domain Name", value: zone?.name || "-" },
                      { label: "Zone Type", value: zone?.is_private ? "Private Hosted Zone" : "Public Hosted Zone" },
                      { label: "Record Count", value: zone?.record_count?.toString() || "0" },
                      { label: "Created At", value: zone?.created_at ? new Date(zone.created_at).toUTCString() : "-" },
                      { label: "Updated At", value: zone?.updated_at ? new Date(zone.updated_at).toUTCString() : "-" },
                    ]}
                  />
                </Container>
              ),
            },
          ]}
        />
      </SpaceBetween>

      {/* Create Record Modal */}
      <Modal
        visible={createModalOpen}
        onDismiss={() => {
          setCreateModalOpen(false);
          setFormError(null);
        }}
        header="Create record"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createRecordSubmitting}
                disabled={createRecordSubmitting}
                onClick={handleCreateRecordSubmit}
              >
                Create records
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="l">
          {formError ? <Alert key="rec-form-error" type="error">{formError}</Alert> : null}

          <FormField
            key="rec-name-field"
            label="Record name"
            description={`Subdomain name. Leave empty or type '@' for apex domain (${zone?.name || ""})`}
          >
            <Input
              value={recordName}
              onChange={(e) => setRecordName(e.detail.value)}
              placeholder="e.g. www, api, or leave empty"
            />
          </FormField>

          <FormField label="Record type">
            <Select
              selectedOption={recordTypeOption}
              onChange={(e) => setRecordTypeOption(e.detail.selectedOption as any)}
              options={RECORD_TYPES.map((t) => ({ label: t.label, value: t.value }))}
            />
          </FormField>

          <FormField label="Value / Route traffic to" description={currentTypeInfo.desc}>
            <Textarea
              value={recordValuesText}
              onChange={(e) => setRecordValuesText(e.detail.value)}
              placeholder={currentTypeInfo.placeholder}
              rows={4}
            />
          </FormField>

          <FormField label="TTL (seconds)" description="Time To Live in seconds">
            <Input
              value={ttl}
              onChange={(e) => setTtl(e.detail.value)}
              type="number"
              placeholder="300"
            />
          </FormField>

          <FormField label="Routing policy">
            <Select
              selectedOption={{ label: "Simple routing", value: "simple" }}
              disabled
              options={[{ label: "Simple routing", value: "simple" }]}
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Edit Record Modal */}
      <Modal
        visible={editModalOpen}
        onDismiss={() => setEditModalOpen(false)}
        header={`Edit record - ${selectedRecord?.name || ""}`}
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
        <SpaceBetween size="l">
          <FormField label="Value / Route traffic to (one per line)">
            <Textarea
              value={editValuesText}
              onChange={(e) => setEditValuesText(e.detail.value)}
              rows={4}
            />
          </FormField>

          <FormField label="TTL (seconds)">
            <Input
              value={editTtl}
              onChange={(e) => setEditTtl(e.detail.value)}
              type="number"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Delete Record Confirmation Modal */}
      <Modal
        visible={deleteModalOpen}
        onDismiss={() => setDeleteModalOpen(false)}
        header={`Delete record ${selectedRecord?.name || ""}`}
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
        <Box variant="p">
          Are you sure you want to delete record <b>{selectedRecord?.name}</b> ({selectedRecord?.type})? This action cannot be undone.
        </Box>
      </Modal>

      {/* Export Zone Modal */}
      <ExportZoneModal
        visible={exportModalOpen}
        zoneId={parseInt(zoneId, 10)}
        zoneName={zone?.name || ""}
        onDismiss={() => setExportModalOpen(false)}
      />

      {/* Import Zone Modal */}
      <ImportZoneModal
        visible={importModalOpen}
        zoneId={parseInt(zoneId, 10)}
        zoneName={zone?.name || ""}
        onDismiss={() => setImportModalOpen(false)}
        onSuccess={(count) => {
          queryClient.invalidateQueries({ queryKey: ["dns-records", zoneId] });
          queryClient.invalidateQueries({ queryKey: ["hosted-zone", zoneId] });
          addNotification("success", `Successfully imported ${count} DNS records from BIND file`);
        }}
      />
    </Shell>
  );
}
