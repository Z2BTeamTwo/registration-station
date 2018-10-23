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

var courseStatus = {
    Registered: {code: 1, text: 'Course Registered'},
    Dropped: {code: 2, text: 'Course Dropped'},
    TuitionRequested: {code: 3, text: 'Tuition Requested'},
    TuitionPaid: {code: 4, text: 'Tuition Paid'},
    Refunded: {code: 5, text: 'Tuition Refunded'},
    RegistrationStatusAccepted: {code: 6, text: 'Registration Status Accepted'},
    RegistrationStatusDenied: {code: 15, text: 'Registration Status Denied'},
    RegistrationStatusForwarded: {code: 7, text: 'Registration Status Forwarded'},
    Cancelled: {code: 8, text: 'Course Cancelled'}
};

/**
 * create an order to purchase
 * create a course to register
 * @param {org.acme.Z2BTestNetwork.CreateOrder} purchase - the order to be processed
 * @transaction
 */
function CreateCourse(register) {
    register.course.student = register.student;
    register.course.amount = register.amount;
    register.course.created = new Date().toISOString();
    register.course.status = JSON.stringify(courseStatus.Created);
    return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
        .then(function (assetRegistry) {
            return assetRegistry.update(register.course);
        });
}
/**
 * Record a request to purchase
 * Record a course to register
 * @param {org.acme.Z2BTestNetwork.Buy} purchase - the order to be processed
 * @transaction
 */
function RegisterCourse(register) {
    if (register.course.status == JSON.stringify(courseStatus.Created))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.bought = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Bought);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
/**
 * Record a request to cancel an order
 * @param {org.acme.Z2BTestNetwork.OrderCancel} purchase - the order to be processed
 * @transaction
 */
function DropCourse(register) {
    if (register.course.status == JSON.stringify(courseStatus.Created))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.bought = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Bought);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
/**
 * Record a request to order by seller from supplier
 * @param {org.acme.Z2BTestNetwork.OrderFromSupplier} purchase - the order to be processed
 * @transaction
 */
function ReceiveTuitionRequest(register) {
    if (register.course.status == JSON.stringify(orderStatus.Bought))
    {
        register.course.student = register.student;
        register.course.cashier = register.cashier;
        register.course.registered = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Registered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
/**
 * Record a request to ship by supplier to shipper
 * @param {org.acme.Z2BTestNetwork.RequestShipping} purchase - the order to be processed
 * @transaction
 */
function PayTuition(register) {
    if (register.course.status == JSON.stringify(orderStatus.Bought))
    {
        register.course.student = register.student;
        register.course.cashier = register.cashier;
        register.course.registered = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Registered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
/**
 * Record a delivery by shipper
 * @param {org.acme.Z2BTestNetwork.Delivering} purchase - the order to be processed
 * @transaction
 */
function GetRefund(register) {
    if (register.course.status == JSON.stringify(orderStatus.Bought))
    {
        register.course.student = register.student;
        register.course.cashier = register.cashier;
        register.course.registered = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Registered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
/**
 * Record a delivery by shipper
 * @param {org.acme.Z2BTestNetwork.Deliver} purchase - the order to be processed
 * @transaction
 */
function AcceptRegistrationStatus(register) {
    if ((register.course.status == JSON.stringify(courseStatus.RegisterRequest)) || (JSON.parse(register.course.status).code == courseStatus.Registrating.code))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registrated = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Delivered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
 /**
 * Record a request for payment by the seller
 * @param {org.acme.Z2BTestNetwork.RequestPayment} purchase - the order to be processed
 * @transaction
 */
function RejectRegistrationStatus(register) {
    if ((register.course.status == JSON.stringify(courseStatus.RegisterRequest)) || (JSON.parse(register.course.status).code == courseStatus.Registrating.code))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registrated = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Delivered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
 /**
 * Record a payment to the seller
 * @param {org.acme.Z2BTestNetwork.AuthorizePayment} purchase - the order to be processed
 * @transaction
 */
function ForwardRegistrationStatus(register) {
    if ((register.course.status == JSON.stringify(courseStatus.RegisterRequest)) || (JSON.parse(register.course.status).code == courseStatus.Registrating.code))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registrated = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Delivered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.registrar);
            });
        }
}
 /**
 * Record a payment to the seller
 * @param {org.acme.Z2BTestNetwork.Pay} purchase - the order to be processed
 * @transaction
 */
function Pay(register) {
    if (JSON.parse(register.course.status).text == courseStatus.Authorize.text )
        {register.course.status = JSON.stringify(coursseStatus.Paid);
        register.courser.paid = new Date().toISOString();
        }
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(register.registrar);
        });
}
 /**
 * Record a dispute by the buyer
 * @param {org.acme.Z2BTestNetwork.Dispute} purchase - the order to be processed
 * @transaction
 */
function CancelCourse(register) {
        register.course.status = JSON.stringify(courseStatus.Cancel);
        register.course.cancel = register.cancel;
        register.course.courseCancelled = new Date().toISOString();
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(register.registrar);
        });
}
 /**
 * Resolve a seller initiated dispute
 * @param {org.acme.Z2BTestNetwork.Resolve} purchase - the order to be processed
 * @transaction

function Resolve(purchase) {
        purchase.order.status = JSON.stringify(orderStatus.Resolve);
        purchase.order.resolve = purchase.resolve;
        purchase.order.disputeResolved = new Date().toISOString();
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order);
        });
}  */
 /**
 * Record a refund to the buyer
 * @param {org.acme.Z2BTestNetwork.Refund} purchase - the order to be processed
 * @transaction

function Refund(purchase) {
        purchase.order.status = JSON.stringify(orderStatus.Refund);
        purchase.order.refund = purchase.refund;
        purchase.order.orderRefunded = new Date().toISOString();
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order);
        });
}  */
 /**
 * Record a backorder by the supplier
 * @param {org.acme.Z2BTestNetwork.BackOrder} purchase - the order to be processed
 * @transaction

function BackOrder(purchase) {
        purchase.order.status = JSON.stringify(orderStatus.Backordered);
        purchase.order.backorder = purchase.backorder;
        purchase.order.dateBackordered = new Date().toISOString();
        purchase.order.provider = purchase.provider;
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order);
        }); 
}  */
