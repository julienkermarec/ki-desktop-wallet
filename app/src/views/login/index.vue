<template>
  <div>
    <!-- <div class="alerts">
    <div class="alert alert-warning alert-dismissible fade show" style="position:relative;" role="alert">
      This tool aims at testing the functionnalities of the <strong>Kichain Testnet</strong> only!
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  </div> -->

    <div class="login-container main-container">
      <div id="imported_alert" />
      <img
        :src="'static/img/icons/ki-chain.png'"
        :style="{ marginTop: '50px' }"
      />
      <div class="info">
        <h1>
          {{ globalData.kichain.network.network }}
          <span>{{ $t('webwallet_wallet') }}</span>
        </h1>

        <p>
          <span>{{ $t('webwallet_home_create') }}</span>
        </p>

        <!-- =======================Modal tabs============================= -->
        <div class="deck d-flex justify-content-center">
          <a
            role="button"
            data-toggle="modal"
            data-target="#import-form"
            class="custom-card"
          >
            <div
              class="card h-100"
              :style="{ width: '15rem', display: 'inline-block' }"
            >
              <div
                class="card-body d-flex align-items-center flex-column justify-content-center h-100"
              >
                <img
                  src="static/img/chain/kichain_banner_import.png"
                  class="card-img-top"
                  style="width:60%"
                />
                <p class="card-text">
                  Import an existing Wallet
                </p>
              </div>
            </div>
          </a>
          <a
            role="button"
            data-toggle="modal"
            data-target="#add-form"
            class="custom-card"
          >
            <div
              class="card h-100"
              :style="{ width: '15rem', display: 'inline-block' }"
            >
              <div
                class="card-body d-flex align-items-center flex-column justify-content-center h-100"
              >
                <img
                  src="static/img/chain/kichain_banner_add.png"
                  class="card-img-top"
                  style="width:60%"
                />
                <p class="card-text">Generate a new Wallet</p>
              </div>
            </div>
          </a>
        </div>

        <!-- =======================Import modal============================= -->
        <ImportWalletForm
          modalId="import-form"
          @onResetModal="handleResetModal"
          @onImportWallet="handleImportWallet"
          @onImportMultiSigWallet="handleImportMultiSigWallet"
        />
        <!-- =======================Create modal============================= -->
        <CreateWalletForm
          modalId="add-form"
          @onResetModal="handleResetModal"
          @onImportCreatedWallet="handleImportWallet"
        />
      </div>
    </div>

    <footer class="copyright">
      KiFoundation 2022
    </footer>
  </div>
</template>

<script>
import Vue from 'vue';
import router from '@router';
import { createWalletFromMnemonic, createAddress } from '@tendermint/sig';
import { BDropdown, BDropdownItem } from 'bootstrap-vue';
Vue.component('BDropdownItem', BDropdownItem);
Vue.component('BDropdown', BDropdown);

import ToggleButton from 'vue-js-toggle-button';
Vue.use(ToggleButton);

import * as AES from 'crypto-js/aes';
import ImportWalletForm from '@cmp/wallets/modals/import-wallet';
import CreateWalletForm from '@cmp/wallets/modals/create-wallet';
import { mapMutations } from 'vuex';
import { SET_ACCOUNT } from '@store/account';
import { SET_CURRENT_WALLET, SET_WALLETS_LIST, SET_WALLETS_DICT, SET_CATEGORY_LIST} from '@store/wallets';
import { publicKeyCreate as secp256k1PublicKeyCreate } from 'secp256k1';

export default {
  components: {
    ImportWalletForm,
    CreateWalletForm,
  },
  data() {
    return {
      blockchain: 'KiChain',
      blockchain_lowercase: 'kichain',
      nodeUrl: '',
      network: '',
      token: '',
      mnemonic: '',
      multisig: false,
      ms_address: '',
      mnemonic_create: '',
      wallet_name: '',
      ms_address_correct: false,
      name_exists: false,
      mnemonic_correct: false,
      name_correct: true,
      password_correct: true,
      disabled: false,
      generated: false,
      wallets: [],
      selected_wallet: '',
      password: 'password',
      wallet_pass_tmp: '',
    };
  },
  created() {
    this.getChain();
  },

  mounted() {
    // this.getwallets();
    this.getCategories();
  },

  methods: {
    ...mapMutations({
      setAccount: SET_ACCOUNT,
      setCurrentWallet: SET_CURRENT_WALLET,
      setWalletsList: SET_WALLETS_LIST,
      setWalletsDict: SET_WALLETS_DICT,
      setCategoryList: SET_CATEGORY_LIST,
    }),
    getChain() {
      if (this.blockchain) {
        let blockchain = this.blockchain.toLowerCase();
        this.blockchain_lowercase = blockchain;
        this.nodeUrl = this.globalData[blockchain].nodeUrl;
        this.network = this.globalData[blockchain].network;
        this.token = this.globalData[blockchain].token;
        this.prefix = this.globalData[blockchain].prefix;
      }
    },

    handleImportMultiSigWallet(formValue) {
      const { wallet_name, wallet_pass_tmp, ms_address, threshold, pubkeys, multisig} = formValue;

      // Store Wallet
      this.storeInWalletList(wallet_name);

      localStorage.setItem(
        wallet_name,
        '{ "offline":' + false + ',"ms":' + multisig + ',\
        "privateKey":"","publicKey":{"type":"Buffer","data":[]},\
        "address":"' + ms_address + '",\
        "threshold":"'+ threshold + '",\
        "pubkeys":' + JSON.stringify(pubkeys) + '}',
      );

      localStorage.setItem('import_success', 'true');

      // window.location.reload();
      this.selected_wallet = wallet_name;
      $("#import-form").modal("hide");

      this.login();
    },

    handleImportWallet(formValue) {
      const { wallet_name, wallet_pass_tmp, mnemonic, private_key, multisig, offline, address} = formValue;

      var wallet = {}
      var priv_key = ''

      if ( mnemonic != null &&  private_key == null){
        // Create the wallet
        const wallet_temp = createWalletFromMnemonic(mnemonic, '', this.prefix);
        wallet = wallet_temp
        priv_key = wallet.privateKey.toString('hex')
      }

      if ( mnemonic == null &&  private_key != null){
        priv_key = private_key
        wallet.publicKey = secp256k1PublicKeyCreate(Buffer.from(private_key, 'hex'), true);
        wallet.address = createAddress(wallet.publicKey, this.prefix);
      }

      // Store Wallet
      this.storeInWalletList(wallet_name);

      // Encrypt the private key
      if (!offline){
        var encrypted_key = AES.encrypt(
          priv_key,
          wallet_pass_tmp,
        ).toString();

        wallet.privateKey = encrypted_key;
      }
      else{
        wallet.privateKey = "";
        wallet.publicKey = "";
      }

      wallet.ms = (multisig == undefined) ? false : multisig;
      wallet.offline = (offline == undefined) ? false : offline;

      // Save the encrypted wallet in the local storage
      localStorage.setItem(wallet_name, JSON.stringify(wallet));

      localStorage.setItem('import_success', 'true');

      this.selected_wallet = wallet_name;
      $("#import-form").modal("hide");
      $("#add-form").modal("hide");

      this.login();
    },

    storeInWalletList(wallet_name) {
      // Store the wallet name in the wallet name list if it doesnot already exist
      if (localStorage.getItem('wallet_list')){
        const list = localStorage.getItem('wallet_list');
        localStorage.setItem(
          'wallet_list',
          (list && wallet_name + ',' + list) || wallet_name,
        );
      }
      else{
        localStorage.setItem(
          'wallet_list',
          wallet_name
        );
      }
    },

    handleResetModal() {
      this.mnemonic = '';
      this.ms_address = '';
      this.wallet_name = '';
      this.wallet_pass_tmp = '';
      this.mnemonic_create = '';
      this.disabled = false;
      this.generated = false;
      this.name_exists = false;
      this.name_correct = true;
      this.mnemonic_correct = true;
      this.password_correct = true;
    },

    getCategories(){
      let categories = [];
      if (localStorage.getItem('categories')) {
        categories = localStorage.getItem('categories').split(',');
      }else{
        categories =  ['personal','work','multisignature','uncategorized']
        localStorage.setItem('categories', categories);
      }
      this.categories = categories.join(",");
      this.setCategoryList(categories);
    },

    login() {
      let nodeUrl = this.nodeUrl;
      let network = this.network;
      let chainid = this.network.chainId;

      if (localStorage.getItem('wallet_list')) {
        let identity = `{
          "blockchain":"cosmos",
          "chainId":"${chainid}"}`;

        localStorage.setItem('identity_' + this.blockchain_lowercase, identity);
        const id = JSON.parse(identity);

        const wallets = [];
        const wallets_dict = {};

        let wallet_list = localStorage.getItem('wallet_list').split(',');
        for (var w in wallet_list) {
          if (localStorage.getItem(wallet_list[w])){
            wallets.push({
              account: wallet_list[w],
              address: JSON.parse(localStorage.getItem(wallet_list[w])).address,
              privatekey: JSON.parse(localStorage.getItem(wallet_list[w]))
                .privateKey,
              publickey: Buffer.from(
                JSON.parse(localStorage.getItem(wallet_list[w])).publicKey,
              ).toString('hex'),
            });
            wallets_dict[JSON.parse(localStorage.getItem(wallet_list[w])).address] = wallet_list[w]
          }
        }
        this.setWalletsList(wallets);
        this.setWalletsDict(wallets_dict);

        router.push({
          name: 'home',
        });
      }
    },

    clear() {
      localStorage.clear();
      window.location.reload();
    },
  },
};
</script>
