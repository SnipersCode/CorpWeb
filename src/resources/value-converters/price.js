import numeral from 'numeral';
import config from '../../config';

export class IskFormatValueConverter {
  toView(value) {
    return numeral(value).format(config.format.isk);
  }
}
