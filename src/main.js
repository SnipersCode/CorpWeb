import environment from './environment';

// Force tracing order
import $ from 'jquery';
import 'materialize-css';
import 'aurelia-materialize-bridge';

//Configure Bluebird Promises.
//Note: You may want to use environment-specific configuration.
Promise.config({
  warnings: {
    wForgottenReturn: false
  }
});

export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .plugin('aurelia-validation')
    .plugin('aurelia-materialize-bridge', b => b.useAll())
    .feature('resources');

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot());
}
