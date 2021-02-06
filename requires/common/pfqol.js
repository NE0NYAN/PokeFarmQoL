/* globals jQuery GM_addStyle
        Globals Resources Helpers QoLHub PagesManager */
'use strict';
class PFQoL {
    constructor($) {
        // :contains to case insensitive
        $.extend($.expr[':'], {
            // eslint-disable-next-line no-unused-vars
            'containsIN': function (elem, i, match, array) {
                return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || '').toLowerCase()) >= 0;
            }
        });

        this.jQuery = $;
        this.GLOBALS = new Globals();
        this.HELPERS = new Helpers();
        this.RESOURCES = new Resources();
        this.PAGES = new PagesManager(this.jQuery, this.GLOBALS);
        this.QOLHUB = new QoLHub(this.jQuery, this.GLOBALS, this.PAGES);
        this.GLOBALS.fillTemplates(this.RESOURCES);
        this.GLOBALS.fillOptionsLists();

        this.init();
    }
    instantiatePages(obj) {
        obj.PAGES.instantiatePages(obj.QOLHUB);
    }
    loadSettings(obj) { // initial settings on first run and setting the variable settings key
        obj.QOLHUB.loadSettings();
        obj.PAGES.loadSettings(obj.QOLHUB);
    } // loadSettings
    saveSettings() { // Save changed settings
        this.QOLHUB.saveSettings();
        this.PAGES.saveSettings(this.QOLHUB);
    } // saveSettings
    populateSettingsPage(obj) { // checks all settings checkboxes that are true in the settings
        obj.QOLHUB.populateSettings();
        obj.PAGES.populateSettings(obj.QOLHUB);
    }
    setupHTML(obj) { // injects the HTML changes from GLOBALS.TEMPLATES into the site
        // Header link to Userscript settings
        document.querySelector('li[data-name*=\'Lucky Egg\']')
            .insertAdjacentHTML('afterend', obj.GLOBALS.TEMPLATES.qolHubLinkHTML);
        obj.PAGES.setupHTML(obj.GLOBALS, obj.QOLHUB);
    }
    setupCSS(obj) { // All the CSS changes are added here
        GM_addStyle(obj.RESOURCES.css());
        obj.PAGES.setupCSS(obj.QOLHUB);
        obj.QOLHUB.setupCSS();
    }
    setupObservers(obj) { // all the Observers that needs to run
        obj.PAGES.setupObservers(obj.QOLHUB);
    }
    setupHandlers(obj) { // all the event handlers
        obj.jQuery(document).on('click', 'li[data-name="QoL"]', (function () { //open QoL hub
            obj.QOLHUB.build(document);
            obj.populateSettingsPage();
        }));
        obj.QOLHUB.setupHandlers();
        obj.PAGES.setupHandlers(obj.GLOBALS, obj.QOLHUB);
    }
    startup() { // All the functions that are run to start the script on Pokéfarm
        return {
            'creating Page handlers': this.instantiatePages,
            'loading Settings': this.loadSettings,
            'setting up HTML': this.setupHTML,
            'populating Settings': this.populateSettingsPage,
            'setting up CSS': this.setupCSS,
            'setting up Observers': this.setupObservers,
            'setting up Handlers': this.setupHandlers,
        };
    }
    init() { // Starts all the functions.
        console.log('Starting up ..');
        const startup = this.startup();
        for (const message in startup) {
            if (Object.hasOwnProperty.call(startup, message)) {
                console.log(message);
                startup[message](this, this.GLOBALS);
            }
        }
    }
}



if (module) {
    module.exports.pfqol = PFQoL;
} else {
    new PFQoL(jQuery);
}