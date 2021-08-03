import { DocumentPage } from "./pages/item-details";

fixture `PDF document`
  .page `https://islandora-idc.traefik.me/node/54`;

test('PDF viewer renders', async (t) => {
  await t
    .expect(DocumentPage.viewer.exists).ok()
    .expect(
      DocumentPage.viewer.withAttribute('src', '/themes/contrib/idc-ui-theme/js/packages/pdf.js/web/viewer.html?file=/system/files/2021-08/ilford_temperature-compensation-chart.pdf').exists
    ).ok();
});
