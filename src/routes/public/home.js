import {inject} from 'aurelia-framework';

import Socket from '../../core/socket';
import {quote_suffix} from '../eggs';

@inject(Socket)
export class Home {
  constructor(Socket) {
    this.connection = Socket;

    // Silly example to demonstrate 'real-time' site and infinite generators
    const quote_iterator = quote_suffix();
    this.quote = quote_iterator.next().value;
    const quote_loop = () => {
      setTimeout(() => {
        this.quote = quote_iterator.next().value;
        quote_loop();
      }, 2000)
    };
    quote_loop();
  }
}
