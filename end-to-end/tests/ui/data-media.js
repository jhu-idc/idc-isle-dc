import { Selector, t } from "testcafe";
import { download } from "../helpers";
import { localAdmin } from "../roles";

const MediaType = {
  Audio: 'Audio',
  Document: 'Document',
  ExtractedText: 'Extracted Text',
  File: 'File',
  FITS: 'FITS Technical metadata',
  Image: 'Image',
  RemoteVideo: 'Remote video',
  Video: 'Video'
};

const MediaUse = {
  ExtractedText: 'Extracted Text',
  FITS: 'FITS File',
  Intermediate: 'Intermediate File',
  Original: 'Original File',
  Preservation: 'Preservation Master File',
  Service: 'Service File',
  Thumbnail: 'Thumbnail Image',
  Transcript: 'Transcript'
}

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

class AddMedia {
  constructor() {
    this.addBtn = Selector('[data-drupal-link-system-path="media/add"]');
    this.currentMedia = Selector('table td[headers="view-name-table-column"]');
  }

  async addMedia(mediaType) {
    const link = Selector('a .label').withText(mediaType);
    await t
      .expect(this.addBtn.exists).ok()
      .click(this.addBtn)
      .click(link);
  }
}

class Checkbox {
  constructor(mediaUse) {
    this.label = Selector('label').withText(mediaUse);
    this.checkbox = this.label.parent().find('input[type="checkbox"]');
  }
}

class Media {
  constructor() {
    this.name = Selector('#edit-name-0-value');
    this.file = Selector('input[type="file"]');
    this.uploadedFile = Selector('span.file');
    this.accessTerms = Selector('#edit-field-access-terms option');
    this.mediaOf = Selector('#edit-field-media-of-0-target-id');
    this.submit = Selector('#edit-submit');

    this.mediaUse = Selector('#edit-field-media-use');
  }

  async toggleMediaUse(mediaUse) {
    // const checkbox = this.mediaUse
    //   .find('label').withText(mediaUse)
    //   .parent().find('input[type="checkbox"]');
    await t.click(this.mediaUse.find('label').withText(mediaUse));
  }

  /**
   *
   * @param {binary} file file bits
   * @param {string} name file name
   * @param {string} parent parent object title
   * @param {string} accessTerm AccessTerm
   * @param {string} mediaUse MediaUse
   */
  async fillInfo(file, name, parent, accessTerm, mediaUse) {
    await t
      .typeText(this.name, name, { paste: true }) // Set media name
      .setFilesToUpload(this.file, file)  // Add file
      .expect(this.uploadedFile.exists).ok()
      .click(this.accessTerms.withText(accessTerm)) // Set access term
      .typeText(this.mediaOf, parent, { paste: true }) // Type name of parent
      .click(Selector('li').withText(parent)); // Click the autocompleted item to set 'media of'

    await this.toggleMediaUse(mediaUse);
  }

  async submitMedia() {
    await t.click(this.submit);
  }
}

class Image extends Media {
  constructor() {
    super();
    this.altText = Selector('label').withText('Alternative text').parent().find('input[type="text"]');
  }

  async addImage(file, name, parent, accessTerm, mediaUse, altText) {
    await this.fillInfo(file, name, parent, accessTerm, mediaUse);
    await t.typeText(this.altText, altText, { paste: true });
  }
}

const addMediaPage = new AddMedia();
const mediaPage = new Media();
const imagePage = new Image();

async function addMedia(mediaType, options) {
  const { name, file, parent, accessTerm, mediaUse, altText } = options;

  await addMediaPage.addMedia(mediaType);

  if (mediaType === MediaType.Image) {
    await imagePage.addImage(file, name, parent, accessTerm, mediaUse, altText);
  } else {
    await mediaPage.fillInfo(file, name, parent, accessTerm, mediaUse);
  }

  await mediaPage.submitMedia();
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
  if (await addMediaPage.currentMedia.withText('Page 1 img').exists) {
    return;
  }

  console.log('   > Adding media');

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
