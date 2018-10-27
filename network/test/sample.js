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

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

require('chai').should();

// const network = 'zerotoblockchain-network';
const _timeout = 90000;
const NS = 'org.acme.Z2BTestNetwork';
const courseNo = '12345';
const secondCourseNo = '67890';
const studentID = 'beststudentever@email.com';
const registrarID = 'registeringYouSinceYouWereBorn@email.com';
const cashierID = 'weTakeYoMoneys';
const reasonForCancellation = 'Scooby Doo is AWESOME';
const reasonForRejection = 'Because I can!';
const courseAmount = 300.0;

let courseStatus = {
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
 * create an empty course
 * @param {createCourseTemplate} _inbound - Order created with factory.newResource(NS, 'Order', orderNo)
 * @returns {Course} - updated order item with all required fields except for relationships (student, registrar)
 * @utility
 */
function createCourseTemplate (_inbound)
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
}


describe('Registration Network', function () {
    this.timeout(_timeout);
    let businessNetworkConnection;
    before(function () {
        businessNetworkConnection = new BusinessNetworkConnection();
        return businessNetworkConnection.connect('admin@zerotoblockchain-network');
    });

    describe('#createCourse', () => {

        it('should be able to create a course', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
            // create the student
            const student = factory.newResource(NS, 'Student', studentID);
            student.participantName = 'Jimbo';

            // create the registrar
            const registrar = factory.newResource(NS, 'Registrar', registrarID);
            registrar.participantName = 'Wake Tech Registrar';

            // create the cashier
            const cashier = factory.newResource(NS, 'Cashier', cashierID);
            cashier.participantName = 'Wake Tech Cashier';

            // create the course
            let course = factory.newResource(NS, 'Course', courseNo);
            course = createCourseTemplate(course);
            course.courseCode = courseNo;
            course.creditHours = 3;
            course.amountDue = course.creditHours * 100.00;
            course.courseTitle = "Studying things";
            course.schedule = "Mon, Wed, Fri 6:00-8:00";

            // create the buy transaction
            const createNew = factory.newTransaction(NS, 'CreateCourse');

            course.student = factory.newRelationship(NS, 'Student', student.$identifier);
            course.registrar = factory.newRelationship(NS, 'Registrar', registrar.$identifier);
            course.cashier = factory.newRelationship(NS, 'Cashier', cashier.$identifier);
            createNew.course = factory.newRelationship(NS, 'Course', course.$identifier);
            createNew.student = factory.newRelationship(NS, 'Student', student.$identifier);
            createNew.amount = course.amountDue;

            // tests the initial addition of various datapoints
            course.student.$identifier.should.equal(student.$identifier);
            course.amountDue.should.equal(courseAmount);
            createNew.amount.should.equal(courseAmount);
            createNew.course.$identifier.should.equal(courseNo);

            // Get the asset registry.
            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {

                    // add the course to the asset registry.
                    return assetRegistry.add(course)
                        .then(() => {
                            return businessNetworkConnection.getParticipantRegistry(NS + '.Student');
                        })
                        .then((participantRegistry) => {
                            // add the student, registrar, and cashier
                            return participantRegistry.addAll([student, registrar, cashier]);
                        })
                        .then(() => {
                            // submit the transaction
                            return businessNetworkConnection.submitTransaction(createNew);
                        })
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should not be simon
                            newCourse.student.$identifier.should.equal(studentID);
                            JSON.parse(newCourse.status).code.should.equal(courseStatus.Created.code);
                            newCourse.amountDue.should.equal(courseAmount);
                        });
                });
        });
    });

    describe('#issueRegisterRequest', () => {

        it('should be able to issue a register request', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const registerNow = factory.newTransaction(NS, 'RegisterCourse'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);
                    registerNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    registerNow.student = newCourse.student;
                    registerNow.registrar = newCourse.registrar;
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(registerNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be buyer
                            newCourse.student.$identifier.should.equal(studentID);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.Registered.text);
                        });

                });
        });
    });

    describe('#issueStatusAccept', () => {

        it('should be able to issue a status accept', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const acceptNow = factory.newTransaction(NS, 'AcceptRegistrationStatus'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);
                    acceptNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    acceptNow.student = newCourse.student;
                    acceptNow.registrar = newCourse.registrar;
                    acceptNow.cashier = newCourse.cashier;
                    acceptNow.registrationStatus = "Registered";
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(acceptNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be buyer
                            newCourse.student.$identifier.should.equal(studentID);
                            newCourse.registrationStatus.should.equal("Registered");
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.RegistrationStatusAccepted.text + " Registered");
                        });
                });
        });
    });

    describe('#issueForwardStatusChange', () => {

        it('should be able to issue a status forward', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const forwardNow = factory.newTransaction(NS, 'ForwardRegistrationStatus'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);
                    forwardNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    forwardNow.student = newCourse.student;
                    forwardNow.registrar = newCourse.registrar;
                    forwardNow.cashier = newCourse.cashier;
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(forwardNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be student
                            newCourse.student.$identifier.should.equal(studentID);
                            newCourse.registrationStatus.should.equal("Registered");
                            JSON.parse(newCourse.status).code.should.equal(courseStatus.RegistrationStatusForwarded.code);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.RegistrationStatusForwarded.text + " Registered");
                        });
                });
        });
    });

    describe('#issueRequestTuition', () => {

        it('should be able to issue a payment request', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const payNow = factory.newTransaction(NS, 'RequestTuition'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);
                    payNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    payNow.student = newCourse.student;
                    payNow.registrar = newCourse.registrar;
                    payNow.cashier = newCourse.cashier;
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(payNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be student
                            newCourse.student.$identifier.should.equal(studentID);
                            newCourse.registrationStatus.should.equal("Registered");
                            JSON.parse(newCourse.status).code.should.equal(courseStatus.TuitionRequested.code);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.TuitionRequested.text);
                        });
                });
        });
    });

    describe('#issuePayTuition', () => {

        it('should be able to issue a payment', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const payNow = factory.newTransaction(NS, 'PayTuition'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);
                    payNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    payNow.student = newCourse.student;
                    payNow.registrar = newCourse.registrar;
                    payNow.cashier = newCourse.cashier;
                    payNow.amountPaid = 300;
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(payNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be student
                            newCourse.student.$identifier.should.equal(studentID);
                            newCourse.registrationStatus.should.equal("Registered");
                            newCourse.amountPaid.should.equal(300);
                            newCourse.amountDue.should.equal(0);
                            JSON.parse(newCourse.status).code.should.equal(courseStatus.TuitionPaid.code);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.TuitionPaid.text + " Amount due: $" + newCourse.amountDue);
                        });
                });
        });
    });

    describe('#issueCancelCourse', () => {

        it('should be able to issue a course cancellation', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const courseCancelNow = factory.newTransaction(NS, 'CancelCourse'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);
                    courseCancelNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    courseCancelNow.student = newCourse.student;
                    courseCancelNow.registrar = newCourse.registrar;
                    courseCancelNow.cashier = newCourse.cashier;
                    courseCancelNow.reasonForCancellation = reasonForCancellation;

                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(courseCancelNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be student
                            newCourse.student.$identifier.should.equal(studentID);
                            newCourse.registrationStatus.should.equal("Cancelled");
                            newCourse.amountPaid.should.equal(300);
                            newCourse.amountDue.should.equal(0);
                            newCourse.cancelReason = reasonForCancellation;
                            JSON.parse(newCourse.status).code.should.equal(courseStatus.Cancelled.code);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.Cancelled.text);
                        });
                });
        });
    });

    describe('#issueRefundTuition', () => {

        it('should be able to issue a tuition refund', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const refundNow = factory.newTransaction(NS, 'RefundTuition'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);
                    refundNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    refundNow.student = newCourse.student;
                    refundNow.registrar = newCourse.registrar;
                    refundNow.cashier = newCourse.cashier;
                    refundNow.reason = "Course Cancelled";
                    refundNow.amountRefunded = 300;

                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(refundNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be student
                            newCourse.student.$identifier.should.equal(studentID);
                            newCourse.registrationStatus.should.equal("Cancelled");
                            newCourse.amountPaid.should.equal(300);
                            newCourse.amountDue.should.equal(0);
                            newCourse.amountRefunded.should.equal(300);
                            newCourse.refundReason = "Course Cancelled";
                            JSON.parse(newCourse.status).code.should.equal(courseStatus.Refunded.code);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.Refunded.text + " in the amount of $" + newCourse.amountRefunded.toString());
                        });
                });
        });
    });


    describe('#createSecondCourse', () => {

        it('should be able to create a course', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
            // create the course
            let course = factory.newResource(NS, 'Course', secondCourseNo);
            course = createCourseTemplate(course);
            course.courseCode = secondCourseNo;
            course.creditHours = 3;
            course.amountDue = course.creditHours * 100.00;
            course.courseTitle = "Studying things";
            course.schedule = "Mon, Wed, Fri 6:00-8:00";

            // create the buy transaction
            const createNew = factory.newTransaction(NS, 'CreateCourse');

            course.student = factory.newRelationship(NS, 'Student', studentID);
            course.registrar = factory.newRelationship(NS, 'Registrar', registrarID);
            course.cashier = factory.newRelationship(NS, 'Cashier', cashierID);
            createNew.course = factory.newRelationship(NS, 'Course', course.$identifier);
            createNew.student = factory.newRelationship(NS, 'Student', studentID);
            createNew.amount = course.amountDue;

            // tests the initial addition of various datapoints
            course.student.$identifier.should.equal(studentID);
            course.amountDue.should.equal(courseAmount);
            createNew.amount.should.equal(courseAmount);
            createNew.course.$identifier.should.equal(secondCourseNo);

            // Get the asset registry.
            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {

                    // add the course to the asset registry.
                    return assetRegistry.add(course)
                        .then(() => {
                            // submit the transaction
                            return businessNetworkConnection.submitTransaction(createNew);
                        })
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(secondCourseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should not be simon
                            newCourse.student.$identifier.should.equal(studentID);
                            JSON.parse(newCourse.status).code.should.equal(courseStatus.Created.code);
                            newCourse.amountDue.should.equal(courseAmount);
                        });
                });
        });
    });

    // This is the second pass to cover drop and deny scenarios
    describe('#issueRegisterRequestForSecondCourse', () => {

        it('should be able to issue a register request', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            //create the course transaction 
            const registerNow = factory.newTransaction(NS, 'RegisterCourse'); 

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(secondCourseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(secondCourseNo);
                    registerNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    registerNow.student = newCourse.student;
                    registerNow.registrar = newCourse.registrar;
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(registerNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(secondCourseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be buyer
                            newCourse.student.$identifier.should.equal(studentID);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.Registered.text);
                        });

                });
        });
    });
    // This is step two for the second course
    describe('#issueDropRequestForSecondCourse', () => {

        it('should be able to issue a drop request for second course', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the buy transaction
            const dropNow = factory.newTransaction(NS, 'DropCourse');

            return businessNetworkConnection.getParticipantRegistry(NS + '.Student')
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                })
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(secondCourseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(secondCourseNo);
                    dropNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    dropNow.student = newCourse.student;
                    dropNow.registrar = newCourse.registrar;
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(dropNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(secondCourseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the commodity should be student
                            newCourse.student.$identifier.should.equal(studentID);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.Dropped.text);
                        });

                });
        });
    });
    describe('#issueDenyRegistrationStatusForSecondCourse', () => {

        it('should be able to issue a request to deny registration status for second course', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the buy transaction
            const denyNow = factory.newTransaction(NS, 'DenyRegistrationStatus');

            return businessNetworkConnection.getParticipantRegistry(NS + '.Student')
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                })
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(secondCourseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(secondCourseNo);

                    denyNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    denyNow.student = factory.newRelationship(NS, 'Student', studentID);
                    denyNow.registrar = factory.newRelationship(NS, 'Registrar', registrarID);
                    denyNow.reasonForRejection = reasonForRejection;
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(denyNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(secondCourseNo);
                        })
                        .then((newCourse) => {
                            // the owner of the course should be student
                            newCourse.student.$identifier.should.equal(studentID);
                            newCourse.registrationRejectionReason.should.equal(reasonForRejection);
                            JSON.parse(newCourse.status).text.should.equal(courseStatus.RegistrationStatusDenied.text + " " + reasonForRejection);
                        });

                });
        });
    });
});
/*
    describe('#issueDelivery', () => {

        it('should be able to record a product delivery', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'Deliver');

            return businessNetworkConnection.getAssetRegistry(NS + '.Order')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);

                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.shipper = factory.newRelationship(NS, 'Shipper', shipperID);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.Delivered.text);
                        });

                });
        });
    });

    //describe('#issueRequestPayment', () => {
    describe('#issueTuitionRequested', () => {
        describe('#issueTuitionRequested', () => {

            it('should be able to issue a request to request payment for the course', () => {
                const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

                // create the buy transaction
                const orderNow = factory.newTransaction(NS, 'RequestPayment');

                return businessNetworkConnection.getParticipantRegistry(NS + '.Cashier')
                    .then((participantRegistry) => {
                        // add the cashier
                        return participantRegistry.addAll([cashier]);
                    })
                    .then(() => {
                        return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                    })
                    .then((assetRegistry) => {
                        // re-get the commodity
                        return assetRegistry.get(courseNo);
                    })
                    .then((newCourse) => {
                        newCourse.student.$identifier.should.equal(studentID);
                        newCourse.$identifier.should.equal(courseNo);

                        orderNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                        orderNow.cashier = factory.newRelationship(NS, 'Cashier', cashierID);
                        orderNow.registrar = factory.newRelationship(NS, 'Registrar', newCourse.registrar.$identifier);
                        // submit the transaction
                        return businessNetworkConnection.submitTransaction(orderNow)
                            .then(() => {
                                return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                            })
                            .then((assetRegistry) => {
                                // re-get the commodity
                                return assetRegistry.get(courseNo);
                            })
                            .then((newOrder) => {
                                // the owner of the commodity should be student
                                //JSON.parse(newOrder.status).text.should.equal(orderStatus.PayRequest.text);
                            });
                    });
            });

        /*
        it('should be able to issue a request to request payment for the course', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the buy transaction
            const orderNow = factory.newTransaction(NS, 'RequestPayment');

            return businessNetworkConnection.getParticipantRegistry(NS + '.FinanceCo')
                .then((participantRegistry) => {
                    // add the financeCo
                    return participantRegistry.addAll([financeCo]);
                })
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                })
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);

                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                    orderNow.seller = factory.newRelationship(NS, 'Seller', newOrder.seller.$identifier);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.PayRequest.text);
                        });
                });
        });
        });

        describe('#authorizeTuitionPayment', () => {

            it('should be able to record a approval for order payment', () => {
                const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

                // create the Deliver transaction
                const orderNow = factory.newTransaction(NS, 'AuthorizeTuitionPayment');

                return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                    .then((assetRegistry) => {
                        // re-get the commodity
                        return assetRegistry.get(courseNo);
                    })
                    .then((newCourse) => {
                        newCourse.student.$identifier.should.equal(studentID);
                        newCourse.$identifier.should.equal(courseNo);

                        orderNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                        orderNow.cashier = factory.newRelationship(NS, 'Cashier', cashierID);
                        orderNow.student = factory.newRelationship(NS, 'Student', newCourse.student.$identifier);
                        // submit the transaction
                        return businessNetworkConnection.submitTransaction(orderNow)
                    })
                    .then(() => {
                        return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                    })
                    .then((assetRegistry) => {
                        // re-get the commodity
                        return assetRegistry.get(courseNo);
                    })
                    .then((newCourse) => {
                        // the owner of the commodity should be buyer
                        //JSON.parse(newOrder.status).text.should.equal(orderStatus.Authorize.text);
                    });
            });
        });
        /*
    describe('#authorizePayment', () => {

        it('should be able to record a approval for order payment', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'AuthorizePayment');

            return businessNetworkConnection.getAssetRegistry(NS + '.Order')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);

                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                    orderNow.buyer = factory.newRelationship(NS, 'Buyer', newOrder.buyer.$identifier);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.Authorize.text);
                        });

                });
        });
        */
        /*
    describe('#Pay', () => {

        it('should be able to record an order payment', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'Pay');

            return businessNetworkConnection.getAssetRegistry(NS + '.Order')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);

                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                    orderNow.seller = factory.newRelationship(NS, 'Seller', newOrder.seller.$identifier);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.Paid.text);
                        });

                });
        });
    });

    describe('#issueDispute', () => {

        it('should be able to record a product dispute', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'Dispute');

            return businessNetworkConnection.getAssetRegistry(NS + '.Order')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);

                    orderNow.dispute = dispute;
                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                    orderNow.seller = factory.newRelationship(NS, 'Seller', newOrder.seller.$identifier);
                    orderNow.buyer = factory.newRelationship(NS, 'Buyer', newOrder.buyer.$identifier);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            newOrder.dispute.should.equal(dispute);
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.Dispute.text);
                        });

                });
        });
    });

    describe('#issueResolution', () => {

        it('should be able to record a dispute resolution', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'Resolve');

            return businessNetworkConnection.getAssetRegistry(NS + '.Order')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);

                    orderNow.resolve = resolve;
                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                    orderNow.seller = factory.newRelationship(NS, 'Seller', newOrder.seller.$identifier);
                    orderNow.shipper = factory.newRelationship(NS, 'Shipper', newOrder.shipper.$identifier);
                    orderNow.provider = factory.newRelationship(NS, 'Provider', provider.$identifier);
                    orderNow.buyer = factory.newRelationship(NS, 'Buyer', newOrder.buyer.$identifier);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            newOrder.resolve.should.equal(resolve);
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.Resolve.text);
                        });

                });
        });
    });

    describe('#issueBackorder', () => {

        it('should be able to record a product backorder', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'BackOrder');

            return businessNetworkConnection.getAssetRegistry(NS + '.Order')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);

                    orderNow.backorder = backorder;
                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.provider = factory.newRelationship(NS, 'Provider', providerID);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            newOrder.backorder.should.equal(backorder);
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.Backordered.text);
                        });

                });
        });
    });
    describe('#issueDropCourse', () => {

        it('should be able to record a course cancellation', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'DropCourse');

            return businessNetworkConnection.getAssetRegistry(NS + '.Course')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(courseNo);
                })
                .then((newCourse) => {
                    newCourse.student.$identifier.should.equal(studentID);
                    newCourse.$identifier.should.equal(courseNo);

                    orderNow.course = factory.newRelationship(NS, 'Course', newCourse.$identifier);
                    orderNow.registrar = factory.newRelationship(NS, 'Registrar', newCourse.registrar.$identifier);
                    orderNow.student = factory.newRelationship(NS, 'Student', newCourse.student.$identifier);
                    orderNow.cashier = factory.newRelationship(NS, 'Cashier', newCourse.cashier.$identifier);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Course');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(courseNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            //JSON.parse(newOrder.status).text.should.equal(orderStatus.Cancelled.text);
                        });

                });
        });
    });
});

    describe('#issueCancel', () => {

        it('should be able to record an order cancellation', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Deliver transaction
            const orderNow = factory.newTransaction(NS, 'OrderCancel');

            return businessNetworkConnection.getAssetRegistry(NS + '.Order')
                .then((assetRegistry) => {
                    // re-get the commodity
                    return assetRegistry.get(orderNo);
                })
                .then((newOrder) => {
                    newOrder.buyer.$identifier.should.equal(buyerID);
                    newOrder.$identifier.should.equal(orderNo);
                    
                    orderNow.order = factory.newRelationship(NS, 'Order', newOrder.$identifier);
                    orderNow.seller = factory.newRelationship(NS, 'Seller', newOrder.seller.$identifier);
                    orderNow.buyer = factory.newRelationship(NS, 'Buyer', newOrder.buyer.$identifier);
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(orderNow)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Order');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(orderNo);
                        })
                        .then((newOrder) => {
                            // the owner of the commodity should be buyer
                            JSON.parse(newOrder.status).text.should.equal(orderStatus.Cancelled.text);
                        });

                });
        });
    });
    */

/*
 * display using console.log the properties of the inbound object
 * @param {displayObjectProperties} _name - string name of object
 * @param {displayObjectProperties}  _obj - the object to be parsed
 * @utility
 */
/*
function displayObjectProperties(_name, _obj)
{
    for(let propt in _obj){ console.log(_name+' object property: '+propt ); }
}
*/
/*
 * display using console.log the properties of each property in the inbound object
 * @param {displayObjectProperties} _string - string name of object
 * @param {displayObjectProperties}  _object - the object to be parsed
 * @utility
 */
/*
function displayObjectValues (_string, _object)
{
    for (let prop in _object){
        console.log(_string+'-->'+prop+':\t '+(((typeof(_object[prop]) === 'object') || (typeof(_object[prop]) === 'function'))  ? typeof(_object[prop]) : _object[prop]));
    }
}
*/