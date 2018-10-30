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
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const config = require('../../../env.json');
const NS = 'org.acme.Z2BTestNetwork';
let itemTable = null;
const svc = require('./Z2B_Services');
let bRegistered = false;

/**
 * get orders for buyer with ID =  _id
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the buyer making the request
 *  req.body.userID - the user id of the buyer in the identity table making this request
 *  req.body.secret - the pw of this user.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} an array of assets
 * @function
 */
exports.getMyCourses = function (req, res, next) {
    // connect to the network
    let method = 'getMyCourses';
    console.log(method+' req.body.userID is: '+req.body.userID );
    let allCourses = new Array();
    let businessNetworkConnection;
    if (svc.m_connection === null) {svc.createMessageSocket();}
    let ser;
    let archiveFile = fs.readFileSync(path.join(path.dirname(require.main.filename),'network','dist','zerotoblockchain-network.bna'));
    businessNetworkConnection = new BusinessNetworkConnection();
    return BusinessNetworkDefinition.fromArchive(archiveFile)
    .then((bnd) => {
        ser = bnd.getSerializer();
        //
        // v0.14
        // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, req.body.userID, req.body.secret)
        //
        // v0.15
        console.log(method+' req.body.userID is: '+req.body.userID );
        return businessNetworkConnection.connect(req.body.userID)
        .then(() => {
            return businessNetworkConnection.query('selectCourses')
            .then((courses) => {
                allCourses = new Array();
                for (let each in courses)
                    { (function (_idx, _arr)
                        {
                        let _jsn = ser.toJSON(_arr[_idx]);
                        _jsn.id = _arr[_idx].courseCode;
                        allCourses.push(_jsn);
                    })(each, courses);
                }
                res.send({'result': 'success', 'courses': allCourses});
            })
            .catch((error) => {console.log('selectCourses failed ', error);
                res.send({'result': 'failed', 'error': 'selectCourses: '+error.message});
            });
        })
        .catch((error) => {console.log('businessNetwork connect failed ', error);
            res.send({'result': 'failed', 'error': 'businessNetwork: '+error.message});
        });
    })
    .catch((error) => {console.log('create bnd from archive failed ', error);
        res.send({'result': 'failed', 'error': 'create bnd from archive: '+error.message});
    });
};


/**
 * return a json object built from the item table created by the autoload function
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * return {Array} an array of assets
 * @function
 */
exports.getItemTable = function (req, res, next)
{
    if (itemTable === null)
    {
        let newFile = path.join(path.dirname(require.main.filename),'startup','itemList.txt');
        itemTable = JSON.parse(fs.readFileSync(newFile));
    }
    res.send(itemTable);
};

/**
 * courseAction - act on an coursse for a student
 * @param {express.req} req - the inbound request object from the client
 * req.body.action - string with buyer requested action
 * student available actions are:
 * Create  - create a course
 * Register - register for a course
 * Purchase - submit created order to seller for execution
 * Cancel - cancel an existing order
 * req.body.participant - string with student id
 * req.body.courseCode - string with courseCode to be acted upon
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} an array of assets
 * @function
 */
exports.courseAction = function (req, res, next) {
    let method = 'courseAction';
    console.log(method+' req.body.participant is: '+req.body.participant );
    if (svc.m_connection === null) {svc.createMessageSocket();}
    let businessNetworkConnection;
    let updateCourse;
    businessNetworkConnection = new BusinessNetworkConnection();
    //
    // v0.14
    // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, req.body.participant, req.body.secret)
    //
    // v0.15
    return businessNetworkConnection.connect(req.body.participant)
    .then(() => {
        return businessNetworkConnection.getAssetRegistry(NS+'.Course')
        .then((assetRegistry) => {
            return assetRegistry.get(req.body.courseCode)
            .then((course) => {
                let factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                course.status = req.body.action;
                switch (req.body.action)
                {
                case 'RegisterCourse':
                    console.log('Course registration entered');
                    updateCourse = factory.newTransaction(NS, 'RegisterCourse');
                    updateCourse.registrar = factory.newRelationship(NS, 'Registrar', 'registrar@waketech.edu');
                    updateCourse.student = factory.newRelationship(NS, 'Student', course.student.$identifier);
                    console.log('Register update course', updateCourse);
                    break;
                case 'DropCourse':
                    console.log('Course drop entered');
                    updateCourse = factory.newTransaction(NS, 'DropCourse');
                    updateCourse.registrar = factory.newRelationship(NS, 'Registrar', course.registrar.$identifier);
                    updateCourse.student = factory.newRelationship(NS, 'Student', course.student.$identifier);
                    console.log('req.body', req.body);
                    console.log('course', course);
                    console.log('updateCourse', updateCourse);
                    break;
                case 'AcceptRegistrationStatus':
                    console.log('Accept Registration Status entered');
                    updateCourse = factory.newTransaction(NS, 'AcceptRegistrationStatus');
                    updateCourse.student = factory.newRelationship(NS, 'Student', course.student.$identifier);
                    updateCourse.registrar = factory.newRelationship(NS, 'Registrar', course.registrar.$identifier);
                    updateCourse.cashier = factory.newRelationship(NS, 'Cashier', course.cashier.$identifier);
                    updateCourse.registrationStatus = req.body.registrationStatus;
                    break;
                case 'DenyRegistrationStatus':
                    console.log('Deny Registration Status entered');
                    updateCourse = factory.newTransaction(NS, 'DenyRegistrationStatus');
                    updateCourse.student = factory.newRelationship(NS, 'Student', course.student.$identifier);
                    updateCourse.registrar = factory.newRelationship(NS, 'Registrar', course.registrar.$identifier);
                    console.log('reason', req.body.reason);
                    updateCourse.reasonForRejection = req.body.reason;
                    break;
                case 'ForwardRegistrationStatus':
                    console.log('Forward Registration Status entered');
                    updateCourse = factory.newTransaction(NS, 'ForwardRegistrationStatus');
                    updateCourse.student = factory.newRelationship(NS, 'Student', course.student.$identifier);
                    updateCourse.registrar = factory.newRelationship(NS, 'Registrar', course.registrar.$identifier);
                    updateCourse.cashier = factory.newRelationship(NS, 'Cashier', req.body.cashier);
                    break;
                case 'CancelCourse':
                    console.log('Cancel course entered');
                    updateCourse = factory.newTransaction(NS, 'CancelCourse');
                    updateCourse.student = factory.newRelationship(NS, 'Student', course.student.$identifier);
                    updateCourse.registrar = factory.newRelationship(NS, 'Registrar', course.registrar.$identifier);
                    updateCourse.cashier = factory.newRelationship(NS, 'Cashier', course.cashier.$identifier);
                    updateCourse.reasonForCancellation = req.body.reason;
                    break;
                case 'RequestTuition':
                    // to be completed for cashier
                    break;
                case 'PayTuition':
                    console.log('Pay Tuition entered');
                    updateCourse = factory.newTransaction(NS, 'PayTuition');
                    updateCourse.student = factory.newRelationship(NS, 'Student', course.student.$identifer);
                    updateCourse.registrar = factory.newRelationship(NS, 'Registrar', course.registrar.$identifer);
                    updateCourse.cashier = factory.newRelationship(NS, 'Cashier', course.cashier.$identifer);
                    updateCourse.amountPaid = parseFloat(req.body.amount);
                    break;
                case 'RefundTuition':
                    // console.log('Update Delivery Status');
                    // updateOrder = factory.newTransaction(NS, 'Delivering');
                    // updateOrder.shipper = factory.newRelationship(NS, 'Shipper', req.body.participant);
                    // updateOrder.deliveryStatus = req.body.delivery;
                    break;
                default :
                    console.log('default entered for action: '+req.body.action);
                    res.send({'result': 'failed', 'error':' course '+req.body.courseNo+' unrecognized request: '+req.body.action});
                }
                updateCourse.course = factory.newRelationship(NS, 'Course', course.$identifier);
                return businessNetworkConnection.submitTransaction(updateCourse)
                .then(() => {
                    console.log(' course '+req.body.courseCode+' successfully updated to '+req.body.action);
                    res.send({'result': ' course '+req.body.courseCode+' successfully updated to '+req.body.action});
                })
                .catch((error) => {
                    if (error.message.search('MVCC_READ_CONFLICT') !== -1)
                        {console.log(' retrying assetRegistry.update for: '+req.body.courseCode);
                        svc.loadTransaction(req.app.locals, updateCourse, req.body.courseCode, businessNetworkConnection);
                    }
                    else
                    {console.log(req.body.courseCode+' submitTransaction to update status to '+req.body.action+' failed with text: ',error.message);}
                });

            })
            .catch((error) => {
                console.log('Registry Get Course failed: '+error.message);
                res.send({'result': 'failed', 'error': 'Registry Get Course failed: '+error.message});
            });
        })
        .catch((error) => {console.log('Get Asset Registry failed: '+error.message);
            res.send({'result': 'failed', 'error': 'Get Asset Registry failed: '+error.message});
        });
    })
    .catch((error) => {console.log('Business Network Connect failed: '+error.message);
        res.send({'result': 'failed', 'error': 'Get Asset Registry failed: '+error.message});
    });
};

/**
 * adds an order to the blockchain
 * @param {express.req} req - the inbound request object from the client
 * req.body.seller - string with seller id
 * req.body.buyer - string with buyer id
 * req.body.items - array with items for order
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} an array of assets
 * @function
 */
exports.addCourse = function (req, res, next) {
    let method = 'addCourse';
    console.log(method+' req.body.student is: '+req.body.student );
    // console.log(req.body.course);
    let businessNetworkConnection;
    let factory;
    let ts = Date.now();
    let courseData = JSON.parse(req.body.course);
    let courseCode= courseData.baseCourseCode + req.body.student.replace(/@/, '').replace(/\./, '')+ts;
    if (svc.m_connection === null) {svc.createMessageSocket();}
    businessNetworkConnection = new BusinessNetworkConnection();
    //
    // v0.14
    // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, req.body.buyer, req.body.secret)
    //
    // v0.15
    return businessNetworkConnection.connect(req.body.student)
    .then(() => {
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();
        let course = factory.newResource(NS, 'Course', courseCode);
        course = svc.createCourseTemplate(course);
        course.amountDue = courseData.creditHours * 100;
        course.courseCode = courseCode;
        course.creditHours = courseData.creditHours;
        course.courseTitle = courseData.courseTitle;
        course.student = factory.newRelationship(NS, 'Student', req.body.student);
        course.registrar = factory.newRelationship(NS, 'Registrar', 'noop@dummy');
        course.cashier = factory.newRelationship(NS, 'Cashier', 'noop@dummy');
        
        // create the create order transaction
        const createNew = factory.newTransaction(NS, 'CreateCourse');

        createNew.course = factory.newRelationship(NS, 'Course', course.$identifier);
        createNew.student = factory.newRelationship(NS, 'Student', req.body.student);
        createNew.amount = course.amountDue;
        // add the order to the asset registry.
        return businessNetworkConnection.getAssetRegistry(NS+'.Course')
        .then((assetRegistry) => {
            return assetRegistry.add(course)
                .then(() => {
                    return businessNetworkConnection.submitTransaction(createNew)
                    .then(() => {console.log(' course '+courseCode+' successfully added');
                        res.send({'result': ' course '+courseCode+' successfully added'});
                    })
                    .catch((error) => {
                        if (error.message.search('MVCC_READ_CONFLICT') !== -1)
                            {console.log(courseCode+' retrying assetRegistry.add for: '+courseCode);
                            svc.loadTransaction(req.app.locals, createNew, courseCode, businessNetworkConnection);
                        }
                        else
                        {console.log(courseCode+' submitTransaction failed with text: ',error.message);}
                    });
                })
                .catch((error) => {
                    if (error.message.search('MVCC_READ_CONFLICT') !== -1)
                        {console.log(courseCode+' retrying assetRegistry.add for: '+courseCode);
                        svc.loadTransaction(req.app.locals, createNew, courseCode, businessNetworkConnection);
                    }
                    else
                    {
                        console.log(courseCode+' assetRegistry.add failed: ',error.message);
                        res.send({'result': 'failed', 'error':' course '+courseCode+' getAssetRegistry failed '+error.message});
                    }
                });
        })
        .catch((error) => {
            console.log(courseCode+' getAssetRegistry failed: ',error.message);
            res.send({'result': 'failed', 'error':' course '+courseCode+' getAssetRegistry failed '+error.message});
        });
    })
    .catch((error) => {
        console.log(method + ' : '+courseCode+' business network connection failed: text',error.message);
        res.send({'result': 'failed', 'error':' course '+courseCode+' add failed on on business network connection '+error.message});
    });
};
/**
 * _monitor
 * @param {WebSocket} _conn - web socket to use for member event posting
 * @param {WebSocket} _f_conn - web sockect to use for FinanceCo event posting
 * @param {Event} _event - the event just emitted
 *
 */
function _monitor(locals, _event)
{
    let method = '_monitor';
    console.log(method+ ' _event received: '+_event.$type+' for course: '+_event.courseCode);
    // create an event object and give it the event type, the orderID, the buyer id and the eventID
    // send that event back to the requestor
    let event = {};
    event.type = _event.$type;
    event.courseCode = _event.courseCode;
    event.ID = _event.studentID;
    svc.send(locals, 'Alert',JSON.stringify(event));

    // using switch/case logic, send events back to each participant who should be notified. 
    // for example, when a seller requests payment, they should be notified when the transaction has completed
    // and the financeCo should be notified at the same time. 
    // so you would use the _conn connection to notify the seller and the 
    // _f_conn connection to notify the financeCo

    switch (_event.$type)
    {
    case 'Created':
        break;
    case 'Registered':
    case 'RegistrationStatusAccepted':
        event.ID = _event.sellerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.financeCoID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        break;
    case 'Ordered':
    case 'Cancelled':
    case 'Backordered':
        event.ID = _event.sellerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.providerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        break;
    case 'ShipRequest':
    case 'DeliveryStarted':
    case 'DeliveryCompleted':
        event.ID = _event.sellerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.providerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.shipperID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        break;
    case 'DisputeOpened':
    case 'Resolved':
    case 'Refunded':
    case 'Paid':
        event.ID = _event.sellerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.providerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.shipperID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.financeCoID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        break;
    case 'PaymentAuthorized':
        event.ID = _event.sellerID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        event.ID = _event.financeCoID;
        svc.send(locals, 'Alert',JSON.stringify(event));
        break;
    default:
        break;
    }

}

/**
 * Register for all of the available Z2BEvents
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Object} - returns are via res.send
*/
exports.init_z2bEvents = function (req, res, next)
{
    let method = 'init_z2bEvents';
    if (bRegistered) {res.send('Already Registered');}
    else{
        bRegistered = true;
//        svc.createAlertSocket();
        let businessNetworkConnection;
        businessNetworkConnection = new BusinessNetworkConnection();
        businessNetworkConnection.setMaxListeners(50);
        //
        // v0.14
        // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, config.composer.adminID, config.composer.adminPW)
        //
        // v0.15
        return businessNetworkConnection.connect(config.composer.adminCard)
        .then(() => {
            // using the businessNetworkConnection, start monitoring for events.
            // when an event is provided, call the _monitor function, passing in the al_connection, f_connection and event information
            businessNetworkConnection.on('event', (event) => {_monitor(req.app.locals, event); });
            res.send('event registration complete');
        }).catch((error) => {
            // if an error is encountered, log the error and send it back to the requestor
            console.log(method+' business network connection failed'+error.message);
            res.send(method+' business network connection failed'+error.message);
        });
    }
};
