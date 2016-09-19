import {inject} from 'aurelia-framework';
import {MdToastService} from 'aurelia-materialize-bridge';
import {RedirectToRoute} from 'aurelia-router';

import Socket from 'core/socket';
import Site_Config from './config';
import Nav from 'core/nav';
import Changefeeds from 'core/changefeeds';

@inject(Socket, Site_Config, MdToastService, Nav, Changefeeds)
export class App {

  constructor(Socket, Site_Config, Toast, Nav, Changefeeds) {
    this.socket = Socket;
    this.site_config = Site_Config;
    this.toast = Toast;
    this.nav = Nav;
    this.changefeeds = Changefeeds;

    this.changefeeds.attach_toast(Toast);
    if (this.socket.info.user_id){
      this.socket.send("auth", "user.characters", this.socket.info.user_id);
    }

  }

  configureRouter(config, router){
    config.title = 'CorpWeb';
    config.options.pushState = true;
    config.addAuthorizeStep(AuthorizeStep);
    config.map(this.nav.routes);

    this.router = router;
  }

  connection() {
    if (this.socket.state == "Connected") {
      this.socket.close();
      console.log(`Closed connection to ${this.socket.connection_uri}`);
    } else if (this.socket.state == "Disconnected") {
      this.socket.open();
      console.log(`Opened connection to ${this.socket.connection_uri}`);
    }
  }

  logout() {
    this.socket.send("auth", "logout", false);
    this.router.navigateToRoute('home');
  }

  associated() {
    this.socket.send("auth", "user.characters", this.socket.info.user_id);
    return true;
  }

}

@inject(Socket)
class AuthorizeStep {
  constructor(Socket) {
    this.socket = Socket;
  }

  run(navigationInstruction, next) {
    for (const instruction of navigationInstruction.getAllInstructions()){
      // Has permissions
      if (instruction.config.auth && this.socket.info.permissions) {
        // Bypass check for super admins
        if (this.socket.info.permissions.get('super_admin')) {
          return next();
        }
        // Must have ALL permissions specified in route config
        for(const group of instruction.config.settings.auth){
          if (!this.socket.info.permissions.get(group)){
            return next.cancel(new RedirectToRoute('home'));
          }
        }
      }
      // Instruction needs auth, but user doesn't have any permissions
      else if (instruction.config.auth) {
        return next.cancel(new RedirectToRoute('home'));
      }
    }
    return next();
  }
}
