import Vue from 'vue';
import Vuex from 'vuex';

import { moduleWallets } from './wallets';
import { moduleValidators } from './validators';
import { moduleApp } from './app';
import { moduleAccount } from './account';
import { moduleTransfer } from './transfer';
import { moduleTx } from './tx';

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    wallets: moduleWallets.state,
    validators: moduleValidators.state,
    app: moduleApp.state,
    account: moduleAccount.state,
    transfer: moduleTransfer.state,
    tx: moduleTx.state,
  },
  actions: {
    ...moduleWallets.actions,
    ...moduleValidators.actions,
    ...moduleApp.actions,
    ...moduleAccount.actions,
    ...moduleTransfer.actions,
    ...moduleTx.actions,
  },
  getters: {
    ...moduleWallets.getters,
    ...moduleValidators.getters,
    ...moduleApp.getters,
    ...moduleAccount.getters,
    ...moduleTransfer.getters,
    ...moduleTx.getters,
  },
  mutations: {
    ...moduleWallets.mutations,
    ...moduleValidators.mutations,
    ...moduleApp.mutations,
    ...moduleAccount.mutations,
    ...moduleTransfer.mutations,
    ...moduleTx.mutations,
  },
  // @TODO: modules:
});
