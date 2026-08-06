import * as yup from "yup";

import type {
  CertificationChoice,
  CertificationDesignation,
  CourseApiResponse,
  CourseFormat,
  CourseFormValues,
  CourseModuleValue,
  CoursePayload,
  CourseProgramItem,
  PaymentMethod,
} from "./types";

export const CERTIFICATION_DESIGNATIONS: CertificationDesignation[] = [
  "RYT_200",
  "RYT_300",
  "RYT_500",
  "RYS",
  "YACEP",
];

export const CERTIFICATION_LABELS: Record<CertificationDesignation, string> = {
  RYT_200: "RYT 200 (Yoga Alliance)",
  RYT_300: "RYT 300 (Yoga Alliance)",
  RYT_500: "RYT 500 (Yoga Alliance)",
  RYS: "RYS (Registered Yoga School)",
  YACEP: "YACEP",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  online: "Online",
  cash: "Gotówka",
  bank_transfer: "Przelew",
};

const emptyToNull = <T>(value: T, originalValue: unknown) =>
  originalValue === "" || originalValue == null ? null : value;

const nullableNumber = yup
  .number()
  .transform(emptyToNull)
  .typeError("Podaj poprawną kwotę")
  .nullable();

const optionalString = yup
  .string()
  .transform((value) => value?.trim() || "")
  .optional();

const moduleSchema = yup.object({
  title: yup.string().trim().required("Nazwa modułu jest wymagana"),
  hours: yup
    .number()
    .transform(emptyToNull)
    .integer("Godziny muszą być liczbą całkowitą")
    .min(1, "Godziny muszą być większe od 0")
    .nullable()
    .optional(),
  description: optionalString.nullable(),
});

const programItemSchema = yup.object({
  start_date: yup.string().trim().required("Wybierz datę rozpoczęcia"),
  end_date: yup
    .string()
    .nullable()
    .optional()
    .test(
      "end-after-start",
      "Data zakończenia nie może być wcześniejsza niż rozpoczęcie",
      function (value) {
        const start = this.parent?.start_date;
        if (!value || !start) return true;
        return new Date(value) >= new Date(start);
      },
    ),
  imageId: yup.string().nullable().optional(),
  description: optionalString.nullable(),
});

export const courseDraftSchema = yup.object({
  title: yup.string().trim().required("Nazwa kursu jest wymagana"),
});

export const coursePublishSchema = yup
  .object({
    title: yup.string().trim().required("Nazwa kursu jest wymagana"),
    description: yup.string().nullable().optional(),
    is_teacher_training: yup.boolean().default(false),
    is_online: yup.boolean().default(false),
    is_onsite: yup.boolean().default(false),
    start_date: yup.string().required("Data początku jest wymagana"),
    end_date: yup.string().required("Data końca jest wymagana"),
    enrollment_closes: yup.string().nullable().optional(),
    program: yup.array().of(programItemSchema).default([]),
    modules: yup
      .array()
      .of(moduleSchema)
      .test("module-title", "Dodaj co najmniej jeden moduł z nazwą", (modules) =>
        Boolean(modules?.some((module) => module?.title?.trim())),
      )
      .required(),
    instructor_ids: yup
      .array()
      .of(yup.string().required())
      .min(1, "Dodaj co najmniej jednego prowadzącego"),
    certificationChoice: yup
      .string()
      .oneOf([
        "none",
        "school",
        "other",
        ...CERTIFICATION_DESIGNATIONS.map((designation) => `recognized:${designation}`),
      ] as CertificationChoice[])
      .required(),
    certificationName: yup.string().when("certificationChoice", {
      is: (choice: CertificationChoice) => choice === "school" || choice === "other",
      then: (schema) => schema.trim().required("Podaj nazwę certyfikatu"),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    price: nullableNumber.required("Cena jest wymagana").min(0, "Cena nie może być ujemna"),
    currency: yup.string().trim().required("Waluta jest wymagana"),
    deposit_amount: nullableNumber.optional(),
    balance_payment_methods: yup.array().of(yup.string().required()).default([]),
    payment_terms: yup.string().nullable().optional(),
    goals: yup.array().of(yup.string().required()).default([]),
    includes: yup.array().of(yup.string().required()).default([]),
    prerequisites: yup.string().nullable().optional(),
    skill_level: yup.string().nullable().optional(),
    cancellation_policy: yup.string().nullable().optional(),
    important_info: yup.string().nullable().optional(),
    location_id: yup.string().nullable().optional(),
    image_ids: yup.array().of(yup.string().required()).default([]),
    is_public: yup.boolean().default(false),
  })
  .test({
    name: "format-selected",
    test(value, context) {
      if (!value.is_online && !value.is_onsite) {
        return context.createError({
          path: "is_onsite",
          message: "Wybierz sposób odbywania się kursu",
        });
      }
      return true;
    },
  })
  .test({
    name: "location-required",
    test(value, context) {
      if (value.is_onsite && !value.location_id) {
        return context.createError({
          path: "location_id",
          message: "Adres jest wymagany dla kursu stacjonarnego lub hybrydowego",
        });
      }
      return true;
    },
  })
  .test({
    name: "date-order",
    test(value, context) {
      if (!value.start_date || !value.end_date) return true;
      if (new Date(value.end_date) < new Date(value.start_date)) {
        return context.createError({
          path: "end_date",
          message: "Data zakończenia nie może być wcześniejsza niż początek",
        });
      }
      return true;
    },
  })
  .test({
    name: "enrollment-before-start",
    test(value, context) {
      if (!value.enrollment_closes || !value.start_date) return true;
      if (new Date(value.enrollment_closes) > new Date(value.start_date)) {
        return context.createError({
          path: "enrollment_closes",
          message: "Zapisy do nie mogą być później niż początek kursu",
        });
      }
      return true;
    },
  })
  .test({
    name: "deposit-less-than-price",
    test(value, context) {
      if (value.deposit_amount == null) return true;
      const deposit = Number(value.deposit_amount);
      const price = Number(value.price);
      if (deposit > 0 && deposit < price) return true;
      return context.createError({
        path: "deposit_amount",
        message: "Zadatek musi być większy od 0 i mniejszy niż cena",
      });
    },
  });

export function deriveCourseFormat(
  value: Pick<CourseFormValues, "is_online" | "is_onsite">,
): CourseFormat | null {
  if (value.is_online && value.is_onsite) return "hybrid";
  if (value.is_onsite) return "onsite";
  if (value.is_online) return "online";
  return null;
}

export function setCourseFormat(
  format: CourseFormat,
): Pick<CourseFormValues, "is_online" | "is_onsite"> {
  if (format === "hybrid") return { is_online: true, is_onsite: true };
  if (format === "onsite") return { is_online: false, is_onsite: true };
  return { is_online: true, is_onsite: false };
}

export function getModuleHoursTotal(modules: CourseModuleValue[]): number | null {
  const hourValues = modules
    .map((module) => (module.hours === "" || module.hours == null ? null : Number(module.hours)))
    .filter((hours): hours is number => Number.isFinite(hours));
  if (hourValues.length === 0) return null;
  return hourValues.reduce((sum, hours) => sum + hours, 0);
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function cleanStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean);
}

function cleanNumber(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function cleanCourseProgram(items: CourseProgramItem[]): CourseProgramItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => cleanString(item.start_date))
    .map((item) => ({
      start_date: cleanString(item.start_date)!,
      end_date: cleanString(item.end_date),
      imageId: cleanString(item.imageId),
      description: cleanString(item.description),
    }));
}

export function buildCertificationPayload(choice: CertificationChoice, name?: string | null) {
  if (choice === "none") return null;
  if (choice === "school") return { type: "school" as const, name: cleanString(name) ?? "" };
  if (choice === "other") return { type: "other" as const, name: cleanString(name) ?? "" };
  const designation = choice.replace("recognized:", "") as CertificationDesignation;
  return { type: "recognized" as const, designation };
}

export function certificationChoiceFromApi(
  certification: CourseApiResponse["certification"],
): CertificationChoice {
  if (!certification) return "none";
  if (certification.type === "recognized" && certification.designation) {
    return `recognized:${certification.designation as CertificationDesignation}`;
  }
  if (certification.type === "school") return "school";
  if (certification.type === "other") return "other";
  return "none";
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function buildCoursePayload(values: CourseFormValues): CoursePayload {
  const modules = (values.modules ?? [])
    .map((module) => {
      const title = cleanString(module.title);
      if (!title) return null;
      const hours = cleanNumber(module.hours);
      const description = cleanString(module.description);
      return {
        title,
        ...(hours != null ? { hours } : {}),
        ...(description ? { description } : {}),
      };
    })
    .filter(
      (module): module is { title: string; hours?: number; description?: string } => module != null,
    );

  return {
    title: values.title.trim(),
    description: cleanString(values.description),
    is_teacher_training: Boolean(values.is_teacher_training),
    is_online: Boolean(values.is_online),
    is_onsite: Boolean(values.is_onsite),
    location_id: values.is_onsite ? (values.location_id ?? null) : null,
    start_date: cleanString(values.start_date),
    end_date: cleanString(values.end_date),
    enrollment_closes: cleanString(values.enrollment_closes),
    program: cleanCourseProgram(values.program ?? []),
    modules,
    instructor_ids: values.instructor_ids ?? [],
    certification: buildCertificationPayload(values.certificationChoice, values.certificationName),
    price: cleanNumber(values.price),
    currency: values.currency || "PLN",
    deposit_amount: cleanNumber(values.deposit_amount),
    balance_payment_methods: (values.balance_payment_methods ?? []) as PaymentMethod[],
    payment_terms: cleanString(values.payment_terms),
    goals: cleanStringArray(values.goals),
    includes: cleanStringArray(values.includes),
    prerequisites: cleanString(values.prerequisites),
    skill_level: cleanString(values.skill_level) ? [cleanString(values.skill_level)!] : [],
    cancellation_policy: cleanString(values.cancellation_policy),
    important_info: cleanString(values.important_info),
    image_ids: values.image_ids ?? [],
    is_public: Boolean(values.is_public),
  };
}

export function formValuesFromCourse(course: CourseApiResponse): CourseFormValues {
  const instructors = course.instructors ?? [];
  const certificationChoice = certificationChoiceFromApi(course.certification);

  return {
    title: course.title ?? "",
    description: course.description ?? "",
    is_teacher_training: Boolean(course.is_teacher_training),
    is_online: Boolean(course.is_online),
    is_onsite: Boolean(course.is_onsite),
    start_date: toDateInputValue(course.start_date),
    end_date: toDateInputValue(course.end_date),
    enrollment_closes: toDateInputValue(course.enrollment_closes),
    program: (course.program ?? []).map((item) => ({
      start_date: toDateInputValue(item.start_date),
      end_date: item.end_date ? toDateInputValue(item.end_date) : "",
      imageId: item.imageId ?? null,
      description: item.description ?? "",
    })),
    modules: course.modules ?? [],
    instructor_ids: instructors.map((instructor) => instructor.id),
    instructors,
    certificationChoice,
    certificationName: course.certification?.name ?? "",
    certification: course.certification ?? null,
    price: course.price ?? "",
    currency: course.currency ?? "PLN",
    deposit_amount: course.deposit_amount ?? "",
    balance_payment_methods: ((course.balance_payment_methods ?? []) as PaymentMethod[]).filter(
      (method) => method in PAYMENT_METHOD_LABELS,
    ),
    payment_terms: course.payment_terms ?? "",
    goals: course.goals ?? [],
    includes: course.includes ?? [],
    prerequisites: course.prerequisites ?? "",
    skill_level: course.skill_level?.[0] ?? "",
    cancellation_policy: course.cancellation_policy ?? "",
    important_info: course.important_info ?? "",
    location_id: course.location?.id ?? null,
    location: course.location ?? null,
    image_ids: course.image_ids ?? [],
    is_public: Boolean(course.is_public),
  };
}

export const emptyCourseFormValues: CourseFormValues = {
  title: "",
  description: "",
  is_teacher_training: false,
  is_online: false,
  is_onsite: false,
  start_date: "",
  end_date: "",
  enrollment_closes: "",
  program: [],
  modules: [],
  instructor_ids: [],
  instructors: [],
  certificationChoice: "none",
  certificationName: "",
  certification: null,
  price: "",
  currency: "PLN",
  deposit_amount: "",
  balance_payment_methods: [],
  payment_terms: "",
  goals: [],
  includes: [],
  prerequisites: "",
  skill_level: "",
  cancellation_policy: "",
  important_info: "",
  location_id: null,
  location: null,
  image_ids: [],
  is_public: false,
};
