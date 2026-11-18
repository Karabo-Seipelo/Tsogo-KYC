export type KycStep = "document" | "selfie" | "liveness" | "review";

export type FunnelEvent =
  | { event: "kyc_started"; device: "desktop" | "phone" }
  | { event: "kyc_device_selected"; choice: "phone" | "this_device" }
  | { event: "kyc_handoff_completed"; secondsToScan: number }
  | { event: "kyc_step_viewed"; step: KycStep }
  | { event: "kyc_step_failed"; step: KycStep; reason: string }
  | { event: "kyc_retry"; step: KycStep; attempt: number }
  | { event: "kyc_manual_review"; step: KycStep }
  | { event: "kyc_submitted"; secondsSinceStart: number }
  | { event: "kyc_completed"; result: "verified" | "rejected" };
