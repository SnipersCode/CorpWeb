export default class Changefeeds {

  constructor(){
    this.associated_characters = [];
    this.logging_in = false;
    this.associating = false;
    this.lossmails_all = new Map();

    // Fake settings
    this.srp_rules = {
      standard: new Map([
        [5, 1],      // T1 Frigate
        [1362, .5],  // Faction Frigate
        [1364, 1],   // T2 Frigate

        [464, 1],    // T1 Destroyer
        [1373, .5],  // T2 Destroyer

        [6, 1],      // T1 Cruiser
        [1369, .5],  // Faction Cruiser
        [1368, .5],  // T2 Cruiser

        [469, .5],   // T1 Battlecruiser
        [1703, .5],  // Faction Battlecruiser
        [1375, .5],  // T2 Battlecruiser

        [7, .5],     // T1 Battleship
        [1378, .5],  // Faction Battleship
        [1377, .5],  // T2 Battleship

        [8, 0],      // T1 Industrial Ship
        [1385, 0],   // T2 Industrial Ship

        [761, 0],    // Capital: Dreadnought
        [766, 0],    // Capital: Freighter
        [812, 0],    // Capital: Titan
        [817, 0],    // Capital: Carriers
        [1047, 0],   // Capital: Capital Industrial Ships
        [1089, 0],   // Capital: Jump Freighters
        [2271, 0],   // Capital: Force Auxiliaries

        [null, 0]    // Default
      ]),
      fc: new Map([[null, 1]]),
      solo: new Map([[null, 0.4]])
    }
  }

  attach_toast(toast_service){
    this.toast = toast_service;
  }

  attach_socket(socket) {
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
    socket.subscribe("srp", "change.lossmails", (data) => {
      data.forEach((killmail) => {
        this.lossmails_all.set(killmail.id, killmail);
      })
    });
    socket.subscribe("srp", "lossmails.all", (data) => {
      data.forEach((killmail) => {
        this.lossmails_all.set(killmail.id, killmail);
      });
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
