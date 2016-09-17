import {inject, NewInstance} from 'aurelia-framework';
import {ValidationController, ValidationRules} from 'aurelia-validation';
import {MdToastService, MaterializeFormValidationRenderer} from 'aurelia-materialize-bridge';
import numeral from 'numeral';
import {url_regex} from '../../core/snippits';

import Socket from '../../core/socket';
import Changefeeds from '../../core/changefeeds';
import config from '../../config';

@inject(Socket, Changefeeds, MdToastService, NewInstance.of(ValidationController))
export class SRP {
  constructor(Socket, Changefeeds, MdToastService, ValidationController){
    this.socket = Socket;
    this.changefeeds = Changefeeds;
    this.toast = MdToastService;
    this.validation = ValidationController;
    this.validation.addRenderer(new MaterializeFormValidationRenderer());

    this.srp_types = Object.keys(this.changefeeds.srp_rules);
    this.personal_selected = [];
    this.srp_type = "standard";
    this.aar = '';
    this.reimburse_to = this.socket.info.character_name;

    this.lossmails = [];
    this.personal_base_price = 0;
    this.personal_srp_total = 0;

    this.socket.subscribe("srp", "lossmails.get", (data) => {
      data.map(this.recalculate.bind(this));
      this.lossmails = data;
      this.updating_losses = false;
      this.personal_prices();
    });
    this.socket.send("srp", "lossmails.all", null);
    this.socket.send("srp", "lossmails.get", null);
    this.updating_losses = true;

    this.rules = ValidationRules
      .ensure('aar').required().matches(url_regex)
      .rules;

  }

  personal_prices() {
    this.lossmails.map(this.recalculate.bind(this));
    if (this.personal){
      this.personal_selected = this.personal.getSelected();
      this.personal_base_price = this.personal_selected.reduce(
        (prev, cur) => prev + cur.srp_base_price, 0
      );
      this.personal_srp_total = this.personal_selected.reduce(
        (prev, cur) => prev + cur.srp_total, 0
      );
    }
  }

  multiplier(ship_group_id) {
    let multiplier = this.changefeeds.srp_rules[this.srp_type].get(ship_group_id);
    if (!multiplier || !ship_group_id){ // No specific rule or no lower ship group
      multiplier = this.changefeeds.srp_rules[this.srp_type].get(null);
      if (!multiplier) {  // No default
        multiplier = 0;
      }
    }
    return multiplier;
  }

  recalculate(lossmail) {
    lossmail.multiplier = this.multiplier(lossmail.lower_ship_group_id);
    lossmail.srp_total = lossmail.srp_base_price * lossmail.multiplier;
    return lossmail;
  }

  all_selection(event) {
    this.all_selected = this.all.getSelected();
  }

  submit() {
    this.validation.validate().then((errors) => {
      if (errors.length !== 0){
        return;
      }
      this.aar = '';
      this.srp_type = "standard";
      this.toast.show(
        `Work In Progress: ${numeral(this.personal_srp_total).format(config.format.isk)}`,
        5000);
      $(this.submit_modal).closeModal();
      this.refresh();
    });
  }

  refresh() {
    this.socket.send("srp", "lossmails.get", null);
    this.updating_losses = true;
  }
}
