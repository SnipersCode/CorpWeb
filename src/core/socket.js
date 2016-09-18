import {inject} from 'aurelia-framework';
import Primus from 'primus';
import jwt_decode from 'jwt-decode';

import config from '../config';
import Nav from '../core/nav';
import Changefeeds from 'core/changefeeds';

@inject(Nav, Changefeeds)
export default class Socket {

  constructor(Nav, Changefeeds) {

    this.nav = Nav;
    this.nav.set_socket(this);

    this.info = null;
    this.update_jwt(localStorage.getItem('CorpWeb:JWT'));
    this.validate_jwt();
    // Delete jwt if user_id is null (user refreshed before log in)
    if (this.info.user_id === null) {
      this.update_jwt(null);
    }

    this.connection_uri = config.backend.uri;
    this.connection = Primus.connect(config.backend.uri);
    this.initialize();
    // Default to reconnecting
    this.state = "Reconnecting";
    this.action = "Reconnecting...";
    this.reconnect = {seconds: 0, attempt: 0, max: 0};
    this.latest_data = null;

    this.changefeeds = Changefeeds;
    this.changefeeds.attach_socket(this);

    // Initial listeners
    this.connection.on('data', (data) => {
      this.latest_data = data;
      if (data.error == "auth.session" || data.error == "auth.jwt"){
        this.update_jwt(null);
        console.log(data);
      } else if (data.error) {
        this.update_jwt(null);
        console.log(data);
      } else {
        // Update JWT on each message
        this.update_jwt(data.jwt);
      }

    }).on('open', () => {
      this.state = "Connected";
      this.action = "Disconnect";
    }).on('end', () => {
      this.state = "Disconnected";
      this.action = "Connect";
    }).on('reconnect scheduled', (opts) => {
      console.log(`Connecting to ${config.backend.uri}`);
      this.state = "Reconnecting";
      this.action = "Reconnecting...";
      this.reconnect = {seconds: opts.scheduled, attempt: opts.attempt, max: opts.retries};
    }).on('reconnected', () => {
      this.state = "Connected";
      this.action = "Disconnect";
    });
  }

  initialize() {
    // Send request in order to verify jwt
    // Can be used to send initialization data in the future.
    this.send("Auth", null, null, true);
  }

  update_jwt(jwt){
    if (!jwt) {
      localStorage.removeItem("CorpWeb:JWT");
    } else {
      localStorage.setItem('CorpWeb:JWT', jwt);
    }
    this.jwt = jwt;
    this.info = jwt ? jwt_decode(jwt) : {};
    this.info.permissions = this.info.permissions ? new Map(this.info.permissions) : new Map();
    this.super_admin = this.info.permissions.get('super_admin');
    this.has_groups = this.info.auth_groups && this.info.auth_groups !== [];
    this.nav.update_bar();
  }

  validate_jwt() {
    if (this.info.exp && this.info.exp < Date.now() / 1000 + 300) {
      this.update_jwt(null);
    }
  }

  check_auth(groups) {
    if (this.info.permissions && !this.info.permissions.get('super_admin')){  // Bypass check for super admins
      for (const group of groups){
        if (!(this.info.permissions && this.info.permissions.get(group))){
          return false;
        }
      }
    }
    return true;
  }

  get jwt_string(){
    return JSON.stringify(this.info);
  }

  get is_reconnecting() {
    return !(this.connection.readyState === Primus.CLOSED && !this.connection.recovery.reconnecting());
  }

  send(module, endpoint, payload, buffer = true) {
    if (this.connection.readyState === Primus.OPEN || buffer){
      this.validate_jwt();
      this.connection.write({jwt: this.jwt, module: module, endpoint: endpoint, payload: payload })
    }
  }

  open() {
    if (!this.is_reconnecting) {
      this.validate_jwt();
      this.connection.open();
      this.initialize();
    }
  }

  close() {
    this.connection.end();
  }

  subscribe(module, endpoint, callback) {
    this.connection.addListener('data', (data) => {
      if (!module || (data.module == module && !endpoint) || (data.module == module && data.endpoint == endpoint)){
        callback(data.payload);
      }
    });
  }

  get direct_state() {
    //noinspection JSAccessibilityCheck
    switch (this.connection.readyState) {
      case Primus.OPENING:
        return "Opening";
        break;
      case Primus.CLOSED:
        return "Closed";
        break;
      case Primus.OPEN:
        return "Open";
        break;
      default:
        return "Unknown"
    }
  }

}
