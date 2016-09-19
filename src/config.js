// WARNING: Replaced by template in CorpWebAnsible

const config = {
  backend: {
    uri: "http://localhost:3000",  // Hard-coded in. Needs template
    eve_sso_redirect: "/eve-sso",
    eve_sso_authorize: "/eve-sso/authorize",
    eve_sso_associate: "/eve-sso/associate"
  },
  format: {
    isk: '$0,0.00'
  }
};

export default config;
