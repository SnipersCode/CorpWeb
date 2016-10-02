export default class Nav {
  constructor() {
    this.routes = [
      { route: '', name: 'home', moduleId: 'routes/public/home', nav: true, title: "Home"},
      { route: 'srp', name: 'srp', moduleId: 'routes/corp/srp', nav: true, title: "SRP", auth: true,
        settings: { auth: ["corporation"] } },
      { route: 'srp/admin', name: 'srp-admin', moduleId: 'routes/corp/srp_admin', nav: false, title: "SRP - Admin",
        auth: true, settings: {auth: ['srp_approve']}},
      { route: 'groups', name: 'groups', moduleId: 'routes/auth/groups', nav: true, title: "Groups", auth: true,
        settings: { auth: ["corporation", "edit_auth_groups"] } },
      { route: 'eve-sso', name: 'eve-sso', moduleId: 'routes/auth/eve_sso', nav: false}
    ];
    this.bar = {};
    this.socket = {
      check_auth: function always_false() {
        return false;
      }
    }
  }

  set_socket(socket){
    this.socket = socket;
  }

  update_bar() {
    for (const route of this.routes) {
      if (route.nav && !route.auth) {
        this.bar[route.title] = true;
      } else {
        this.bar[route.title] = !!(route.nav && this.socket.check_auth(route.settings.auth));
      }
    }
  }
}
