export default class Changefeeds {

  constructor(){
    this.associated_characters = [];
    this.logging_in = false;
    this.associating = false;
    this.lossmails_all = new Map();

    // Fake settings
    this.srp_rules = {
      standard: new Map([
        [null, 0]    // Default
      ])
    };
    this.srp_types = [];

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
        if (rule != "id" && rule != "group"){
          this.srp_rules[rule] = new Map(data[rule]);
        }
      }
      this.srp_types = Object.keys(this.srp_rules);
      if (this.references.srp_select) {
        this.references.srp_select.refresh();
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
