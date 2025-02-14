import * as numeral from 'numeral';

export const tokenUtil = {
  format: tokens => numeral(tokens / Math.pow(10, 6)).format('0,0.00[0000]'),
  formatShort: tokens => numeral(tokens / Math.pow(10, 6)).format('0,0.00'),
  formatPrice: price => numeral(price).format('0,0.000'),
};
