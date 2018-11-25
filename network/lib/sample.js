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

var ns = 'org.acme.Z2BTestNetwork';

/**
 * create a course to register
 * @param {org.acme.Z2BTestNetwork.CreateCourse} register - the course to be processed
 * @transaction
 */
function CreateCourse(register) {
    console.log("In create course.");
    register.course.student = register.student;
    register.course.amountDue = 0.00;
    register.course.amountPaid = 0.00;
    register.course.created = new Date().toISOString();
    register.course.status = JSON.stringify(courseStatus.Created);
    return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
        .then(function (assetRegistry) {
            return assetRegistry.update(register.course)
            .then (function (_res) 
                    {
                        console.log('z2bEmit called');
                        z2bEmit('Created', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
        });
}
/**
 * Record a course to register
 * @param {org.acme.Z2BTestNetwork.RegisterCourse} register - the course to be processed
 * @transaction
 */
function RegisterCourse(register) {
    if (register.course.status == JSON.stringify(courseStatus.Created) || JSON.parse(register.course.status).code == courseStatus.Dropped.code || (JSON.parse(register.course.status).code == courseStatus.RegistrationStatusAccepted.code & register.course.registrationStatus == 'Dropped'))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registered = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Registered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        console.log('z2bEmit called');
                        z2bEmit('Registered', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
            });
        }
}
/**
 * Record a request to drop a course
 * @param {org.acme.Z2BTestNetwork.DropCourse} register - the course to be processed
 * @transaction
 */
function DropCourse(register) {
    if (register.course.status == JSON.stringify(courseStatus.Created) || register.course.status == JSON.stringify(courseStatus.Registered) || (register.course.status != JSON.stringify(courseStatus.Registered) & register.course.registrationStatus == 'Registered'))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.dropped = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Dropped);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        z2bEmit('Dropped', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
            });
        }
}
/**
 * Record a request for tuition from student by cashier
 * @param {org.acme.Z2BTestNetwork.RequestTuition} register - the course to be processed
 * @transaction
 */
function RequestTuition(register) {
    if (JSON.parse(register.course.status).code == courseStatus.RegistrationStatusForwarded.code)
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.tuitionRequested = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.TuitionRequested);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        z2bEmit('TuitionRequested', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
            });
        }
}
/**
 * Record a tuition payment
 * @param {org.acme.Z2BTestNetwork.PayTuition} register - the course to be processed
 * @transaction
 */
function PayTuition(register) {
    if (register.course.status == JSON.stringify(courseStatus.TuitionRequested) || JSON.parse(register.course.status).code == courseStatus.TuitionPaid.code)
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.amountPaid += register.amountPaid;
        register.course.tuitionPaid = new Date().toISOString();
        var _status = courseStatus.TuitionPaid;
        _status.text += " Amount due: $" + register.course.amountDue.toString();
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then(function (assetRegistry) {
                    return assetRegistry.update(register.course)
                    .then (function (_res) 
                    {
                        z2bEmit('TuitionPaid', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
                });
            });
        }
}
/**
 * Record a refund by cashier
 * @param {org.acme.Z2BTestNetwork.RefundTuition} register - the course to be processed
 * @transaction
 */
function RefundTuition(register) {
    if (JSON.parse(register.course.status).code == courseStatus.RegistrationStatusForwarded.code || (JSON.parse(register.course.status).code == courseStatus.TuitionPaid.code & register.course.amountDue < 0) || register.course.status == JSON.stringify(courseStatus.Cancelled))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.refundReason = register.reason;
        register.course.amountRefunded += register.amountRefunded;
        register.course.refunded = new Date().toISOString();
        var _status = courseStatus.Refunded;
        _status.text += " in the amount of $" + register.amountRefunded.toString();
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        z2bEmit('Refunded', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
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
        register.course.amountDue = register.course.creditHours * 100;
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        z2bEmit('RegistrationStatusAccepted', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
            });
    } else if (register.course.status == JSON.stringify(courseStatus.Dropped)){
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.registrationStatusAccepted = new Date().toISOString();
        register.course.registrationStatus = register.registrationStatus;
        register.course.amountDue = 0;
        var _status = courseStatus.RegistrationStatusAccepted;
        _status.text += " " + register.registrationStatus;
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        z2bEmit('RegistrationStatusAccepted', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
            });
    }
}
 /**
 * Record a rejection of registration status update
 * @param {org.acme.Z2BTestNetwork.DenyRegistrationStatus} register - the course to be processed
 * @transaction
 */
function DenyRegistrationStatus(register) {
    if ((register.course.status == JSON.stringify(courseStatus.Registered)) || register.course.status == JSON.stringify(courseStatus.Dropped))
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.registrationRejectionReason = register.reasonForRejection;
        register.course.registrationStatusDenied = new Date().toISOString();
        var _status = courseStatus.RegistrationStatusDenied;
        _status.text += " " + register.reasonForRejection;
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        z2bEmit('RegistrationStatusDenied', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
            });
    }
}
 /**
 * Record a forwarding of the registration change to the cashier
 * @param {org.acme.Z2BTestNetwork.ForwardRegistrationStatus} register - the course to be processed
 * @transaction
 */
function ForwardRegistrationStatus(register) {
    if (JSON.parse(register.course.status).code == courseStatus.RegistrationStatusAccepted.code || JSON.parse(register.course.status).code == courseStatus.RegistrationStatusDenied.code)
    {
        register.course.student = register.student;
        register.course.registrar = register.registrar;
        register.course.cashier = register.cashier;
        register.course.registrationStatusForwarded = new Date().toISOString();
        var _status = courseStatus.RegistrationStatusForwarded
        _status.text += " " + register.course.registrationStatus;
        register.course.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
            .then(function (assetRegistry) {
                return assetRegistry.update(register.course)
                .then (function (_res) 
                    {
                        z2bEmit('RegistrationStatusForwarded', register.course);
                        return (_res);
                    }).catch(function(error){return(error);});
            });
    } else {
        console.log('The course status ' + register.course.status + " is not correct");
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
        register.course.cancelReason = register.reasonForCancellation;
        register.course.amountDue = 0;
        register.course.registrationStatus = "Cancelled";
        register.course.courseCancelled = new Date().toISOString();
        register.course.status = JSON.stringify(courseStatus.Cancelled);
    return getAssetRegistry('org.acme.Z2BTestNetwork.Course')
        .then(function (assetRegistry) {
            return assetRegistry.update(register.course)
            .then (function (_res) 
                    {
                        z2bEmit('CourseCancelled', register.course);
                        return (_res);
                    }).catch(function(error){
                        console.log('Error detected in chaincode:', error);
                        return(error);});
        });
}



function displayObjectValues (_string, _object)
{
    for (var prop in _object){
        console.log(_string+'-->'+prop+':\t '+(((typeof(_object[prop]) === 'object') || (typeof(_object[prop]) === 'function'))  ? typeof(_object[prop]) : _object[prop]));
    }
}


/*
* z2bEmit emits an event of the type passed in on param 1
* all Z2BEvents have one extra parameter, which is the order identifier
* @param {String} _event - the event to be emitted
* @param {org.acme.Z2BTestNetwork.Order} _order - the orderID to be associated with this event
*/
function z2bEmit(_event, _course)
{
    console.log('z2bEmit event', _event);
    console.log('z2bEmit course', _course );
    var method = 'z2bEmit';
    var factory = getFactory();
    var z2bEvent = factory.newEvent(ns, _event);
    z2bEvent.courseCode = _course.$identifier;
    z2bEvent.studentID = _course.student.$identifier;

    console.log(z2bEvent.courseCode);
    console.log(z2bEvent.studentID);
    console.log('z2bEmit event:', z2bEvent);
    switch (_event)
    {
        case 'Created':
        case 'TuitionRequested':
            break;
        case 'RegistrationStatusAccepted':
        case 'RegistrationStatusDenied':
            z2bEvent.registrarID = _course.registrar.$identifier;
            break;
        case 'Registered':
            z2bEvent.registrarID = _course.registrar.$identifier;
            break;
        case 'Dropped':
            z2bEvent.registrarID = _course.registrar.$identifier;
            break;
        case 'RegistrationStatusForwarded':
            z2bEvent.cashierID = _course.cashier.$identifier;
            break;
        case 'TuitionPaid':
            z2bEvent.cashierID = _course.cashier.$identifier;
            break;
        case 'Refunded':
            break;
        case 'CourseCancelled':
            z2bEvent.cashierID = _course.cashier.$identifier;
            break;
        default:
            break;
    }
    console.log('Event about to be emitted', z2bEvent);
    emit(z2bEvent);
    console.log('Event just emitted', z2bEvent);
    return;
}