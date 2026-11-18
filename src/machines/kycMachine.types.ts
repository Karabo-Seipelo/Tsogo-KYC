export const kycStates = [
  "idle",
  "deviceSelection",
  "qrHandoff",
  "documentUpload",
  "documentValidation",
  "selfieCapture",
  "livenessCheck",
  "faceMatch",
  "review",
  "processing",
  "complete",
  "error",
] as const;

export type KycState = (typeof kycStates)[number];

export type Device = "desktop" | "phone";

export type KycErrorReason = "maxAttempts" | "sessionExpired";

export type RetakeTarget = "document" | "selfie";

export type KycEvent =
  | { type: "START"; device: Device }
  | { type: "CHOOSE_PHONE" }
  | { type: "CHOOSE_THIS_DEVICE" }
  | { type: "PHONE_CONNECTED" }
  | { type: "DOC_CAPTURED" }
  | { type: "DOC_VALID" }
  | { type: "DOC_INVALID" }
  | { type: "UPLOAD_FAILED" }
  | { type: "SELFIE_CAPTURED" }
  | { type: "LIVENESS_PASSED" }
  | { type: "MATCHED" }
  | { type: "NO_MATCH" }
  | { type: "SUBMIT" }
  | { type: "VERIFIED" }
  | { type: "REJECTED" }
  | { type: "RETAKE"; target: RetakeTarget }
  | { type: "SESSION_EXPIRED" }
  | { type: "REFRESH_TOKEN" }
  | { type: "RESTART" };

export type KycContext = {
  documentType: string | null;
  docAttempts: number;
  matchAttempts: number;
  device: Device | null;
  cameraError: boolean;
  uploadError: boolean;
  offline: boolean;
  timeoutWarning: boolean;
  reason: KycErrorReason | null;
};
