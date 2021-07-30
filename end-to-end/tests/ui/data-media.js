
import { download } from "../helpers";
import { localAdmin } from "../roles";
import {
  AddMediaPage,
  ImagePage,
  MediaPage,
  MediaType,
  MediaUse
} from './pages/media';

const filePrefix = 'http://migration-assets/assets';
const Files = {
  [MediaType.Image]: [
    { name: 'tiff.tif', path: '/image/formats/tiff.tif' },
    { name: 'jpg.jpg', path: '/image/formats/jpg.jpg' },
    { name: 'png.png', path: '/image/formats/png.png' },
    { name: 'TRP_7767.jpg', path: '/image/TRP_7767.jpg' }
  ],
  [MediaType.Audio] : [
    { name: 'moo.mp3', path: '/audio/moo.mp3' }
  ],
  [MediaType.ExtractedText]: [],
  [MediaType.Document]: [
    { name: 'ilford_temperature-compensation-chart.pdf', path: '/document/ilford_temperature-compensation-chart.pdf' },
    { name: 'hello_world.txt', path: '/extracted_text/hello_world.txt' }
  ],
  [MediaType.Video]: [
    { name: 'chair-pop-gif.mp4', path: '/video/chair-pop-gif.mp4' }
  ]
};

async function addMedia(mediaType, options) {
  const { name, file, parent, accessTerm, mediaUse, altText } = options;

  await AddMediaPage.addMedia(mediaType);

  if (mediaType === MediaType.Image) {
    await ImagePage.addImage(file, name, parent, accessTerm, mediaUse, altText);
  } else {
    await MediaPage.fillInfo(file, name, parent, accessTerm, mediaUse);
  }

  await MediaPage.submitMedia();
  console.log(`     - ${mediaType}: ${name}`);
}

/**
 *
 * @param {MediaType} mediaType
 * @param {number} index index of file to reference
 * @returns the downloaded file bits, can be used to be uploaded to Drupal
 */
async function getMedia(mediaType, index = 0) {
  const path = `${filePrefix}${Files[mediaType][index].path}`;
  return await download(path);
}

fixture('Add media to Drupal')
  .page('https://islandora-idc.traefik.me/admin/content/media')
  .beforeEach(async (t) => await t.useRole(localAdmin));

/**
 * repo item with media item attached, 1 per media type
 *  * video
 *  * audio + transcription (pdf)
 *  * paged content
 *  * PDFs should NOT use PDFjs display hint
 *
 * Check OpenSeadragon display hint
 */
test('Add all test media', async (t) => {
  if (await AddMediaPage.currentMedia.withText('Page 1 img').exists) {
    return;
  }

  console.log('   > Adding media');

  await addMedia(MediaType.Image, {
    name: 'A single image',
    file: await getMedia(MediaType.Image, 0),
    parent: 'Mallard',
    accessTerm: 'Duck Collection',
    mediaUse: MediaUse.Original,
    altText: 'A single image'
  });

  await addMedia(MediaType.Image, {
    name: 'Page 1 img',
    file: await getMedia(MediaType.Image, 1),
    parent: 'Page 1',
    accessTerm: 'Parent Collection',
    mediaUse: MediaUse.Original,
    altText: 'Page one'
  });

  await addMedia(MediaType.Image, {
    name: 'Page 2 img',
    file: await getMedia(MediaType.Image, 2),
    parent: 'Page 2',
    accessTerm: 'Parent Collection',
    mediaUse: MediaUse.Original,
    altText: 'Page two'
  });

  await addMedia(MediaType.Document, {
    name: 'Ilford Temperature Compensation Chart',
    file: await getMedia(MediaType.Document, 0),
    parent: 'A PDF document',
    accessTerm: 'Parent Collection',
    mediaUse: MediaUse.Original
  });

  await addMedia(MediaType.Audio, {
    name: 'Moo',
    file: await getMedia(MediaType.Audio, 0),
    parent: 'Audio plus transcription',
    accessTerm: 'Parent Collection',
    mediaUse: MediaUse.Original
  });

  await addMedia(MediaType.Document, {
    name: 'Transcription',
    file: await getMedia(MediaType.Document, 1),
    parent: 'Audio plus transcription',
    accessTerm: 'Parent Collection',
    mediaUse: MediaUse.Transcript
  });

  await addMedia(MediaType.Video, {
    name: 'A Video',
    file: await getMedia(MediaType.Video, 0),
    parent: 'A video item',
    accessTerm: 'Parent Collection',
    mediaUse: MediaUse.Original
  });
});
