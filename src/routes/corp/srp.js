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
  constructor(Socket, Changefeeds, MdToastService, ValidationController) {
    this.socket = Socket;
    this.changefeeds = Changefeeds;
    this.toast = MdToastService;
    this.validation = ValidationController;
    this.validation.addRenderer(new MaterializeFormValidationRenderer());

    this.personal_selected = [];
    this.srp_type = "standard";
    this.aar = '';
    this.srp_note = '';
    this.reimburse_to = this.socket.info.character_name;

    this.lossmails = [];
    this.personal_base_price = 0;
    this.personal_srp_total = 0;

    this.edit_override = false;
    this.edit_price = 0;
    this.edit_type = 'override';

    this.pending_only = true;

    this.rules = ValidationRules
      .ensure('aar').required().matches(url_regex)
      .rules;
  }

  attached() {
    this.changefeeds.references.srp_select = this.type_select;
    this.changefeeds.references.srp_pay_to_select = this.pay_to_select;

    this.socket.subscribe("srp", "lossmails.get", (data) => {
      data.map(this.recalculate.bind(this));
      this.lossmails = data;
      this.updating_losses = false;
      if (this.personal) {
        this.personal.clearSelection();
      }
      this.personal_prices();
    });
    this.socket.subscribe("srp", "lossmails.submit", (data) => {
      this.toast.show("Send Success",5000);
      this.refresh();
    });
    this.socket.send("srp", "lossmails.all", null);
    this.socket.send("auth", "user.characters", this.socket.info.user_id);  // Force check associations
    this.refresh();
  }

  detached() {
    this.socket.unsubscribe('srp', 'lossmails.get');
    this.socket.unsubscribe('srp', 'lossmails.submit');
  }

  personal_prices() {
    this.lossmails.map(this.recalculate.bind(this));
    if (this.personal) {
      this.personal_selected = this.personal.getSelected();
      this.personal_base_price = this.personal_selected.reduce(
        (prev, cur) => prev + cur.srp_base_price, 0
      );
      this.personal_srp_total = this.personal_selected.reduce(
        (prev, cur) => prev + cur.srp_total, 0
      );
    }
  }

  multiplier(srp_type, ship_group_id) {
    let multiplier = this.changefeeds.srp_rules[srp_type].get(ship_group_id);
    if (!multiplier || !ship_group_id) { // No specific rule or no lower ship group
      multiplier = this.changefeeds.srp_rules[srp_type].get(null);
      if (!multiplier) {  // No default
        multiplier = 0;
      }
    }
    return multiplier;
  }

  recalculate(lossmail) {
    lossmail.multiplier = this.multiplier(this.srp_type, lossmail.lower_ship_group_id);
    lossmail.srp_total = lossmail.srp_base_price * lossmail.multiplier;
    return lossmail;
  }

  submit() {
    this.validation.validate().then((errors) => {
      if (errors.length !== 0) {
        return;
      }
      const to_send = this.personal.getSelected();
      to_send.map((lossmail) => {
        lossmail.reimburse_to = this.reimburse_to;
        lossmail.aar = this.aar;
        lossmail.note = this.srp_note;
        lossmail.srp_type = this.srp_type;
      });
      this.socket.send("srp", "lossmails.submit", to_send);
      this.aar = '';
      this.srp_note = '';
      this.srp_type = "standard";
      this.updating_losses = true;
      $(this.submit_modal).closeModal();
    });
  }

  refresh() {
    this.updating_losses = true;
    this.socket.send("srp", "rules.get");
    this.socket.send("srp", "lossmails.get", null);
  }

  edit_select(lossmail) {
    this.edit_lossmail = lossmail;
    this.edit_aar = lossmail.aar;
    this.edit_note = lossmail.note;
    this.edit_override = !!lossmail.overridden;
    this.edit_multiplier = 'N/A';
    if (!this.edit_override) {
      this.edit_type = lossmail.srp_type;
    } else {
      this.edit_type = 'override';
    }
    this.edit_prices(this.edit_override);
  }

  edit_prices(override) {
    this.edit_override = override;
    if(!override){
      this.edit_multiplier = this.multiplier(this.edit_type, this.edit_lossmail.lower_ship_group_id);
      this.edit_price = this.edit_lossmail.srp_base_price * this.edit_multiplier;
    } else {
      this.edit_multiplier = 'N/A';
      this.edit_price = this.edit_lossmail.srp_total;
    }
  }

  edit_submit() {
    this.socket.send("srp", "lossmails.edit", {
      id: this.edit_lossmail.id,
      aar: this.edit_aar,
      note: this.edit_note,
      overridden: this.edit_override,
      srp_total: this.edit_price,
      srp_type: this.edit_override ? 'override' : this.edit_type
    })
  }

  edit_status(status, lossmail) {
    this.socket.send("srp", "lossmails.edit", {
      id: lossmail.id,
      srp_status: status
    })
  }

  toggle_pending() {
    this.pending_only = !this.pending_only;
    return true;
  }
}
