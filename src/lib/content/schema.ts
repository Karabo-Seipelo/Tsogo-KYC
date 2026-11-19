import { z } from "zod";

// The schema is the source of the Content type. safeParse reports success
// without throwing. Source: https://zod.dev/api
const text = z.string();

const titled = z.object({
  title: text,
  description: text,
});

const tipList = z.object({
  intro: text,
  tips: z.array(text),
});

export const contentSchema = z.object({
  meta: z.object({
    locale: text,
    version: text,
    source: text,
    notes: z.array(text),
  }),
  common: z.object({
    description: text,
    demoBanner: z.object({
      long: text,
      short: text,
    }),
    header: z.object({
      title: text,
      titleShort: text,
      help: text,
      saveAndExit: text,
      back: text,
    }),
    actions: z.object({
      continue: text,
      back: text,
      tryAgain: text,
      retakePhoto: text,
      uploadInstead: text,
      uploadPhotoInstead: text,
    }),
    progress: z.object({
      label: text,
      steps: z.object({
        document: text,
        selfie: text,
        liveness: text,
        review: text,
      }),
    }),
    status: z.object({
      done: text,
      inProgress: text,
      waiting: text,
      passed: text,
    }),
    attempt: text,
    documentTitle: text,
  }),
  start: z.object({
    title: text,
    intro: text,
    estimate: text,
    requirementsTitle: text,
    requirements: z.array(text),
    privacy: text,
    privacyLink: text,
    cta: text,
  }),
  device: z.object({
    title: text,
    intro: text,
    options: z.object({
      phone: titled,
      thisDevice: titled,
    }),
  }),
  handoff: z.object({
    title: text,
    steps: z.array(text),
    waiting: text,
    connected: text,
    expiresIn: text,
    refresh: text,
    fallback: text,
    qrAlt: text,
    expired: z.object({
      title: text,
      body: text,
      cta: text,
      fallback: text,
    }),
  }),
  status: z.object({
    title: text,
    intro: text,
    steps: z.object({
      phoneConnected: text,
      documentCaptured: text,
      documentChecked: text,
      selfie: text,
      liveness: text,
      faceMatch: text,
    }),
    lostConnection: text,
    disconnected: z.object({
      label: text,
      reconnecting: text,
      body: text,
      cta: text,
    }),
  }),
  document: z.object({
    select: z.object({
      title: text,
      intro: text,
      options: z.object({
        passport: titled,
        nationalId: titled,
        driversLicence: titled,
      }),
    }),
    capture: z.object({
      title: text,
      instruction: text,
      sideLabel: text,
      takePhoto: text,
      uploadInstead: text,
      cameraAlt: text,
    }),
    checking: text,
    result: z.object({
      title: text,
      passed: z.object({
        title: text,
        checks: z.object({
          corners: text,
          readable: text,
          notExpired: text,
        }),
      }),
      failed: z.object({
        title: text,
        reasons: z.object({
          blurry: tipList,
          glare: tipList,
          cropped: tipList,
          expired: tipList,
        }),
      }),
    }),
  }),
  selfie: z.object({
    title: text,
    instruction: text,
    cta: text,
    cameraAlt: text,
  }),
  liveness: z.object({
    title: text,
    prompts: z.object({
      turnLeft: text,
      turnRight: text,
      blink: text,
    }),
    progress: text,
    confirmed: text,
    help: text,
  }),
  faceMatch: z.object({
    title: text,
    comparing: text,
    documentPhoto: text,
    selfie: text,
    matched: z.object({
      title: text,
      body: text,
    }),
    noMatch: z.object({
      title: text,
      intro: text,
      tips: z.array(text),
      retake: text,
      differentDocument: text,
    }),
  }),
  phoneDone: z.object({
    headerTitle: text,
    title: text,
    body: text,
  }),
  review: z.object({
    title: text,
    intro: text,
    rows: z.object({
      document: text,
      documentCheck: text,
      liveness: text,
      faceMatch: text,
    }),
    retake: text,
    confirm: text,
    confirmRequired: text,
    submit: text,
  }),
  processing: z.object({
    title: text,
    body: text,
    slow: text,
  }),
  complete: z.object({
    title: text,
    body: text,
    cta: text,
  }),
  manualReview: z.object({
    title: text,
    body: text,
    reference: text,
    cta: text,
  }),
  errors: z.object({
    CAMERA_DENIED: z.object({
      title: text,
      intro: text,
      steps: z.array(text),
      cta: text,
      fallback: text,
    }),
    CAMERA_NOT_FOUND: z.object({
      title: text,
      intro: text,
      cta: text,
    }),
    UPLOAD_FAILED: z.object({
      message: text,
      hint: text,
      cta: text,
      secondary: text,
    }),
    OFFLINE: z.object({
      banner: text,
      body: text,
    }),
    HANDOFF_USED: z.object({
      title: text,
      body: text,
    }),
    SESSION_TIMEOUT_WARNING: z.object({
      title: text,
      body: text,
      end: text,
      stay: text,
    }),
    SESSION_EXPIRED: z.object({
      title: text,
      body: text,
      cta: text,
    }),
    VERIFICATION_REJECTED: z.object({
      title: text,
      body: text,
      nextStepsTitle: text,
      nextSteps: z.array(text),
      contactSupport: text,
      tryAgain: text,
    }),
    generic: z.object({
      title: text,
      body: text,
    }),
  }),
  help: z.object({
    title: text,
    close: text,
    faq: z.array(
      z.object({
        q: text,
        a: text,
      }),
    ),
    privacyLink: text,
    support: text,
  }),
  saveExit: z.object({
    confirmTitle: text,
    confirmBody: text,
    confirm: text,
    cancel: text,
    savedTitle: text,
    savedBody: text,
    return: text,
  }),
  privacy: z.object({
    title: text,
    demo: text,
    sections: z.array(
      z.object({
        heading: text,
        body: text,
      }),
    ),
    back: text,
  }),
});

export type Content = z.infer<typeof contentSchema>;
