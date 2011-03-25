

var templates = [
      { name: 'Running Late', template: 'mailto:runninglate@onmachine.org?subject=Running%20late&amp;body=Lvoe' },
      { name: 'Home in 5', template: 'mailto:homein5@onmachine.org?subject=Home%20in%205&amp;body=Lvoe' }
];

var templates2;

function saveTemplate() {
    localStorage["empltz.templates"] = JSON.stringify(templates);
    return true;
}

function getTemplate() {
    templates2 = JSON.parse(localStorage["empltz.templates"]);
    return true;
}

$(document).ready(function(){
    saveTemplate();
    
    if (getTemplate()) {
        var markup = '<li><a href=${template}>${name}</a><a href="/1/edit" data-rel="dialog" data-transition="pop"></a></li>';
        // Compile the markup as a named template
        $.template( "templatesTemplate", markup );

        // Render the template with the movies data and insert
        // the rendered HTML under the "movieList" element
        $.tmpl( "templatesTemplate", templates2 )
        .insertAfter( "#templateList" );

    }

});

