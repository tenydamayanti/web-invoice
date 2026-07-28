import axios from "axios";

type ApiErrorData = {
  message?: unknown;
  error?: unknown;
  errors?: Record<string, unknown>;
};

function humanizeField(field: string) {
  return field
    .replace(/^template_data\./, "")
    .replace(/^items\.\d+\./, "Item: ")
    .replaceAll("_", " ");
}

export function getApiErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "Server terlalu lama merespons. Periksa koneksi dan status backend.";
    }

    return "Tidak dapat terhubung ke server API. Pastikan backend berjalan dan alamat API/port 8000 dapat diakses.";
  }

  const data = error.response.data as ApiErrorData | string | undefined;
  if (typeof data === "string" && data.trim()) {
    return `Server mengembalikan error (${error.response.status}): ${data.slice(0, 180)}`;
  }

  if (data && typeof data === "object") {
    const messages = Object.entries(data.errors ?? {}).flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values.filter((message): message is string => typeof message === "string").map((message) =>
        `${humanizeField(field)}: ${message}`,
      );
    });

    if (messages.length) {
      return messages.join("\n");
    }

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return `Server mengembalikan error HTTP ${error.response.status}.`;
}

export function getApiValidationErrors(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response?.data || typeof error.response.data !== "object") {
    return {};
  }

  const errors = (error.response.data as ApiErrorData).errors;
  return errors && typeof errors === "object" ? errors : {};
}
