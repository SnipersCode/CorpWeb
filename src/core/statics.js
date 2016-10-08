import config from '../config';
import numeral from 'numeral';

export const static_permissions = ["edit_auth_groups", "edit_user", "srp_approve"];

export const price_round = function round(value, string=true){
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

  if (string){
    return numeral(rounded).format(config.format.isk);
  } else {
    return rounded;
  }
};
