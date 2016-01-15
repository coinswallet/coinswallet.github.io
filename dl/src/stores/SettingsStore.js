var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");

var Immutable = require("immutable");
var _ =require("lodash");
const STORAGE_KEY = "__graphene__";
const CORE_ASSET = "MUSE"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

var ls = typeof localStorage === "undefined" ? null : localStorage;

class SettingsStore {
    constructor() {
        this.exportPublicMethods({getSetting: this.getSetting.bind(this)});

        this.settings = Immutable.Map({
            locale: "en",
            connection: "ws://52.6.149.0/ws",
            faucet_address: "http://52.6.149.0",
            unit: CORE_ASSET,
            showSettles: false,
            walletLockTimeout: 60 * 10
        });

        this.viewSettings =  Immutable.Map({
            cardView: true
        });

        this.defaultMarkets = Immutable.Map([
        ]);

        this.starredAccounts = Immutable.Map();

        // If you want a default value to be translated, add the translation to settings in locale-xx.js
        // and use an object {translate: key} in the defaults array
        this.defaults = {
            locale: [
                "en",
                "cn",
                "fr",
                "ko",
                "de",
                "es",
                "tr"
            ],
            connection: [
                "ws://52.6.149.0/ws"
            ],
            unit: [
                CORE_ASSET,
                "USD",
                "CNY",
                "BTC",
                "EUR"
            ],
            showSettles: [
                {translate: "yes"},
                {translate: "no"}
            ]
            // confirmMarketOrder: [
            //     {translate: "confirm_yes"},
            //     {translate: "confirm_no"}
            // ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onChangeViewSetting: SettingsActions.changeViewSetting,
            onAddStarMarket: SettingsActions.addStarMarket,
            onRemoveStarMarket: SettingsActions.removeStarMarket,
            onAddStarAccount: SettingsActions.addStarAccount,
            onRemoveStarAccount: SettingsActions.removeStarAccount,
            onAddWS: SettingsActions.addWS,
            onRemoveWS: SettingsActions.removeWS
        });

        if (this._lsGet("settings_v3")) {
            this.settings = Immutable.Map(_.merge(this.settings.toJS(), JSON.parse(this._lsGet("settings_v3"))));
        }

        if (this._lsGet("starredMarkets")) {
            this.starredMarkets = Immutable.Map(JSON.parse(this._lsGet("starredMarkets")));
        }

        if (this._lsGet("starredAccounts")) {
            this.starredAccounts = Immutable.Map(JSON.parse(this._lsGet("starredAccounts")));
        }

        if (this._lsGet("defaults_v1")) {
            this.defaults = _.merge(this.defaults, JSON.parse(this._lsGet("defaults_v1")));
        }

        if (this._lsGet("viewSettings_v1")) {
            this.viewSettings = Immutable.Map(JSON.parse(this._lsGet("viewSettings_v1")));
        }
    }

    getSetting(setting) {
        return this.settings.get(setting);
    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );

        this._lsSet("settings_v3", this.settings.toJS());
        if (payload.setting === "walletLockTimeout") {
            this._lsSet("lockTimeout", payload.value);
        }
    }

    onChangeViewSetting(payload) {
        for (key in payload) {
            this.viewSettings = this.viewSettings.set(key, payload[key]);
        }

        this._lsSet("viewSettings_v1", this.viewSettings.toJS());
    }

    _lsGet(key) {
        if (ls) {
            return ls.getItem(STORAGE_KEY + key);
        }
    }

    _lsSet(key, object) {
        if (ls) {
            ls.setItem(STORAGE_KEY + key, JSON.stringify(object));
        }

    }

    onAddStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        if (!this.starredMarkets.has(marketID)) {
            this.starredMarkets = this.starredMarkets.set(marketID, {quote: market.quote, base: market.base});

            this._lsSet("starredMarkets", this.starredMarkets.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        this.starredMarkets = this.starredMarkets.delete(marketID);

        this._lsSet("starredMarkets", this.starredMarkets.toJS());
    }

    onAddStarAccount(account) {
        if (!this.starredAccounts.has(account)) {
            this.starredAccounts = this.starredAccounts.set(account, {name: account});

            this._lsSet("starredAccounts", this.starredAccounts.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarAccount(account) {

        this.starredAccounts = this.starredAccounts.delete(account);

        this._lsSet("starredAccounts", this.starredAccounts.toJS());
    }

    onAddWS(ws) {
        this.defaults.connection.push(ws);
        this._lsSet("defaults_v1", this.defaults);
    }

    onRemoveWS(index) {
        if (index !== 0) { // Prevent removing the default connection
            this.defaults.connection.splice(index, 1);
            this._lsSet("defaults_v1", this.defaults);
        }
    }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
