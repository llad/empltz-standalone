var init_templates = [
    { name: 'Nice App', To: 'empltz@onmachine.org', Subject: 'Nice App', Body: 'Yep, I sent the test email'}
];

var editID = -1;

var components = {
    To: 'mailto',
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
    url += 'mailto:' + plt.To + '?' +
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
        
        $('.plt').remove();
        var markup = '<li class="plt" id=${id}><a href=${template}>${name}</a><a class="pltEdit" id=${id} href="#edit" data-rel="dialog" data-transition="pop" ></a></li>';
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
                console.log(editID);
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
            console.log(plt.id);
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

$('#edit').live('pagebeforecreate',function(event, ui){
    
        $('div#editForm').append(function () {
            var html = '<label for="ename">Name:</label>' + '\n' +
                    '<input class="auto" type="text" name="name" id="ename" value=""  />';
            jQuery.each(components, function(k, v){
                html += '<label for="e' + k + '">' + k + ':</label>' + '\n' +
                        '<input type="';
                if (v === 'mailto') {
                    html += 'email';
                }
                else {
                    html += 'text';
                }
                html += '" name="' + k + '" id="e' + k + '" value=""  />';     
                });
            return html;
            });
})
.live('pageshow', function(event, ui){

    $('div#editForm').children().removeAttr('value');
    
        var plt = JSON.parse(localStorage.getItem('empltz.' + editID));
        jQuery.each(plt, function(k, v){
            var element = '#e' + k;
            $(element).attr('value', plt[k]);
        });
})
.live('pagehide', function(){
    $('a[href="#"]').removeClass('ui-btn-active');
});

$('#add').live('pagebeforecreate',function(event, ui){
    
        $('div#addForm').append(function () {
            var html = '<label for="name">Name:</label>' + '\n' +
                    '<input class="auto" type="text" name="name" id="name" value=""  />';
            jQuery.each(components, function(k, v){
                html += '<label for="' + k + '">' + k + ':</label>' + '\n' +
                        '<input type="';
                if (v === 'mailto') {
                    html += 'email';
                }
                else {
                    html += 'text';
                }
                html += '" name="' + k + '" id="' + k + '" value=""  />';     
                });
            return html;
            });
})
.live('pagehide', function(){
    $('a[href="#"]').removeClass('ui-btn-active');
});

