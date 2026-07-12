/*!
 * TRIVIUM core — public API.
 * The core knows no engine. Adapters are registered by the caller.
 */
"use strict";

const wir = require("./src/wir");
const ledger = require("./src/ledger");
const coherence = require("./src/coherence");
const { createRegistry } = require("./src/registry");
const { translate } = require("./src/router");

module.exports = {
  ...wir,
  ROUTES: ledger.ROUTES,
  formatReport: ledger.formatReport,
  checkCoherence: coherence.check,
  createRegistry,
  translate,
};
