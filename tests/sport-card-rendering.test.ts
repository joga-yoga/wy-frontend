import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SportCardLogo } from "../src/components/booking/SportCardLogo";
import { sportCardPhoto } from "../src/components/page-contents/studio/pricingHelpers";

const card = {
  id: "acceptance", studio_id: "studio", sport_card_id: "card", fee: null,
  sport_card: { id: "card", name: "FitProfit", slug: "fitprofit", photo: null },
};
assert.equal(sportCardPhoto(card), "/images/cards/fitprofit.webp");
assert.equal(sportCardPhoto({ id: "custom", studio_id: "studio", photo: "custom-upload" }), "custom-upload");
const empty = renderToStaticMarkup(createElement(SportCardLogo, { photo: null, alt: "Custom" }));
assert.match(empty, /Karta/);
console.log("Verified public card selection and the empty custom-card fallback");
