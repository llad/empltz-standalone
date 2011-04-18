

var init_templates = [
      { name: 'Running Late', template: 'mailto:runninglate@onmachine.org?subject=Running%20late&amp;body=Lvoe' },
      { name: 'Home in 5', template: 'mailto:homein5@onmachine.org?subject=Home%20in%205&amp;body=Lvoe' }
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
    
    // TODO make this more dynamic in the future
    
    url += 'mailto:' + plt.To + '?' +
        'subject=' + plt.Subject + '&' +
        'body=' + plt.Body;
    
    //var k;
    //for (k in plt) {
    //    if (k != 'id' || 'name') {
    //       var comp;
    //        comp = components[k] + ':' + plt[k] + '?';
    //       url += comp;
    //    }
    //}
    console.log(url);
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
        var count = countPltz();
        if (count < 1) {
            initTemplates();
        }
        
        $('.plt').remove();
        var markup = '<li class="plt" id=${id}><a href=${template}>${name}</a><a class="pltEdit" id=${id} href="#edit" data-rel="dialog" data-transition="pop"></a></li>';
        // Compile the markup as a named template
        $.template( "templatesTemplate", markup );
        // Render the template with the template data and insert
        // the rendered HTML under the "templateList" element
        $.tmpl( "templatesTemplate", getPltz() )
        .insertAfter( "#templateList" );
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
            $.mobile.changePage('list');
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
            plt.id = $('form#edit').data('id');
            savePlt(plt);
            $.mobile.changePage('list');
            return false;
        });
});




$(function(){

    $('.swipedelete').live('pageshow',function(event, ui){
                $('.plt').bind('swipe', function(e){
                var $li = $(this);
                if (!$li.children('.aDeleteBtn')[0]) {
                    $('.aDeleteBtn').remove();
                    var $aDeleteBtn = $('<a>Delete</a>')
                        .attr({
                        'class': 'aDeleteBtn ui-btn-up-r',
                        'href': 'index.html',
                        'id': $li.attr('id'),
                        'rel': 'external'
                    });
                    $li.prepend($aDeleteBtn);
                }
                
                else {
                    $('.aDeleteBtn').remove();
                }

                $('.aDeleteBtn').click(function () {
                    var $del = $(this);
                    delPlt($del.attr('id'));
                    $('.aDeleteBtn').remove();
                    event.preventDefault();
                });
            });
    });    
        
          
});


// TODO Figure out why the close button stays active after closing once.

$('#edit').live('pagebeforecreate',function(event, ui){
    
        $('div#editForm').append(function () {
            var html = '<label for="ename">Name:</label>' + '\n' +
                    '<input class="auto" type="text" name="name" id="ename" value=""  />';
            jQuery.each(components, function(k, v){
                html += '<label for="e' + k + '">' + k + ':</label>' + '\n' +
                        '<input type="text" name="' + k + '" id="e' + k + '" value=""  />';     
                });
            return html;
            });
         
        var plt = JSON.parse(localStorage.getItem('empltz.' + editID));
        jQuery.each(plt, function(k, v){
            var element = '#e' + k;
            $(element).attr('value', plt[k]);
        });
        editID = -1;
});



$('#add').live('pagebeforecreate',function(event, ui){
    
        $('div#addForm').append(function () {
            var html = '<label for="name">Name:</label>' + '\n' +
                    '<input class="auto" type="text" name="name" id="name" value=""  />';
            jQuery.each(components, function(k, v){
                html += '<label for="' + k + '">' + k + ':</label>' + '\n' +
                        '<input type="text" name="' + k + '" id="' + k + '" value=""  />';     
                });
            return html;
            });
});

