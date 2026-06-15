import assert from "node:assert/strict";

import {
  buildCoursePayload,
  courseDraftSchema,
  coursePublishSchema,
  deriveCourseFormat,
  getModuleHoursTotal,
  setCourseFormat,
} from "./courseFormModel";
import type { CourseFormValues } from "./types";

const baseValues: CourseFormValues = {
  title: "Kurs nauczycielski Hatha 200h",
  description: "",
  is_teacher_training: false,
  is_online: false,
  is_onsite: false,
  start_date: "",
  end_date: "",
  enrollment_closes: "",
  harmonogram: "",
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

async function main() {
  await courseDraftSchema.validate({ ...baseValues, title: "Szkic" });
  await assert.rejects(courseDraftSchema.validate({ ...baseValues, title: "" }), /Nazwa kursu/);

  assert.equal(deriveCourseFormat({ is_online: true, is_onsite: true }), "hybrid");
  assert.deepEqual(setCourseFormat("online"), { is_online: true, is_onsite: false });
  assert.deepEqual(setCourseFormat("onsite"), { is_online: false, is_onsite: true });

  assert.equal(
    getModuleHoursTotal([
      { title: "A", hours: 10, description: "" },
      { title: "B", hours: null, description: "" },
      { title: "C", hours: 5, description: "" },
    ]),
    15,
  );
  assert.equal(getModuleHoursTotal([{ title: "Bez godzin", hours: null, description: "" }]), null);

  await assert.rejects(
    coursePublishSchema.validate(
      {
        ...baseValues,
        is_online: true,
        start_date: "2026-04-11",
        end_date: "2026-04-10",
        price: "5200",
        modules: [{ title: "Filozofia", hours: 30, description: "" }],
        instructor_ids: ["instructor-1"],
      },
      { abortEarly: false },
    ),
    /Data zakończenia/,
  );

  await assert.rejects(
    coursePublishSchema.validate(
      {
        ...baseValues,
        is_online: true,
        start_date: "2026-04-11",
        end_date: "2026-12-13",
        enrollment_closes: "2026-04-12",
        price: "5200",
        modules: [{ title: "Filozofia", hours: 30, description: "" }],
        instructor_ids: ["instructor-1"],
      },
      { abortEarly: false },
    ),
    /Zapisy/,
  );

  await assert.rejects(
    coursePublishSchema.validate(
      {
        ...baseValues,
        is_online: true,
        start_date: "2026-04-11",
        end_date: "2026-12-13",
        price: "5200",
        deposit_amount: "5200",
        modules: [{ title: "Filozofia", hours: 30, description: "" }],
        instructor_ids: ["instructor-1"],
      },
      { abortEarly: false },
    ),
    /Zadatek/,
  );

  const validPublish = await coursePublishSchema.validate(
    {
      ...baseValues,
      is_online: true,
      start_date: "2026-04-11",
      end_date: "2026-12-13",
      price: "5200",
      modules: [{ title: "Filozofia", hours: 30, description: "" }],
      instructor_ids: ["instructor-1"],
      certificationChoice: "recognized:RYT_200",
    },
    { abortEarly: false },
  );
  assert.equal(validPublish.title, "Kurs nauczycielski Hatha 200h");

  assert.deepEqual(
    buildCoursePayload({
      ...baseValues,
      is_online: true,
      is_onsite: false,
      location_id: "hidden-location-id",
      certificationChoice: "recognized:RYT_200",
      certificationName: "Ignored",
      price: "5200",
      deposit_amount: "",
      goals: ["  Uczyć bezpiecznie  ", ""],
      modules: [
        { title: " Filozofia ", hours: 30, description: "" },
        { title: "", hours: 12, description: "ignored" },
      ],
    }),
    {
      title: "Kurs nauczycielski Hatha 200h",
      description: null,
      is_teacher_training: false,
      is_online: true,
      is_onsite: false,
      location_id: null,
      start_date: null,
      end_date: null,
      enrollment_closes: null,
      harmonogram: null,
      modules: [{ title: "Filozofia", hours: 30 }],
      instructor_ids: [],
      certification: { type: "recognized", designation: "RYT_200" },
      price: 5200,
      currency: "PLN",
      deposit_amount: null,
      balance_payment_methods: [],
      payment_terms: null,
      goals: ["Uczyć bezpiecznie"],
      includes: [],
      prerequisites: null,
      skill_level: [],
      cancellation_policy: null,
      important_info: null,
      image_ids: [],
      is_public: false,
    },
  );
}

main();
