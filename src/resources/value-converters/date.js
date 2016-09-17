import moment from 'moment';

export class DateValueConverter {
  toView(value) {
    return moment.utc(value).format("MMMM DD YYYY, HH:mm:ss") + " UTC";
  }
}
