import { ItemDetail } from "./item-details";

class ImageDetail extends ItemDetail {
  constructor() {
    super();
    this.image = this.container.find('field-media--field-media-image');
  }
}

export default new ImageDetail();
