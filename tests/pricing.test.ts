import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePlans,
  DEFAULT_CALCULATOR,
  formatSubscriptionPrice,
  monthlyCost,
  partitionFeatures,
  PLANS,
  recommendPlan,
} from "../src/app/cennik/pricing";

test("Figma inputs use owner-approved net prices plus VAT, not inconsistent mock totals", () => {
  const results = calculatePlans(DEFAULT_CALCULATOR.salesGrosze, DEFAULT_CALCULATOR.registrations);
  assert.deepEqual(
    results.map((result) => result.totalGrossGrosze),
    [18143, 14850, 17500],
  );
  assert.equal(recommendPlan(results).plan.id, "balans");
});

test("sales and registrations independently change monthly costs", () => {
  assert.deepEqual(
    calculatePlans(0, 0).map((result) => result.totalGrossGrosze),
    [0, 8700, 17500],
  );
  assert.deepEqual(
    calculatePlans(300_000, 250).map((result) => result.totalGrossGrosze),
    [45203, 27150, 17500],
  );
  assert.deepEqual(
    calculatePlans(100_000, 1000).map((result) => result.totalGrossGrosze),
    [41205, 30225, 17500],
  );
});

test("registration limits charge only excess registrations", () => {
  assert.equal(monthlyCost(PLANS[0], 0, 100).registrationNetGrosze, 0);
  assert.equal(monthlyCost(PLANS[0], 0, 101).registrationNetGrosze, 25);
  assert.equal(monthlyCost(PLANS[1], 0, 500).registrationNetGrosze, 0);
  assert.equal(monthlyCost(PLANS[1], 0, 501).registrationNetGrosze, 25);
  assert.equal(monthlyCost(PLANS[2], 0, 10_000).registrationNetGrosze, 0);
});

test("recommendation follows the cheapest total and prefers the lower tier on ties", () => {
  assert.equal(recommendPlan(calculatePlans(0, 100)).plan.id, "flex");
  assert.equal(recommendPlan(calculatePlans(100_000, 250)).plan.id, "balans");
  assert.equal(recommendPlan(calculatePlans(500_000, 1000)).plan.id, "przestrzen");
  const tied = calculatePlans(0, 0).map((result) => ({ ...result, totalGrossGrosze: 100 }));
  assert.equal(recommendPlan(tied).plan.id, "flex");
});

test("currency calculations round half-up in grosze and reject fractional inputs", () => {
  assert.equal(monthlyCost(PLANS[0], 50, 0).commissionNetGrosze, 6);
  assert.equal(monthlyCost(PLANS[0], 0, 102).totalGrossGrosze, 62);
  assert.throws(() => monthlyCost(PLANS[0], 0.5, 100), RangeError);
  assert.throws(() => monthlyCost(PLANS[0], -1, 100), RangeError);
  assert.throws(() => monthlyCost(PLANS[0], 0, NaN), RangeError);
});

test("gross component breakdown sums exactly to the displayed estimate", () => {
  for (const result of calculatePlans(123_400, 876)) {
    assert.equal(
      result.plan.subscriptionGrossGrosze + result.variableGrossGrosze,
      result.totalGrossGrosze,
    );
    assert.equal(
      result.commissionGrossGrosze + result.registrationGrossGrosze,
      result.variableGrossGrosze,
    );
  }
});

test("feature availability is stably partitioned with the exact Balans disabled order", () => {
  const flex = partitionFeatures(PLANS[0]);
  const balans = partitionFeatures(PLANS[1]);
  const przestrzen = partitionFeatures(PLANS[2]);

  assert.equal(flex.included.length, 9);
  assert.deepEqual(
    balans.unavailable.map((feature) => feature.id),
    ["lotus", "waitlist", "commission"],
  );
  assert.deepEqual(
    [...balans.included, ...balans.unavailable].map((feature) => feature.order),
    Array.from({ length: 16 }, (_, index) => index + 1),
  );
  assert.equal(przestrzen.included.length, 16);
  assert.equal(przestrzen.unavailable.length, 0);
});

test("fixed subscription formatting is independent of calculator totals", () => {
  assert.equal(formatSubscriptionPrice(PLANS[0].subscriptionGrossGrosze), "0 zł");
  assert.match(formatSubscriptionPrice(PLANS[1].subscriptionGrossGrosze), /87,00\s*zł/);
  assert.match(formatSubscriptionPrice(PLANS[2].subscriptionGrossGrosze), /175,00\s*zł/);
});
