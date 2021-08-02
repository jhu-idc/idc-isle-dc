import { Selector, t } from "testcafe";
import ContactModal from "./contact-modal";

export class ItemDetail {
  constructor() {
    this.container = Selector('#item-container');

    this.title = this.container.find('h3').nth(0);
    this.description = this.container.find('#item-description');

    const actions = this.container.find('button');
    this.downloadBtn = actions.withText('Download Item');
    this.exportBtn = actions.withText('Export Metadata');
    this.contactBtn = actions.withText('Ask the Collection Admin');

    this.metadata = this.container.find('.node--id-49 div.field').filterVisible();

    this.contactModal = ContactModal;
  }
}

export default new ItemDetail();
