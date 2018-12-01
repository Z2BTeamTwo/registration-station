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

// z2c-student.js

'use strict';
let student_notify = '#student_notify';
let student_count = '#student_count';
let student_id = '';
let student_alerts;

let courseDiv = 'courseDiv';
let itemTable = {};
let newItems = [];
let totalAmount = 0;

/**
 * load the Student User Experience
 */
function loadStudentUX (unifiedView)
{
    // get the html page to load
    let toLoad = 'student.html';
    // if (buyers.length === 0) then autoLoad() was not successfully run before this web app starts, so the sie of the buyer list is zero
    // assume user has run autoLoad and rebuild member list
    // if autoLoad not yet run, then member list length will still be zero
    if ((typeof(students) === 'undefined') || (students === null) || (students.length === 0))
    { $.when($.get(toLoad), deferredMemberLoad()).done(function (page, res)
        {
            setupStudent(page, unifiedView);
        });
    }
    else
    {
        $.when($.get(toLoad)).done(function (page)
        {
            setupStudent(page, unifiedView);
        });
    }
}
    
    function setupStudent(page, unifiedView)
    {
    // empty the html element that will hold this page
    if (unifiedView){
        $('#studentbody').empty();
        $('#studentbody').append(page);
    }
    else {
        $('#body').empty();
        $('#body').append(page);
    }
    // empty the buyer alerts array
    student_alerts = [];
    // if there are no alerts, then remove the 'on' class and add the 'off' class
    if (student_alerts.length === 0)
    {$(student_notify).removeClass('on'); $(student_notify).addClass('off'); }
    else {$(student_notify).removeClass('off'); $(student_notify).addClass('on'); }
      // update the text on the page using the prompt data for the selected language
    updatePage('student');
    // enable the buttons to process an onClick event
    let _create = $('#newCourse');
    let _list = $('#courseStatus');
    let _courseDiv = $('#'+courseDiv);
    _create.on('click', function(){displayCourseForm();});
    _list.on('click', function(){listCourses();});
    $('#student').empty();
    // build the student select HTML element
    for (let each in students)
    {(function(_idx, _arr)
        {$('#student').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');})(each, students);
    }
    // display the name of the current student
    $('#studentName')[0].innerText = students[0].participantName;
    // save the current buyer id as b_id
    student_id = students[0].id;
    // subscribe to events
    z2bSubscribe('Student', student_id);
      // create a function to execute when the user selects a different buyer
    $('#student').on('change', function() 
    { _courseDiv.empty(); $('#student_messages').empty(); 
        $('#studentName')[0].innerText = findMember($('#student').find(':selected').text(),students).participantName;
        // unsubscribe the current buyer
        z2bUnSubscribe(student_id);
        // get the new student id
        student_id = findMember($('#student').find(':selected').text(),students).id;
        // subscribe the new buyer
        z2bSubscribe('Student', student_id);
    });

}

function clearCourseTable() {
        $('#courseCode').empty();
        $('#status').empty();
        $('#today').empty();
        $('#courseTitle').empty();
        $('#schedule').empty();
        $('#creditHours').empty();
        $('#amount').empty();
}
/**
 * populates course table with the information from the course
 */

function populateCourseTable(){
    let selectedVal = $('#course').find(':selected').val();
    if (selectedVal == 'blank'){
        $('#submitNewCourse').hide();
        $('#cancelNewCourse').hide();
        clearCourseTable();
        return;
    }

    let course = itemTable[selectedVal];
    console.log($('#course').find(':selected').val());
    console.log(course);
    clearCourseTable();
    $('#submitNewCourse').show();
    $('#cancelNewCourse').show();
    $('#courseCode').append(course.baseCourseCode);
    $('#status').append('New Course');
    $('#today').append(new Date().toISOString());
    $('#courseTitle').append(course.courseTitle);
    $('#schedule').append(course.schedule);
    $('#creditHours').append(course.creditHours);
    $('#amount').append('$' + (course.creditHours * 100).toFixed(2));
}

/**
 * Displays the create course form for the selected student
 */
function displayCourseForm()
{  let toLoad = 'createCourse.html';
    totalAmount = 0;
    newItems = [];
    // get the order creation web page and also get all of the items that a user can select
    $.when($.get(toLoad), $.get('/composer/client/getItemTable')).done(function (page, _items)
    {
        itemTable = _items[0].classes;
        let _courseDiv = $('#'+courseDiv);
        _courseDiv.empty();
        _courseDiv.append(page[0]);
        // update the page with the appropriate text for the selected language
        updatePage('createCourse');
        // build a select list for the items
        let _str = '<option value="blank"></option>';
        for (let each in itemTable){(function(_idx, _arr){_str+='<option value="'+_idx+'">'+_arr[_idx].courseTitle+'</option>';})(each, itemTable);}
        $('#course').empty();
        $('#course').append(_str);
        
        // hide the action buttons
        $('#submitNewCourse').hide();
        $('#cancelNewCourse').hide();


        $('#course').on('change', function()
        {
            populateCourseTable();
        });

        $('#cancelNewCourse').on('click', function (){_courseDiv.empty();});
        

        $('#submitNewCourse').on('click', function ()
            { let options = {};
            let selectedCourse = itemTable[$('#course').find(':selected').val()];
            options.student = $('#student').find(':selected').val();
            options.registrar = 'registrar@waketech.edu';
            options.cashier = 'cashier@waketech.edu';
            options.course = JSON.stringify(selectedCourse);
            console.log(options);
            _courseDiv.empty(); _courseDiv.append(formatMessage(textPrompts.courseProcess.create_msg));
            $.when($.post('/composer/client/addCourse', options)).done(function(_res)
            {    _courseDiv.empty(); _courseDiv.append(formatMessage(_res.result)); console.log(_res);});
        });
    });
}


/**
 * lists all orders for the selected buyer
 */
function listCourses()
{
    let options = {};
    // get the users email address
    options.id = $('#student').find(':selected').text();
    // get their password from the server. This is clearly not something we would do in production, but enables us to demo more easily
    // $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
    // {
    // get their orders
    options.userID = options.id;
    // options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyCourses', options)).done(function(_results)
    {
        if ((typeof(_results.courses) === 'undefined') || (_results.courses === null))
        {console.log('error getting courses: ', _results);}
        else
        {// if they have no orders, then display a message to that effect
            if (_results.courses.length < 1) {$('#courseDiv').empty(); $('#courseDiv').append(formatMessage(textPrompts.courseProcess.student_no_courses_msg+options.id));}
        // if they have orders, format and display the orders.
            else{formatCourses($('#courseDiv'), _results.courses);}
        }
    });
    // });
}

/**
 * used by the listOrders() function
 * formats the orders for a buyer. Orders to be formatted are provided in the _orders array
 * output replaces the current contents of the html element identified by _target
 * @param {String} _target - string with div id prefaced by #
 * @param {Array} _orders - array with order objects
 */
function formatCourses(_target, _courses)
{
    _target.empty();
    let _str = ''; let _date = '';
    _str += '<div class="accordion" id="courseAccordion">';
    for (let each in _courses)
    {(function(_idx, _arr)
      {let _action = '<select id=student_action'+_idx+'><option value="'+textPrompts.courseProcess.NoAction.select+'">'+textPrompts.courseProcess.NoAction.message+'</option>';
        let r_string;
        r_string = '';
        //
        // each order can have different states and the action that a buyer can take is directly dependent on the state of the order.
        // this switch/case table displays selected order information based on its current status and displays selected actions, which
        // are limited by the sate of the order.
        //
        // Throughout this code, you will see many different objects referemced by 'textPrompts.orderProcess.(something)'
        // These are the text strings which will be displayed in the browser and are retrieved from the prompts.json file
        // associated with the language selected by the web user.
        //
        console.log(_arr[_idx]);
        switch (JSON.parse(_arr[_idx].status).code)
        {
        case courseStatus.Created.code:
            _date = _arr[_idx].created;
            _action += '<option value="'+textPrompts.courseProcess.Register.select+'">'+textPrompts.courseProcess.Register.message+'</option>';
            break;
        case courseStatus.Registered.code:
            _date = _arr[_idx].registered;
            _action += '<option value="'+textPrompts.courseProcess.Drop.select+'">'+textPrompts.courseProcess.Drop.message+'</option>';
            break;
        case courseStatus.Dropped.code:
            _date = _arr[_idx].dropped;
            _action += '<option value="'+textPrompts.courseProcess.Register.select+'">'+textPrompts.courseProcess.Register.message+'</option>';
            break;
        case courseStatus.TuitionRequested.code:
            _date = _arr[_idx].tuitionRequested;
            _action += '<option value="'+textPrompts.courseProcess.Drop.select+'">'+textPrompts.courseProcess.Drop.message+'</option>';
            _action += '<option value="'+textPrompts.courseProcess.PayTuition.select+'">'+textPrompts.courseProcess.PayTuition.message+'</option>';
            r_string = textPrompts.courseProcess.PayTuition.prompt+'<input id="student_amount'+_idx+'" type="text"></input></th>';
            break;
        case courseStatus.TuitionPaid.code:
            _date = _arr[_idx].tuitionPaid;
            _action += '<option value="'+textPrompts.courseProcess.Drop.select+'">'+textPrompts.courseProcess.Drop.message+'</option>';
            if (_arr[_idx].amountDue > 0){
                _action += '<option value="'+textPrompts.courseProcess.PayTuition.select+'">'+textPrompts.courseProcess.PayTuition.message+'</option>';
                r_string = textPrompts.courseProcess.PayTuition.prompt+'<input id="student_amount'+_idx+'" type="text"></input></th>';
            }
            break;
        case courseStatus.Refunded.code:
            _date = _arr[_idx].refunded + "<br/>" + _arr[_idx].refundReason;
            if(_arr[_idx].registrationStatus != 'Cancelled'){
                _action += '<option value="'+textPrompts.courseProcess.Register.select+'">'+textPrompts.courseProcess.Register.message+'</option>';
            }
            break;
        case courseStatus.RegistrationStatusAccepted.code:
            _date = _arr[_idx].registrationStatusAccepted;
            if (_arr[_idx].registrationStatus == 'Registered'){
                _action += '<option value="'+textPrompts.courseProcess.Drop.select+'">'+textPrompts.courseProcess.Drop.message+'</option>';
            } else {
                _action += '<option value="'+textPrompts.courseProcess.Register.select+'">'+textPrompts.courseProcess.Register.message+'</option>';
            }
            
            break;
        case courseStatus.RegistrationStatusDenied.code:
            _date = _arr[_idx].registrationStatusDenied;
            if (_arr[_idx].registrationStatus == 'Registered'){
                _action += '<option value="'+textPrompts.courseProcess.Drop.select+'">'+textPrompts.courseProcess.Drop.message+'</option>';
            } else if (_arr[_idx].registrationStatus == 'Dropped') {
                _action += '<option value="'+textPrompts.courseProcess.Register.select+'">'+textPrompts.courseProcess.Register.message+'</option>';
            }
            break;
        case courseStatus.RegistrationStatusForwarded.code:
            _date = _arr[_idx].registrationStatusForwarded;
            _action += '<option value="'+textPrompts.courseProcess.Drop.select+'">'+textPrompts.courseProcess.Drop.message+'</option>';
            break;
        case courseStatus.Cancelled.code:
            _date = _arr[_idx].courseCancelled;
            break;
        default:
            break;
        }
        
        let _button = '<button id="student_btn_'+_idx+'">'+textPrompts.courseProcess.ex_button+'</button>';
        _action += '</select>';
        //if (_idx > 0) {_str += '<div class="spacer"></div>';}
        let amountToBePaid = _arr[_idx].amountDue - _arr[_idx].amountPaid + _arr[_idx].amountRefunded;
        _str += '<div class="card">';
        _str += '<div class="card-header alert alert-success" id="course' + _idx + '">';
        _str += '<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse' + _idx + '" aria-expanded="false" aria-controls="collapse' + _idx + '">';
        _str += _arr[_idx].courseCode.substr(0, 6) + ' ' + _arr[_idx].courseTitle + '</button><br/>' + JSON.parse(_arr[_idx].status).text + ' ';
        _str += _date + ' ';
        if (amountToBePaid > 0){
            _str += '<br/>Amount to be Paid: $' + amountToBePaid;
        } else {
            _str += '<br/>Amount to be Refunded: $' + amountToBePaid * -1;
        }
        _str += '<br/>' + _action + ' ' + _button;
        _str += '<div id="r_string' + _idx + '">' + r_string; + '</div>';
        _str += '</div>';
        _str += '<div id="collapse' + _idx + '" class="collapse" aria-labelledby="collapse' + _idx + '" data-parent="#courseAccordion">';
        _str += '<div class="card-body">';
        _str += '<span class="label">Course Code</span><br/>' + _arr[_idx].courseCode + '<br/>';
        _str += '<span class="label">Schedule</span><br/>' + _arr[_idx].schedule + '<br/>';
        _str += '<span class="label">Credit Hours</span> ' + _arr[_idx].creditHours + '<br/>';
        _str += '<span class="label">Amount Paid</span> $' + _arr[_idx].amountPaid + '<br/>';
        _str += '<span class="label">Amount Due</span> $' + _arr[_idx].amountDue + '<br/>';
        _str += '<span class="label">Amount Refunded</span> $' + _arr[_idx].amountRefunded + '<br/>';
        _str += '</div>';
        _str += '</div>';
        _str += '</div>';

        


        $(document).ready(function(){
                $('#r_string' + _idx).hide();
                $('#student_action'+_idx).on('click', function ()
                {
                let action;
                action = $('#student_action'+_idx).find(':selected').val();
                
                switch (action)
                {
                    case 'NoAction':
                    case 'Register':
                    case 'Drop':
                        $('#r_string' + _idx).hide();
                        break;
                    case 'PayTuition':
                        $('#student_amount' + _idx).val('');
                        $('#r_string' + _idx).show();
                        break;
                    default:
                        break;

                }
            });
        });

    })(each, _courses);
    }
    _str += '</div>';
    // append the newly built order table to the web page
    _target.append(_str);
    //
    // now that the page has been placed into the browser, all of the id tags created in the previous routine can now be referenced.
    // iterate through the page and make all of the different parts of the page active.
    //
    for (let each in _courses)
        {(function(_idx, _arr)
            { $('#student_btn_'+_idx).on('click', function ()
                {
                let options = {};
                options.action = $('#student_action'+_idx).find(':selected').val();
                options.courseCode = _arr[_idx].courseCode;
                options.participant = $('#student').val();
                if ((options.action === 'PayTuition'))
                {options.amount = $('#student_amount'+_idx).val();}
                $('#student_messages').prepend(formatMessage(options.action+textPrompts.courseProcess.processing_msg.format(options.action, options.courseCode)+options.courseCode));
                $.when($.post('/composer/client/courseAction', options)).done(function (_results)
                { $('#student_messages').prepend(formatMessage(_results.result)); });
            });
            // use the notifyMe function to determine if this order is in the alert array. 
            // if it is, the highlight the $('#b_status'+_idx) html element by adding the 'highlight' class
            if (notifyMe(student_alerts, _arr[_idx].id)) {$('#course'+_idx).addClass('highlight'); }
        })(each, _courses);
    }
    // reset the b_alerts array to a new array
    student_alerts = new Array();
    // call the toggleAlerts function to reset the alert icon
    toggleAlert($('#student_notify'), student_alerts, student_alerts.length);
}