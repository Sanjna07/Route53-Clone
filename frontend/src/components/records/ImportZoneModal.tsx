"use client";

import React, { useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Textarea from "@cloudscape-design/components/textarea";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import { apiFetch } from "@/lib/api";

interface ImportZoneModalProps {
  visible: boolean;
  zoneId: number;
  zoneName: string;
  onDismiss: () => void;
  onSuccess: (count: number) => void;
}

export default function ImportZoneModal({
  visible,
  zoneId,
  zoneName,
  onDismiss,
  onSuccess,
}: ImportZoneModalProps) {
  const [bindContent, setBindContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBindContent(event.target?.result as string || "");
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!bindContent.trim()) {
      setErrorMsg("Please paste or upload a BIND zone file.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch<{ message: string; created_count: number }>(`/hosted-zones/${zoneId}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: bindContent,
      });

      onSuccess(res.created_count);
      onDismiss();
      setBindContent("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to import BIND zone records.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={`Import BIND zone file into ${zoneName}`}
      closeAriaLabel="Close import modal"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleImport}>
              Import records
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        {errorMsg && <Alert type="error">{errorMsg}</Alert>}

        <FormField
          label="Upload .zone / .txt file"
          description="Select a standard BIND zone file from your computer"
        >
          <input
            type="file"
            accept=".zone,.txt,.bind"
            onChange={handleFileUpload}
            style={{ marginTop: "4px" }}
          />
        </FormField>

        <FormField
          label="Or paste BIND zone file content"
          description="Supports $ORIGIN, $TTL, A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA records"
        >
          <Textarea
            value={bindContent}
            onChange={(e) => setBindContent(e.detail.value)}
            placeholder={`$ORIGIN ${zoneName}\n$TTL 300\n@ IN A 192.0.2.1\nwww IN CNAME target.com.`}
            rows={8}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
