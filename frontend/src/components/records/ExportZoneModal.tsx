"use client";

import React, { useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import Textarea from "@cloudscape-design/components/textarea";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { apiFetch } from "@/lib/api";

interface ExportZoneModalProps {
  visible: boolean;
  zoneId: number;
  zoneName: string;
  onDismiss: () => void;
}

export default function ExportZoneModal({ visible, zoneId, zoneName, onDismiss }: ExportZoneModalProps) {
  const [formatOption, setFormatOption] = useState<{ label: string; value: string }>({
    label: "BIND Zone File (.zone)",
    value: "bind",
  });
  const [previewContent, setPreviewContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchPreview = async () => {
    setLoading(true);
    try {
      if (formatOption.value === "json") {
        const jsonRes = await apiFetch<any>(`/hosted-zones/${zoneId}/export?format=json`);
        setPreviewContent(JSON.stringify(jsonRes, null, 2));
      } else {
        const textRes = await apiFetch<string>(`/hosted-zones/${zoneId}/export?format=bind`);
        setPreviewContent(typeof textRes === "string" ? textRes : JSON.stringify(textRes));
      }
    } catch (e: any) {
      setPreviewContent(`Error exporting zone: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const filename = `${zoneName.replace(/\.$/, "")}.${formatOption.value === "json" ? "json" : "zone"}`;
    const blob = new Blob([previewContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={`Export zone records - ${zoneName}`}
      closeAriaLabel="Close export modal"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button onClick={handleFetchPreview} loading={loading}>
              Generate preview
            </Button>
            <Button variant="primary" disabled={!previewContent} onClick={handleDownload}>
              Download file
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        <FormField label="Export format">
          <Select
            selectedOption={formatOption}
            onChange={(e) => {
              setFormatOption(e.detail.selectedOption as any);
              setPreviewContent("");
            }}
            options={[
              { label: "BIND Zone File (.zone)", value: "bind" },
              { label: "JSON Format (.json)", value: "json" },
            ]}
          />
        </FormField>

        {previewContent && (
          <FormField label="Export preview">
            <Textarea value={previewContent} readOnly rows={10} />
          </FormField>
        )}
      </SpaceBetween>
    </Modal>
  );
}
