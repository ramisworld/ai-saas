"use client";

import { TrackerStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const statuses = [
  TrackerStatus.DRAFT_READY,
  TrackerStatus.APPLIED,
  TrackerStatus.INTERVIEWING,
  TrackerStatus.OFFER,
  TrackerStatus.REJECTED,
  TrackerStatus.ARCHIVED,
];

function label(status: TrackerStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function TrackerStatusSelect({
  entryId,
  status,
}: {
  entryId: string;
  status: TrackerStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function updateStatus(nextStatus: TrackerStatus) {
    setValue(nextStatus);
    setSaving(true);

    try {
      const response = await fetch(`/api/tracker/${entryId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Status update failed.");
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed.");
      setValue(status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(event) => updateStatus(event.target.value as TrackerStatus)}
      className="rounded-full border border-input bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#164b3f] focus:ring-4 focus:ring-[#164b3f]/10 disabled:opacity-60"
    >
      {statuses.map((item) => (
        <option key={item} value={item}>
          {label(item)}
        </option>
      ))}
    </select>
  );
}
