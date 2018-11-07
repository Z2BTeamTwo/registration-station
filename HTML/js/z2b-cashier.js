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

// z2b-cashier.js

'use strict';
let cashierCourseDiv = 'cashierCourseDiv';
let cashier_alerts = [];
let cashier_notify = '#cashier_notify';
let cashier_count = '#cashier_count';

/**
 * load the administration Cashier Experience
 */
function loadCashierUX ()
{
    console.log(cashiers);
    let toLoad = 'cashier.html';
    if (cashiers.length === 0) 
    { $.when($.get(toLoad), deferredMemberLoad()).done(function (page, res)
    {setupCashier(page[0]);});
    }
    else{
        $.when($.get(toLoad)).done(function (page)
        {setupCashier(page);});
    }
}

/**
 * load the registrar User Experience
 * @param {String} page - page to load
 */
function setupCashier(page)
{
    $('#body').empty();
    $('#body').append(page);
    if (cashier_alerts.length == 0) 
    {$(cashier_notify).removeClass('on'); $(cashier_notify).addClass('off'); }
    else {$(cashier_notify).removeClass('off'); $(cashier_notify).addClass('on'); }
    updatePage('cashier');
    let _clear = $('#cashier_clear');
    let _list = $('#cashierCourseStatus');
    let _courseDiv = $('#'+cashierCourseDiv);
    _clear.on('click', function(){_courseDiv.empty();});
    //
    // this section changes from the previous chapter, buyer changing to seller
    //
    _list.on('click', function(){listCashierCourses();});
    $('#cashierName').empty();
    $('#cashierName').append('Wake Tech Cashier\'s Office');
    z2bSubscribe('Cashier', cashier_id);
}
/**
 * lists all orders for the selected seller
 */
function listCashierCourses()
{
    let options = {};
    //
    // seller instead of buyer
    //
    options.id = cashier_id;
    options.userID = options.id;
    $.when($.post('/composer/client/getMyCourses', options)).done(function(_results)
    {
        if (_results.courses.length < 1) {$('#cashierCourseDiv').empty(); $('#cashierCourseDiv').append(formatMessage(textPrompts.courseProcess.cashier_no_courses_msg));}
        else{formatCashierCourses($('#cashierCourseDiv'), _results.courses);}
    });
}
/**
 * used by the listOrders() function
 * formats the orders for a buyer. Orders to be formatted are provided in the _orders array
 * output replaces the current contents of the html element identified by _target
 * @param {String} _target - string with div id prefaced by #
 * @param {Array} _orders - array with order objects
 */
function formatCashierCourses(_target, _courses)
{
    _target.empty();
    let _str = ''; let _date = '';
    //let _registrationStatus = {};
    for (let each in _courses)
    {(function(_idx, _arr)
        { console.log(_arr[_idx]); let _action = '<th><select id=cashier_action'+_idx+'><option value="'+textPrompts.courseProcess.NoAction.select+'">'+textPrompts.courseProcess.NoAction.message+'</option>';
        //_registrationStatus[_idx] = '';
        //
        // each order can have different states and the action that a buyer can take is directly dependent on the state of the order. 
        // this switch/case table displays selected order information based on its current status and displays selected actions, which
        // are limited by the sate of the order.
        //
        // Throughout this code, you will see many different objects referemced by 'textPrompts.orderProcess.(something)' 
        // These are the text strings which will be displayed in the browser and are retrieved from the prompts.json file 
        // associated with the language selected by the web user.
        //
        let r_string = '</th>';
        switch (JSON.parse(_arr[_idx].status).code)
        {/*
        case courseStatus.Registered.code:
            _date = _arr[_idx].registered;
            _action += '<option value="'+textPrompts.courseProcess.AcceptRegistrationStatus.select+'">'+textPrompts.courseProcess.AcceptRegistrationStatus.message+'</option>';
            _action += '<option value="'+textPrompts.courseProcess.DenyRegistrationStatus.select+'">'+textPrompts.courseProcess.DenyRegistrationStatus.message+'</option>';
            _action += '<option value="'+textPrompts.courseProcess.CancelCourse.select+'">'+textPrompts.courseProcess.CancelCourse.message+'</option>';
            r_string = '<br/>'+textPrompts.courseProcess.CancelCourse.prompt+'<input id="reason'+_idx+'" type="text"></input></th>';
            //_registrationStatus[_idx] = 'Registered';
            break;
        case courseStatus.Dropped.code:
            _date = _arr[_idx].dropped;
            _action += '<option value="'+textPrompts.courseProcess.AcceptRegistrationStatus.select+'">'+textPrompts.courseProcess.AcceptRegistrationStatus.message+'</option>';
            _action += '<option value="'+textPrompts.courseProcess.DenyRegistrationStatus.select+'">'+textPrompts.courseProcess.DenyRegistrationStatus.message+'</option>';
            _action += '<option value="'+textPrompts.courseProcess.CancelCourse.select+'">'+textPrompts.courseProcess.CancelCourse.message+'</option>';
            r_string = '<br/>'+textPrompts.courseProcess.CancelCourse.prompt+'<input id="reason'+_idx+'" type="text"></input></th>';
            //_registrationStatus[_idx] = 'Dropped';
            break;
            */
        case courseStatus.TuitionRequested.code:
            _date = _arr[_idx].tuitionRequested;
            //_action += '<option value="'+textPrompts.courseProcess.CancelCourse.select+'">'+textPrompts.courseProcess.CancelCourse.message+'</option>';
            //r_string = '<br/>'+textPrompts.courseProcess.courseProcess.CancelCourse.prompt+'<input id="reason'+_idx+'" type="text"></input></th>';
            break;
        case courseStatus.TuitionPaid.code:
            _date = _arr[_idx].tuitionPaid;
            //_action += '<option value="'+textPrompts.courseProcess.CancelCourse.select+'">'+textPrompts.courseProcess.CancelCourse.message+'</option>';
            //r_string = '<br/>'+textPrompts.courseProcess.CancelCourse.prompt+'<input id="reason'+_idx+'" type="text"></input></th>';
            break;
        case courseStatus.Refunded.code:
            _date = _arr[_idx].refunded;
            break;
        case courseStatus.RegistrationStatusAccepted.code:
            _date = _arr[_idx].registrationStatusAccepted;
            //_action += '<option value="'+textPrompts.courseProcess.ForwardRegistrationStatus.select+'">'+textPrompts.courseProcess.ForwardRegistrationStatus.message+'</option>';
            //_action += '<option value="'+textPrompts.courseProcess.CancelCourse.select+'">'+textPrompts.courseProcess.CancelCourse.message+'</option>';
            //r_string = '<br/>'+textPrompts.courseProcess.CancelCourse.prompt+'<input id="reason'+_idx+'" type="text"></input></th>';
            break;
        case courseStatus.RegistrationStatusDenied.code:
            _date = _arr[_idx].registrationStatusDenied;
            //_action += '<option value="'+textPrompts.courseProcess.ForwardRegistrationStatus.select+'">'+textPrompts.courseProcess.ForwardRegistrationStatus.message+'</option>';
            //_action += '<option value="'+textPrompts.courseProcess.CancelCourse.select+'">'+textPrompts.courseProcess.CancelCourse.message+'</option>';
            //r_string = '<br/>'+textPrompts.courseProcess.CancelCourse.prompt+'<input id="reason'+_idx+'" type="text"></input></th>';
            break;
        case courseStatus.RegistrationStatusForwarded.code:
            _date = _arr[_idx].registrationStatusForwarded;
            if(_arr[_idx].registrationStatus == 'Dropped'||_arr[_idx].registrationStatus == 'Cancelled'){
            _action += '<option value="'+textPrompts.courseProcess.RefundTuition.select+'">'+textPrompts.courseProcess.RefundTuition.message+'</option>';//added action to perform refund of tuition
            r_string = '<br/>'+textPrompts.courseProcess.RefundTuition.prompt+'<input id="reason'+_idx+'" type="text"></input><br/>'+textPrompts.courseProcess.amountRefunded+'<input id="amount'+_idx+'" type="text"></input></th>';
            }
            else if(_arr[_idx].registrationStatus == 'Registered'){
                _action += '<option value="'+textPrompts.courseProcess.RequestTuition.select+'">'+textPrompts.courseProcess.RequestTuition.message+'</option>';
            }
            break;
        case courseStatus.Cancelled.code:
            _date = _arr[_idx].courseCancelled;
            _action += '<option value="'+textPrompts.courseProcess.RefundTuition.select+'">'+textPrompts.courseProcess.RefundTuition.message+'</option>';//added action to perform refund of tuition
            r_string = '<br/>'+textPrompts.courseProcess.RefundTuition.prompt+'<input id="reason'+_idx+'" type="text"></input><br/>'+textPrompts.courseProcess.amountRefunded+'<input id="amount'+_idx+'" type="text"></input></th>';

            break;
        default:
            break;
        }
        let _button = '<th><button id="cashier_btn_'+_idx+'">'+textPrompts.courseProcess.ex_button+'</button></th>';
        _action += '</select>';
        if (_idx > 0) {_str += '<div class="spacer"></div>';}
        _str += '<table class="wide"><tr><th>'+textPrompts.courseProcess.courseCode+'</th><th>'+textPrompts.courseProcess.status+'</th><th colspan="3" class="right message">'+textPrompts.courseProcess.student + ' ' + findMember(_arr[_idx].student.split('#')[1],students).participantName +'</th></tr>';
        _str += '<tr><th id ="cashier_course'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%" id="s_status'+_idx+'">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th>'+_action + r_string + '<br/>'+'</th>'+_button+'</tr></table>';
        _str += '</table>';
    })(each, _courses);
    }

    _target.append(_str);
    for (let each in _courses)
    {(function(_idx, _arr)
      { $('#cashier_btn_'+_idx).on('click', function ()
        {
          let options = {};
          options.action = $('#cashier_action'+_idx).find(':selected').val();
          options.courseCode = $('#cashier_course'+_idx).text();
          options.participant = cashier_id;
          if(options.action === 'RefundTuition' && (_arr[_idx].registrationStatus == 'Dropped'||_arr[_idx].registrationStatus == 'Cancelled')){
            options.reason= $('#reason'+_idx).val();//retrieving and assigning reason to reason variable option
            options.amount = $('#amount'+_idx).val();//retrieving and assigning amount to amount variable option
        }
          

          
          console.log('presending options', options.action, $('#reason'+_idx).val());
          if ((options.action === 'DenyRegistrationStatus') || (options.action === 'CancelCourse')) {options.reason = $('#reason'+_idx).val();}
          if (options.action === 'AcceptRegistrationStatus')
          {
              console.log('we are accepting registration status and the status code is', _registrationStatus[_idx]);
              options.registrationStatus = _registrationStatus[_idx];
          }
          $('#cashier_messages').prepend(formatMessage(options.action+textPrompts.courseProcess.processing_msg.format(options.action, options.courseCode)));
          $.when($.post('/composer/client/courseAction', options)).done(function (_results)
          { $('#cashier_messages').prepend(formatMessage(_results.result)); });
      });
        if (notifyMe(cashier_alerts, _arr[_idx].id)) {$('#cashier_status'+_idx).addClass('highlight'); }
    })(each, _courses);
    }
    cashier_alerts = new Array();
    toggleAlert($('#cashier_notify'), cashier_alerts, cashier_alerts.length);
}
