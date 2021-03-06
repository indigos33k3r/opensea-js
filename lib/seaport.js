"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Web3 = require("web3");
var wyvern_js_1 = require("wyvern-js");
var WyvernSchemas = require("wyvern-schemas");
var _ = require("lodash");
var api_1 = require("./api");
var contracts_1 = require("./contracts");
var types_1 = require("./types");
var utils_1 = require("./utils");
var bignumber_js_1 = require("bignumber.js");
var fbemitter_1 = require("fbemitter");
var OpenSeaPort = /** @class */ (function () {
    /**
     * Your very own seaport.
     * Create a new instance of OpenSeaJS.
     * @param provider Web3 Provider to use for transactions. For example:
     *  `const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io')`
     * @param apiConfig configuration options, including `networkName`
     * @param logger logger, optional, a function that will be called with debugging
     *  information
     */
    function OpenSeaPort(provider, apiConfig, logger) {
        if (apiConfig === void 0) { apiConfig = {}; }
        // Extra gwei to add to the mean gas price when making transactions
        this.gasPriceAddition = new bignumber_js_1.BigNumber(3);
        // Multiply gas estimate by this factor when making transactions
        this.gasIncreaseFactor = 1.2;
        apiConfig.networkName = apiConfig.networkName || types_1.Network.Main;
        apiConfig.gasPrice = apiConfig.gasPrice || utils_1.makeBigNumber(300000);
        // API config
        this.api = new api_1.OpenSeaAPI(apiConfig);
        // Web3 Config
        this.web3 = new Web3(provider);
        this._networkName = apiConfig.networkName;
        // WyvernJS config
        this._wyvernProtocol = new wyvern_js_1.WyvernProtocol(provider, {
            network: this._networkName,
            gasPrice: apiConfig.gasPrice,
        });
        // WyvernJS config for readonly (optimization for infura calls)
        var readonlyProvider = new Web3.providers.HttpProvider(this._networkName == types_1.Network.Main ? utils_1.MAINNET_PROVIDER_URL : utils_1.RINKEBY_PROVIDER_URL);
        this._wyvernProtocolReadOnly = new wyvern_js_1.WyvernProtocol(readonlyProvider, {
            network: this._networkName,
            gasPrice: apiConfig.gasPrice,
        });
        // Emit events
        this._emitter = new fbemitter_1.EventEmitter();
        // Debugging: default to nothing
        this.logger = logger || (function (arg) { return arg; });
    }
    /**
     * Add a listener to a marketplace event
     * @param event An event to listen for
     * @param listener A callback that will accept an object with event data
     * @param once Whether the listener should only be called once
     */
    OpenSeaPort.prototype.addListener = function (event, listener, once) {
        if (once === void 0) { once = false; }
        var subscription = once
            ? this._emitter.once(event, listener)
            : this._emitter.addListener(event, listener);
        return subscription;
    };
    /**
     * Remove an event listener, included here for completeness.
     * Simply calls `.remove()` on a subscription
     * @param subscription The event subscription returned from `addListener`
     */
    OpenSeaPort.prototype.removeListener = function (subscription) {
        // Kill tslint "no this used" warning
        if (!this._emitter) {
            return;
        }
        subscription.remove();
    };
    /**
     * Remove all event listeners. Good idea to call this when you're unmounting
     * a component that listens to events to make UI updates
     * @param event Optional EventType to remove listeners for
     */
    OpenSeaPort.prototype.removeAllListeners = function (event) {
        this._emitter.removeAllListeners(event);
    };
    /**
     * Wrap ETH into W-ETH.
     * W-ETH is needed for placing buy orders (making offers).
     * Emits the `WrapEth` event when the transaction is prompted.
     * @param param0 __namedParameters Object
     * @param amountInEth How much ether to wrap
     * @param accountAddress Address of the user's wallet containing the ether
     */
    OpenSeaPort.prototype.wrapEth = function (_a) {
        var amountInEth = _a.amountInEth, accountAddress = _a.accountAddress;
        return __awaiter(this, void 0, void 0, function () {
            var token, amount, gasPrice, txHash;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token = WyvernSchemas.tokens[this._networkName].canonicalWrappedEther;
                        amount = wyvern_js_1.WyvernProtocol.toBaseUnitAmount(utils_1.makeBigNumber(amountInEth), token.decimals);
                        this._dispatch(types_1.EventType.WrapEth, { accountAddress: accountAddress, amount: amount });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 1:
                        gasPrice = _b.sent();
                        return [4 /*yield*/, utils_1.sendRawTransaction(this.web3, {
                                from: accountAddress,
                                to: token.address,
                                value: amount,
                                data: WyvernSchemas.encodeCall(contracts_1.getMethod(contracts_1.CanonicalWETH, 'deposit'), []),
                                gasPrice: gasPrice
                            }, function (error) {
                                _this._dispatch(types_1.EventType.TransactionDenied, { error: error, accountAddress: accountAddress });
                            })];
                    case 2:
                        txHash = _b.sent();
                        return [4 /*yield*/, this._confirmTransaction(txHash, types_1.EventType.WrapEth, "Wrapping ETH")];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Unwrap W-ETH into ETH.
     * Emits the `UnwrapWeth` event when the transaction is prompted.
     * @param param0 __namedParameters Object
     * @param amountInEth How much W-ETH to unwrap
     * @param accountAddress Address of the user's wallet containing the W-ETH
     */
    OpenSeaPort.prototype.unwrapWeth = function (_a) {
        var amountInEth = _a.amountInEth, accountAddress = _a.accountAddress;
        return __awaiter(this, void 0, void 0, function () {
            var token, amount, gasPrice, txHash;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token = WyvernSchemas.tokens[this._networkName].canonicalWrappedEther;
                        amount = wyvern_js_1.WyvernProtocol.toBaseUnitAmount(utils_1.makeBigNumber(amountInEth), token.decimals);
                        this._dispatch(types_1.EventType.UnwrapWeth, { accountAddress: accountAddress, amount: amount });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 1:
                        gasPrice = _b.sent();
                        return [4 /*yield*/, utils_1.sendRawTransaction(this.web3, {
                                from: accountAddress,
                                to: token.address,
                                value: 0,
                                data: WyvernSchemas.encodeCall(contracts_1.getMethod(contracts_1.CanonicalWETH, 'withdraw'), [amount.toString()]),
                                gasPrice: gasPrice
                            }, function (error) {
                                _this._dispatch(types_1.EventType.TransactionDenied, { error: error, accountAddress: accountAddress });
                            })];
                    case 2:
                        txHash = _b.sent();
                        return [4 /*yield*/, this._confirmTransaction(txHash, types_1.EventType.UnwrapWeth, "Unwrapping W-ETH")];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a buy order to make an offer on an asset.
     * Will throw an 'Insufficient balance' error if the maker doesn't have enough W-ETH to make the offer.
     * If the user hasn't approved W-ETH access yet, this will emit `ApproveCurrency` before asking for approval.
     * @param param0 __namedParameters Object
     * @param tokenId Token ID
     * @param tokenAddress Address of the token's contract
     * @param accountAddress Address of the maker's wallet
     * @param startAmount Value of the offer, in units of the payment token (or wrapped ETH if no payment token address specified)
     * @param expirationTime Expiration time for the order, in seconds. An expiration time of 0 means "never expire"
     * @param paymentTokenAddress Optional address for using an ERC-20 token in the order. If unspecified, defaults to W-ETH
     * @param bountyBasisPoints Optional basis points (1/100th of a percent) to reward someone for referring the fulfillment of this order
     */
    OpenSeaPort.prototype.createBuyOrder = function (_a) {
        var tokenId = _a.tokenId, tokenAddress = _a.tokenAddress, accountAddress = _a.accountAddress, startAmount = _a.startAmount, _b = _a.expirationTime, expirationTime = _b === void 0 ? 0 : _b, paymentTokenAddress = _a.paymentTokenAddress, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c;
        return __awaiter(this, void 0, void 0, function () {
            var asset, order, hashedOrder, signature, error_1, orderWithSignature;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        asset = { tokenAddress: tokenAddress, tokenId: tokenId };
                        return [4 /*yield*/, this._makeBuyOrder({ asset: asset, accountAddress: accountAddress, startAmount: startAmount, expirationTime: expirationTime, paymentTokenAddress: paymentTokenAddress, bountyBasisPoints: bountyBasisPoints })
                            // NOTE not in Wyvern exchange code:
                            // frontend checks to make sure
                            // token is approved and sufficiently available
                        ];
                    case 1:
                        order = _d.sent();
                        // NOTE not in Wyvern exchange code:
                        // frontend checks to make sure
                        // token is approved and sufficiently available
                        return [4 /*yield*/, this._validateBuyOrderParameters({ order: order, accountAddress: accountAddress })];
                    case 2:
                        // NOTE not in Wyvern exchange code:
                        // frontend checks to make sure
                        // token is approved and sufficiently available
                        _d.sent();
                        hashedOrder = __assign({}, order, { hash: utils_1.getOrderHash(order) });
                        _d.label = 3;
                    case 3:
                        _d.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this._signOrder(hashedOrder)];
                    case 4:
                        signature = _d.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _d.sent();
                        console.error(error_1);
                        throw new Error("You declined to sign your offer. Just a reminder: there's no gas needed anymore to create offers!");
                    case 6:
                        orderWithSignature = __assign({}, hashedOrder, signature);
                        return [2 /*return*/, this._validateAndPostOrder(orderWithSignature)];
                }
            });
        });
    };
    /**
     * Create a sell order to auction an asset.
     * Will throw a 'You do not own this asset' error if the maker doesn't have the asset.
     * If the user hasn't approved access to the token yet, this will emit `ApproveAllAssets` (or `ApproveAsset` if the contract doesn't support approve-all) before asking for approval.
     * @param param0 __namedParameters Object
     * @param tokenId Token ID
     * @param tokenAddress Address of the token's contract
     * @param accountAddress Address of the maker's wallet
     * @param startAmount Price of the asset at the start of the auction. Units are in the amount of a token above the token's decimal places (integer part). For example, for ether, expected units are in ETH, not wei.
     * @param endAmount Optional price of the asset at the end of its expiration time. Units are in the amount of a token above the token's decimal places (integer part). For example, for ether, expected units are in ETH, not wei.
     * @param expirationTime Expiration time for the order, in seconds. An expiration time of 0 means "never expire."
     * @param paymentTokenAddress Address of the ERC-20 token to accept in return. If undefined or null, uses Ether.
     * @param bountyBasisPoints Optional basis points (1/100th of a percent) to reward someone for referring the fulfillment of this order
     * @param buyerAddress Optional address that's allowed to purchase this item. If specified, no other address will be able to take the order.
     */
    OpenSeaPort.prototype.createSellOrder = function (_a) {
        var tokenId = _a.tokenId, tokenAddress = _a.tokenAddress, accountAddress = _a.accountAddress, startAmount = _a.startAmount, endAmount = _a.endAmount, _b = _a.expirationTime, expirationTime = _b === void 0 ? 0 : _b, paymentTokenAddress = _a.paymentTokenAddress, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c, buyerAddress = _a.buyerAddress;
        return __awaiter(this, void 0, void 0, function () {
            var asset, order, hashedOrder, signature, error_2, orderWithSignature;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        asset = { tokenAddress: tokenAddress, tokenId: tokenId };
                        return [4 /*yield*/, this._makeSellOrder({ asset: asset, accountAddress: accountAddress, startAmount: startAmount, endAmount: endAmount, expirationTime: expirationTime, paymentTokenAddress: paymentTokenAddress, bountyBasisPoints: bountyBasisPoints, buyerAddress: buyerAddress })];
                    case 1:
                        order = _d.sent();
                        return [4 /*yield*/, this._validateSellOrderParameters({ order: order, accountAddress: accountAddress })];
                    case 2:
                        _d.sent();
                        hashedOrder = __assign({}, order, { hash: utils_1.getOrderHash(order) });
                        _d.label = 3;
                    case 3:
                        _d.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this._signOrder(hashedOrder)];
                    case 4:
                        signature = _d.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _d.sent();
                        console.error(error_2);
                        throw new Error("You declined to sign your auction. Just a reminder: there's no gas needed anymore to create auctions!");
                    case 6:
                        orderWithSignature = __assign({}, hashedOrder, signature);
                        return [2 /*return*/, this._validateAndPostOrder(orderWithSignature)];
                }
            });
        });
    };
    /**
     * Create multiple sell orders in bulk to auction assets out of an asset factory.
     * Will throw a 'You do not own this asset' error if the maker doesn't own the factory.
     * Items will mint to users' wallets only when they buy them. See https://docs.opensea.io/docs/opensea-initial-item-sale-tutorial for more info.
     * If the user hasn't approved access to the token yet, this will emit `ApproveAllAssets` (or `ApproveAsset` if the contract doesn't support approve-all) before asking for approval.
     * @param param0 __namedParameters Object
     * @param assetId Identifier for the asset factory
     * @param factoryAddress Address of the factory contract
     * @param accountAddress Address of the factory owner's wallet
     * @param startAmount Price of the asset at the start of the auction. Units are in the amount of a token above the token's decimal places (integer part). For example, for ether, expected units are in ETH, not wei.
     * @param endAmount Optional price of the asset at the end of its expiration time. Units are in the amount of a token above the token's decimal places (integer part). For example, for ether, expected units are in ETH, not wei.
     * @param expirationTime Expiration time for the orders, in seconds. An expiration time of 0 means "never expire."
     * @param paymentTokenAddress Address of the ERC-20 token to accept in return. If undefined or null, uses Ether.
     * @param bountyBasisPoints Optional basis points (1/100th of a percent) to reward someone for referring the fulfillment of each order
     * @param buyerAddress Optional address that's allowed to purchase each item. If specified, no other address will be able to take each order.
     * @param numberOfOrders Number of times to repeat creating the same order. If greater than 5, creates them in batches of 5. Requires an `apiKey` to be set during seaport initialization in order to not be throttled by the API.
     */
    OpenSeaPort.prototype.createFactorySellOrders = function (_a) {
        var assetId = _a.assetId, factoryAddress = _a.factoryAddress, accountAddress = _a.accountAddress, startAmount = _a.startAmount, endAmount = _a.endAmount, _b = _a.expirationTime, expirationTime = _b === void 0 ? 0 : _b, paymentTokenAddress = _a.paymentTokenAddress, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c, buyerAddress = _a.buyerAddress, _d = _a.numberOfOrders, numberOfOrders = _d === void 0 ? 1 : _d;
        return __awaiter(this, void 0, void 0, function () {
            var asset, dummyOrder, _makeAndPostOneSellOrder, range, batches, allOrdersCreated, _i, batches_1, subRange, batchOrdersCreated;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        asset = { tokenAddress: factoryAddress, tokenId: assetId };
                        if (numberOfOrders < 1) {
                            throw new Error('Need to make at least one sell order');
                        }
                        return [4 /*yield*/, this._makeSellOrder({ asset: asset, accountAddress: accountAddress, startAmount: startAmount, endAmount: endAmount, expirationTime: expirationTime, paymentTokenAddress: paymentTokenAddress, bountyBasisPoints: bountyBasisPoints, buyerAddress: buyerAddress })];
                    case 1:
                        dummyOrder = _e.sent();
                        return [4 /*yield*/, this._validateSellOrderParameters({ order: dummyOrder, accountAddress: accountAddress })];
                    case 2:
                        _e.sent();
                        _makeAndPostOneSellOrder = function () { return __awaiter(_this, void 0, void 0, function () {
                            var order, hashedOrder, signature, error_3, orderWithSignature;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this._makeSellOrder({ asset: asset, accountAddress: accountAddress, startAmount: startAmount, endAmount: endAmount, expirationTime: expirationTime, paymentTokenAddress: paymentTokenAddress, bountyBasisPoints: bountyBasisPoints, buyerAddress: buyerAddress })];
                                    case 1:
                                        order = _a.sent();
                                        hashedOrder = __assign({}, order, { hash: utils_1.getOrderHash(order) });
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4 /*yield*/, this._signOrder(hashedOrder)];
                                    case 3:
                                        signature = _a.sent();
                                        return [3 /*break*/, 5];
                                    case 4:
                                        error_3 = _a.sent();
                                        console.error(error_3);
                                        throw new Error("You declined to sign your auction, or your web3 provider can't sign using personal_sign. Try 'web3-provider-engine' and make sure a mnemonic is set. Just a reminder: there's no gas needed anymore to mint tokens!");
                                    case 5:
                                        orderWithSignature = __assign({}, hashedOrder, signature);
                                        return [2 /*return*/, this._validateAndPostOrder(orderWithSignature)];
                                }
                            });
                        }); };
                        range = _.range(numberOfOrders);
                        batches = _.chunk(range, utils_1.SELL_ORDER_BATCH_SIZE);
                        allOrdersCreated = [];
                        _i = 0, batches_1 = batches;
                        _e.label = 3;
                    case 3:
                        if (!(_i < batches_1.length)) return [3 /*break*/, 7];
                        subRange = batches_1[_i];
                        return [4 /*yield*/, Promise.all(subRange.map(_makeAndPostOneSellOrder))];
                    case 4:
                        batchOrdersCreated = _e.sent();
                        this.logger("Created and posted a batch of " + batchOrdersCreated.length + " orders in parallel.");
                        allOrdersCreated = allOrdersCreated.concat(batchOrdersCreated);
                        // Don't overwhelm router
                        return [4 /*yield*/, utils_1.delay(1000)];
                    case 5:
                        // Don't overwhelm router
                        _e.sent();
                        _e.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7: return [2 /*return*/, allOrdersCreated];
                }
            });
        });
    };
    /**
     * Create a sell order to auction a bundle of assets.
     * Will throw a 'You do not own this asset' error if the maker doesn't have one of the assets.
     * If the user hasn't approved access to any of the assets yet, this will emit `ApproveAllAssets` (or `ApproveAsset` if the contract doesn't support approve-all) before asking for approval for each asset.
     * @param param0 __namedParameters Object
     * @param bundleName Name of the bundle
     * @param bundleDescription Optional description of the bundle. Markdown is allowed.
     * @param bundleExternalLink Optional link to a page that adds context to the bundle.
     * @param assets An array of objects with the tokenId and tokenAddress of each of the assets to bundle together.
     * @param accountAddress The address of the maker of the bundle and the owner of all the assets.
     * @param startAmount Price of the asset at the start of the auction
     * @param endAmount Optional price of the asset at the end of its expiration time
     * @param expirationTime Expiration time for the order, in seconds. An expiration time of 0 means "never expire."
     * @param paymentTokenAddress Address of the ERC-20 token to accept in return. If undefined or null, uses Ether.
     * @param bountyBasisPoints Optional basis points (1/100th of a percent) to reward someone for referring the fulfillment of this order
     * @param buyerAddress Optional address that's allowed to purchase this bundle. If specified, no other address will be able to take the order.
     */
    OpenSeaPort.prototype.createBundleSellOrder = function (_a) {
        var bundleName = _a.bundleName, bundleDescription = _a.bundleDescription, bundleExternalLink = _a.bundleExternalLink, assets = _a.assets, accountAddress = _a.accountAddress, startAmount = _a.startAmount, endAmount = _a.endAmount, _b = _a.expirationTime, expirationTime = _b === void 0 ? 0 : _b, paymentTokenAddress = _a.paymentTokenAddress, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c, buyerAddress = _a.buyerAddress;
        return __awaiter(this, void 0, void 0, function () {
            var order, hashedOrder, signature, error_4, orderWithSignature;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this._makeBundleSellOrder({ bundleName: bundleName, bundleDescription: bundleDescription, bundleExternalLink: bundleExternalLink, assets: assets, accountAddress: accountAddress, startAmount: startAmount, endAmount: endAmount, expirationTime: expirationTime, paymentTokenAddress: paymentTokenAddress, bountyBasisPoints: bountyBasisPoints, buyerAddress: buyerAddress })];
                    case 1:
                        order = _d.sent();
                        return [4 /*yield*/, this._validateSellOrderParameters({ order: order, accountAddress: accountAddress })];
                    case 2:
                        _d.sent();
                        hashedOrder = __assign({}, order, { hash: utils_1.getOrderHash(order) });
                        _d.label = 3;
                    case 3:
                        _d.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this._signOrder(hashedOrder)];
                    case 4:
                        signature = _d.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_4 = _d.sent();
                        console.error(error_4);
                        throw new Error("You declined to sign your auction. Just a reminder: there's no gas needed anymore to create auctions!");
                    case 6:
                        orderWithSignature = __assign({}, hashedOrder, signature);
                        return [2 /*return*/, this._validateAndPostOrder(orderWithSignature)];
                }
            });
        });
    };
    /**
     * Fullfill or "take" an order for an asset, either a buy or sell order
     * @param param0 __namedParamaters Object
     * @param order The order to fulfill, a.k.a. "take"
     * @param accountAddress The taker's wallet address
     * @param referrerAddress The optional address that referred the order
     */
    OpenSeaPort.prototype.fulfillOrder = function (_a) {
        var order = _a.order, accountAddress = _a.accountAddress, referrerAddress = _a.referrerAddress;
        return __awaiter(this, void 0, void 0, function () {
            var matchingOrder, _b, buy, sell, metadata, transactionHash;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        matchingOrder = this._makeMatchingOrder({ order: order, accountAddress: accountAddress });
                        _b = utils_1.assignOrdersToSides(order, matchingOrder), buy = _b.buy, sell = _b.sell;
                        metadata = referrerAddress;
                        return [4 /*yield*/, this._atomicMatch({ buy: buy, sell: sell, accountAddress: accountAddress, metadata: metadata })];
                    case 1:
                        transactionHash = _c.sent();
                        return [4 /*yield*/, this._confirmTransaction(transactionHash.toString(), types_1.EventType.MatchOrders, "Fulfilling order")];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancel an order on-chain, preventing it from ever being fulfilled.
     * @param param0 __namedParameters Object
     * @param order The order to cancel
     * @param accountAddress The order maker's wallet address
     */
    OpenSeaPort.prototype.cancelOrder = function (_a) {
        var order = _a.order, accountAddress = _a.accountAddress;
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, transactionHash;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this._dispatch(types_1.EventType.CancelOrder, { order: order, accountAddress: accountAddress });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 1:
                        gasPrice = _b.sent();
                        return [4 /*yield*/, this._wyvernProtocol.wyvernExchange.cancelOrder_.sendTransactionAsync([order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken], [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt], order.feeMethod, order.side, order.saleKind, order.howToCall, order.calldata, order.replacementPattern, order.staticExtradata, order.v, order.r, order.s, { from: accountAddress, gasPrice: gasPrice })];
                    case 2:
                        transactionHash = _b.sent();
                        return [4 /*yield*/, this._confirmTransaction(transactionHash.toString(), types_1.EventType.CancelOrder, "Cancelling order")];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Approve a non-fungible token for use in trades.
     * Requires an account to be initialized first.
     * Called internally, but exposed for dev flexibility.
     * Checks to see if already approved, first. Then tries different approval methods from best to worst.
     * @param param0 __namedParamters Object
     * @param tokenId Token id to approve, but only used if approve-all isn't
     *  supported by the token contract
     * @param tokenAddress The contract address of the token being approved
     * @param accountAddress The user's wallet address
     * @param proxyAddress Address of the user's proxy contract. If not provided,
     *  will attempt to fetch it from Wyvern.
     * @param tokenAbi ABI of the token's contract. Defaults to a flexible ERC-721
     *  contract.
     * @param skipApproveAllIfTokenAddressIn an optional list of token addresses that, if a token is approve-all type, will skip approval
     * @returns Transaction hash if a new transaction was created, otherwise null
     */
    OpenSeaPort.prototype.approveNonFungibleToken = function (_a) {
        var tokenId = _a.tokenId, tokenAddress = _a.tokenAddress, accountAddress = _a.accountAddress, _b = _a.proxyAddress, proxyAddress = _b === void 0 ? null : _b, _c = _a.tokenAbi, tokenAbi = _c === void 0 ? contracts_1.ERC721 : _c, _d = _a.skipApproveAllIfTokenAddressIn, skipApproveAllIfTokenAddressIn = _d === void 0 ? [] : _d;
        return __awaiter(this, void 0, void 0, function () {
            var tokenContract, erc721, isApprovedCheckData, isApprovedForAllCallHash, isApprovedForAll, gasPrice, txHash, error_5, approvedAddr, gasPrice, txHash, error_6;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        tokenContract = this.web3.eth.contract(tokenAbi);
                        return [4 /*yield*/, tokenContract.at(tokenAddress)];
                    case 1:
                        erc721 = _e.sent();
                        if (!!proxyAddress) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._getProxy(accountAddress)];
                    case 2:
                        proxyAddress = _e.sent();
                        if (!proxyAddress) {
                            throw new Error('Uninitialized account');
                        }
                        _e.label = 3;
                    case 3:
                        isApprovedCheckData = erc721.isApprovedForAll.getData(accountAddress, proxyAddress);
                        return [4 /*yield*/, utils_1.promisify(function (c) { return _this.web3.eth.call({
                                from: accountAddress,
                                to: erc721.address,
                                data: isApprovedCheckData,
                            }, c); })];
                    case 4:
                        isApprovedForAllCallHash = _e.sent();
                        isApprovedForAll = parseInt(isApprovedForAllCallHash);
                        if (isApprovedForAll == 1) {
                            // Supports ApproveAll
                            // Result was NULL_BLOCK_HASH + 1
                            this.logger('Already approved proxy for all tokens');
                            return [2 /*return*/, null];
                        }
                        if (!(isApprovedForAll == 0)) return [3 /*break*/, 10];
                        // Supports ApproveAll
                        //  Result was NULL_BLOCK_HASH
                        //  not approved for all yet
                        if (skipApproveAllIfTokenAddressIn.includes(tokenAddress)) {
                            this.logger('Already approving proxy for all tokens in another transaction');
                            return [2 /*return*/, null];
                        }
                        skipApproveAllIfTokenAddressIn.push(tokenAddress);
                        _e.label = 5;
                    case 5:
                        _e.trys.push([5, 9, , 10]);
                        this._dispatch(types_1.EventType.ApproveAllAssets, { accountAddress: accountAddress, proxyAddress: proxyAddress, tokenAddress: tokenAddress });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 6:
                        gasPrice = _e.sent();
                        return [4 /*yield*/, utils_1.sendRawTransaction(this.web3, {
                                from: accountAddress,
                                to: erc721.address,
                                data: erc721.setApprovalForAll.getData(proxyAddress, true),
                                gasPrice: gasPrice
                            }, function (error) {
                                _this._dispatch(types_1.EventType.TransactionDenied, { error: error, accountAddress: accountAddress });
                            })];
                    case 7:
                        txHash = _e.sent();
                        return [4 /*yield*/, this._confirmTransaction(txHash, types_1.EventType.ApproveAllAssets, 'Approving all tokens of this type for trading')];
                    case 8:
                        _e.sent();
                        return [2 /*return*/, txHash];
                    case 9:
                        error_5 = _e.sent();
                        console.error(error_5);
                        throw new Error("Couldn't get permission to trade these tokens. Remember, you only have to approve them once for this item type!");
                    case 10:
                        // Does not support ApproveAll (ERC721 v1 or v2)
                        this.logger('Contract does not support Approve All');
                        return [4 /*yield*/, utils_1.promisify(function (c) { return erc721.getApproved.call(tokenId, c); })];
                    case 11:
                        approvedAddr = _e.sent();
                        if (approvedAddr == proxyAddress) {
                            this.logger('Already approved proxy for this token');
                            return [2 /*return*/, null];
                        }
                        this.logger("Approve response: " + approvedAddr);
                        if (!(approvedAddr == '0x')) return [3 /*break*/, 13];
                        return [4 /*yield*/, utils_1.promisify(function (c) { return erc721.kittyIndexToApproved.call(tokenId, c); })];
                    case 12:
                        // CRYPTOKITTIES check
                        approvedAddr = _e.sent();
                        if (approvedAddr == proxyAddress) {
                            this.logger('Already approved proxy for this kitty');
                            return [2 /*return*/, null];
                        }
                        this.logger("CryptoKitties approve response: " + approvedAddr);
                        _e.label = 13;
                    case 13:
                        if (!(approvedAddr == '0x')) return [3 /*break*/, 15];
                        return [4 /*yield*/, utils_1.promisify(function (c) { return erc721.allowed.call(accountAddress, tokenId, c); })];
                    case 14:
                        // ETHEREMON check
                        approvedAddr = _e.sent();
                        if (approvedAddr == proxyAddress) {
                            this.logger('Already allowed proxy for this token');
                            return [2 /*return*/, null];
                        }
                        this.logger("\"allowed\" response: " + approvedAddr);
                        _e.label = 15;
                    case 15:
                        _e.trys.push([15, 19, , 20]);
                        this._dispatch(types_1.EventType.ApproveAsset, { accountAddress: accountAddress, proxyAddress: proxyAddress, tokenAddress: tokenAddress, tokenId: tokenId });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 16:
                        gasPrice = _e.sent();
                        return [4 /*yield*/, utils_1.sendRawTransaction(this.web3, {
                                from: accountAddress,
                                to: erc721.address,
                                data: erc721.approve.getData(proxyAddress, tokenId),
                                gasPrice: gasPrice
                            }, function (error) {
                                _this._dispatch(types_1.EventType.TransactionDenied, { error: error, accountAddress: accountAddress });
                            })];
                    case 17:
                        txHash = _e.sent();
                        return [4 /*yield*/, this._confirmTransaction(txHash, types_1.EventType.ApproveAsset, "Approving single token for trading")];
                    case 18:
                        _e.sent();
                        return [2 /*return*/, txHash];
                    case 19:
                        error_6 = _e.sent();
                        console.error(error_6);
                        throw new Error("Couldn't get permission to trade this token.");
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Approve a fungible token (e.g. W-ETH) for use in trades.
     * Called internally, but exposed for dev flexibility.
     * Checks to see if the minimum amount is already approved, first.
     * @param param0 __namedParamters Object
     * @param accountAddress The user's wallet address
     * @param tokenAddress The contract address of the token being approved
     * @param minimumAmount The minimum amount needed to skip a transaction. Defaults to the max-integer.
     * @returns Transaction hash if a new transaction occurred, otherwise null
     */
    OpenSeaPort.prototype.approveFungibleToken = function (_a) {
        var accountAddress = _a.accountAddress, tokenAddress = _a.tokenAddress, _b = _a.minimumAmount, minimumAmount = _b === void 0 ? wyvern_js_1.WyvernProtocol.MAX_UINT_256 : _b;
        return __awaiter(this, void 0, void 0, function () {
            var approvedAmount, contractAddress, gasPrice, txHash;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this._getApprovedTokenCount({ accountAddress: accountAddress, tokenAddress: tokenAddress })];
                    case 1:
                        approvedAmount = _c.sent();
                        if (approvedAmount.toNumber() >= minimumAmount.toNumber()) {
                            this.logger('Already approved enough currency for trading');
                            return [2 /*return*/, null];
                        }
                        this.logger("Not enough token approved for trade: " + approvedAmount);
                        contractAddress = wyvern_js_1.WyvernProtocol.getTokenTransferProxyAddress(this._networkName);
                        this._dispatch(types_1.EventType.ApproveCurrency, { accountAddress: accountAddress, tokenAddress: tokenAddress });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 2:
                        gasPrice = _c.sent();
                        return [4 /*yield*/, utils_1.sendRawTransaction(this.web3, {
                                from: accountAddress,
                                to: tokenAddress,
                                data: WyvernSchemas.encodeCall(contracts_1.getMethod(contracts_1.ERC20, 'approve'), [contractAddress, wyvern_js_1.WyvernProtocol.MAX_UINT_256.toString()]),
                                gasPrice: gasPrice
                            }, function (error) {
                                _this._dispatch(types_1.EventType.TransactionDenied, { error: error, accountAddress: accountAddress });
                            })];
                    case 3:
                        txHash = _c.sent();
                        return [4 /*yield*/, this._confirmTransaction(txHash, types_1.EventType.ApproveCurrency, "Approving currency for trading")];
                    case 4:
                        _c.sent();
                        return [2 /*return*/, txHash];
                }
            });
        });
    };
    /**
     * Gets the price for the order using the contract
     * @param order The order to calculate the price for
     */
    OpenSeaPort.prototype.getCurrentPrice = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var currentPrice;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.calculateCurrentPrice_.callAsync([order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken], [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt], order.feeMethod, order.side, order.saleKind, order.howToCall, order.calldata, order.replacementPattern, order.staticExtradata)];
                    case 1:
                        currentPrice = _a.sent();
                        return [2 /*return*/, currentPrice];
                }
            });
        });
    };
    /**
     * Returns whether an order is fulfillable.
     * An order may not be fulfillable if a target item's transfer function
     * is locked for some reason, e.g. an item is being rented within a game
     * or trading has been locked for an item type.
     * @param param0 __namedParamters Object
     * @param order Order to check
     * @param accountAddress The account address that will be fulfilling the order
     * @param referrerAddress The optional address that referred the order
     */
    OpenSeaPort.prototype.isOrderFulfillable = function (_a) {
        var order = _a.order, accountAddress = _a.accountAddress, referrerAddress = _a.referrerAddress;
        return __awaiter(this, void 0, void 0, function () {
            var matchingOrder, _b, buy, sell, metadata, gas, error_7;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        matchingOrder = this._makeMatchingOrder({ order: order, accountAddress: accountAddress });
                        _b = utils_1.assignOrdersToSides(order, matchingOrder), buy = _b.buy, sell = _b.sell;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        metadata = referrerAddress;
                        return [4 /*yield*/, this._estimateGasForMatch({ buy: buy, sell: sell, accountAddress: accountAddress, metadata: metadata })];
                    case 2:
                        gas = _c.sent();
                        this.logger("Gas estimate for " + (order.side == types_1.OrderSide.Sell ? "sell" : "buy") + " order: " + gas);
                        return [2 /*return*/, gas > 0];
                    case 3:
                        error_7 = _c.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * WIP Returns whether an asset is transferrable.
     * (Currently returns true too often, even when asset is locked by contract.)
     * An asset may not be transferrable if its transfer function
     * is locked for some reason, e.g. an item is being rented within a game
     * or trading has been locked for an item type.
     * @param param0 __namedParamters Object
     * @param tokenId ID of the token to check
     * @param tokenAddress Address of the token's contract
     * @param fromAddress The account address that currently owns the asset
     * @param toAddress The account address that will be acquiring the asset
     * @param tokenAbi ABI for the token contract. Defaults to ERC-721
     */
    OpenSeaPort.prototype.isAssetTransferrable = function (_a) {
        var tokenId = _a.tokenId, tokenAddress = _a.tokenAddress, fromAddress = _a.fromAddress, toAddress = _a.toAddress, _b = _a.tokenAbi, tokenAbi = _b === void 0 ? contracts_1.ERC721 : _b;
        return __awaiter(this, void 0, void 0, function () {
            var tokenContract, erc721, proxy, data, gas, error_8;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        tokenContract = this.web3.eth.contract(tokenAbi);
                        return [4 /*yield*/, tokenContract.at(tokenAddress)];
                    case 1:
                        erc721 = _c.sent();
                        return [4 /*yield*/, this._getProxy(fromAddress)];
                    case 2:
                        proxy = _c.sent();
                        if (!proxy) {
                            console.error("This asset's owner (" + fromAddress + ") no longer has a proxy!");
                            return [2 /*return*/, false];
                        }
                        data = erc721.transferFrom.getData(fromAddress, toAddress, tokenId);
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, utils_1.estimateGas(this.web3, {
                                from: proxy,
                                to: tokenAddress,
                                data: data
                            })];
                    case 4:
                        gas = _c.sent();
                        return [2 /*return*/, gas > 0];
                    case 5:
                        error_8 = _c.sent();
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transfer one or more assets to another address
     * @param param0 __namedParamaters Object
     * @param assets An array of objects with the tokenId and tokenAddress of each of the assets to transfer.
     * @param fromAddress The owner's wallet address
     * @param toAddress The recipient's wallet address
     */
    OpenSeaPort.prototype.transferAll = function (_a) {
        var assets = _a.assets, fromAddress = _a.fromAddress, toAddress = _a.toAddress;
        return __awaiter(this, void 0, void 0, function () {
            var schema, wyAssets, calldata, proxyAddress, gasPrice, txHash;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        schema = this._getSchema();
                        wyAssets = assets.map(function (asset) { return utils_1.getWyvernAsset(schema, asset.tokenId, asset.tokenAddress); });
                        calldata = utils_1.encodeAtomicizedTransfer(schema, wyAssets, fromAddress, toAddress, this._wyvernProtocol.wyvernAtomicizer).calldata;
                        return [4 /*yield*/, this._getProxy(fromAddress)];
                    case 1:
                        proxyAddress = _b.sent();
                        if (!!proxyAddress) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._initializeProxy(fromAddress)];
                    case 2:
                        proxyAddress = _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, this._approveAll({ wyAssets: wyAssets, accountAddress: fromAddress, proxyAddress: proxyAddress })];
                    case 4:
                        _b.sent();
                        this._dispatch(types_1.EventType.TransferAll, { accountAddress: fromAddress, toAddress: toAddress, assets: assets });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 5:
                        gasPrice = _b.sent();
                        return [4 /*yield*/, utils_1.sendRawTransaction(this.web3, {
                                from: fromAddress,
                                to: proxyAddress,
                                data: utils_1.encodeProxyCall(wyvern_js_1.WyvernProtocol.getAtomicizerContractAddress(this._networkName), types_1.HowToCall.DelegateCall, calldata),
                                gasPrice: gasPrice
                            }, function (error) {
                                _this._dispatch(types_1.EventType.TransactionDenied, { error: error, accountAddress: fromAddress });
                            })];
                    case 6:
                        txHash = _b.sent();
                        return [4 /*yield*/, this._confirmTransaction(txHash, types_1.EventType.TransferAll, "Transferring " + assets.length + " asset" + (assets.length == 1 ? '' : 's'))];
                    case 7:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get known fungible tokens (ERC-20) that match your filters.
     * @param param0 __namedParamters Object
     * @param symbol Filter by the ERC-20 symbol for the token,
     *    e.g. "DAI" for Dai stablecoin
     * @param address Filter by the ERC-20 contract address for the token,
     *    e.g. "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359" for Dai
     * @param name Filter by the name of the ERC-20 contract.
     *    Not guaranteed to exist or be unique for each token type.
     *    e.g. '' for Dai and 'Decentraland' for MANA
     * FUTURE: officiallySupported: Filter for tokens that are
     *    officially supported and shown on opensea.io
     */
    OpenSeaPort.prototype.getFungibleTokens = function (_a) {
        var _b = _a === void 0 ? {} : _a, symbol = _b.symbol, address = _b.address, name = _b.name;
        return __awaiter(this, void 0, void 0, function () {
            var tokenSettings, tokens, offlineTokens;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        tokenSettings = WyvernSchemas.tokens[this._networkName];
                        return [4 /*yield*/, this.api.getTokens({ symbol: symbol, address: address, name: name })];
                    case 1:
                        tokens = (_c.sent()).tokens;
                        offlineTokens = [
                            tokenSettings.canonicalWrappedEther
                        ].concat(tokenSettings.otherTokens).filter(function (t) {
                            if (symbol != null && t.symbol.toLowerCase() != symbol.toLowerCase()) {
                                return false;
                            }
                            if (address != null && t.address.toLowerCase() != address.toLowerCase()) {
                                return false;
                            }
                            if (name != null && t.name != name) {
                                return false;
                            }
                            return true;
                        });
                        return [2 /*return*/, offlineTokens.concat(tokens)];
                }
            });
        });
    };
    /**
     * Get the balance of a fungible token.
     * @param param0 __namedParameters Object
     * @param accountAddress User's account address
     * @param tokenAddress Optional address of the token's contract.
     *  Defaults to W-ETH
     * @param tokenAbi ABI for the token's contract. Defaults to ERC20
     */
    OpenSeaPort.prototype.getTokenBalance = function (_a) {
        var accountAddress = _a.accountAddress, tokenAddress = _a.tokenAddress, _b = _a.tokenAbi, tokenAbi = _b === void 0 ? contracts_1.ERC20 : _b;
        return __awaiter(this, void 0, void 0, function () {
            var amount;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!tokenAddress) {
                            tokenAddress = WyvernSchemas.tokens[this._networkName].canonicalWrappedEther.address;
                        }
                        return [4 /*yield*/, utils_1.promisify(function (c) { return _this.web3.eth.call({
                                from: accountAddress,
                                to: tokenAddress,
                                data: WyvernSchemas.encodeCall(contracts_1.getMethod(tokenAbi, 'balanceOf'), [accountAddress]),
                            }, c); })];
                    case 1:
                        amount = _c.sent();
                        return [2 /*return*/, utils_1.makeBigNumber(amount.toString())];
                }
            });
        });
    };
    /**
     * Compute the fees for an order
     * @param param0 __namedParameters
     * @param assets Array of addresses and ids that will be in the order
     * @param side The side of the order (buy or sell)
     * @param isPrivate Whether the order is private or not (known taker)
     * @param bountyBasisPoints The basis points to add for the bounty
     */
    OpenSeaPort.prototype.computeFees = function (_a) {
        var assets = _a.assets, side = _a.side, _b = _a.isPrivate, isPrivate = _b === void 0 ? false : _b, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c;
        return __awaiter(this, void 0, void 0, function () {
            var buyerFeeBPS, sellerFeeBPS, _d, tokenAddress, tokenId, asset, sellerBountyBPS, buyerBountyBPS, totalSellerFeeBPS, totalBuyerFeeBPS;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        buyerFeeBPS = utils_1.DEFAULT_BUYER_FEE_BASIS_POINTS;
                        sellerFeeBPS = utils_1.DEFAULT_SELLER_FEE_BASIS_POINTS;
                        if (!(_.uniqBy(assets, function (a) { return a.tokenAddress; }).length == 1)) return [3 /*break*/, 2];
                        _d = assets[0], tokenAddress = _d.tokenAddress, tokenId = _d.tokenId;
                        return [4 /*yield*/, this.api.getAsset(tokenAddress, tokenId)];
                    case 1:
                        asset = _e.sent();
                        if (!asset) {
                            throw new Error('No asset found for this order');
                        }
                        buyerFeeBPS = asset.assetContract.buyerFeeBasisPoints;
                        sellerFeeBPS = asset.assetContract.sellerFeeBasisPoints;
                        _e.label = 2;
                    case 2:
                        // Remove fees for private orders
                        if (isPrivate) {
                            buyerFeeBPS = 0;
                            sellerFeeBPS = 0;
                            bountyBasisPoints = 0;
                        }
                        sellerBountyBPS = side == types_1.OrderSide.Sell
                            ? bountyBasisPoints
                            : 0;
                        buyerBountyBPS = side == types_1.OrderSide.Buy
                            ? bountyBasisPoints
                            : 0;
                        totalSellerFeeBPS = sellerFeeBPS + sellerBountyBPS;
                        totalBuyerFeeBPS = buyerFeeBPS + buyerBountyBPS;
                        return [2 /*return*/, {
                                totalBuyerFeeBPS: totalBuyerFeeBPS,
                                totalSellerFeeBPS: totalSellerFeeBPS,
                                sellerBountyBPS: sellerBountyBPS,
                                buyerBountyBPS: buyerBountyBPS
                            }];
                }
            });
        });
    };
    /**
     * Compute the gas price for sending a txn, in wei
     * Will be slightly above the mean to make it faster
     */
    OpenSeaPort.prototype._computeGasPrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var meanGas, weiToAdd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils_1.getCurrentGasPrice(this.web3)];
                    case 1:
                        meanGas = _a.sent();
                        weiToAdd = this.web3.toWei(this.gasPriceAddition, 'gwei');
                        return [2 /*return*/, meanGas.plus(weiToAdd)];
                }
            });
        });
    };
    /**
     * Compute the gas amount for sending a txn
     * Will be slightly above the result of estimateGas to make it more reliable
     * @param estimation The result of estimateGas for a transaction
     */
    OpenSeaPort.prototype._correctGasAmount = function (estimation) {
        return Math.ceil(estimation * this.gasIncreaseFactor);
    };
    /**
     * Estimate the gas needed to match two orders
     * @param param0 __namedParamaters Object
     * @param buy The buy order to match
     * @param sell The sell order to match
     * @param accountAddress The taker's wallet address
     * @param metadata Metadata bytes32 to send with the match
     */
    OpenSeaPort.prototype._estimateGasForMatch = function (_a) {
        var buy = _a.buy, sell = _a.sell, accountAddress = _a.accountAddress, _b = _a.metadata, metadata = _b === void 0 ? utils_1.NULL_BLOCK_HASH : _b;
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(buy.maker == accountAddress && buy.paymentToken == utils_1.NULL_ADDRESS)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._getRequiredAmountForTakingSellOrder(sell)];
                    case 1:
                        value = _c.sent();
                        _c.label = 2;
                    case 2: return [2 /*return*/, this._wyvernProtocolReadOnly.wyvernExchange.atomicMatch_.estimateGasAsync([buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken], [buy.makerRelayerFee, buy.takerRelayerFee, buy.makerProtocolFee, buy.takerProtocolFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerRelayerFee, sell.takerRelayerFee, sell.makerProtocolFee, sell.takerProtocolFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt], [buy.feeMethod, buy.side, buy.saleKind, buy.howToCall, sell.feeMethod, sell.side, sell.saleKind, sell.howToCall], buy.calldata, sell.calldata, buy.replacementPattern, sell.replacementPattern, buy.staticExtradata, sell.staticExtradata, [buy.v, sell.v], [buy.r, buy.s, sell.r, sell.s,
                            metadata], 
                        // Typescript error in estimate gas method, so use any
                        { from: accountAddress, value: value })];
                }
            });
        });
    };
    /**
     * Estimate the gas needed to transfer assets in bulk
     * @param param0 __namedParamaters Object
     * @param assets An array of objects with the tokenId and tokenAddress of each of the assets to transfer.
     * @param fromAddress The owner's wallet address
     * @param toAddress The recipient's wallet address
     */
    OpenSeaPort.prototype._estimateGasForTransfer = function (_a) {
        var assets = _a.assets, fromAddress = _a.fromAddress, toAddress = _a.toAddress;
        return __awaiter(this, void 0, void 0, function () {
            var schema, wyAssets, proxyAddress, calldata;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        schema = this._getSchema();
                        wyAssets = assets.map(function (asset) { return utils_1.getWyvernAsset(schema, asset.tokenId, asset.tokenAddress); });
                        return [4 /*yield*/, this._getProxy(fromAddress)];
                    case 1:
                        proxyAddress = _b.sent();
                        if (!proxyAddress) {
                            throw new Error('Uninitialized proxy address');
                        }
                        return [4 /*yield*/, this._approveAll({ wyAssets: wyAssets, accountAddress: fromAddress, proxyAddress: proxyAddress })];
                    case 2:
                        _b.sent();
                        calldata = utils_1.encodeAtomicizedTransfer(schema, wyAssets, fromAddress, toAddress, this._wyvernProtocol.wyvernAtomicizer).calldata;
                        return [2 /*return*/, utils_1.estimateGas(this.web3, {
                                from: fromAddress,
                                to: proxyAddress,
                                data: utils_1.encodeProxyCall(wyvern_js_1.WyvernProtocol.getAtomicizerContractAddress(this._networkName), types_1.HowToCall.DelegateCall, calldata)
                            })];
                }
            });
        });
    };
    /**
     * Get the proxy address for a user's wallet.
     * Internal method exposed for dev flexibility.
     * @param accountAddress The user's wallet address
     * @param retries Optional number of retries to do
     */
    OpenSeaPort.prototype._getProxy = function (accountAddress, retries) {
        if (retries === void 0) { retries = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var proxyAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernProxyRegistry.proxies.callAsync(accountAddress)];
                    case 1:
                        proxyAddress = _a.sent();
                        if (proxyAddress == '0x') {
                            throw new Error("Couldn't retrieve your account from the blockchain - make sure you're on the correct Ethereum network!");
                        }
                        if (!(!proxyAddress || proxyAddress == utils_1.NULL_ADDRESS)) return [3 /*break*/, 4];
                        if (!(retries > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, utils_1.delay(3000)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this._getProxy(accountAddress, retries - 1)];
                    case 3:
                        proxyAddress = null;
                        _a.label = 4;
                    case 4: return [2 /*return*/, proxyAddress];
                }
            });
        });
    };
    /**
     * Initialize the proxy for a user's wallet.
     * Proxies are used to make trades on behalf of the order's maker so that
     *  trades can happen when the maker isn't online.
     * Internal method exposed for dev flexibility.
     * @param accountAddress The user's wallet address
     */
    OpenSeaPort.prototype._initializeProxy = function (accountAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, txnData, gasEstimate, transactionHash, proxyAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._dispatch(types_1.EventType.InitializeAccount, { accountAddress: accountAddress });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 1:
                        gasPrice = _a.sent();
                        txnData = { from: accountAddress, gasPrice: gasPrice };
                        return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernProxyRegistry.registerProxy.estimateGasAsync(txnData)];
                    case 2:
                        gasEstimate = _a.sent();
                        return [4 /*yield*/, this._wyvernProtocol.wyvernProxyRegistry.registerProxy.sendTransactionAsync(__assign({}, txnData, { gas: this._correctGasAmount(gasEstimate) }))];
                    case 3:
                        transactionHash = _a.sent();
                        return [4 /*yield*/, this._confirmTransaction(transactionHash, types_1.EventType.InitializeAccount, "Initializing proxy for account")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, utils_1.delay(1000)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this._getProxy(accountAddress, 2)];
                    case 6:
                        proxyAddress = _a.sent();
                        if (!proxyAddress) {
                            throw new Error('Failed to initialize your account :( Please restart your wallet/browser and try again!');
                        }
                        return [2 /*return*/, proxyAddress];
                }
            });
        });
    };
    /**
     * For a fungible token to use in trades (like W-ETH), get the amount
     *  approved for use by the Wyvern transfer proxy.
     * Internal method exposed for dev flexibility.
     * @param param0 __namedParamters Object
     * @param accountAddress Address for the user's wallet
     * @param tokenAddress Address for the token's contract
     */
    OpenSeaPort.prototype._getApprovedTokenCount = function (_a) {
        var accountAddress = _a.accountAddress, tokenAddress = _a.tokenAddress;
        return __awaiter(this, void 0, void 0, function () {
            var contractAddress, approved;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!tokenAddress) {
                            tokenAddress = WyvernSchemas.tokens[this._networkName].canonicalWrappedEther.address;
                        }
                        contractAddress = wyvern_js_1.WyvernProtocol.getTokenTransferProxyAddress(this._networkName);
                        return [4 /*yield*/, utils_1.promisify(function (c) { return _this.web3.eth.call({
                                from: accountAddress,
                                to: tokenAddress,
                                data: WyvernSchemas.encodeCall(contracts_1.getMethod(contracts_1.ERC20, 'allowance'), [accountAddress, contractAddress]),
                            }, c); })];
                    case 1:
                        approved = _b.sent();
                        return [2 /*return*/, utils_1.makeBigNumber(approved)];
                }
            });
        });
    };
    OpenSeaPort.prototype._makeBuyOrder = function (_a) {
        var asset = _a.asset, accountAddress = _a.accountAddress, startAmount = _a.startAmount, _b = _a.expirationTime, expirationTime = _b === void 0 ? 0 : _b, paymentTokenAddress = _a.paymentTokenAddress, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c;
        return __awaiter(this, void 0, void 0, function () {
            var schema, wyAsset, metadata, listingTime, _d, totalBuyerFeeBPS, totalSellerFeeBPS, buyerBountyBPS, _e, target, calldata, replacementPattern, paymentToken, _f, basePrice, extra;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        schema = this._getSchema();
                        wyAsset = utils_1.getWyvernAsset(schema, asset.tokenId, asset.tokenAddress);
                        metadata = {
                            asset: wyAsset,
                            schema: schema.name,
                        };
                        listingTime = Math.round(Date.now() / 1000 - 100);
                        return [4 /*yield*/, this.computeFees({ assets: [asset], bountyBasisPoints: bountyBasisPoints, side: types_1.OrderSide.Buy })];
                    case 1:
                        _d = _g.sent(), totalBuyerFeeBPS = _d.totalBuyerFeeBPS, totalSellerFeeBPS = _d.totalSellerFeeBPS, buyerBountyBPS = _d.buyerBountyBPS;
                        _e = WyvernSchemas.encodeBuy(schema, wyAsset, accountAddress), target = _e.target, calldata = _e.calldata, replacementPattern = _e.replacementPattern;
                        paymentToken = paymentTokenAddress || WyvernSchemas.tokens[this._networkName].canonicalWrappedEther.address;
                        return [4 /*yield*/, this._getPriceParameters(paymentToken, startAmount)];
                    case 2:
                        _f = _g.sent(), basePrice = _f.basePrice, extra = _f.extra;
                        return [2 /*return*/, {
                                exchange: wyvern_js_1.WyvernProtocol.getExchangeContractAddress(this._networkName),
                                maker: accountAddress,
                                taker: utils_1.NULL_ADDRESS,
                                makerRelayerFee: utils_1.makeBigNumber(totalBuyerFeeBPS),
                                takerRelayerFee: utils_1.makeBigNumber(totalSellerFeeBPS),
                                makerProtocolFee: utils_1.makeBigNumber(0),
                                takerProtocolFee: utils_1.makeBigNumber(0),
                                makerReferrerFee: utils_1.makeBigNumber(buyerBountyBPS),
                                feeMethod: types_1.FeeMethod.SplitFee,
                                feeRecipient: utils_1.feeRecipient,
                                side: types_1.OrderSide.Buy,
                                saleKind: types_1.SaleKind.FixedPrice,
                                target: target,
                                howToCall: types_1.HowToCall.Call,
                                calldata: calldata,
                                replacementPattern: replacementPattern,
                                staticTarget: utils_1.NULL_ADDRESS,
                                staticExtradata: '0x',
                                paymentToken: paymentToken,
                                basePrice: basePrice,
                                extra: extra,
                                listingTime: utils_1.makeBigNumber(listingTime),
                                expirationTime: utils_1.makeBigNumber(expirationTime),
                                salt: wyvern_js_1.WyvernProtocol.generatePseudoRandomSalt(),
                                metadata: metadata,
                            }];
                }
            });
        });
    };
    OpenSeaPort.prototype._makeSellOrder = function (_a) {
        var asset = _a.asset, accountAddress = _a.accountAddress, startAmount = _a.startAmount, endAmount = _a.endAmount, _b = _a.expirationTime, expirationTime = _b === void 0 ? 0 : _b, paymentTokenAddress = _a.paymentTokenAddress, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c, buyerAddress = _a.buyerAddress;
        return __awaiter(this, void 0, void 0, function () {
            var schema, wyAsset, listingTime, _d, totalSellerFeeBPS, totalBuyerFeeBPS, sellerBountyBPS, _e, target, calldata, replacementPattern, orderSaleKind, taker, paymentToken, _f, basePrice, extra;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        schema = this._getSchema();
                        wyAsset = utils_1.getWyvernAsset(schema, asset.tokenId, asset.tokenAddress);
                        listingTime = Math.round(Date.now() / 1000 - 100);
                        return [4 /*yield*/, this.computeFees({ assets: [asset], side: types_1.OrderSide.Sell, isPrivate: !!buyerAddress, bountyBasisPoints: bountyBasisPoints })];
                    case 1:
                        _d = _g.sent(), totalSellerFeeBPS = _d.totalSellerFeeBPS, totalBuyerFeeBPS = _d.totalBuyerFeeBPS, sellerBountyBPS = _d.sellerBountyBPS;
                        _e = WyvernSchemas.encodeSell(schema, wyAsset, accountAddress), target = _e.target, calldata = _e.calldata, replacementPattern = _e.replacementPattern;
                        orderSaleKind = endAmount != null && endAmount !== startAmount
                            ? types_1.SaleKind.DutchAuction
                            : types_1.SaleKind.FixedPrice;
                        taker = buyerAddress || utils_1.NULL_ADDRESS;
                        paymentToken = paymentTokenAddress || utils_1.NULL_ADDRESS;
                        return [4 /*yield*/, this._getPriceParameters(paymentToken, startAmount, endAmount)];
                    case 2:
                        _f = _g.sent(), basePrice = _f.basePrice, extra = _f.extra;
                        return [2 /*return*/, {
                                exchange: wyvern_js_1.WyvernProtocol.getExchangeContractAddress(this._networkName),
                                maker: accountAddress,
                                taker: taker,
                                makerRelayerFee: utils_1.makeBigNumber(totalSellerFeeBPS),
                                takerRelayerFee: utils_1.makeBigNumber(totalBuyerFeeBPS),
                                makerProtocolFee: utils_1.makeBigNumber(0),
                                takerProtocolFee: utils_1.makeBigNumber(0),
                                makerReferrerFee: utils_1.makeBigNumber(sellerBountyBPS),
                                feeMethod: types_1.FeeMethod.SplitFee,
                                feeRecipient: utils_1.feeRecipient,
                                side: types_1.OrderSide.Sell,
                                saleKind: orderSaleKind,
                                target: target,
                                howToCall: types_1.HowToCall.Call,
                                calldata: calldata,
                                replacementPattern: replacementPattern,
                                staticTarget: utils_1.NULL_ADDRESS,
                                staticExtradata: '0x',
                                paymentToken: paymentToken,
                                basePrice: basePrice,
                                extra: extra,
                                listingTime: utils_1.makeBigNumber(listingTime),
                                expirationTime: utils_1.makeBigNumber(expirationTime),
                                salt: wyvern_js_1.WyvernProtocol.generatePseudoRandomSalt(),
                                metadata: {
                                    asset: wyAsset,
                                    schema: schema.name,
                                }
                            }];
                }
            });
        });
    };
    OpenSeaPort.prototype._makeBundleSellOrder = function (_a) {
        var bundleName = _a.bundleName, bundleDescription = _a.bundleDescription, bundleExternalLink = _a.bundleExternalLink, assets = _a.assets, accountAddress = _a.accountAddress, startAmount = _a.startAmount, endAmount = _a.endAmount, _b = _a.expirationTime, expirationTime = _b === void 0 ? 0 : _b, paymentTokenAddress = _a.paymentTokenAddress, _c = _a.bountyBasisPoints, bountyBasisPoints = _c === void 0 ? 0 : _c, buyerAddress = _a.buyerAddress;
        return __awaiter(this, void 0, void 0, function () {
            var schema, wyAssets, bundle, _d, totalSellerFeeBPS, totalBuyerFeeBPS, sellerBountyBPS, _e, calldata, replacementPattern, taker, paymentToken, _f, basePrice, extra, listingTime, orderSaleKind;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        schema = this._getSchema();
                        wyAssets = assets.map(function (asset) { return utils_1.getWyvernAsset(schema, asset.tokenId, asset.tokenAddress); });
                        bundle = {
                            assets: wyAssets,
                            name: bundleName,
                            description: bundleDescription,
                            external_link: bundleExternalLink
                        };
                        return [4 /*yield*/, this.computeFees({ assets: assets, side: types_1.OrderSide.Sell, isPrivate: !!buyerAddress, bountyBasisPoints: bountyBasisPoints })];
                    case 1:
                        _d = _g.sent(), totalSellerFeeBPS = _d.totalSellerFeeBPS, totalBuyerFeeBPS = _d.totalBuyerFeeBPS, sellerBountyBPS = _d.sellerBountyBPS;
                        _e = WyvernSchemas.encodeAtomicizedSell(schema, wyAssets, accountAddress, this._wyvernProtocol.wyvernAtomicizer), calldata = _e.calldata, replacementPattern = _e.replacementPattern;
                        taker = buyerAddress || utils_1.NULL_ADDRESS;
                        paymentToken = paymentTokenAddress || utils_1.NULL_ADDRESS;
                        return [4 /*yield*/, this._getPriceParameters(paymentToken, startAmount, endAmount)
                            // Small offset to account for latency
                        ];
                    case 2:
                        _f = _g.sent(), basePrice = _f.basePrice, extra = _f.extra;
                        listingTime = Math.round(Date.now() / 1000 - 100);
                        orderSaleKind = endAmount != null && endAmount !== startAmount
                            ? types_1.SaleKind.DutchAuction
                            : types_1.SaleKind.FixedPrice;
                        return [2 /*return*/, {
                                exchange: wyvern_js_1.WyvernProtocol.getExchangeContractAddress(this._networkName),
                                maker: accountAddress,
                                taker: taker,
                                makerRelayerFee: utils_1.makeBigNumber(totalSellerFeeBPS),
                                takerRelayerFee: utils_1.makeBigNumber(totalBuyerFeeBPS),
                                makerProtocolFee: utils_1.makeBigNumber(0),
                                takerProtocolFee: utils_1.makeBigNumber(0),
                                makerReferrerFee: utils_1.makeBigNumber(sellerBountyBPS),
                                feeMethod: types_1.FeeMethod.SplitFee,
                                feeRecipient: utils_1.feeRecipient,
                                side: types_1.OrderSide.Sell,
                                saleKind: orderSaleKind,
                                target: wyvern_js_1.WyvernProtocol.getAtomicizerContractAddress(this._networkName),
                                howToCall: types_1.HowToCall.DelegateCall,
                                calldata: calldata,
                                replacementPattern: replacementPattern,
                                staticTarget: utils_1.NULL_ADDRESS,
                                staticExtradata: '0x',
                                paymentToken: paymentToken,
                                basePrice: basePrice,
                                extra: extra,
                                listingTime: utils_1.makeBigNumber(listingTime),
                                expirationTime: utils_1.makeBigNumber(expirationTime),
                                salt: wyvern_js_1.WyvernProtocol.generatePseudoRandomSalt(),
                                metadata: {
                                    bundle: bundle,
                                    schema: schema.name,
                                },
                            }];
                }
            });
        });
    };
    OpenSeaPort.prototype._makeMatchingOrder = function (_a) {
        var _this = this;
        var order = _a.order, accountAddress = _a.accountAddress;
        var schema = this._getSchema();
        var listingTime = Math.round(Date.now() / 1000 - 1000);
        var computeOrderParams = function () {
            if (order.metadata.asset) {
                return order.side == types_1.OrderSide.Buy
                    ? WyvernSchemas.encodeSell(schema, order.metadata.asset, accountAddress)
                    : WyvernSchemas.encodeBuy(schema, order.metadata.asset, accountAddress);
            }
            else if (order.metadata.bundle) {
                // We're matching a bundle order
                var atomicized = order.side == types_1.OrderSide.Buy
                    ? WyvernSchemas.encodeAtomicizedSell(schema, order.metadata.bundle.assets, accountAddress, _this._wyvernProtocol.wyvernAtomicizer)
                    : WyvernSchemas.encodeAtomicizedBuy(schema, order.metadata.bundle.assets, accountAddress, _this._wyvernProtocol.wyvernAtomicizer);
                return {
                    target: wyvern_js_1.WyvernProtocol.getAtomicizerContractAddress(_this._networkName),
                    calldata: atomicized.calldata,
                    replacementPattern: atomicized.replacementPattern
                };
            }
            else {
                throw new Error('Invalid order metadata');
            }
        };
        var _b = computeOrderParams(), target = _b.target, calldata = _b.calldata, replacementPattern = _b.replacementPattern;
        var matchingOrder = {
            exchange: order.exchange,
            maker: accountAddress,
            taker: order.maker,
            makerRelayerFee: order.makerRelayerFee,
            takerRelayerFee: order.takerRelayerFee,
            makerProtocolFee: order.makerProtocolFee,
            takerProtocolFee: order.takerProtocolFee,
            makerReferrerFee: order.makerReferrerFee,
            feeMethod: order.feeMethod,
            feeRecipient: utils_1.NULL_ADDRESS,
            side: (order.side + 1) % 2,
            saleKind: types_1.SaleKind.FixedPrice,
            target: target,
            howToCall: order.howToCall,
            calldata: calldata,
            replacementPattern: replacementPattern,
            staticTarget: utils_1.NULL_ADDRESS,
            staticExtradata: '0x',
            paymentToken: order.paymentToken,
            basePrice: order.basePrice,
            extra: utils_1.makeBigNumber(0),
            listingTime: utils_1.makeBigNumber(listingTime),
            expirationTime: utils_1.makeBigNumber(0),
            salt: wyvern_js_1.WyvernProtocol.generatePseudoRandomSalt(),
            metadata: order.metadata,
        };
        return __assign({}, matchingOrder, { hash: utils_1.getOrderHash(matchingOrder) });
    };
    /**
     * Validate against Wyvern that a buy and sell order can match
     * @param param0 __namedParamters Object
     * @param buy The buy order to validate
     * @param sell The sell order to validate
     * @param accountAddress Address for the user's wallet
     */
    OpenSeaPort.prototype._validateMatch = function (_a) {
        var buy = _a.buy, sell = _a.sell, accountAddress = _a.accountAddress;
        return __awaiter(this, void 0, void 0, function () {
            var ordersCanMatch, orderCalldataCanMatch;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.ordersCanMatch_.callAsync([buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken], [buy.makerRelayerFee, buy.takerRelayerFee, buy.makerProtocolFee, buy.takerProtocolFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerRelayerFee, sell.takerRelayerFee, sell.makerProtocolFee, sell.takerProtocolFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt], [buy.feeMethod, buy.side, buy.saleKind, buy.howToCall, sell.feeMethod, sell.side, sell.saleKind, sell.howToCall], buy.calldata, sell.calldata, buy.replacementPattern, sell.replacementPattern, buy.staticExtradata, sell.staticExtradata, { from: accountAddress })];
                    case 1:
                        ordersCanMatch = _b.sent();
                        if (!ordersCanMatch) {
                            throw new Error('Unable to match offer with auction. Please refresh or restart your wallet and try again!');
                        }
                        this.logger("Orders matching: " + ordersCanMatch);
                        return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.orderCalldataCanMatch.callAsync(buy.calldata, buy.replacementPattern, sell.calldata, sell.replacementPattern)];
                    case 2:
                        orderCalldataCanMatch = _b.sent();
                        this.logger("Order calldata matching: " + orderCalldataCanMatch);
                        if (!orderCalldataCanMatch) {
                            throw new Error('Unable to match offer details with auction. Please refresh or restart your wallet and try again!');
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Throws
    OpenSeaPort.prototype._validateSellOrderParameters = function (_a) {
        var order = _a.order, accountAddress = _a.accountAddress;
        return __awaiter(this, void 0, void 0, function () {
            var wyAssets, tokenAddress, minimumAmount, sellValid;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        wyAssets = order.metadata.bundle
                            ? order.metadata.bundle.assets
                            : order.metadata.asset
                                ? [order.metadata.asset]
                                : [];
                        tokenAddress = order.paymentToken;
                        return [4 /*yield*/, this._approveAll({ wyAssets: wyAssets, accountAddress: accountAddress })
                            // For fulfilling bids,
                            // need to approve access to fungible token because of the way fees are paid
                            // This can be done at a higher level to show UI
                        ];
                    case 1:
                        _b.sent();
                        if (!(tokenAddress != utils_1.NULL_ADDRESS)) return [3 /*break*/, 3];
                        minimumAmount = utils_1.makeBigNumber(order.basePrice);
                        return [4 /*yield*/, this.approveFungibleToken({ accountAddress: accountAddress, tokenAddress: tokenAddress, minimumAmount: minimumAmount })];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.validateOrderParameters_.callAsync([order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken], [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt], order.feeMethod, order.side, order.saleKind, order.howToCall, order.calldata, order.replacementPattern, order.staticExtradata, { from: accountAddress })];
                    case 4:
                        sellValid = _b.sent();
                        if (!sellValid) {
                            console.error(order);
                            throw new Error("Failed to validate sell order parameters. Make sure you're on the right network!");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    OpenSeaPort.prototype._approveAll = function (_a) {
        var wyAssets = _a.wyAssets, accountAddress = _a.accountAddress, _b = _a.proxyAddress, proxyAddress = _b === void 0 ? null : _b;
        return __awaiter(this, void 0, void 0, function () {
            var schema, _c, proxy, contractsWithApproveAll;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        schema = this._getSchema();
                        _c = proxyAddress;
                        if (_c) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._getProxy(accountAddress)];
                    case 1:
                        _c = (_d.sent());
                        _d.label = 2;
                    case 2:
                        proxyAddress = _c;
                        if (!!proxyAddress) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._initializeProxy(accountAddress)];
                    case 3:
                        proxyAddress = _d.sent();
                        _d.label = 4;
                    case 4:
                        proxy = proxyAddress;
                        contractsWithApproveAll = [];
                        return [2 /*return*/, Promise.all(wyAssets.map(function (wyAsset) { return __awaiter(_this, void 0, void 0, function () {
                                var where;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, utils_1.findAsset(this.web3, { account: accountAddress, proxy: proxy, wyAsset: wyAsset, schema: schema })];
                                        case 1:
                                            where = _a.sent();
                                            if (where != 'account') {
                                                // small todo: handle the 'proxy' case, which shouldn't happen ever anyway
                                                throw new Error('You do not own this asset.');
                                            }
                                            return [2 /*return*/, this.approveNonFungibleToken({
                                                    tokenId: wyAsset.id.toString(),
                                                    tokenAddress: wyAsset.address,
                                                    accountAddress: accountAddress,
                                                    proxyAddress: proxyAddress,
                                                    skipApproveAllIfTokenAddressIn: contractsWithApproveAll
                                                })];
                                    }
                                });
                            }); }))];
                }
            });
        });
    };
    // Throws
    OpenSeaPort.prototype._validateBuyOrderParameters = function (_a) {
        var order = _a.order, counterOrder = _a.counterOrder, accountAddress = _a.accountAddress;
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, balance, minimumAmount, buyValid;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tokenAddress = order.paymentToken;
                        if (!(tokenAddress != utils_1.NULL_ADDRESS)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.getTokenBalance({ accountAddress: accountAddress, tokenAddress: tokenAddress })
                            /* NOTE: no buy-side auctions for now, so sell.saleKind === 0 */
                        ];
                    case 1:
                        balance = _b.sent();
                        minimumAmount = utils_1.makeBigNumber(order.basePrice);
                        if (!counterOrder) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._getRequiredAmountForTakingSellOrder(counterOrder)];
                    case 2:
                        minimumAmount = _b.sent();
                        _b.label = 3;
                    case 3:
                        // Check WETH balance
                        if (balance.toNumber() < minimumAmount.toNumber()) {
                            if (tokenAddress == WyvernSchemas.tokens[this._networkName].canonicalWrappedEther.address) {
                                throw new Error('Insufficient balance. You may need to wrap Ether.');
                            }
                            else {
                                throw new Error('Insufficient balance.');
                            }
                        }
                        // Check token approval
                        // This can be done at a higher level to show UI
                        return [4 /*yield*/, this.approveFungibleToken({ accountAddress: accountAddress, tokenAddress: tokenAddress, minimumAmount: minimumAmount })];
                    case 4:
                        // Check token approval
                        // This can be done at a higher level to show UI
                        _b.sent();
                        _b.label = 5;
                    case 5: return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.validateOrderParameters_.callAsync([order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken], [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt], order.feeMethod, order.side, order.saleKind, order.howToCall, order.calldata, order.replacementPattern, order.staticExtradata, { from: accountAddress })];
                    case 6:
                        buyValid = _b.sent();
                        if (!buyValid) {
                            console.error(order);
                            throw new Error("Failed to validate buy order parameters. Make sure you're on the right network!");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Compute the `basePrice` and `extra` parameters to be used to price an order.
     * @param tokenAddress Address of the ERC-20 token to use for trading.
     * Use the null address for ETH
     * @param startAmount The base value for the order, in the token's main units (e.g. ETH instead of wei)
     * @param endAmount The end value for the order, in the token's main units (e.g. ETH instead of wei). If unspecified, the order's `extra` attribute will be 0
     */
    OpenSeaPort.prototype._getPriceParameters = function (tokenAddress, startAmount, endAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var isEther, tokens, token, priceDiff, basePrice, extra;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isEther = tokenAddress == utils_1.NULL_ADDRESS;
                        return [4 /*yield*/, this.getFungibleTokens({ address: tokenAddress })];
                    case 1:
                        tokens = _a.sent();
                        token = tokens[0];
                        if (!isEther && !token) {
                            throw new Error("No ERC-20 token found for '" + tokenAddress + "'");
                        }
                        priceDiff = endAmount != null
                            ? startAmount - endAmount
                            : 0;
                        basePrice = isEther
                            ? utils_1.makeBigNumber(this.web3.toWei(startAmount, 'ether')).round()
                            : wyvern_js_1.WyvernProtocol.toBaseUnitAmount(utils_1.makeBigNumber(startAmount), token.decimals);
                        extra = isEther
                            ? utils_1.makeBigNumber(this.web3.toWei(priceDiff, 'ether')).round()
                            : wyvern_js_1.WyvernProtocol.toBaseUnitAmount(utils_1.makeBigNumber(priceDiff), token.decimals);
                        return [2 /*return*/, { basePrice: basePrice, extra: extra }];
                }
            });
        });
    };
    OpenSeaPort.prototype._atomicMatch = function (_a) {
        var buy = _a.buy, sell = _a.sell, accountAddress = _a.accountAddress, _b = _a.metadata, metadata = _b === void 0 ? utils_1.NULL_BLOCK_HASH : _b;
        return __awaiter(this, void 0, void 0, function () {
            var value, buyValid, sellValid, txHash, gasPrice, txnData, args, gasEstimate, error_9, error_10;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(sell.maker.toLowerCase() == accountAddress.toLowerCase() && sell.feeRecipient == utils_1.NULL_ADDRESS)) return [3 /*break*/, 3];
                        // USER IS THE SELLER
                        return [4 /*yield*/, this._validateSellOrderParameters({ order: sell, accountAddress: accountAddress })];
                    case 1:
                        // USER IS THE SELLER
                        _c.sent();
                        return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.validateOrder_.callAsync([buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken], [buy.makerRelayerFee, buy.takerRelayerFee, buy.makerProtocolFee, buy.takerProtocolFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt], buy.feeMethod, buy.side, buy.saleKind, buy.howToCall, buy.calldata, buy.replacementPattern, buy.staticExtradata, buy.v, buy.r, buy.s, { from: accountAddress })];
                    case 2:
                        buyValid = _c.sent();
                        if (!buyValid) {
                            throw new Error('Invalid offer. Please restart your wallet/browser and try again!');
                        }
                        this.logger("Buy order is valid: " + buyValid);
                        return [3 /*break*/, 8];
                    case 3:
                        if (!(buy.maker.toLowerCase() == accountAddress.toLowerCase())) return [3 /*break*/, 8];
                        // USER IS THE BUYER
                        return [4 /*yield*/, this._validateBuyOrderParameters({ order: buy, counterOrder: sell, accountAddress: accountAddress })];
                    case 4:
                        // USER IS THE BUYER
                        _c.sent();
                        return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.validateOrder_.callAsync([sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken], [sell.makerRelayerFee, sell.takerRelayerFee, sell.makerProtocolFee, sell.takerProtocolFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt], sell.feeMethod, sell.side, sell.saleKind, sell.howToCall, sell.calldata, sell.replacementPattern, sell.staticExtradata, sell.v, sell.r, sell.s, { from: accountAddress })];
                    case 5:
                        sellValid = _c.sent();
                        if (!sellValid) {
                            throw new Error('Invalid auction. Please restart your wallet/browser and try again!');
                        }
                        this.logger("Sell order validation: " + sellValid);
                        if (!(buy.paymentToken == utils_1.NULL_ADDRESS)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this._getRequiredAmountForTakingSellOrder(sell)];
                    case 6:
                        value = _c.sent();
                        _c.label = 7;
                    case 7: return [3 /*break*/, 8];
                    case 8: return [4 /*yield*/, this._validateMatch({ buy: buy, sell: sell, accountAddress: accountAddress })];
                    case 9:
                        _c.sent();
                        this._dispatch(types_1.EventType.MatchOrders, { buy: buy, sell: sell, accountAddress: accountAddress, matchMetadata: metadata });
                        return [4 /*yield*/, this._computeGasPrice()];
                    case 10:
                        gasPrice = _c.sent();
                        txnData = { from: accountAddress, value: value, gasPrice: gasPrice };
                        args = [
                            [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target,
                                buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken],
                            [buy.makerRelayerFee, buy.takerRelayerFee, buy.makerProtocolFee, buy.takerProtocolFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerRelayerFee, sell.takerRelayerFee, sell.makerProtocolFee, sell.takerProtocolFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
                            [buy.feeMethod, buy.side, buy.saleKind, buy.howToCall, sell.feeMethod, sell.side, sell.saleKind, sell.howToCall],
                            buy.calldata,
                            sell.calldata,
                            buy.replacementPattern,
                            sell.replacementPattern,
                            buy.staticExtradata,
                            sell.staticExtradata,
                            [buy.v, sell.v],
                            [buy.r, buy.s, sell.r, sell.s,
                                metadata]
                        ];
                        _c.label = 11;
                    case 11:
                        _c.trys.push([11, 13, , 14]);
                        return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.atomicMatch_.estimateGasAsync(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], txnData)];
                    case 12:
                        gasEstimate = _c.sent();
                        txnData.gas = this._correctGasAmount(gasEstimate);
                        return [3 /*break*/, 14];
                    case 13:
                        error_9 = _c.sent();
                        console.error(error_9);
                        throw new Error("Oops, the Ethereum network rejected this transaction :( The OpenSea devs have been alerted, but this problem is typically due an item being locked or untransferrable. The exact error was \"" + error_9.message.substr(0, utils_1.MAX_ERROR_LENGTH) + "...\"");
                    case 14:
                        _c.trys.push([14, 16, , 17]);
                        this.logger("Fulfilling order with gas set to " + txnData.gas);
                        return [4 /*yield*/, this._wyvernProtocol.wyvernExchange.atomicMatch_.sendTransactionAsync(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], txnData)];
                    case 15:
                        txHash = _c.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        error_10 = _c.sent();
                        console.error(error_10);
                        this._dispatch(types_1.EventType.TransactionDenied, { error: error_10, buy: buy, sell: sell, accountAddress: accountAddress, matchMetadata: metadata });
                        throw new Error("Failed to authorize transaction: \"" + (error_10.message
                            ? error_10.message
                            : 'user denied') + "...\"");
                    case 17: return [2 /*return*/, txHash];
                }
            });
        });
    };
    OpenSeaPort.prototype._getRequiredAmountForTakingSellOrder = function (sell) {
        return __awaiter(this, void 0, void 0, function () {
            var currentPrice, estimatedPrice, maxPrice, feePercentage, fee;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentPrice(sell)];
                    case 1:
                        currentPrice = _a.sent();
                        estimatedPrice = utils_1.estimateCurrentPrice(sell);
                        maxPrice = bignumber_js_1.BigNumber.max(currentPrice, estimatedPrice);
                        // TODO Why is this not always a big number?
                        sell.takerRelayerFee = utils_1.makeBigNumber(sell.takerRelayerFee);
                        feePercentage = sell.takerRelayerFee.div(utils_1.INVERSE_BASIS_POINT);
                        fee = feePercentage.times(maxPrice);
                        return [2 /*return*/, fee.plus(maxPrice).ceil()];
                }
            });
        });
    };
    // Throws
    OpenSeaPort.prototype._validateAndPostOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var hash, valid, confirmedOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.hashOrder_.callAsync([order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken], [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt], order.feeMethod, order.side, order.saleKind, order.howToCall, order.calldata, order.replacementPattern, order.staticExtradata)];
                    case 1:
                        hash = _a.sent();
                        if (hash !== order.hash) {
                            console.error(order);
                            throw new Error("Order couldn't be validated by the exchange due to a hash mismatch. Make sure your wallet is on the right network!");
                        }
                        this.logger('Order hashes match');
                        return [4 /*yield*/, this._wyvernProtocolReadOnly.wyvernExchange.validateOrder_.callAsync([order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken], [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt], order.feeMethod, order.side, order.saleKind, order.howToCall, order.calldata, order.replacementPattern, order.staticExtradata, order.v, order.r || '0x', order.s || '0x')];
                    case 2:
                        valid = _a.sent();
                        if (!valid) {
                            console.error(order);
                            throw new Error('Invalid order. Please restart your wallet/browser and try again!');
                        }
                        this.logger('Order is valid');
                        return [4 /*yield*/, this.api.postOrder(utils_1.orderToJSON(order))];
                    case 3:
                        confirmedOrder = _a.sent();
                        return [2 /*return*/, confirmedOrder];
                }
            });
        });
    };
    OpenSeaPort.prototype._signOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var message, signerAddress;
            return __generator(this, function (_a) {
                message = order.hash;
                signerAddress = order.maker;
                this._dispatch(types_1.EventType.CreateOrder, { order: order, accountAddress: order.maker });
                try {
                    return [2 /*return*/, utils_1.personalSignAsync(this.web3, message, signerAddress)];
                }
                catch (error) {
                    this._dispatch(types_1.EventType.OrderDenied, { order: order, accountAddress: signerAddress });
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    OpenSeaPort.prototype._getSchema = function (schemaName) {
        if (schemaName === void 0) { schemaName = types_1.WyvernSchemaName.ERC721; }
        var schema = WyvernSchemas.schemas[this._networkName].filter(function (s) { return s.name == schemaName; })[0];
        if (!schema) {
            throw new Error('No schema found for this asset; please check back later!');
        }
        return schema;
    };
    OpenSeaPort.prototype._dispatch = function (event, data) {
        this._emitter.emit(event, data);
    };
    OpenSeaPort.prototype._confirmTransaction = function (transactionHash, event, description) {
        return __awaiter(this, void 0, void 0, function () {
            var transactionEventData, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transactionEventData = { transactionHash: transactionHash, event: event };
                        this.logger("Transaction started: " + description);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this._dispatch(types_1.EventType.TransactionCreated, transactionEventData);
                        return [4 /*yield*/, utils_1.confirmTransaction(this.web3, transactionHash)];
                    case 2:
                        _a.sent();
                        this.logger("Transaction succeeded: " + description);
                        this._dispatch(types_1.EventType.TransactionConfirmed, transactionEventData);
                        return [3 /*break*/, 4];
                    case 3:
                        error_11 = _a.sent();
                        this.logger("Transaction failed: " + description);
                        this._dispatch(types_1.EventType.TransactionFailed, __assign({}, transactionEventData, { error: error_11 }));
                        throw error_11;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return OpenSeaPort;
}());
exports.OpenSeaPort = OpenSeaPort;
//# sourceMappingURL=seaport.js.map