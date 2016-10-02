export default class Changefeeds {

  constructor(){
    this.associated_characters = [];
    this.logging_in = false;
    this.associating = false;
    this.lossmails_all = new Map();

    // Fake settings
    this.srp_rules = {
      standard: {
        groups: new Map([
          [null, 0]    // Default
        ]),
        ships: new Map([
          [null, 0]
        ])
      }
    };
    this.srp_types = [];
    this.srp_flags = [];

    // External references. There's probably a better way to implement this
    this.references = {};

  }

  attach_toast(toast_service){
    this.toast = toast_service;
  }

  attach_socket(socket) {

    const lossmail_adjust = (data) => {
      data.forEach((killmail) => {
        this.lossmails_all.set(killmail.id, killmail);
      });
      // Reorder
      // Careful! Babel might be messing with spread (...) syntax.
      // This is NOT equivalent to [...this.lossmails_all] or Array.from([...this.lossmails_all])
      this.lossmails_all = new Map(Array.from(this.lossmails_all.entries()).sort(
        (a,b) => new Date(b[1].kill_time) - new Date(a[1].kill_time)))
    };

    socket.subscribe("auth", "user.characters", (data) => {
      this.associated_characters = data;
      if (this.references.srp_pay_to_select) {
        this.references.srp_pay_to_select.refresh();
      }
    });
    socket.subscribe("auth", "change.session", (data) => {
      this.logging_in = false;
      this.display('Logged In', 2000);
    });
    socket.subscribe("auth", "change.association", (data) => {
      this.associating = false;
      this.display(`${data} successfully associated`, 2000);
    });
    socket.subscribe("srp", "change.lossmails", lossmail_adjust);
    socket.subscribe("srp", "lossmails.all", lossmail_adjust);
    socket.subscribe("srp", "change.rules", (data) => {
      for (const rule of Object.keys(data)){
        if (rule != "id" && rule != "group" && rule != "flags"){
          this.srp_rules[rule] = {
            id: rule,
            groups: new Map(data[rule].groups),
            ships: new Map(data[rule].ships)
          };
        } else if (rule == "flags") {
          this.srp_flags = data[rule];
        }
      }
      this.srp_types = Object.keys(this.srp_rules);

      // Select Refreshes (References from other pages)
      if (this.references.srp_select) {
        this.references.srp_select.refresh();  // srp.js
      }
      if (this.references.srp_admin_select) {
        this.references.srp_admin_select.refresh();  //srp_admin.js
      }
    });
  }

  display(message, timeout) {
    if(this.toast){
      this.toast.show(message, timeout);
    }
  }

  flag(key, timeout){
    this[key] = true;
    setTimeout(() => this[key] = false, timeout);
  }
}
