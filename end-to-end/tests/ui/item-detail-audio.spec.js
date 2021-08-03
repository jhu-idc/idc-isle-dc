import { AudioPage } from "./pages/item-details";

fixture `Audio item with transcription`
  .page `https://islandora-idc.traefik.me/node/56`;

test('Audio player and PDF viewer are present', async (t) => {
  await t
    .expect(AudioPage.docViewer.exists).ok()
    .expect(
      AudioPage.docViewer.withAttribute('src', '/themes/contrib/idc-ui-theme/js/packages/pdf.js/web/viewer.html?file=/system/files/2021-08/fuji_acros.pdf').exists
    ).ok()
    .expect(AudioPage.audioPlayer.exists).ok()
    .expect(AudioPage.audioSrc.exists).ok()
    .expect(
      AudioPage.audioSrc.withAttribute('src', '/system/files/2021-08/56-Service%20File.mp3').exists
    ).ok()
    .expect(AudioPage.audioSrc.withAttribute('type', 'audio/mpeg').exists).ok();
});
