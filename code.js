var init_templates = [
    { name: 'Nice App', To: 'empltz@onmachine.org', Subject: 'Nice App', Body: 'Yep, I sent the test email'}
];

var editID = -1;

var components = {
    To: 'to',
    Subject: 'subject',
    Body: 'body'
};

function initTemplates() {
    
    for (var i = 0; i < init_templates.length; i++) {
        var newDate = new Date();
        var id = newDate.getTime();
        init_templates[i].id = id;
        localStorage["empltz." + id] = JSON.stringify(init_templates[i]);
    }
    return true;
}

function updateNoType() {
    for (var j = 0; j < localStorage.length; j++) {
        var key = localStorage.key(j);

        if (key.indexOf('empltz.') !== -1) {
            var p = {};
            p = JSON.parse(localStorage.getItem(localStorage.key(j)));
            p.type = 'mailto';
            localStorage[localStorage.key(j)] = JSON.stringify(p);
        }
    }
    
    return true;
}
    

function savePlt(plt) {
    if (!plt.id) {
        var newDate = new Date();
        var id = newDate.getTime();
        plt.id = id; 
    }
    localStorage["empltz." + plt.id] = JSON.stringify(plt);
}

function delPlt(id) {
    localStorage.removeItem('empltz.' + id);
}

function createURL (plt) {
    var url = "";
    url += plt.type + ':' + plt.To + '?' +
        'subject=' + plt.Subject + '&' +
        'body=' + plt.Body;
    
    
    // TODO make this more dynamic in the future
    //var k;
    //for (k in plt) {
    //    if (k != 'id' || 'name') {
    //       var comp;
    //        comp = components[k] + ':' + plt[k] + '?';
    //       url += comp;
    //    }
    //}
    return encodeURI(url);
}

function getPltz() {
    var pltz = [];
    var components = [];
    var i = 0;
    for (var j = 0; j < localStorage.length; j++) {
        var key = localStorage.key(j);

        if (key.indexOf('empltz.') !== -1) {
            var p = {};
            p = JSON.parse(localStorage.getItem(localStorage.key(j)));
            pltz[i] = {
                id: p.id,
                name: p.name,
                template: createURL(p)
            };

            i += 1;
	    }
    }
    
    return pltz;
}

function countPltz() {
    var count = 0;
    
    for (var j = 0; j < localStorage.length; j++) {
        var key = localStorage.key(j);
        if (key.indexOf('empltz.') !== -1) {
            count += 1;
        }
    }
    return count;
}

$(document).bind("mobileinit", function(){
   $.extend(  $.mobile, { ajaxFormsEnabled: false });
});

$(function(){

    $('#list').live('pageshow',function(event){
        if (!localStorage.getItem('initEmpltz')) {
            initTemplates();
            localStorage.initEmpltz = true;
        }
        
        if (!localStorage.getItem('versionEmpltz')) {
            updateNoType();
            localStorage.versionEmpltz = '0.8';
        }
        
        $('.plt').remove();
        var markup = '<li class="plt" id=${id}><a href=${template}>${name}</a><a class="pltEdit" id=${id} href="#edit" data-rel="dialog" data-transition="pop" rel="external"></a></li>';
        // Compile the markup as a named template
        $.template( "templatesTemplate", markup );
        // Render the template with the template data and insert
        // the rendered HTML under the "templateList" element
        $.tmpl( "templatesTemplate", getPltz() )
        .insertAfter( "#listart" );
        $('.ui-listview').listview('refresh');
        
        $(function(){
            $('a.pltEdit').click(function(event) {
                editID = $(this).attr('id');
            });
        });
        
    });
});


$(function(){
    $('form#add').submit(function() {
            event.preventDefault();
            var fields = $(this).serializeArray();
            var plt = {};
            jQuery.each(fields, function(i, field){
                var name = field.name;
                plt[name] = field.value;
            });
            savePlt(plt);
            $.mobile.changePage('list','pop',true);
            return false;
        });
});

$(function(){
    $('form#edit').submit(function() {
            event.preventDefault();
            var fields = $(this).serializeArray();
            var plt = {};
            jQuery.each(fields, function(i, field){
                var name = field.name;
                plt[name] = field.value;
            });
            plt.id = editID;
            savePlt(plt);
            $.mobile.changePage('list','pop',true);
            return false;
        });
});




$(function(){

    $('.swipedelete').live('pageshow',function(event, ui){
        $('.plt').bind('swipe', function(e){
            var $plt = $(this);
            if (!$plt.children('.aDeleteBtn')[0]) {
                $('.swipedelete').bind('tap click', function(e){
                    $('.aDeleteBtn').remove();
                    $('.swipedelete').unbind('tap click');
                    return false;
                });
                
                $('.aDeleteBtn').remove();
                var $aDeleteBtn = $('<a>Delete</a>')
                    .attr({
                    'class': 'aDeleteBtn ui-btn-up-r',
                    'id': $plt.attr('id')
                });
                $plt.prepend($aDeleteBtn);
                $('.aDeleteBtn').bind('tap click', function () {
                    event.preventDefault();
                    var $del = $(this);
                    delPlt($del.attr('id'));
                    $del.parent().remove();
                });
            }    
            else {
                $('.aDeleteBtn').remove();
                $('.swipedelete').unbind('tap click');
            }
        });
    });    
});


var typeChoice = '<fieldset data-role="controlgroup" data-type="horizontal">' +
            '<legend>Type:</legend>' +
            '<input type="radio" name="type" id="type-1" value="mailto"/>' +
            '<label for="type-1">Email</label>' +
            '<input type="radio" name="type" id="type-2" value="sms"  />' +
            '<label for="type-2">SMS</label>' +
        '</fieldset>';

//var typeChoice = '<label for="type">Type:</label>' +
//	'<select name="type" id="type">' +
//		'<option value="mailto">Email</option>' +
//		'<option value="sms">SMS</option>' +
//	'</select>';

function formHTML() {
    var html = typeChoice +
            '<label for="name">Label:</label>' + '\n' +
            '<input class="auto" type="text" name="name" id="name" value=""  />';
    jQuery.each(components, function(k, v){
        html += '<label for="' + k + '">' + k + ':</label>' + '\n' +
        '<input type="text" name="' + k + '" id="' + k + '" value=""  />';     
    });
    return html;
}


$('#edit').live('pagebeforecreate',function(event, ui){
    
        $('div#editForm').append(formHTML());
})
.live('pageshow', function(event, ui){

    //$('div#editForm').children().removeAttr('value');
    
    var plt = JSON.parse(localStorage.getItem('empltz.' + editID));
    jQuery.each(plt, function(k, v){
        if (k === 'type') {
            $('input[value="' + plt[k] + '"]').attr("checked",true);
        }
        else {
            var element = '#' + k;
            $(element).val(plt[k]);
        }
    });
    $("input[type='radio']").checkboxradio("refresh");
})
.live('pagehide', function(){
    $('a[href="#"]').removeClass('ui-btn-active');
});

$('#add').live('pagebeforecreate',function(event, ui){
    
        $('div#addForm').append(formHTML());
})
.live('pageshow', function(event, ui){

    $('div#addForm').children().removeAttr('value');

})
.live('pagehide', function(){
    $('a[href="#"]').removeClass('ui-btn-active');
});

