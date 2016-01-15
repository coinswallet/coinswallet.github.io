import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import BalanceComponent from "../Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "../Utility/AmountSelector";
import AccountActions from "actions/AccountActions";

@BindToChainState({keep_updating:true})
class WithdrawModalBlocktrades extends React.Component {

   static propTypes = {
       account: ChainTypes.ChainAccount.isRequired,
       issuer: ChainTypes.ChainAccount.isRequired,
       asset: ChainTypes.ChainAsset.isRequired,
       output_coin_name: React.PropTypes.string.isRequired,
       output_coin_symbol: React.PropTypes.string.isRequired,
       output_coin_type: React.PropTypes.string.isRequired,
       url: React.PropTypes.string,
       output_wallet_type: React.PropTypes.string
   }

   constructor( props ) {
      super(props);
      this.state = {
         withdraw_amount: null,
         withdraw_address: null,
         withdraw_address_check_in_progress: false,
         withdraw_address_is_valid: false
      }
   }

   onWithdrawAmountChange( {amount, asset} ) {
      this.setState( {withdraw_amount:amount} );
   }

   onWithdrawAddressChanged( e ) {
      let new_withdraw_address = e.target.value;

      fetch(this.props.url + '/wallets/' + this.props.output_wallet_type + '/address-validator?address=' + encodeURIComponent(new_withdraw_address),
            {
               method: 'get',
               headers: new Headers({"Accept": "application/json"})
            }).then(reply => { reply.json().then( json =>
            {
               // only process it if the user hasn't changed the address
               // since we initiated the request
               if (this.state.withdraw_address === new_withdraw_address)
               {
                  this.setState(
                  {
                     withdraw_address_check_in_progress: false,
                     withdraw_address_is_valid: json.isValid
                  });
               }
            })});

      this.setState( 
         {
            withdraw_address: new_withdraw_address,
            withdraw_address_check_in_progress: true,
            withdraw_address_is_valid: null
         });
   }

   onSubmit() {
     let asset = this.props.asset;
     let precision = utils.get_asset_precision(asset.get("precision"));
     let amount = this.state.withdraw_amount.replace( /,/g, "" )
     console.log( "withdraw_amount: ", amount );
     AccountActions.transfer(
         this.props.account.get("id"),
         this.props.issuer.get("id"),
         parseInt(amount * precision, 10),
         asset.get("id"),
         this.props.output_coin_type + ":" + this.state.withdraw_address
     )
   }

   render() {
       let balance = null;
       // console.log( "account: ", this.props.account.toJS() );
       let account_balances = this.props.account.get("balances").toJS();
       // console.log( "balances: ", account_balances );
       let asset_types = Object.keys(account_balances);

       if (asset_types.length > 0) {
           let current_asset_id = this.props.asset.get('id');
           if( current_asset_id )
              balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>)
           else
              balance = "No funds";
       } else {
           balance = "No funds";
       }

       let invalid_address_message = null;
       if (!this.state.withdraw_address_check_in_progress)
       {
          if (!this.state.withdraw_address_is_valid)
            invalid_address_message = <span>Please enter a valid {this.props.output_coin_name} address</span>;
          // if (this.state.withdraw_address_is_valid)
          //   invalid_address_message = <Icon name="checkmark-circle" className="success" />;
          // else
          //   invalid_address_message = <Icon name="cross-circle" className="alert" />;
       }

       return (<form className="grid-block vertical full-width-content">
                 <div className="grid-container">
                   <div className="content-block">
                      <h3>Withdraw {this.props.output_coin_name}({this.props.output_coin_symbol})</h3>
                   </div>
                   <div className="content-block">
                     <AmountSelector label="modal.withdraw.amount" 
                                     amount={this.state.withdraw_amount}
                                     asset={this.props.asset.get('id')}
                                     assets={[this.props.asset.get('id')]}
                                     placeholder="0.0"
                                     onChange={this.onWithdrawAmountChange.bind(this)}
                                     display_balance={balance}
                                     />
                   </div>
                   <div className="content-block">
                       <label><Translate component="span" content="modal.withdraw.address"/></label>
                       <span>
                          <input type="text" value={this.state.withdraw_address} tabIndex="4" onChange={this.onWithdrawAddressChanged.bind(this)} autoComplete="off" style={{width: "100%"}} />
                          {invalid_address_message}
                       </span>
                   </div>
                                  
                   <div className="content-block">
                     <input type="submit" className="button" 
                            onClick={this.onSubmit.bind(this)} 
                            value={counterpart.translate("modal.withdraw.submit")} />
                       <Trigger close={this.props.modal_id}>
                           <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                       </Trigger>
                   </div>
                 </div> 
               </form>)
   }
   
};

export default WithdrawModalBlocktrades
