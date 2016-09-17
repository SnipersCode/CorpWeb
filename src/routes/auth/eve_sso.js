import {inject} from 'aurelia-framework'
import {RedirectToRoute, Redirect} from 'aurelia-router'
import {HttpClient} from 'aurelia-fetch-client';
import jwt_decode from 'jwt-decode';

import Socket from '../../core/socket';
import Changefeeds from '../../core/changefeeds';
import site_config from '../../config';

@inject(Socket, Changefeeds)
export class Eve_SSO {

  constructor(Socket, Changefeeds) {
    this.connection = Socket;
    this.changefeeds = Changefeeds;
  }

  canActivate(params, routeConfig, navigationInstruction) {
    if (params.code && params.state) {
      this.code = params.code;
      this.state = params.state;

      const client = new HttpClient();
      const token = localStorage.getItem('CorpWeb:JWT');
      if (token) {
        // Signed in. Association flow.
        const payload = jwt_decode(token);
        client.fetch(
          site_config.backend.uri + site_config.backend.eve_sso_associate +
          '?code=' + encodeURIComponent(this.code) +
          '&state=' + encodeURIComponent(this.state) +
          '&user_id=' + encodeURIComponent(payload.user_id),
          {credentials: 'include'}
        )
          .then((response) => {
            this.changefeeds.flag("associating", 60000);
          })
          .catch((error) => console.log(error));

      } else {
        // Not signed in. Sign in flow.
        client.fetch(
          site_config.backend.uri + site_config.backend.eve_sso_authorize +
          '?code=' + encodeURIComponent(this.code) +
          '&state=' + encodeURIComponent(this.state),
          {credentials: 'include'}
        )
          .then((response) => response.json())
          .then((json_response) => {
            this.connection.update_jwt(json_response["jwt"]);
            this.connection.initialize();
            this.changefeeds.flag("logging_in", 60000);
          })
          .catch((error) => console.log(error));
      }
    }

    // Prevent any requests from rendering view
    // Might cause problems in the future
    return new RedirectToRoute('home');
  }

}
