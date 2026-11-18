import assert from "node:assert/strict";
import { test } from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import type { DashboardItem } from "../../src/app/account/partner/offer/offerConfig";
import { OfferEventRow, publicLink } from "../../src/app/account/partner/offer/OfferEventRow";

const actions = {
  onDelete: () => {},
  onHide: () => {},
  onDuplicate: () => {},
  itemToDelete: null,
  isDeleting: false,
  onDeleteConfirm: () => {},
  onDeleteCancel: () => {},
};

for (const [kind, editor, publicPath] of [
  ["workshop", "workshops", "wydarzenia"],
  ["retreat", "retreats", "wyjazdy"],
  ["course", "courses", "kursy"],
] as const) {
  for (const isPublic of [true, false]) {
    test(`${kind}: independent edit, public view and overflow for ${isPublic ? "published" : "private"} rows`, () => {
      const event: DashboardItem = {
        id: "saved-id",
        slug: "saved-slug",
        title: "Moja oferta",
        kind,
        is_public: isPublic,
      };
      const html = renderToStaticMarkup(<OfferEventRow event={event} {...actions} />);
      const anchors = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(([anchor]) => anchor);
      assert.equal(anchors.length, 2);
      assert.match(anchors[0], new RegExp(`href="/account/partner/${editor}/saved-id/edit"`));
      assert.match(anchors[1], new RegExp(`href="/${publicPath}/saved-slug"`));
      assert.match(anchors[1], /target="_blank"/);
      assert.match(anchors[1], /rel="noopener noreferrer"/);
      assert.match(anchors[1], /aria-label="Zobacz stronę publiczną: Moja oferta \(nowa karta\)"/);
      assert.match(html, /aria-label="Więcej akcji: Moja oferta"/);
      for (const anchor of anchors) {
        assert.equal((anchor.match(/<a\b/g) ?? []).length, 1);
        assert.doesNotMatch(anchor, /<button\b/);
      }
    });
  }
}

test("courses use saved IDs when no slug exists; other missing destinations stay editable", () => {
  const event: DashboardItem = {
    id: "course-id",
    slug: "",
    title: "Kurs",
    kind: "course",
    is_public: false,
  };
  assert.equal(publicLink(event), "/kursy/course-id");
  for (const kind of ["workshop", "retreat"] as const) {
    assert.equal(publicLink({ ...event, kind }), null);
    const html = renderToStaticMarkup(<OfferEventRow event={{ ...event, kind }} {...actions} />);
    assert.match(html, /\/edit"/);
    assert.doesNotMatch(html, /Zobacz stronę publiczną/);
    assert.match(html, /Więcej akcji: Kurs/);
  }
});
