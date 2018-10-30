/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
let fs = require('fs');
let path = require('path');
const sleep = require('sleep');

// const ws = require('websocket');
// const http = require('http');
// const url = require('url');
const express = require('express');
const app = express();
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
const util = require('./Z2B_Utilities');
app.set('port', appEnv.port);



/**
 * This class creates an administration connection to a Hyperledger Composer runtime. The
 * connection can then be used to:
 * <ul>
 * <li></li>
 * </ul>
 *
 * @class
 * @memberof module:Z2Blockchain
 */
let  Z2Blockchain  = {

/**
 * create an empty order. This is used by any server side routine that needs to create an new
 * empty order.
 * @param {createCourseTemplate} _inbound - Course created with factory.newResource(NS, 'Course',.courseCode)
 * @returns {Course} - updated order item with all required fields except for relationships (student, registrar, cashier)
 * @utility
 */
    createCourseTemplate (_inbound)
{
        _inbound.courseCode = '';
        _inbound.courseTitle = '';
        _inbound.schedule = '';
        _inbound.creditHours = 0;
        _inbound.amountPaid = 0;
        _inbound.amountDue = 0;
        _inbound.amountRefunded = 0;
        _inbound.status = '';
        _inbound.cancelReason = '';
        _inbound.registrationStatus = '';
        _inbound.refundReason = '';
        _inbound.registrationRejectionReason = '';
        _inbound.created = '';
        _inbound.registered = '';
        _inbound.dropped = '';
        _inbound.tuitionRequested = '';
        _inbound.tuitionPaid = '';
        _inbound.refunded = '';
        _inbound.registrationStatusAccepted = '';
        _inbound.registrationStatusDenied = '';
        _inbound.registrationStatusForwarded = '';
        _inbound.courseCancelled = '';
        return(_inbound);
    },
/**
 * find a vendor in an array. This routine is no longer used
 * @param {vendor_type} _string - type of vendor to find (e.g. 'supplier', 'shipper', etc.)
 * @param {vendor_array} _vendorArray - vendor array from order
 * @returns {$identifier} - returns the identifier if found else -1
 * @utility
 */
    getVendor: function (_string, _vendorArray)
    {
        for (let each in _vendorArray)
            {for (let _prop in JSON.parse(_vendorArray[each]))
                {if (_prop === _string){return (JSON.parse(_vendorArray[each])[_string]);}}}
        return(-1);
    },
/**
 * find a item in an array. This is only used by the autoLoad process
 * @param {item_number} _itemNo - item number to find
 * @param {vendor_array} _itemArray - item array from order
 * @returns {JSON_object} - returns the item if found else error response
 * @utility
 */
    getItem: function (_itemNo, _itemArray)
    {
        for (let each in _itemArray)
            { if (_itemArray[each].itemNo === _itemNo){return (_itemArray[each]);}}
        return({'description':'Item '+_itemNo+ 'Not Found', 'unitPrice': 0, 'extendedPrice': 0});
    },
/**
 * update item quantity. used by the autoLoad process.
 * @param {item_number} _itemNo - item number to find
 * @param {item_number} _qty - quantity to change * @utility
 * @param {vendor_array} _itemArray - item array from order
 */
    setItem: function (_itemNo, _qty, _itemArray)
    {
        for (let each in _itemArray)
            {if (_itemArray[each].itemNo === _itemNo) {_itemArray[each].quantity += _qty;} }
    },
/**
 * supplemental routine to resubmit orders when MVCC_READ_CONFLICT encountered
 * @param {object} _con - web socket connection
 * @param {transaction} _item - transaction to process
 * @param {order_object} _id - order id
 * @param {BusinessNetworkConnection} businessNetworkConnection - already created business network connection
 * @returns {promise} promise
 */
    loadTransaction: function (_con, _item, _id, businessNetworkConnection)
    {
        let method = 'loadTransaction';
        return businessNetworkConnection.submitTransaction(_item)
        .then(() => {
            console.log(method+': order '+_id+' successfully added ');
            this.send(_con, 'Message', 'Order '+_id+' successfully added');
        })
        .catch((error) => {
            if (error.message.search('MVCC_READ_CONFLICT') !== -1)
                {sleep.sleep(5);
                console.log(_id+' loadTransaction retrying submit transaction for: '+_id);
                this.loadTransaction(_con, _item, _id, businessNetworkConnection);
                }
            });
    },
/**
 * add an order to a registry. This adds an Asset and does not execute a transaction
 * @param {order_object} _con - websocket
 * @param {assetRegistry} _course - order_object to process
 * @param {networkTransaction} _registry - registry into which asset (order) should be placed
 * @param {networkTransaction} _createNew - transaction to be processed after order successfully added
 * @param {businessNetworkConnection} _bnc - business network connection to use
 * @returns {promise} promise
 */
addCourse: function (_con, _course, _registry, _createNew, _bnc)
{
    let method = 'addCourse';
    return _registry.add(_course)
    .then(() => {
        this.loadTransaction(_con, _createNew, _course.courseCode, _bnc);
    })
    .catch((error) => {
        if (error.message.search('MVCC_READ_CONFLICT') !== -1)
        {console.log(_course.courseCode+' addCourse retrying assetRegistry.add for: '+_course.courseCode);
            this.addCourse(_con, _course, _registry, _createNew, _bnc);
        }
        else {console.log(method+' error with assetRegistry.add', error);}
    });
    },

/**
 * repeats the bind identity request
 * @param {WebSocket} _con - order_object to process
 * @param {String} _id - registry into which asset (course) should be placed
 * @param {String} _cert - transaction to be processed after order successfully added
 * @param {BusinessNetworkConnection} _bnc - business network connection to use
 * @returns {promise} promise
 */
bindIdentity: function (_con, _id, _cert, _bnc)
{
    let method = 'bindIdentity';
    console.log(method+' retrying bindIdentity for: '+_id);
    return _bnc.bindIdentity(_id, _cert)
    .then(() => {
        console.log(method+' Succeeded for: '+_id);
    })
    .catch((error) => {
        if (error.message.search('MVCC_READ_CONFLICT') !== -1)
        {console.log(' bindIdentity retrying _bnc.bindIdentity(_id, _cert) for: '+_id);
            this.bindIdentity(_con, _id, _cert,  _bnc);
        }
        else {console.log(method+' error with _bnc.bindIdentity(_id, _cert) for: '+_id+' with error: ', error);}
    });
},

/**
 * saves the member table with ids and secrets
 * @param {array} _table - array of JSON objects to save to file
 */
    saveMemberTable: function (_table)
    {
        let options = { flag : 'w' };
        let newFile = path.join(path.dirname(require.main.filename),'startup','memberList.txt');
        let _mem = '{"members": [';
        for (let each in _table)
            {(function(_idx, _arr)
                {if(_idx>0){_mem += ', ';} _mem +=JSON.stringify(_arr[_idx]);})(each, _table);}
        _mem += ']}';
        fs.writeFileSync(newFile, _mem, options);
    },
/**
 * saves the item table * @param {array} _table - array of JSON objects to save to file
 * @param {JSON} _table - data to be saved
 */
saveItemTable: function (_table)
{
    console.log('_table: ', _table);
    let options = { flag : 'w' };
    let newFile = path.join(path.dirname(require.main.filename),'startup','itemList.txt');
    let _mem = '{"classes": [';
    for (let each in _table)
        {(function(_idx, _arr){if(_idx>0){_mem += ', ';} _mem += JSON.stringify(_arr[_idx]);})(each, _table);}
    _mem += ']}';
    console.log('_mem: ', _mem);
    fs.writeFileSync(newFile, _mem, options);
},
/**
 * update an empty order with 4 items. update the amount field based on the sum of the line items
 * @param {addItems} _inbound - Course created with factory.newResource(NS, 'Course',.courseCode)
 * @param {itemTable} _itemTable - array of existing items
 * @returns {Course} - updated course item with all required fields except for relationships (student, registrar, cashier)
 * @utility
 */
    addItems: function (_inbound, _itemTable)
    {
        let _amount = 0;
        let _items = [];
        let _this = this;
        for (let each in _inbound.items)
            {(function(_idx, _arr)
                {
                    let _item = _this.getItem(_arr[_idx].itemNo, _itemTable);
                    _this.setItem(_arr[_idx].itemNo, _arr[_idx].quantity, _itemTable);
                    _arr[_idx].description = _item.itemDescription;
                    _arr[_idx].unitPrice = _item.unitPrice;
                    _arr[_idx].extendedPrice = _item.unitPrice*_arr[_idx].quantity;
                    _amount += _arr[_idx].extendedPrice;
                    _items.push(JSON.stringify(_arr[_idx]));
                })(each, _inbound.items);}
        return ({'items': _items, 'amount': _amount});
    },
/**
 * formats an Order into a reusable json object. work-around because serializer 
 * was not initially working. This function is no longer in use.
 * @param {Course} _course - the inbound Course item retrieved from a registry
 * @return JSON object order elements
 * @return {Course} JSON object course elements
 * @function
 */
    getCourseData: function (_course)
    {
        let courseElements = ['items', 'status', 'amount', 'created', 'cancelled', 'bought', 'ordered', 'dateBackordered', 'requestShipment', 'delivered', 'delivering', 'approved',
            'disputeOpened', 'disputeResolved', 'paymentRequested', 'orderRefunded', 'paid', 'dispute', 'resolve', 'backorder', 'refund'];
        let _obj = {};
        for (let each in courseElements){(function(_idx, _arr)
        { _obj[_arr[_idx]] = _course[_arr[_idx]]; })(each, courseElements);}
        _obj.student = _course.buyer.$identifier;
        _obj.registrar = _course.registrar.$identifier;
        _obj.cashier = _course.cashier.$provider;
        return (_obj);
    },

/**
 * JSON object of available order status types and codes. This is used by nodejs
 * server side code to correctly update order status with identical codes and text.
 */
    courseStatus: {
        Created: {code: 1, text: 'Course Created'},
        Registered: {code: 2, text: 'Course Registered'},
        Dropped: {code: 3, text: 'Course Dropped'},
        TuitionRequested: {code: 4, text: 'Tuition Requested'},
        TuitionPaid: {code: 5, text: 'Tuition Paid'},
        Refunded: {code: 6, text: 'Tuition Refunded'},
        RegistrationStatusAccepted: {code: 7, text: 'Registration Status Accepted'},
        RegistrationStatusDenied: {code: 8, text: 'Registration Status Denied'},
        RegistrationStatusForwarded: {code: 9, text: 'Registration Status Forwarded'},
        Cancelled: {code: 10, text: 'Course Cancelled'}
    },
/**
 * New code to support sending messages to socket clients
 * @param {Object} _locals - shared variables and functions from index.js
 * @param {String} type - type of event message to put on channel
 * @param {Event} event - event message
 */
    send: function (_locals, type, event)
    {
        _locals.processMessages({'type': type, 'data': event} );
    }
};

module.exports = Z2Blockchain;