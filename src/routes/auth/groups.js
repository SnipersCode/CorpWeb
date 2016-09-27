import {inject} from 'aurelia-framework';

import Socket from '../../core/socket';

import {static_permissions} from '../../core/statics';

@inject(Socket)
export class Groups {

  constructor(Socket) {
    this.socket = Socket;
    this.static_permissions = static_permissions;

    this.groups = [];
    this.current_group = null;
    this.id = '';
    this.priority = 1;
    this.permissions = {};
    this.initialize_group();
    this.group_users = [];
    this.selected_group_users = [];

    this.user_autocomplete = '';
    this.user_results = [];

  }

  attached() {
    this.socket.subscribe("auth", "groups.get", (data) => {
      this.groups = data;
      this.initialize_group();
      this.group_select.refresh();
    });

    this.socket.subscribe("auth", "groups.get_users", (data) => {
      this.group_users = data;
    });

    this.socket.subscribe("auth", "user.find", (users) => {
      this.user_results = users;
    });

    this.socket.send("auth", "groups.get", null);
  }

  detached() {
    this.socket.unsubscribe('auth', 'groups.get');
    this.socket.unsubscribe('auth', 'groups.get_users');
    this.socket.unsubscribe('auth', 'user.find');
  }

  initialize_group() {
    this.group_users = [];
    this.current_group = null;
    this.id = '';
    this.priority = 1;
    for (const permission of static_permissions) {
      this.permissions[permission] = 'null';
    }
  }

  select_group() {
    if (this.current_group) {
      this.id = this.current_group.id;
      this.priority = this.current_group.priority;
      for (const permission of Object.keys(this.current_group)){
        if (permission != 'id' && permission != 'priority'){
          this.permissions[permission] = '' + this.current_group[permission]
        }
      }
      this.socket.send("auth", "groups.get_users", this.id);
    } else {
      this.initialize_group();
    }
  }

  update() {
    if (this.current_group != null){
      this.socket.send("auth", "groups.edit", {
        id: this.current_group,
        priority: this.priority
      })
    }
  }

  edit(new_group=false){
    const to_send = {};
    to_send.id = this.id || 'Unnamed';
    to_send.priority = Number(this.priority) || 1;
    for (const permission of Object.keys(this.permissions)){
      switch (this.permissions[permission]){
        case "true":
          to_send[permission] = true;
          break;
        case "false":
          to_send[permission] = false;
          break;
        case "null":
          to_send[permission] = null;
          break;
        default:
          to_send[permission] = null;
          break;
      }
    }
    if (new_group){
      this.socket.send("auth", "groups.create", to_send);
    } else {
      this.socket.send("auth", "groups.edit", to_send);
    }
  }

  remove() {
    this.socket.send("auth", "groups.remove", this.id);
    this.initialize_group();
  }

  user_find() {
    this.socket.send("auth", "user.find", this.user_autocomplete);
    return true;
  }

  user_selected() {
    this.new_users = this.user_list.getSelected();
  }

  user_add() {
    if (this.new_users && this.current_group){
      for(const user of this.new_users){
        this.socket.send("auth", "groups.add_user", {
          user_id: user.id,
          groups: [this.id]
        })
      }
    }
  }

  group_user_selected() {
    this.selected_group_users = this.group_user_list.getSelected();
  }

  user_remove(){
    if (this.selected_group_users && this.current_group){
      for (const user of this.selected_group_users){
        this.socket.send("auth", "groups.remove_user", {
          user_id: user.id,
          groups: [this.id]
        })
      }
    }
  }
}
