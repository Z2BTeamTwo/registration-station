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
};

/**
 * create a course to register
 * @param {org.acme.Z2BTestNetwork.CreateCourse} register - the course to be processed
 * @transaction
 */
function CreateCourse(register) {
    register.course.student = register.student;
    register.course.amountDue = register.amount;
    register.course.amountPaid = 0.00;
    register.course.created = new Date().toISOString();
    register.course.status = JSON.stringify(courseStatus.Created);
    return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
        .then(function (assetRegistry) {
            return assetRegistry.update(register.course);
        });
}
/**
 * Record a course to register
 * @param {org.acme.Z2BTestNetwork.RegisterCourse} register - the course to be processed
 * @transaction
 */
function RegisterCourse(register) {
    if (register.course.status == JSON.stringify(courseStatus.Created))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registered = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Registered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
        }
}
/**
 * Record a request to drop a course
 * @param {org.acme.Z2BTestNetwork.DropCourse} register - the course to be processed
 * @transaction
 */
function DropCourse(register) {
    if (register.course.status == JSON.stringify(courseStatus.Created))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.dropped = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Dropped);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
        }
}
/**
 * Record a request for tuition from student by cashier
 * @param {org.acme.Z2BTestNetwork.RequestTuition} register - the course to be processed
 * @transaction
 */
function RequestTuition(register) {
    if (register.course.status == JSON.stringify(courseStatus.Registered))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.tuitionRequested = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.TuitionRequested);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
        }
}
/**
 * Record a tuition payment
 * @param {org.acme.Z2BTestNetwork.PayTuition} register - the course to be processed
 * @transaction
 */
function PayTuition(register) {
    if (register.course.status == JSON.stringify(courseStatus.TuitionRequested))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.amountPaid += register.amountPaid;
        register.course.amountDue -= register.amountPaid;
        register.course.tuitionPaid = new Date().toISOString();
        var _status = courseStatus.TuitionPaid;
        _status.text = " Amount due: $" + register.amountPaid.toString();
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
        }
}
/**
 * Record a refund by cashier
 * @param {org.acme.Z2BTestNetwork.RefundTuition} register - the course to be processed
 * @transaction
 */
function RefundTuition(register) {
    if (register.course.status == JSON.stringify(orderStatus.RegistrationStatusForwarded) || register.course.status == JSON.stringify(orderStatus.Cancelled))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.refundReason = register.reason;
        register.course.amountPaid -= register.refundTution;
        register.course.amountDue += register.refundTuition;
        register.course.amountRefunded += register.refundTuition;
        register.course.refunded = new Date().toISOString();
        var _status = courseStatus.Registered;
        _status.text += " $" + register.refundTuition.toString() + " refunded."
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
        }
}
/**
 * Record a acceptance of registration status update
 * @param {org.acme.Z2BTestNetwork.AcceptRegistrationStatus} register - the course to be processed
 * @transaction
 */
function AcceptRegistrationStatus(register) {
    if ((register.course.status == JSON.stringify(courseStatus.Registered)))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.registrationStatusAccepted = new Date().toISOString();
        register.course.registrationStatus = register.registrationStatus;
        var _status = courseStatus.RegistrationStatusAccepted;
        _status.text += " " + register.registrationStatus;
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
    } else if (register.course.status == JSON.stringify(courseStatus.Dropped)){
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.registrationStatusAccepted = new Date().toISOString();
        register.course.registrationStatus = register.registrationStatus;
        var _status = courseStatus.RegistrationStatusAccepted;
        _status.text += " " + register.registrationStatus;
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
    }
}
 /**
 * Record a rejection of registration status update
 * @param {org.acme.Z2BTestNetwork.DenyRegistrationStatus} register - the course to be processed
 * @transaction
 */
function DenyRegistrationStatus(register) {
    if ((register.course.status == JSON.stringify(courseStatus.Registered)))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registrationRejectionReason = register.course.reasonForRejection;
        register.course.registrationStatusRejected = new Date().toISOString();
        var _status = courseStatus.RegistrationStatusDenied;
        _status.text = " " + register.reasonForRejection + ".";
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
    }
}
 /**
 * Record a forwarding of the registration change to the cashier
 * @param {org.acme.Z2BTestNetwork.ForwardRegistrationStatus} register - the course to be processed
 * @transaction
 */
function ForwardRegistrationStatus(register) {
    if ((register.course.status == JSON.stringify(courseStatus.RegistrationStatusAccepted)) || (register.course.status == JSON.stringify(courseStatus.RegistrationStatusDenied)))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registrationStatusForwarded = new Date().toISOString();
        var _status = courseStatus.RegistrationStatusForwarded
        _status.text = " " + register.registrationStatus;
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course);
            });
    }
}
 /**
 * Record a course cancellation
 * @param {org.acme.Z2BTestNetwork.CancelCourse} register - the course to be processed
 * @transaction
 */
function CancelCourse(register) {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cancelReason = register.cancel;
        register.course.courseCancelled = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Cancelled);
    return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
        .then(function (assetRegistry) {
            return assetRegistry.update(register.course);
        });
}