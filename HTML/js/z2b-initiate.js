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

// z2b-initiate.js

'use strict';

let connectionProfileName = 'z2b-test-profile';
let networkFile = 'zerotoblockchain-network.bna';
let businessNetwork = 'zerotoblockchain-network';

let host_address = window.location.host;

let students = new Array();
let registrars= new Array();
let cashiers= new Array();

let students_string, registrars_string, cashiers_string;

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
* standard home page initialization routine
* Refer to this by {@link initPage()}.
*/
function initPage ()
{
    // goMultiLingual() establishes what languages are available for this web app, populates the header with available languages and sets the default language to US_English
    goMultiLingual('US_English', 'index');
    // singleUX loads the members already present in the network
    memberLoad();
    // goChainEvents creates a web socket connection with the server and initiates blockchain event monitoring
    getChainEvents();
    // get the asynch port
    wsConnect();
}
