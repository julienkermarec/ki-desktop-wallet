<template>
  <b-modal
    :id="modalId"
    tabindex="-1"
    hide-footer
    @show="resetData"
  >
    <div class="basic-form modal-body">
      <div class="modal-header" >
        <h5 class="modal-title">
          Withdraw from
          <strong :style="{ fontWeight: '600' }">{{
            validator.description.moniker
          }}</strong>
        </h5>
      </div>
      <form class="basic-form">
        <li class="token">
          <div class="d-flex justify-content-start align-items-center">
            <b-badge variant="light" class="ml-0" :style="{ fontSize: '14px' }">
              {{ validator.operator_address }}
            </b-badge>
          </div>
        </li>
        <ul>
          <li>
            <label>{{ $t('withdraw_config') }}</label>
            <select v-model="withdraw.config">
              <option key="0" value="0">
                Rewards only
              </option>
              <option key="1" value="1">
                Commisions only
              </option>
              <option key="2" value="2">
                Rewards and commissions
              </option>
            </select>
            <span
              v-if="withdraw.config == 1 || withdraw.config == 2"
              class="local-alert"
              >{{ $t('withdraw_with_commission_alert') }}</span
            >
          </li>
        </ul>
        <div v-if="!multisig">
          <label>{{ $t('enter_password') }}</label>
          <div class="buttonInside">
            <input
              v-model="wallet_pass_tmp"
              :type="password"
              :class="[wallet_pass_tmp ? '' : withdraw.alert]"
            />
            <a
              v-if="password == 'password'"
              class="inside"
              @click="password = 'text'"
              ><img
                src="static/img/icons/eye-on.png"
                style="width:25px; opacity:0.2"
            /></a>

            <a
              v-if="password == 'text'"
              class="inside"
              @click="password = 'password'"
              ><img
                src="static/img/icons/eye-off.png"
                style="width:25px; opacity:0.2"
            /></a>
          </div>
        </div>

        <li v-if="withdraw.output != ''" class="token">
          <label>{{ $t('webwallet_output') }}</label>
          <textarea v-model="withdraw.output" class="" rows="3" disabled />
        </li>
        <b-row align-v="center" align-h="center">
          <b-col class="text-center">
            <div v-if="!tx.loading">

            <span v-if="!multisig" >
              <a class="btn btn-primary" @click="sendWithdrawTx">
                {{ $t('withdrawtx') }}
              </a>
            </span>
            <span v-else >
              <a v-if="withdraw.output==''" class="btn btn-primary" @click="sendWithdrawTx">
                Generate
              </a>
              <a v-else class="btn btn-download"
              @click="download()">
                Download
              </a>
            </span>
          </div>

            <div v-else>
              <b-spinner small label="Small Spinner" />
            </div>
          </b-col>
        </b-row>
      </form>
    </div>
  </b-modal>
</template>

<script>
import { BRow, BCol, BSpinner, BModal, BBadge } from 'bootstrap-vue';
import { mapState, mapActions } from 'vuex';
import { POST_TX } from '@store/tx';
import util from '@static/js/util';

export default {
  components: {
    BRow,
    BCol,
    BSpinner,
    BModal,
    BBadge,
  },
  props: {
    modalId: {
      type: String,
      default: 'withdraw-modal',
    },
    validator: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      udenom: this.globalData.kichain.udenom,
      explorer: this.globalData.explorer,
      prefix: this.globalData.kichain.prefix,

      withdraw: {
        alert: '',
        config: 0,
        output: '',
      },
      password: 'password',
      wallet_pass_tmp: '',
    };
  },
  computed: {
    ...mapState({
      chainId: state => state.app.chainId,
    }),   
    currentWallet() {
      return this.$store.state.wallets.current;
    },
    advanced() {
      return this.$store.state.app.advanced;
    },
    multisig() {
      return this.$store.state.wallets.current.multisign;
    },
    account() {
      return this.$store.state.account;
    },
    tx() {
      return this.$store.state.tx;
    },
  },
  methods: {
    ...mapActions({
      postTx: POST_TX,
    }),
    resetData() {
      this.wallet_pass_tmp = '';
      (this.password = 'password'),
        (this.withdraw = {
          alert: '',
          config: 0,
          output: '',
        });
    },

    async sendWithdrawTx() {
      this.withdraw.alert = 'danger';
      let filled = true;

      if (this.wallet_pass_tmp === '' && !this.multisig) {
        filled = false;
      }

      if (!filled) {
        return false;
      }

      const limit = 200000;

      const msg_withdraw_reward = {
        type: 'cosmos-sdk/MsgWithdrawDelegationReward',
        value: {
          delegator_address: this.account.id,
          validator_address: this.validator.operator_address,
        },
      };

      const msg_withdraw_commision = {
        type: 'cosmos-sdk/MsgWithdrawValidatorCommission',
        value: {
          delegator_address: this.account.id,
          validator_address: this.validator.operator_address,
        },
      };


      const transaction = {
        msg: [],
        fee: {
          amount: [{
            denom: this.udenom,
            amount: "5000",
          }],
          gas: limit.toString(),
        },
        memo: '',
      };

      var msg = []

      if (this.withdraw.config == 0) {
        transaction.msg = [msg_withdraw_reward];
      }

      if (this.withdraw.config == 1) {
        transaction.msg = [msg_withdraw_commision];
      }

      if (this.withdraw.config == 2) {
        transaction.msg = [msg_withdraw_reward, msg_withdraw_commision];
      }

      for(var tmsg of transaction.msg){
        msg.push(util.translateTx(tmsg))
      }

      const fees = transaction.fee.amount[0].amount === '0' ? { "amount": [], "gas": transaction.fee.gas } : transaction.fee

      if (this.multisig) {
        this.withdraw.output =
          '{ "type": "cosmos-sdk/StdTx", "value":' +
          JSON.stringify(transaction) +
          '}';
      }

      else {
        try {
         let res = await this.postTx({
            transaction: {msg: msg, fees: fees, memo: transaction.memo, prefix: this.prefix, chainId: this.chainId} ,
            password: this.wallet_pass_tmp,
          });

          if (res.data.tx_response.code && res.data.tx_response.code != 0){
            throw new TypeError(res.data.tx_response.raw_log)
          }

          const $txhashlink = this.$createElement(
          'a',
          {
            attrs: {
                href:  this.explorer + "transactions/" + res.data.tx_response.txhash,
                target: "_blank"
              }
          },
           res.data.tx_response.txhash.slice(0, 30) + "..."
        )

          this.$bvToast.toast([$txhashlink] , {
            title: `Transaction success`,
            variant: 'success',
            autoHideDelay: 5000,
            solid: true,
            toaster: 'b-toaster-bottom-center',
          });
          this.$emit('onWithdrawSuccess');
        } catch (error) {
          this.$bvToast.toast(error.message, {
          title: `Transaction failed`,
          variant: 'danger',
          autoHideDelay: 5000,
          solid: true,
          toaster: 'b-toaster-bottom-center',
        });
          this.$emit('onWithdrawError');
        }
      }
    },
    download() {
      var date_today = util.getFormatedDate()
      return util.download(  date_today + '_withdraw_from_' + this.validator.description.moniker +'.json', document, this.withdraw.output);
    }
  },
};
</script>

<style scoped></style>
