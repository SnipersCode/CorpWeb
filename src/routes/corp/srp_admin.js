import {inject} from 'aurelia-framework';
import {MdToastService} from 'aurelia-materialize-bridge';

import Socket from '../../core/socket';
import Changefeeds from '../../core/changefeeds';

@inject(Socket, Changefeeds, MdToastService)
export class SRP_Admin {
  constructor(Socket, Changefeeds, MdToastService) {
    this.socket = Socket;
    this.changefeeds = Changefeeds;
    this.toast = MdToastService;

    this.group_map = new Map();
    this.ship_info = {};

    this.name = '';
    this.current_rule = null;
    this.groups = {};
    this.ships = {};
    this.flags = [];
    this.new_flag = '';

    this.ship_autocomplete = '';
    this.ship_results = [];
    this.selected_ships = [];
    this.ship_display = [];
  }

  attached() {
    this.changefeeds.references.srp_admin_select = this.srp_admin_select;
    this.socket.subscribe("srp", "ship_groups.get", (groups) => {
      for (const group of groups.sort((a, b) => a.name.localeCompare(b.name))) {
        this.group_map.set(group.id, group.name);
      }
      this.initialize_rules();
    });
    this.socket.subscribe("srp", "rules.edit", (rule) => {
      this.srp_admin_select.refresh();
      this.toast.show(rule + ' saved', 4000);
      this.initialize_rules();
    });
    this.socket.subscribe("srp", "rules.delete", (rule) => {
      this.srp_admin_select.refresh();
      this.toast.show(rule + ' deleted', 4000);
      this.initialize_rules();
    });
    this.socket.subscribe("statics", "ships.by_name", (ships) => {
      this.ship_results = ships;
    });
    this.socket.subscribe("statics", "ships.get_all", (ships) => {
      ships.forEach((ship) => this.ship_info[ship.id] = ship.name);
      this.refresh_ships();
    });

    this.socket.send("srp", "rules.get");
    this.socket.send("srp", "ship_groups.get", null);
    this.socket.send("statics", "ships.get_all", [...Object.keys(this.ship_results)]);
  }

  detached() {
    this.socket.unsubscribe("srp", "ship_groups.get");
    this.socket.unsubscribe("srp", "rules.edit");
    this.socket.unsubscribe("srp", "rules.delete");
    this.socket.unsubscribe("statics", "ships.by_name");
    this.socket.unsubscribe("statics", "ships.get_all");
  }

  initialize_rules() {
    this.current_rule = null;
    this.name = '';
    this.flags = this.changefeeds.srp_flags;
    for (const [group_id, group_name] of this.group_map) {
      this.groups[group_id] = 0;
    }
    // Not the same as this.ships = {};
    // Theory: Because this.ships is bound to Aurelia, zombie keys return
    for (const key of Object.keys(this.ships)){
      delete this.ships[key];
    }
    this.refresh_ships();
  }

  select_rule() {
    this.flags = this.changefeeds.srp_flags;
    if (this.current_rule) {
      this.name = this.current_rule.id;
      for (const [group_id, group_name] of this.group_map) {
        const group_multiplier = this.current_rule.groups.get(group_id);
        this.groups[group_id] = group_multiplier ? group_multiplier : 0;
      }
      // Not the same as this.ships = {};
      // Theory: Because this.ships is bound to Aurelia, zombie keys return
      for (const key of Object.keys(this.ships)){
        delete this.ships[key];
      }
      this.ship_display = []; // Clear display
      const ship_ids = [];
      for (const [ship_id, ship_multiplier] of this.current_rule.ships){
        this.ships[ship_id] = ship_multiplier;
        ship_ids.push(ship_id);
      }
      this.socket.send("statics", "ships.get_all", ship_ids);
    } else {
      this.initialize_rules();
    }
  }

  refresh_ships() {
    this.ship_display = Object.keys(this.ships)
      .map((id) => [id, this.ship_info[id]])
      .sort((a, b) => a[1].localeCompare(b[1]));
  }

  send(flags_only=false) {
    const to_send = {
      target: this.name,
      rule: {groups: [], ships: []},
      flags: this.flags,
      flags_only: flags_only
    };
    for (const group of Object.keys(this.groups)){
      to_send.rule.groups.push([+group, +this.groups[group]]);
    }
    for (const ship of Object.keys(this.ships)){
      to_send.rule.ships.push([+ship, +this.ships[ship]]);
    }
    this.socket.send("srp", "rules.edit", to_send);
  }

  ship_find() {
    this.socket.send("statics", "ships.by_name", this.ship_autocomplete);
  }

  ship_select() {
    this.selected_ships = this.ship_list.getSelected();
  }

  ship_add() {
    for (const ship of this.selected_ships) {
      this.ships[ship.id] = 0;
    }
    const new_ships = this.selected_ships.map((ship) => ship.id);
    this.socket.send("statics", "ships.get_all", new_ships);
  }

  ship_delete(ship_id) {
    delete this.ships[ship_id];
    this.refresh_ships();
  }

  rule_delete(rule_id) {
    this.socket.send("srp", "rules.delete", rule_id);
  }

  flag_add(){
    this.flags.push(this.new_flag);
  }

  flag_delete(flag){
    const index = this.flags.indexOf(flag);
    if (index !== -1){
      this.flags.splice(index,1);
    }
  }
}
