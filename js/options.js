$(document).ready(function() {
   init();
});

/* Javascript for stylebot options page */

var bg_window = null;

var cache = {
    modal: null,
    backupModal: null,
    errorMarker: null
};

// options with their default values
//
var options = {
    useShortcutKey: true,
    contextMenu: true,
    shortcutKey: 77, // keycode for 'm'
    shortcutMetaKey: 'alt',
    mode: 'Basic',
    sync: false,
    livePreviewColorPicker: false,
    showPageAction: true
};

// initialize options
function init() {
    // initialize tabs
    initializeTabs();

    // fetch options from datastore
    fetchOptions();

    $.each(options, function(option, value) {
        var $el = $('[name=' + option + ']');
        var el = $el.get(0);

        if (el == undefined)
            return;

        var tag = el.tagName.toLowerCase();

        if (el.type === 'checkbox') {
            if (value == true)
                el.checked = true;
        }

        else if (tag === 'select' || el.type === 'hidden') {
            if (value != undefined)
                el.value = value;
        }

        else if (el.type === 'radio') {
            var len = $el.length;
            for (var i = 0; i < len; i++) {
                if ($el.get(i).value == value)
                {
                    $el.get(i).checked = true;
                    return true;
                }
            }
        }

    });
    
    console.log(localStorage);

    //KeyCombo.init($('[name=shortcutKeyCharacter]').get(0), $('[name=shortcutKey]').get(0));

    bg_window = chrome.extension.getBackgroundPage();
    console.log(bg_window);
    fillStyles();
    attachListeners();
    //initFiltering();
    //updateSyncUI();
    //updateGlobalStylesheetUI();
}

// Initialize tabs
function initializeTabs() {
    $('ul.menu li:first').addClass('tabActive').show();
    $('#options > div').hide();
    $('#basics').show();

    // click event for tab menu items
    $('ul.menu li').click(function() {

        $('ul.menu li').removeClass('tabActive');
        $(this).addClass('tabActive');
        $('#options > div').hide();

        // Get DIV ID for content from the href of the menu link
        var activeTab = $(this).find('a').attr('href');
        $(activeTab).fadeIn();
        return false;
    });
}

// fetches options from the datastore
function fetchOptions() {
    $.each(options, function(option, value) {
        var dataStoreValue = localStorage['stylebot_option_' + option];

        if (dataStoreValue != typeof undefined)
        {
            if (dataStoreValue === 'true' || dataStoreValue === 'false')
                options[option] = (dataStoreValue === 'true');
            else
                options[option] = dataStoreValue;
        }
    });
}

// Attaches listeners for different types of inputs that change option values
function attachListeners() {
    // checkbox
    $('#basics input[type=checkbox]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.checked);
        bg_window.saveOption(name, value);
    });

    // radio
    $('#basics input[type=radio]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.value);
        bg_window.saveOption(name, value);
    });

    // select
    $('#basics select').change(function(e) {
        bg_window.saveOption(e.target.name, e.target.value);
    });

    // textfields
    $('#basics input[type=text]').keyup(function(e) {
        if (e.target.name === 'shortcutKeyCharacter')
            option = 'shortcutKey';
        else
            option = e.target.name;
        bg_window.saveOption(option, translateOptionValue(option, e.target.value));
    });

    // on window resize, resize textarea
    $(window).resize(function(e) {
        resizeEditor();
    });

    // edit styles
    $('.style').live('click keydown', function(e) {
        var $el = $(e.target);
        var $this = $(this);

        if ($el.closest('.selected').length != 0) return true;

        if (e.type === 'keydown' && (e.keyCode != 13 || $el.hasClass('style-button'))) return true;

        setTimeout(function() {
            selectStyle($this);
        }, 0);
    });

    // Tap / to search styles
    $(document).keyup(function(e) {
        if (e.keyCode != 191)
            return true;

        if ($('#styles-container').css('display') === 'none')
            return true;

        var tag = e.target.tagName.toLowerCase();

        if (tag === 'input' || tag === 'textarea')
            return true;

        $('#style-search-field').focus();
    });
}

function translateOptionValue(name, value) {
    switch (name) {
        case 'sync': return (value === 'true') ? true : false;
        case 'shortcutKey': return $('[name=shortcutKey]').attr('value');
    }

    return value;
}

// Styles

// Refreshes the styles. Called during initialization and on import
//
function fillStyles() {
    var container = $('#styles');
    container.html('');
    var count = 0;
    // newest styles are shown at the top
    for (var url in bg_window.cache.styles.get()) {
        // skip the global styles
        if (url === '*') continue;
        container.prepend(createStyleUI(url));
        count ++;
    }
    setStyleCount(count);
}

function getStyleCount() {
    return parseInt($('#style-count').text());
}

function setStyleCount(val) {
    $('#style-count').text(val);
}

