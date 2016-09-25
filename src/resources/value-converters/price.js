import numeral from 'numeral';
import config from '../../config';

export class IskFormatValueConverter {
  toView(value) {
    return numeral(value).format(config.format.isk);
  }
}

export class IskFinalFormatValueConverter {
  toView(value) {
    // Rounding Logic
    // If straight 0, then stays 0
    // If rounded to 0, then use minimum (1 million)
    // If rounded is not a number, then use 0
    // Else, use rounded number (to nearest million)
    let rounded = value;
    if (value != 0) {
      rounded = Math.round(value / 1000000) * 1000000;
      if (rounded == 0) {
        rounded = 1000000;
      } else if (isNaN(rounded)) {
        rounded = 0;
      }
    }

    return numeral(rounded).format(config.format.isk);
  }
}
