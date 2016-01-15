import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";
import {FormattedDate} from "react-intl";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import SettingsActions from "actions/SettingsActions";
import classnames from "classnames";
import PriceText from "../Utility/PriceText";

class TableHeader extends React.Component {

    render() {
        let {buy, baseSymbol, quoteSymbol} = this.props;

        return (
            <thead>
                <tr>
                    <th style={{textAlign: "right"}}><Translate content="exchange.price" /><br/>{baseSymbol ? <span className="header-sub-title">({baseSymbol}/{quoteSymbol})</span> : null}</th>
                    <th style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/>{baseSymbol ? <span className="header-sub-title">({quoteSymbol})</span> : null}</th>
                    <th style={{textAlign: "right"}}><Translate content="exchange.value" /><br/>{baseSymbol ? <span className="header-sub-title">({baseSymbol})</span> : null}</th>
                    <th style={{textAlign: "right"}}><Translate content="transaction.expiration" /><br/><span style={{visibility: "hidden"}} className="header-sub-title">d</span></th>
                    <th style={{textAlign: "right"}}></th>
                </tr>
            </thead>
        );
    }
}

TableHeader.defaultProps = {
    quoteSymbol: null,
    baseSymbol: null
};

class OrderRow extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.order.for_sale !== this.props.order.for_sale ||
            nextProps.order.id !== this.props.order.id
        );
    }

    render() {
        let {base, quote, order, cancel_text, showSymbols, invert} = this.props;
        let {value, price, amount} = market_utils.parseOrder(order, base, quote);
        let isAskOrder = market_utils.isAsk(order, base);
        let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});

        let priceSymbol = showSymbols ? <span>{` ${base.get("symbol")}/${quote.get("symbol")}`}</span> : null;
        let valueSymbol = showSymbols ? " " + base.get("symbol") : null;
        let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;

            return (
                <tr key={order.id}>
                    <td className={tdClass}>
                        <PriceText preFormattedPrice={price} />
                        {priceSymbol}
                    </td>
                    <td>{utils.format_number(amount, quote.get("precision") - 2)} {amountSymbol}</td>
                    <td>{utils.format_number(value, base.get("precision") - 2)} {valueSymbol}</td>
                    <td><FormattedDate
                        value={order.expiration}
                        format="short"
                        />
                    </td>
                    <td className="text-right" style={{padding: "2px 5px"}}>
                        <a style={{marginRight: "0"}} className="tiny button outline order-cancel" onClick={this.props.onCancel}>
                        <span>{cancel_text}</span>
                        </a>
                    </td>
                </tr>
            );
        // }
    }
}

OrderRow.defaultProps = {
    showSymbols: false,
    invert: false
};


class MyOpenOrders extends React.Component {
    constructor(props) {
        super();
        this.state = {
            flip: props.flipMyOrders
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
                nextProps.currentAccount !== this.props.currentAccount ||
                !Immutable.is(nextProps.orders, this.props.orders) ||
                nextState.flip !== this.state.flip
            );
    }

    componentDidMount() {
        let orderContainer = ReactDOM.findDOMNode(this.refs.orders);
        Ps.initialize(orderContainer);
    }

    _flipBuySell() {
        SettingsActions.changeViewSetting({
            flipMyOrders: !this.state.flip
        });

        this.setState({flip: !this.state.flip});
    }

    render() {
        let {orders, currentAccount, base, quote, quoteSymbol, baseSymbol} = this.props;
        let bids = null, asks = null;
        if(orders.size > 0 && base && quote) {
            let cancel = counterpart.translate("account.perm.cancel");

            bids = orders.filter(a => {
                return (a.seller === currentAccount && a.sell_price.quote.asset_id !== base.get("id"));
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, base, quote);
                let {price: b_price} = market_utils.parseOrder(b, base, quote);

                return b_price.full - a_price.full;
            }).map(order => {

                return <OrderRow key={order.id} order={order} base={base} quote={quote} cancel_text={cancel} onCancel={this.props.onCancel.bind(this, order.id)}/>;
            }).toArray();

            asks = orders.filter(a => {
                return (a.seller === currentAccount && a.sell_price.quote.asset_id === base.get("id"));
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, base, quote);
                let {price: b_price} = market_utils.parseOrder(b, base, quote);

                return a_price.full - b_price.full;
            }).map(order => {
                return <OrderRow key={order.id} order={order} base={base} quote={quote} cancel_text={cancel} onCancel={this.props.onCancel.bind(this, order.id)}/>;
            }).toArray();

        } else {
            return (
                <div key="open_orders" className="grid-content text-center ps-container" ref="orders">
                    <table className="table order-table my-orders text-right table-hover">
                        <tbody>
                        </tbody>
                    </table>

                    <table className="table order-table my-orders text-right table-hover">
                        <tbody>
                        </tbody>
                </table>
                </div>
            );
        }

        if (bids.length === 0 && asks.length ===0) {
            return <div key="open_orders" className="grid-content no-padding text-center ps-container" ref="orders"></div>;
        }

        return (
            <div style={{maxHeight: "400px"}} key="open_orders" className="grid-block small-12 no-padding small-vertical medium-horizontal align-spaced ps-container middle-content" ref="orders">
                <div className={classnames("small-12 medium-5", this.state.flip ? "order-1" : "order-3")}>
                    <div className="exchange-content-header"><Translate content="exchange.my_bids" /></div>
                    <table className="table order-table text-right table-hover">
                        <TableHeader type="buy" baseSymbol={baseSymbol} quoteSymbol={quoteSymbol}/>
                        <tbody>
                            {bids}
                        </tbody>
                    </table>
                </div>
                <div className="grid-block vertical align-center text-center no-padding shrink order-2">
                    <span onClick={this._flipBuySell.bind(this)} style={{cursor: "pointer", fontSize: "2rem"}}>&#8646;</span>
                </div>
                <div className={classnames("small-12 medium-5", this.state.flip ? "order-3" : "order-1")}>
                    <div className="exchange-content-header"><Translate content="exchange.my_asks" /></div>
                    <table className="table order-table text-right table-hover">
                        <TableHeader type="sell" baseSymbol={baseSymbol} quoteSymbol={quoteSymbol}/>
                        <tbody>
                            {asks}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

MyOpenOrders.defaultProps = {
    base: {},
    quote: {},
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

MyOpenOrders.propTypes = {
    base: PropTypes.object.isRequired,
    quote: PropTypes.object.isRequired,
    orders: PropTypes.object.isRequired,
    quoteSymbol: PropTypes.string.isRequired,
    baseSymbol: PropTypes.string.isRequired
};

exports.OrderRow = OrderRow;
exports.TableHeader = TableHeader;
exports.MyOpenOrders = MyOpenOrders;
