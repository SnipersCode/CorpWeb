import numeral from 'numeral';
import config from '../../config';
import {price_round} from '../../core/statics';

export class IskFormatValueConverter {
  toView(value) {
    return numeral(value).format(config.format.isk);
  }
}

export class IskFinalFormatValueConverter {
  toView(value) {
    return price_round(value);
  }
}
