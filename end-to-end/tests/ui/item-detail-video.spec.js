import { VideoPage } from "./pages/item-details";

fixture `Video item detail`
  .page `https://islandora-idc.traefik.me/node/55`;

test('Video player is present', async (t) => {
  await t
    .expect(VideoPage.viewer.exists).ok('Video player not found')
    .expect(VideoPage.source.withAttribute('src', '/system/files/2021-08/55-Service%20File.mp4').exists).ok()
    .expect(VideoPage.source.withAttribute('type', 'video/mp4').exists).ok();
});
