// ==UserScript==
// @name         Poké Farm QoL
// @namespace    https://github.com/jpgualdarrama/
// @author       Bentomon
// @homepage	 https://github.com/jpgualdarrama/PokeFarmShelter
// @downloadURL  https://github.com/jpgualdarrama/PokeFarmShelter/raw/master/Poke-Farm-QoL.user.js
// @description  Quality of Life changes to Pokéfarm!
// @version      1.3.52
// @match        https://pokefarm.com/*
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://raw.githubusercontent.com/lodash/lodash/4.17.4/dist/lodash.min.js
// @require      https://cdn.rawgit.com/omichelsen/compare-versions/v3.1.0/index.js
// @resource     QolHubHTML	        https://raw.githubusercontent.com/jpgualdarrama/PokeFarmQoL/master/resources/templates/qolHubHTML.html
// @resource     shelterSettingsHTML    https://raw.githubusercontent.com/jpgualdarrama/PokeFarmQoL/master/resources/templates/shelterOptionsHTML.html
// @resource     evolveFastHTML         https://raw.githubusercontent.com/jpgualdarrama/PokeFarmQoL/master/resources/templates/evolveFastHTML.html
// @resource     labOptionsHTML         https://raw.githubusercontent.com/jpgualdarrama/PokeFarmQoL/master/resources/templates/labOptionsHTML.html
// @resource     fieldSearchHTML        https://raw.githubusercontent.com/jpgualdarrama/PokeFarmQoL/master/resources/templates/fieldSearchHTML.html
// @resource     privateFieldSearchHTML        https://raw.githubusercontent.com/jpgualdarrama/PokeFarmQoL/master/resources/templates/privateFieldSearchHTML.html
// @resource     QoLCSS                 https://raw.githubusercontent.com/jpgualdarrama/PokeFarmQoL/master/resources/css/pfqol.css
// @updateURL    https://github.com/jpgualdarrama/PokeFarmQoL/raw/master/Poke-Farm-QoL.user.js
// @connect      github.com
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// ==/UserScript==

/*
1. Modularize
2. Commonize
*/

(function($) {
    'use strict';
    /////////////////////////////////////
    // Welcome to my first ever script!//
    // Let's hope everything works~    //
    /////////////////////////////////////

    // custom jQuery
    // :contains to case insensitive
    $.extend($.expr[":"], {
        "containsIN": function(elem, i, match, array) {
        return (elem.textContent || elem.innerText || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
        }
    });

    const TEMPLATES = { // all the new/changed HTML for the userscript
        qolHubLinkHTML        : `<li data-name="QoL"><a title="QoL Settings"><img src="https://i.imgur.com/L6KRli5.png" alt="QoL Settings">QoL</a></li>`,
        qolHubUpdateLinkHTML  : `<li data-name="QoLupdate"><a href=\"https://github.com/jpgualdarrama/PokeFarmQoL/raw/master/Poke-Farm-QoL.user.js\" target=\"_blank\"><img src="https://i.imgur.com/SJhgsU8.png" alt="QoL Update">QoL Update Available!</a></li>`,
        qolSettingsMenuHTML   : GM_getResourceText('QoLSettingsMenuHTML'),
        shelterSettingsHTML   : GM_getResourceText('shelterSettingsHTML'),
        massReleaseSelectHTML : `<label id="selectallfish"><input id="selectallfishcheckbox" type="checkbox">Select all</label><label id="movefishselectany"><input id="movefishdselectanycheckbox" type="checkbox">Select Any  </label><label id="movefishselectsour"><input id="movefishselectsourcheckbox" type="checkbox">Select Sour  </label><label id="movefishselectspicy"><input id="movefishselectspicycheckbox" type="checkbox">Select Spicy</label><label id="movefishselectdry"><input id="movefishselectdrycheckbox" type="checkbox">Select Dry  </label><label id="movefishselectsweet"><input id="movefishselectsweetcheckbox" type="checkbox">Select Sweet  </label><label id="movefishselectbitter"><input id="movefishselectbittercheckbox" type="checkbox">Select Bitter  </label>`,
        fieldSortHTML         : `<div id="fieldorder"><label><input type="checkbox" class="qolsetting qolalone" data-key="fieldByBerry"/>Sort by berries</label><label><input type="checkbox" class="qolsetting qolalone" data-key="fieldByMiddle"/>Sort in the middle</label><label><input type="checkbox" class="qolsetting qolalone" data-key="fieldByGrid"/>Align to grid</label><label><input type="checkbox" class="qolsetting" data-key="fieldClickCount"/>Click counter</label></div>`,
        fieldSearchHTML       : GM_getResourceText('fieldSearchHTML'),
        privateFieldSearchHTML: GM_getResourceText('privateFieldSearchHTML'),
        qolHubHTML            : GM_getResourceText('QolHubHTML'),
        partyModHTML          : `<div id='qolpartymod'><label><input type="checkbox" class="qolsetting qolalone" data-key="hideDislike"/>Hide disliked berries</label><label><input type="checkbox" class="qolsetting qolalone" data-key="niceTable"/>Show in table</label><label><input type="checkbox" class="qolsetting qolalone" data-key="hideAll"/>Hide all click fast</label></div>`,
        evolveFastHTML        : GM_getResourceText('evolveFastHTML'),
        labOptionsHTML        : GM_getResourceText('labOptionsHTML'),
    }

    let Helpers = (function Helpers() {
        /* public stuff */
        const API = {
            onPage(pg) { return window.location.href.indexOf(pg) != -1; },
            onMultiuserPage() { return API.onPage("users/"); },
            onShelterPage() { return API.onPage("/shelter"); },
            onPublicFieldsPage() { return API.onPage("fields/"); },
            onPrivateFieldsPage() { return API.onPage("fields") && !API.onPublicFieldsPage(); },
            onFarmPage(tab) { return API.onPage("farm#" + ((tab===undefined) ? "" : tab)); },
            onFishingPage() { return API.onPage("fishing"); },
            onLabPage() { return API.onPage("/lab"); },
            onDexPage() { return API.onPage("dex"); },

            shelterKeyIsTopCheckbox(k) {
                return k != 'findCustom' && k != 'findMale' && k != 'findFemale' && k != 'findNoGender' && k != 'customEgg' && k != 'customPokemon' && k != 'customPng';
            },

            buildOptionsString(arr) {
                let str = '<option value="none">None</option> ';
                for(let i = 0; i < arr.length; i++) {
                    str += `<option value="${i}">${arr[i]}</option> `;
                }
                return str;
            },

			toggleSetting(key, set = false) {
				if (typeof set === 'boolean') {
					let element = document.querySelector(`.qolsetting[data-key="${key}"]`);
					if (element && element.type === 'checkbox') {
						element.checked = set;
					}
				}
				else if (typeof set === 'string') {
					let element = document.querySelector(`.qolsetting[data-key="${key}"]`);
					if (element && element.type === 'text') {
						element.value = set;
					}
				}
			}, // toggleSetting

			setupFieldArrayHTML(arr, id, div, cls) {
				let n = arr.length;
				for(let i = 0; i < n; i++) {
					let rightDiv = i + 1;
					let rightValue = arr[i];
					$(`#${id}`).append(div);
					$(`.${cls}`).removeClass(cls).addClass(""+rightDiv+"").find('.qolsetting').val(rightValue);
				}
			},

            loadSettings(KEY, DEFAULT, obj) {
                console.log('Helpers.loadSettings')

                if (localStorage.getItem(KEY) === null) {
                    API.saveSettings(KEY);
                } else {
                    // console.log(localStorage.getItem(KEY))
                    try {
                        let countScriptSettings = Object.keys(obj).length
                        let localStorageString = JSON.parse(localStorage.getItem(KEY));
                        let countLocalStorageSettings = Object.keys(localStorageString).length
                        if (countLocalStorageSettings < countScriptSettings) { // adds new objects (settings) to the local storage
                            let defaultsSetting = DEFAULT;
                            let userSetting = JSON.parse(localStorage.getItem(KEY));
                            let newSetting = $.extend(true,{}, defaultsSetting, userSetting);

                            obj = newSetting;
                            API.saveSettings(KEY, obj);
                        }
                        if (countLocalStorageSettings > countScriptSettings) {
                            API.saveSettings(KEY, obj);
                        }
                    }
                    catch(err) {
                        API.saveSettings(KEY, obj);
                    }
                    if (localStorage.getItem(KEY) != obj) {
                        obj = JSON.parse(localStorage.getItem(KEY));
                    }
                }

                return obj;
            },
            saveSettings(KEY, obj) {
//                 console.log('Helpers.saveSettings')
//                 console.log(KEY)
//                 console.log(obj)
                localStorage.setItem(KEY, JSON.stringify(obj));
            },
        };

        return API;
    })();

	let GLOBALS = {
		SETTINGS_SAVE_KEY : 'QoLSettings',
        DEX_DATA: '{"columns":["id","name","type1","type2","eggs","eggdex","pkmn","pokedex","shinydex","albidex","melandex"],"types":["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],"regions":{"1":[["001","Bulbasaur",4,7,1,1,1,1,0,0,0],["002","Ivysaur",4,7,0,0,1,1,0,0,0],["003","Venusaur",4,7,0,0,2,1,0,0,0],["004","Charmander",1,-1,1,1,1,1,0,0,0],["005","Charmeleon",1,-1,0,0,1,1,0,0,0],["006","Charizard",1,9,0,0,3,1,0,0,0],["007","Squirtle",2,-1,1,1,1,1,0,0,0],["008","Wartortle",2,-1,0,0,1,1,0,0,0],["009","Blastoise",2,-1,0,0,2,1,0,0,0],["010","Caterpie",11,-1,1,1,1,1,0,0,0],["011","Metapod",11,-1,0,0,1,1,0,0,0],["012","Butterfree",11,9,0,0,1,1,0,0,0],["013","Weedle",11,7,1,1,1,1,0,0,0],["014","Kakuna",11,7,0,0,1,1,0,0,0],["015","Beedrill",11,7,0,0,2,1,0,0,0],["016","Pidgey",0,9,1,1,1,1,0,0,0],["017","Pidgeotto",0,9,0,0,1,1,0,0,0],["018","Pidgeot",0,9,0,0,2,1,0,0,0],["019","Rattata",0,-1,2,2,2,2,0,0,0],["020","Raticate",0,-1,0,0,3,2,0,0,0],["021","Spearow",0,9,1,1,1,1,0,0,0],["022","Fearow",0,9,0,0,1,1,0,0,0],["023","Ekans",7,-1,1,1,1,1,0,0,0],["024","Arbok",7,-1,0,0,1,1,0,0,0],["025","Pichu",3,-1,1,1,1,1,0,0,0],["026","Pikachu",3,-1,0,0,1,1,0,0,0],["027","Raichu",3,-1,0,0,2,0,0,0,0],["028","Sandshrew",8,-1,2,2,2,2,0,0,0],["029","Sandslash",8,-1,0,0,2,1,0,0,0],["030","Nidoran",7,-1,1,1,1,1,0,0,0],["031","Nidorina",7,-1,0,0,1,1,0,0,0],["032","Nidoqueen",7,8,0,0,1,0,0,0,0],["033","Nidorino",7,-1,0,0,1,1,0,0,0],["034","Nidoking",7,8,0,0,1,1,0,0,0],["035","Cleffa",17,-1,1,1,1,1,0,0,0],["036","Clefairy",17,-1,0,0,1,1,0,0,0],["037","Clefable",17,-1,0,0,1,0,0,0,0],["038","Vulpix",1,-1,2,2,2,2,0,0,0],["039","Ninetales",1,-1,0,0,2,1,0,0,0],["040","Igglybuff",0,17,1,1,1,1,0,0,0],["041","Jigglypuff",0,17,0,0,1,1,0,0,0],["042","Wigglytuff",0,17,0,0,1,1,0,0,0],["043","Zubat",7,9,1,1,1,1,0,0,0],["044","Golbat",7,9,0,0,1,1,0,0,0],["045","Crobat",7,9,0,0,1,0,0,0,0],["046","Oddish",4,7,1,1,1,1,0,0,0],["047","Gloom",4,7,0,0,1,1,0,0,0],["048","Vileplume",4,7,0,0,1,1,0,0,0],["049","Bellossom",4,-1,0,0,1,0,0,0,0],["050","Paras",11,4,1,1,1,1,0,0,0],["051","Parasect",11,4,0,0,1,1,0,0,0],["052","Venonat",11,7,1,1,1,1,0,0,0],["053","Venomoth",11,7,0,0,1,1,0,0,0],["054","Diglett",8,-1,2,2,2,2,0,0,0],["055","Dugtrio",8,-1,0,0,2,1,0,0,0],["056","Meowth",0,-1,2,2,2,2,0,0,0],["057","Persian",0,-1,0,0,2,1,0,0,0],["058","Psyduck",2,-1,1,1,1,1,0,0,0],["059","Golduck",2,-1,0,0,1,1,0,0,0],["060","Mankey",6,-1,1,1,1,1,0,0,0],["061","Primeape",6,-1,0,0,1,1,0,0,0],["062","Growlithe",1,-1,1,1,1,1,1,0,0],["063","Arcanine",1,-1,0,0,1,1,0,0,0],["064","Poliwag",2,-1,1,1,1,1,0,0,0],["065","Poliwhirl",2,-1,0,0,1,1,0,0,0],["066","Poliwrath",2,6,0,0,1,0,0,0,0],["067","Politoed",2,-1,0,0,1,1,0,0,0],["068","Abra",10,-1,1,1,1,1,0,0,0],["069","Kadabra",10,-1,0,0,1,1,0,0,0],["070","Alakazam",10,-1,0,0,2,1,0,0,0],["071","Machop",6,-1,1,1,1,1,0,0,0],["072","Machoke",6,-1,0,0,1,1,0,0,0],["073","Machamp",6,-1,0,0,1,1,0,0,0],["074","Bellsprout",4,7,1,1,1,1,0,0,0],["075","Weepinbell",4,7,0,0,1,1,0,0,0],["076","Victreebell",4,7,0,0,1,0,0,0,0],["077","Tentacool",2,7,1,1,1,1,0,0,0],["078","Tentacruel",2,7,0,0,1,1,0,0,0],["079","Geodude",12,8,2,2,2,2,0,0,0],["080","Graveler",12,8,0,0,2,1,0,0,0],["081","Golem",12,8,0,0,2,1,0,0,0],["082","Ponyta",1,-1,1,1,1,1,0,0,0],["083","Rapidash",1,-1,0,0,1,1,0,0,0],["084","Slowpoke",2,10,1,1,1,1,0,0,0],["085","Slowbro",2,10,0,0,2,1,0,0,0],["086","Slowking",2,10,0,0,1,0,0,0,0],["087","Magnemite",3,16,1,1,1,1,0,0,0],["088","Magneton",3,16,0,0,1,1,0,0,0],["089","Magnezone",3,16,0,0,1,1,0,0,0],["090","Farfetch"d",0,9,1,1,1,1,0,0,0],["091","Doduo",0,9,1,1,1,1,0,0,0],["092","Dodrio",0,9,0,0,1,1,0,0,0],["093","Seel",2,-1,1,1,1,1,0,0,0],["094","Dewgong",2,5,0,0,1,0,0,0,0],["095","Grimer",7,-1,2,2,2,2,0,0,0],["096","Muk",7,-1,0,0,2,0,0,0,0],["097","Shellder",2,-1,1,1,1,1,0,0,0],["098","Cloyster",2,5,0,0,1,0,0,0,0],["099","Gastly",13,7,1,1,1,1,0,0,0],["100","Haunter",13,7,0,0,1,1,0,0,0],["101","Gengar",13,7,0,0,2,2,0,0,0],["102","Onix",12,8,1,1,1,1,0,0,0],["103","Steelix",16,8,0,0,2,0,0,0,0],["104","Drowzee",10,-1,1,1,1,1,0,0,0],["105","Hypno",10,-1,0,0,1,1,0,0,0],["106","Krabby",2,-1,1,1,1,1,0,0,0],["107","Kingler",2,-1,0,0,1,0,0,0,0],["108","Voltorb",3,-1,1,1,1,1,0,0,0],["109","Electrode",3,-1,0,0,1,0,0,0,0],["110","Exeggcute",4,10,1,1,1,1,0,0,0],["111","Exeggutor",4,10,0,0,2,1,0,0,0],["112","Cubone",8,-1,1,1,1,1,0,0,0],["113","Marowak",8,-1,0,0,3,1,0,0,0],["114","Lickitung",0,-1,1,1,1,1,0,0,0],["115","Lickilicky",0,-1,0,0,1,0,0,0,0],["116","Koffing",7,-1,1,1,1,1,0,0,0],["117","Weezing",7,-1,0,0,1,1,0,0,0],["118","Rhyhorn",8,12,1,1,1,1,0,0,0],["119","Rhydon",8,12,0,0,1,0,0,0,0],["120","Rhyperior",8,12,0,0,1,0,0,0,0],["121","Tangela",4,-1,1,1,1,1,0,0,0],["122","Tangrowth",4,-1,0,0,1,0,0,0,0],["123","Kangaskhan",0,-1,1,1,2,1,0,0,0],["124","Horsea",2,-1,1,1,1,1,0,0,0],["125","Seadra",2,-1,0,0,1,1,0,0,0],["126","Kingdra",2,14,0,0,1,0,0,0,0],["127","Goldeen",2,-1,1,1,1,1,0,0,0],["128","Seaking",2,-1,0,0,1,1,0,0,0],["129","Staryu",2,-1,1,0,1,0,0,0,0],["130","Starmie",2,10,0,0,1,0,0,0,0],["131","Mime Jr.",10,17,1,1,1,1,0,0,0],["132","Mr. Mime",10,17,1,1,1,1,0,0,0],["133","Scyther",11,9,1,1,1,1,0,0,0],["134","Scizor",11,16,0,0,2,1,0,0,0],["135","Smoochum",5,10,1,1,1,1,0,0,0],["136","Jynx",5,10,0,0,1,1,0,0,0],["137","Pinsir",11,-1,1,1,2,1,0,0,0],["138","Tauros",0,-1,1,1,1,1,0,0,0],["139","Magikarp",2,-1,1,1,1,1,0,0,0],["140","Gyarados",2,9,0,0,2,1,0,0,0],["141","Lapras",2,5,1,1,1,1,0,0,0],["142","Ditto",0,-1,1,0,1,0,0,0,0],["143","Eevee",0,-1,1,1,1,1,0,0,0],["144","Vaporeon",2,-1,0,0,1,0,0,0,0],["145","Jolteon",3,-1,0,0,1,0,0,0,0],["146","Flareon",1,-1,0,0,1,1,0,0,0],["147","Espeon",10,-1,0,0,1,1,0,0,0],["148","Umbreon",15,-1,0,0,1,1,0,0,0],["149","Leafeon",4,-1,0,0,1,1,0,0,0],["150","Glaceon",5,-1,0,0,1,1,0,0,0],["151","Sylveon",17,-1,0,0,1,0,0,0,0],["152","Omanyte",12,2,1,1,1,1,0,0,0],["153","Omastar",12,2,0,0,1,0,0,0,0],["154","Kabuto",12,2,1,1,1,1,0,0,0],["155","Kabutops",12,2,0,0,1,0,0,0,0],["156","Aerodactyl",12,9,1,1,2,1,0,0,0],["157","Munchlax",0,-1,1,1,1,1,0,0,0],["158","Snorlax",0,-1,1,1,1,1,0,0,0],["159","Articuno",5,9,1,0,1,0,0,0,0],["160","Zapdos",3,9,1,0,1,0,0,0,0],["161","Moltres",1,9,1,0,1,0,0,0,0],["162","Dratini",14,-1,1,1,1,1,0,0,0],["163","Dragonair",14,-1,0,0,1,1,0,0,0],["164","Dragonite",14,9,0,0,1,0,0,0,0],["165","Mewtwo",10,-1,1,0,3,0,0,0,0],["166","Mew",10,-1,1,1,1,1,0,0,0]],"2":[["167","Chikorita",4,-1,1,1,1,1,0,0,0],["168","Bayleef",4,-1,0,0,1,1,0,0,0],["169","Meganium",4,-1,0,0,1,1,0,0,0],["170","Cyndaquil",1,-1,1,1,1,1,0,0,0],["171","Quilava",1,-1,0,0,1,1,0,0,0],["172","Typhlosion",1,-1,0,0,1,1,0,0,0],["173","Totodile",2,-1,1,1,1,1,0,0,0],["174","Croconaw",2,-1,0,0,1,1,0,0,0],["175","Feraligator",2,-1,0,0,1,1,0,0,0],["176","Sentret",0,-1,1,1,1,1,0,0,0],["177","Furret",0,-1,0,0,1,1,0,0,0],["178","Hoothoot",0,9,1,1,1,1,0,0,0],["179","Noctowl",0,9,0,0,1,1,0,0,0],["180","Ledyba",11,9,1,1,1,1,0,0,0],["181","Ledian",11,9,0,0,1,1,0,0,0],["182","Spinarak",11,7,1,1,1,1,0,0,0],["183","Ariados",11,7,0,0,1,1,0,0,0],["184","Chinchou",2,3,1,1,1,1,0,0,0],["185","Lanturn",2,3,0,0,1,0,0,0,0],["186","Togepi",17,-1,1,1,1,1,0,0,0],["187","Togetic",17,9,0,0,1,1,0,0,0],["188","Togekiss",17,9,0,0,1,0,0,0,0],["189","Natu",10,9,1,1,1,1,0,0,0],["190","Xatu",10,9,0,0,1,1,0,0,0],["191","Mareep",3,-1,1,1,1,1,0,0,0],["192","Flaaffy",3,-1,0,0,1,1,0,0,0],["193","Ampharos",3,-1,0,0,2,1,0,0,0],["194","Azurill",0,17,1,1,1,1,0,0,0],["195","Marill",2,17,1,1,1,1,0,0,0],["196","Azumarill",2,17,0,0,1,1,0,0,0],["197","Bonsly",12,-1,1,1,1,1,0,0,0],["198","Sudowoodo",12,-1,1,1,1,1,0,0,0],["199","Hoppip",4,9,1,1,1,1,1,0,0],["200","Skiploom",4,9,0,0,1,1,1,0,0],["201","Jumpluff",4,9,0,0,1,1,0,0,0],["202","Aipom",0,-1,1,1,1,1,0,0,0],["203","Ambipom",0,-1,0,0,1,1,0,0,0],["204","Sunkern",4,-1,1,1,1,1,0,0,0],["205","Sunflora",4,-1,0,0,1,0,0,0,0],["206","Yanma",11,9,1,1,1,1,0,0,0],["207","Yanmega",11,9,0,0,1,0,0,0,0],["208","Wooper",2,8,1,1,1,1,0,0,0],["209","Quagsire",2,8,0,0,1,1,0,0,0],["210","Murkrow",15,9,1,1,1,1,0,0,0],["211","Honchkrow",15,9,0,0,1,0,0,0,0],["212","Misdreavus",13,-1,1,1,1,1,0,0,0],["213","Mismagius",13,-1,0,0,1,1,0,0,0],["214|","Unown",10,-1,28,22,28,23,0,0,0],["215","Girafarig",0,10,1,1,1,1,0,0,0],["216","Pineco",11,-1,1,1,1,1,0,0,0],["217","Forretress",11,16,0,0,1,1,0,0,0],["218","Dunsparce",0,-1,1,1,1,1,0,0,0],["219","Gligar",8,9,1,1,1,1,0,0,0],["220","Gliscor",8,9,0,0,1,1,0,0,0],["221","Snubbull",17,-1,1,1,1,1,0,0,0],["222","Granbull",17,-1,0,0,1,1,0,0,0],["223","Qwilfish",2,7,1,1,1,1,0,0,0],["224","Shuckle",11,12,1,1,1,1,0,0,0],["225","Heracross",11,6,1,1,2,1,0,0,0],["226","Sneasel",15,5,1,1,1,1,0,0,0],["227","Weavile",15,5,0,0,1,1,0,0,0],["228","Teddiursa",0,-1,1,1,1,1,0,0,0],["229","Ursaring",0,-1,0,0,1,1,0,0,0],["230","Slugma",1,-1,1,1,1,1,0,0,0],["231","Magcargo",1,12,0,0,1,1,0,0,0],["232","Swinub",5,8,1,1,1,1,0,0,0],["233","Piloswine",5,8,0,0,1,0,0,0,0],["234","Mamoswine",5,8,0,0,1,0,0,0,0],["235","Corsola",2,12,1,1,1,1,0,0,0],["236","Remoraid",2,-1,1,1,1,1,0,0,0],["237","Octillery",2,-1,0,0,1,0,0,0,0],["238","Delibird",5,9,1,1,1,1,0,0,0],["239","Skarmory",16,9,1,1,1,1,0,0,0],["240","Houndour",15,1,1,1,1,1,0,0,0],["241","Houndoom",15,1,0,0,2,1,0,0,0],["242","Phanpy",8,-1,1,1,1,1,0,0,0],["243","Donphan",8,-1,0,0,1,1,0,0,0],["244","Stantler",0,-1,1,1,1,1,0,0,0],["245","Smeargle",0,-1,1,1,1,1,0,0,0],["246","Tyrogue",6,-1,1,1,1,1,0,0,0],["247","Hitmonlee",6,-1,0,0,1,1,0,0,0],["248","Hitmonchan",6,-1,0,0,1,0,0,0,0],["249","Hitmontop",6,-1,0,0,1,0,0,0,0],["250","Elekid",3,-1,1,1,1,1,0,0,0],["251","Electabuzz",3,-1,0,0,1,1,0,0,0],["252","Electivire",3,-1,0,0,1,0,0,0,0],["253","Magby",1,-1,1,1,1,1,0,0,0],["254","Magmar",1,-1,0,0,1,0,0,0,0],["255","Magmortar",1,-1,0,0,1,0,0,0,0],["256","Miltank",0,-1,1,1,1,1,0,0,0],["257","Raikou",3,-1,1,0,1,0,0,0,0],["258","Entei",1,-1,1,0,1,0,0,0,0],["259","Suicune",2,-1,1,0,1,0,0,0,0],["260","Larvitar",12,8,1,1,1,1,0,0,0],["261","Pupitar",12,8,0,0,1,1,0,0,0],["262","Tyranitar",12,15,0,0,2,0,0,0,0],["263","Lugia",10,9,1,0,1,0,0,0,0],["264","Ho-oh",1,9,1,0,1,0,0,0,0],["265","Celebi",10,4,1,0,1,0,0,0,0]],"3":[["266","Treecko",4,-1,1,1,1,1,0,0,0],["267","Grovyle",4,-1,0,0,1,1,0,0,0],["268","Sceptile",4,-1,0,0,2,1,0,0,0],["269","Torchic",1,-1,1,1,1,1,1,0,0],["270","Combusken",1,6,0,0,1,1,0,0,0],["271","Blaziken",1,6,0,0,2,1,0,0,0],["272","Mudkip",2,-1,1,1,1,1,0,0,0],["273","Marshtomp",2,8,0,0,1,1,0,0,0],["274","Swampert",2,8,0,0,2,0,0,0,0],["275","Poochyena",15,-1,1,1,1,1,0,0,0],["276","Mightyena",15,-1,0,0,1,1,0,0,0],["277","Zigzagoon",0,-1,1,1,1,1,0,0,0],["278","Linoone",0,-1,0,0,1,1,0,0,0],["279","Wurmple",11,-1,1,1,1,1,0,0,0],["280","Silcoon",11,-1,0,0,1,0,0,0,0],["281","Beautifly",11,9,0,0,1,1,0,0,0],["282","Cascoon",11,-1,0,0,1,1,0,0,0],["283","Dustox",11,7,0,0,1,1,0,0,0],["284","Lotad",2,4,1,1,1,1,0,0,0],["285","Lombre",2,4,0,0,1,1,0,0,0],["286","Ludicolo",2,4,0,0,1,0,0,0,0],["287","Seedot",4,-1,1,1,1,1,0,0,0],["288","Nuzleaf",4,15,0,0,1,1,0,0,0],["289","Shiftry",4,15,0,0,1,1,0,0,0],["290","Taillow",0,9,1,1,1,1,0,0,0],["291","Swellow",0,9,0,0,1,1,1,0,0],["292","Wingull",2,9,1,1,1,1,0,0,0],["293","Pelipper",2,9,0,0,1,1,0,0,0],["294","Ralts",10,17,1,1,1,1,1,0,0],["295","Kirlia",10,17,0,0,1,1,0,0,0],["296","Gardevoir",10,17,0,0,2,1,0,0,0],["297","Gallade",10,6,0,0,2,0,0,0,0],["298","Surskit",11,2,1,1,1,1,0,0,0],["299","Masquerain",11,9,0,0,1,1,0,0,0],["300","Shroomish",4,-1,1,1,1,1,0,0,0],["301","Breloom",4,6,0,0,1,1,0,0,0],["302","Slakoth",0,-1,1,1,1,1,0,0,0],["303","Vigoroth",0,-1,0,0,1,1,0,0,0],["304","Slaking",0,-1,0,0,1,1,0,0,0],["305","Nincada",11,8,1,1,1,1,0,0,0],["306","Ninjask",11,9,0,0,1,1,0,0,0],["307","Shedinja",11,13,0,0,1,0,0,0,0],["308","Whismur",0,-1,1,1,1,1,0,0,0],["309","Loudred",0,-1,0,0,1,1,0,0,0],["310","Exploud",0,-1,0,0,1,1,0,0,0],["311","Makuhita",6,-1,1,1,1,1,0,0,0],["312","Hariyama",6,-1,0,0,1,1,0,0,0],["313","Nosepass",12,-1,1,1,1,1,0,0,0],["314","Probopass",12,16,0,0,1,1,0,0,0],["315","Skitty",0,-1,1,1,1,1,0,0,0],["316","Delcatty",0,-1,0,0,1,1,0,0,0],["317","Sableye",15,13,1,1,2,1,0,0,0],["318","Mawile",16,17,1,1,2,1,0,0,0],["319","Aron",16,12,1,1,1,1,0,0,0],["320","Lairon",16,12,0,0,1,0,0,0,0],["321","Aggron",16,12,0,0,2,1,0,0,0],["322","Meditite",6,10,1,1,1,1,0,0,0],["323","Medicham",6,10,0,0,2,1,0,0,0],["324","Electrike",3,-1,1,1,1,1,0,0,0],["325","Manectric",3,-1,0,0,2,1,0,0,0],["326","Plusle",3,-1,1,1,1,1,0,0,0],["327","Minun",3,-1,1,1,1,1,0,0,0],["328","Volbeat",11,-1,1,1,1,1,0,0,0],["329","Illumise",11,-1,1,1,1,1,0,0,0],["330","Gulpin",7,-1,1,1,1,1,0,0,0],["331","Swalot",7,-1,0,0,1,1,0,0,0],["332","Carvanha",2,15,1,1,1,1,0,0,0],["333","Sharpedo",2,15,0,0,2,1,0,0,0],["334","Wailmer",2,-1,1,1,1,1,0,0,0],["335","Wailord",2,-1,0,0,1,0,0,0,0],["336","Numel",1,8,1,1,1,1,0,0,0],["337","Camerupt",1,8,0,0,2,1,0,0,0],["338","Torkoal",1,-1,1,1,1,1,0,0,0],["339","Spoink",10,-1,1,1,1,1,0,0,0],["340","Grumpig",10,-1,0,0,1,1,0,0,0],["341","Spinda",0,-1,1,1,1,1,0,0,0],["342","Trapinch",8,-1,1,1,1,1,0,0,0],["343","Vibrava",8,14,0,0,1,1,0,0,0],["344","Flygon",8,14,0,0,1,1,0,0,0],["345","Cacnea",4,-1,1,1,1,1,0,0,0],["346","Cacturne",4,15,0,0,1,1,0,0,0],["347","Swablu",0,9,1,1,1,1,0,0,0],["348","Altaria",14,9,0,0,2,1,0,0,0],["349","Zangoose",0,-1,1,1,1,1,0,0,0],["350","Seviper",7,-1,1,1,1,1,0,0,0],["351","Lunatone",12,10,1,1,1,1,0,0,0],["352","Solrock",12,10,1,1,1,1,0,0,0],["353","Barboach",2,8,1,1,1,1,0,0,0],["354","Whiscash",2,8,0,0,1,0,0,0,0],["355","Corphish",2,-1,1,1,1,1,0,0,0],["356","Crawdaunt",2,15,0,0,1,0,0,0,0],["357","Baltoy",8,10,1,1,1,1,0,0,0],["358","Claydol",8,10,0,0,1,1,0,0,0],["359","Lileep",12,4,1,1,1,1,0,0,0],["360","Cradily",12,4,0,0,1,1,0,0,0],["361","Anorith",12,11,1,1,1,1,0,0,0],["362","Armaldo",12,11,0,0,1,0,0,0,0],["363","Feebas",2,-1,1,1,1,1,0,0,0],["364","Milotic",2,-1,0,0,1,0,0,0,0],["365","Castform",0,-1,1,1,4,1,0,0,0],["366","Kecleon",0,-1,1,1,1,1,0,0,0],["367","Shuppet",13,-1,1,1,1,1,0,0,0],["368","Banette",13,-1,0,0,2,1,0,0,0],["369","Duskull",13,-1,1,1,1,1,0,0,0],["370","Dusclops",13,-1,0,0,1,0,0,0,0],["371","Dusknoir",13,-1,0,0,1,0,0,0,0],["372","Tropius",4,9,1,1,1,1,0,0,0],["373","Chingling",10,-1,1,1,1,1,0,0,0],["374","Chimecho",10,-1,1,1,1,1,0,0,0],["375","Absol",15,-1,1,1,2,1,0,0,0],["376","Wynaut",10,-1,1,1,1,1,0,0,0],["377","Wobbuffet",10,-1,1,1,1,1,0,0,0],["378","Snorunt",5,-1,1,1,1,1,0,0,0],["379","Glalie",5,-1,0,0,2,1,0,0,0],["380","Froslass",5,13,0,0,1,0,0,0,0],["381","Spheal",5,2,1,1,1,1,0,0,0],["382","Sealeo",5,2,0,0,1,1,0,0,0],["383","Walrein",5,2,0,0,1,0,0,0,0],["384","Clamperl",2,-1,1,1,1,1,0,0,0],["385","Huntail",2,-1,0,0,1,0,0,0,0],["386","Gorebyss",2,-1,0,0,1,1,0,0,0],["387","Relicanth",2,12,1,1,1,1,0,0,0],["388","Luvdisc",2,-1,1,1,1,1,0,0,0],["389","Bagon",14,-1,1,1,1,1,0,0,0],["390","Shelgon",14,-1,0,0,1,1,0,0,0],["391","Salamence",14,9,0,0,2,0,0,0,0],["392","Beldum",16,10,1,1,1,1,0,0,0],["393","Metang",16,10,0,0,1,1,0,0,0],["394","Metagross",16,10,0,0,2,0,0,0,0],["395","Regirock",12,-1,1,0,1,0,0,0,0],["396","Regice",5,-1,1,0,1,0,0,0,0],["397","Registeel",16,-1,1,0,1,0,0,0,0],["398","Latias",14,10,1,0,2,0,0,0,0],["399","Latios",14,10,1,0,2,0,0,0,0],["400","Kyogre",2,-1,1,0,2,0,0,0,0],["401","Groudon",8,-1,1,0,2,0,0,0,0],["402","Rayquaza",14,9,1,0,2,1,0,0,0],["403","Jirachi",16,10,1,0,1,1,0,0,0],["404","Deoxys",10,-1,1,0,4,0,0,0,0]],"4":[["405","Turtwig",4,-1,1,1,1,1,0,0,0],["406","Grotle",4,-1,0,0,1,1,0,0,0],["407","Torterra",4,8,0,0,1,0,0,0,0],["408","Chimchar",1,-1,1,1,1,1,0,0,0],["409","Monferno",1,6,0,0,1,1,0,0,0],["410","Infernape",1,6,0,0,1,1,0,0,0],["411","Piplup",2,-1,1,1,1,1,0,0,0],["412","Prinplup",2,-1,0,0,1,0,0,0,0],["413","Empoleon",2,16,0,0,1,0,0,0,0],["414","Starly",0,9,1,1,1,1,0,0,0],["415","Staravia",0,9,0,0,1,1,0,0,0],["416","Staraptor",0,9,0,0,1,1,0,0,0],["417","Bidoof",0,-1,1,1,1,1,0,0,0],["418","Bibarel",0,2,0,0,1,1,0,0,0],["419","Kricketot",11,-1,1,1,1,1,0,0,0],["420","Kricketune",11,-1,0,0,1,1,0,0,0],["421","Shinx",3,-1,1,1,1,1,0,0,0],["422","Luxio",3,-1,0,0,1,1,0,0,0],["423","Luxray",3,-1,0,0,1,1,0,0,0],["424","Budew",4,7,1,1,1,1,0,0,0],["425","Roselia",4,7,1,1,1,1,0,0,0],["426","Roserade",4,7,0,0,1,0,0,0,0],["427","Cranidos",12,-1,1,1,1,1,0,0,0],["428","Rampardos",12,-1,0,0,1,1,0,0,0],["429","Shieldon",12,16,1,1,1,1,0,0,0],["430","Bastiodon",12,16,0,0,1,0,0,0,0],["431","Burmy",11,-1,1,1,3,1,0,0,0],["432","Wormadam",11,4,0,0,3,0,0,0,0],["433","Mothim",11,9,0,0,1,1,0,0,0],["434","Combee",11,9,1,1,1,1,0,0,0],["435","Vespiquen",11,9,0,0,1,0,0,0,0],["436","Pachirisu",3,-1,1,1,1,1,0,0,0],["437","Buizel",2,-1,1,1,1,1,0,0,0],["438","Floatzel",2,-1,0,0,1,1,0,0,0],["439","Cherubi",4,-1,1,1,1,1,0,0,0],["440","Cherrim",4,-1,0,0,2,1,0,0,0],["441","Shellos",2,-1,1,1,2,2,0,0,0],["442","Gastrodon",2,8,0,0,2,1,0,0,0],["443","Drifloon",13,9,1,1,1,1,0,0,0],["444","Drifblim",13,9,0,0,1,1,0,0,0],["445","Buneary",0,-1,1,1,1,1,0,0,0],["446","Lopunny",0,-1,0,0,2,1,0,0,0],["447","Glameow",0,-1,1,1,1,1,0,0,0],["448","Purugly",0,-1,0,0,1,0,0,0,0],["449","Stunky",7,15,1,1,1,1,0,0,0],["450","Skuntank",7,15,0,0,1,1,0,0,0],["451","Bronzor",16,10,1,1,1,1,0,0,0],["452","Bronzong",16,10,0,0,1,1,0,0,0],["453","Happiny",0,-1,1,1,1,1,0,0,0],["454","Chansey",0,-1,1,1,1,1,0,0,0],["455","Blissey",0,-1,0,0,1,0,0,0,0],["456","Chatot",0,9,1,1,1,1,0,0,0],["457","Spiritomb",13,15,1,1,1,1,0,0,0],["458","Gible",14,8,1,1,1,1,0,0,0],["459","Gabite",14,8,0,0,1,1,0,0,0],["460","Garchomp",14,8,0,0,2,1,0,0,0],["461","Riolu",6,-1,1,1,1,1,0,0,0],["462","Lucario",6,16,0,0,2,1,0,0,0],["463","Hippopotas",8,-1,1,1,1,1,0,0,0],["464","Hippowdon",8,-1,0,0,1,1,0,0,0],["465","Skorupi",7,11,1,1,1,1,0,0,0],["466","Drapion",7,15,0,0,1,0,0,0,0],["467","Croagunk",7,6,1,1,1,1,0,0,0],["468","Toxicroak",7,6,0,0,1,1,0,0,0],["469","Carnivine",4,-1,1,1,1,1,0,0,0],["470","Finneon",2,-1,1,1,1,1,0,0,0],["471","Lumineon",2,-1,0,0,1,0,0,0,0],["472","Mantyke",2,9,1,1,1,1,0,0,0],["473","Mantine",2,9,1,1,1,1,0,0,0],["474","Snover",5,4,1,1,1,1,0,0,0],["475","Abomasnow",5,4,0,0,2,0,0,0,0],["476","Porygon",0,-1,1,1,1,1,0,0,0],["477","Porygon2",0,-1,0,0,1,1,0,0,0],["478","Porygon-Z",0,-1,0,0,1,0,0,0,0],["479","Rotom",3,13,1,1,6,1,0,0,0],["480","Uxie",10,-1,1,0,1,0,0,0,0],["481","Mesprit",10,-1,1,0,1,0,0,0,0],["482","Azelf",10,-1,1,0,1,0,0,0,0],["483","Dialga",16,14,1,0,1,0,0,0,0],["484","Palkia",2,14,1,0,1,0,0,0,0],["485","Heatran",1,16,1,0,1,0,0,0,0],["486","Regigigas",0,-1,1,0,1,0,0,0,0],["487","Giratina",13,14,1,0,2,0,0,0,0],["488","Cresselia",10,-1,1,0,1,0,0,0,0],["489","Phione",2,-1,1,1,1,1,0,0,0],["490","Manaphy",2,-1,1,0,1,0,0,0,0],["491","Darkrai",15,-1,1,0,1,0,0,0,0],["492","Shaymin",4,-1,1,0,2,0,0,0,0],["493","Arceus",0,-1,1,0,18,0,0,0,0]],"5":[["494","Victini",10,1,1,0,1,0,0,0,0],["495","Snivy",4,-1,1,1,1,1,0,0,0],["496","Servine",4,-1,0,0,1,0,0,0,0],["497","Serperior",4,-1,0,0,1,1,0,0,0],["498","Tepig",1,-1,1,1,1,1,0,0,0],["499","Pignite",1,6,0,0,1,1,0,0,0],["500","Emboar",1,6,0,0,1,1,0,0,0],["501","Oshawott",2,-1,1,1,1,1,0,0,0],["502","Dewott",2,-1,0,0,1,1,0,0,0],["503","Samurott",2,-1,0,0,1,1,0,0,0],["504","Patrat",0,-1,1,1,1,1,0,0,0],["505","Watchog",0,-1,0,0,1,1,0,0,0],["506","Lillipup",0,-1,1,1,1,1,0,0,0],["507","Herdier",0,-1,0,0,1,1,0,0,0],["508","Stoutland",0,-1,0,0,1,1,0,0,0],["509","Purrloin",15,-1,1,1,1,1,0,0,0],["510","Liepard",15,-1,0,0,1,1,0,0,0],["511","Pansage",4,-1,1,1,1,1,0,0,0],["512","Simisage",4,-1,0,0,1,0,0,0,0],["513","Pansear",1,-1,1,1,1,1,0,0,0],["514","Simisear",1,-1,0,0,1,0,0,0,0],["515","Panpour",2,-1,1,1,1,1,0,0,0],["516","Simipour",2,-1,0,0,1,0,0,0,0],["517","Munna",10,-1,1,1,1,1,0,0,0],["518","Musharna",10,-1,0,0,1,1,0,0,0],["519","Pidove",0,9,1,1,1,1,0,0,0],["520","Tranquill",0,9,0,0,1,1,0,0,0],["521","Unfezant",0,9,0,0,1,0,0,0,0],["522","Blitzle",3,-1,1,1,1,1,0,0,0],["523","Zebstrika",3,-1,0,0,1,1,0,0,0],["524","Roggenrola",12,-1,1,1,1,1,0,0,0],["525","Boldore",12,-1,0,0,1,1,0,0,0],["526","Gigalith",12,-1,0,0,1,1,0,0,0],["527","Woobat",10,9,1,1,1,1,0,0,0],["528","Swoobat",10,9,0,0,1,1,0,0,0],["529","Drilbur",8,-1,1,1,1,1,0,0,0],["530","Excadrill",8,16,0,0,1,1,0,0,0],["531","Audino",0,-1,1,1,2,1,0,0,0],["532","Timburr",6,-1,1,1,1,1,0,0,0],["533","Gurdurr",6,-1,0,0,1,0,0,0,0],["534","Conkeldurr",6,-1,0,0,1,0,0,0,0],["535","Tympole",2,-1,1,1,1,1,0,0,0],["536","Palpitoad",2,8,0,0,1,0,0,0,0],["537","Seismitoad",2,8,0,0,1,0,0,0,0],["538","Throh",6,-1,1,1,1,1,0,0,0],["539","Sawk",6,-1,1,1,1,1,0,0,0],["540","Sewaddle",11,4,1,1,1,1,0,0,0],["541","Swadloon",11,4,0,0,1,1,0,0,0],["542","Leavanny",11,4,0,0,1,0,0,0,0],["543","Venipede",11,7,1,1,1,1,0,0,0],["544","Whirlipede",11,7,0,0,1,1,0,0,0],["545","Scolipede",11,7,0,0,1,1,0,0,0],["546","Cottonee",4,17,1,1,1,1,0,0,0],["547","Whimsicott",4,17,0,0,1,0,0,0,0],["548","Petilil",4,-1,1,1,1,1,0,0,0],["549","Lilligant",4,-1,0,0,1,1,0,0,0],["550","Basculin",2,-1,1,1,2,1,0,0,0],["551","Sandile",8,15,1,1,1,1,0,0,0],["552","Krokorok",8,15,0,0,1,1,0,0,0],["553","Krookodile",8,15,0,0,1,0,0,0,0],["554","Darumaka",1,-1,1,1,1,1,0,0,0],["555","Darmanitan",1,-1,0,0,2,1,0,0,0],["556","Maractus",4,-1,1,1,1,1,0,0,0],["557","Dwebble",11,12,1,1,1,1,0,0,0],["558","Crustle",11,12,0,0,1,0,0,0,0],["559","Scraggy",15,6,1,1,1,1,0,0,0],["560","Scrafty",15,6,0,0,1,0,0,0,0],["561","Sigilyph",10,9,1,1,1,1,0,0,0],["562","Yamask",13,-1,1,1,1,1,0,0,0],["563","Cofagrigus",13,-1,0,0,1,0,0,0,0],["564","Tirtouga",2,12,1,1,1,1,0,0,0],["565","Carracosta",2,12,0,0,1,0,0,0,0],["566","Archen",12,9,1,1,1,1,0,0,0],["567","Archeops",12,9,0,0,1,0,0,0,0],["568","Trubbish",7,-1,1,1,1,1,0,0,0],["569","Garbodor",7,-1,0,0,1,1,0,0,0],["570","Zorua",15,-1,1,1,1,1,0,0,0],["571","Zoroark",15,-1,0,0,1,1,0,0,0],["572","Minccino",0,-1,1,1,1,1,0,0,0],["573","Cinccino",0,-1,0,0,1,1,0,0,0],["574","Gothita",10,-1,1,1,1,1,0,0,0],["575","Gothorita",10,-1,0,0,1,1,0,0,0],["576","Gothitelle",10,-1,0,0,1,0,0,0,0],["577","Solosis",10,-1,1,1,1,1,0,0,0],["578","Duosion",10,-1,0,0,1,1,0,0,0],["579","Reuniclus",10,-1,0,0,1,1,0,0,0],["580","Ducklett",2,9,1,1,1,1,0,0,0],["581","Swanna",2,9,0,0,1,0,0,0,0],["582","Vanillite",5,-1,1,1,1,1,0,0,0],["583","Vanillish",5,-1,0,0,1,0,0,0,0],["584","Vanilluxe",5,-1,0,0,1,0,0,0,0],["585","Deerling",0,4,1,1,1,1,0,0,0],["586","Sawsbuck",0,4,0,0,1,1,0,0,0],["587","Emolga",3,9,1,1,1,1,0,0,0],["588","Karrablast",11,-1,1,1,1,1,0,0,0],["589","Escavalier",11,16,0,0,1,0,0,0,0],["590","Foongus",4,7,1,1,1,1,0,0,0],["591","Amoonguss",4,7,0,0,1,1,0,0,0],["592","Frillish",2,13,1,1,1,1,0,0,0],["593","Jellicent",2,13,0,0,1,0,0,0,0],["594","Alomomola",2,-1,1,1,1,1,0,0,0],["595","Joltik",11,3,1,1,1,1,0,0,0],["596","Galvantula",11,3,0,0,1,1,0,0,0],["597","Ferroseed",4,16,1,1,1,1,0,0,0],["598","Ferrothorn",4,16,0,0,1,0,0,0,0],["599","Klink",16,-1,1,1,1,1,0,0,0],["600","Klang",16,-1,0,0,1,0,0,0,0],["601","Klinklang",16,-1,0,0,1,0,0,0,0],["602","Tynamo",3,-1,1,1,1,1,0,0,0],["603","Eelektrik",3,-1,0,0,1,1,0,0,0],["604","Eelektross",3,-1,0,0,1,1,0,0,0],["605","Elgyem",10,-1,1,1,1,1,0,0,0],["606","Beheeyem",10,-1,0,0,1,0,0,0,0],["607","Litwick",13,1,1,1,1,1,0,0,0],["608","Lampent",13,1,0,0,1,0,0,0,0],["609","Chandelure",13,1,0,0,1,0,0,0,0],["610","Axew",14,-1,1,1,1,1,0,0,0],["611","Fraxure",14,-1,0,0,1,0,0,0,0],["612","Haxorus",14,-1,0,0,1,0,0,0,0],["613","Cubchoo",5,-1,1,1,1,1,0,0,0],["614","Beartic",5,-1,0,0,1,0,0,0,0],["615","Cryogonal",5,-1,1,1,1,1,0,0,0],["616","Shelmet",11,-1,1,1,1,1,0,0,0],["617","Accelgor",11,-1,0,0,1,0,0,0,0],["618","Stunfisk",8,3,1,1,1,1,0,0,0],["619","Mienfoo",6,-1,1,1,1,1,0,0,0],["620","Mienshao",6,-1,0,0,1,0,0,0,0],["621","Druddigon",14,-1,1,1,1,1,0,0,0],["622","Golett",8,13,1,1,1,1,0,0,0],["623","Golurk",8,13,0,0,1,0,0,0,0],["624","Pawniard",15,16,1,1,1,1,0,0,0],["625","Bisharp",15,16,0,0,1,0,0,0,0],["626","Bouffalant",0,-1,1,1,1,1,0,0,0],["627","Rufflet",0,9,1,1,1,1,0,0,0],["628","Braviary",0,9,0,0,1,1,0,0,0],["629","Vullaby",15,9,1,1,1,1,0,0,0],["630","Mandibuzz",15,9,0,0,1,0,0,0,0],["631","Heatmor",1,-1,1,1,1,1,0,0,0],["632","Durant",11,16,1,1,1,1,0,0,0],["633","Deino",15,14,1,1,1,1,0,0,0],["634","Zweilous",15,14,0,0,1,0,0,0,0],["635","Hydreigon",15,14,0,0,1,0,0,0,0],["636","Larvesta",11,1,1,1,1,1,0,0,0],["637","Volcarona",11,1,0,0,1,0,0,0,0],["638","Cobalion",16,6,1,0,1,0,0,0,0],["639","Terrakion",12,6,1,0,1,0,0,0,0],["640","Virizion",4,6,1,0,1,0,0,0,0],["641","Tornadus",9,-1,1,0,2,0,0,0,0],["642","Thundurus",3,9,1,0,2,0,0,0,0],["643","Reshiram",14,1,1,0,1,0,0,0,0],["644","Zekrom",14,3,1,0,1,0,0,0,0],["645","Landorus",8,9,1,0,2,0,0,0,0],["646","Kyurem",14,5,1,0,3,0,0,0,0],["647","Keldeo",2,6,1,0,2,0,0,0,0],["648","Meloetta",0,10,1,0,2,0,0,0,0],["649","Genesect",11,16,1,0,5,0,0,0,0]],"6":[["650","Chespin",4,-1,1,1,1,1,0,0,0],["651","Quilladin",4,-1,0,0,1,0,0,0,0],["652","Chesnaught",4,6,0,0,1,0,0,0,0],["653","Fennekin",1,-1,1,1,1,1,0,0,0],["654","Braixen",1,-1,0,0,1,1,0,0,0],["655","Delphox",1,10,0,0,1,0,0,0,0],["656","Froakie",2,-1,1,1,1,1,0,0,0],["657","Frogadier",2,-1,0,0,1,1,0,0,0],["658","Greninja",2,15,0,0,1,0,0,0,0],["659","Bunnelby",0,-1,1,1,1,1,0,0,0],["660","Diggersby",0,8,0,0,1,1,0,0,0],["661","Fletchling",0,9,1,1,1,1,0,0,0],["662","Fletchinder",1,9,0,0,1,1,0,0,0],["663","Talonflame",1,9,0,0,1,1,0,0,0],["664","Scatterbug",11,-1,1,1,1,1,1,0,0],["665","Spewpa",11,-1,0,0,1,1,1,0,0],["666","Vivillon",11,9,0,0,1,1,0,0,0],["667","Litleo",1,0,1,1,1,1,0,0,0],["668","Pyroar",1,0,0,0,1,1,0,0,0],["669","Flab\u00e9b\u00e9",17,-1,1,1,1,1,0,0,0],["670","Floette",17,-1,0,0,1,1,0,0,0],["671","Florges",17,-1,0,0,1,1,0,0,0],["672","Skiddo",4,-1,1,1,1,1,0,0,0],["673","Gogoat",4,-1,0,0,1,1,0,0,0],["674","Pancham",6,-1,1,1,1,1,0,0,0],["675","Pangoro",6,15,0,0,1,0,0,0,0],["676","Furfrou",0,-1,1,1,1,1,0,0,0],["677","Espurr",10,-1,1,1,1,1,0,0,0],["678","Meowstic",10,-1,0,0,1,1,0,0,0],["679","Honedge",16,13,1,1,1,1,0,0,0],["680","Doublade",16,13,0,0,1,1,0,0,0],["681","Aegislash",16,13,0,0,2,1,0,0,0],["682","Spritzee",17,-1,1,1,1,1,0,0,0],["683","Aromatisse",17,-1,0,0,1,0,0,0,0],["684","Swirlix",17,-1,1,1,1,1,0,0,0],["685","Slurpuff",17,-1,0,0,1,1,0,0,0],["686","Inkay",15,10,1,1,1,1,0,0,0],["687","Malamar",15,10,0,0,1,0,0,0,0],["688","Binacle",12,2,1,1,1,1,0,0,0],["689","Barbaracle",12,2,0,0,1,0,0,0,0],["690","Skrelp",7,2,1,1,1,1,0,0,0],["691","Dragalge",7,14,0,0,1,0,0,0,0],["692","Clauncher",2,-1,1,1,1,1,0,0,0],["693","Clawitzer",2,-1,0,0,1,0,0,0,0],["694","Helioptile",3,0,1,1,1,1,0,0,0],["695","Heliolisk",3,0,0,0,1,0,0,0,0],["696","Tyrunt",12,14,1,1,1,1,0,0,0],["697","Tyrantrum",12,14,0,0,1,0,0,0,0],["698","Amaura",12,5,1,1,1,1,0,0,0],["699","Aurorus",12,5,0,0,1,1,0,0,0],["700","Hawlucha",6,9,1,1,1,1,0,0,0],["701","Dedenne",3,17,1,1,1,1,0,0,0],["702","Carbink",12,17,1,1,1,1,0,0,0],["703","Goomy",14,-1,1,1,1,1,0,0,0],["704","Sliggoo",14,-1,0,0,1,0,0,0,0],["705","Goodra",14,-1,0,0,1,0,0,0,0],["706","Klefki",16,17,1,1,1,1,0,0,0],["707","Phantump",13,4,1,1,1,1,0,0,0],["708","Trevenant",13,4,0,0,1,1,0,0,0],["709","Pumpkaboo",13,4,1,1,4,3,0,0,0],["710","Gourgeist",13,4,0,0,4,3,0,0,0],["711","Bergmite",5,-1,1,1,1,1,0,0,0],["712","Avalugg",5,-1,0,0,1,1,0,0,0],["713","Noibat",9,14,1,1,1,1,0,0,0],["714","Noivern",9,14,0,0,1,1,0,0,0],["715","Xerneas",17,-1,1,0,1,0,0,0,0],["716","Yveltal",15,9,1,0,1,0,0,0,0],["717","Zygarde",14,8,1,0,4,0,0,0,0],["718","Diancie",12,17,1,1,2,1,0,0,0],["719","Hoopa",10,13,1,0,2,0,0,0,0],["720","Volcanion",1,2,1,0,1,0,0,0,0]],"7":[["721","Rowlet",4,9,1,1,1,1,0,0,0],["722","Dartrix",4,9,0,0,1,1,0,0,0],["723","Decidueye",4,13,0,0,1,1,0,0,0],["724","Litten",1,-1,1,1,1,1,0,0,0],["725","Torracat",1,-1,0,0,1,1,0,0,0],["726","Incineroar",1,15,0,0,1,1,0,0,0],["727","Popplio",2,-1,1,1,1,1,0,0,0],["728","Brionne",2,-1,0,0,1,1,0,0,0],["729","Primarina",2,17,0,0,1,1,0,0,0],["730","Pikipek",0,9,1,1,1,1,0,0,0],["731","Trumbeak",0,9,0,0,1,1,0,0,0],["732","Toucannon",0,9,0,0,1,1,0,0,0],["733","Yungoos",0,-1,1,1,1,1,0,0,0],["734","Gumshoos",0,-1,0,0,2,0,0,0,0],["735","Grubbin",11,-1,1,1,1,1,0,0,0],["736","Charjabug",11,3,0,0,1,1,0,0,0],["737","Vikavolt",11,3,0,0,2,1,0,0,0],["738","Crabrawler",6,-1,1,1,1,1,0,0,0],["739","Crabominable",6,5,0,0,1,1,0,0,0],["740","Oricorio",1,9,1,1,4,3,0,0,0],["741","Cutiefly",11,17,1,1,1,1,0,0,0],["742","Ribombee",11,17,0,0,2,1,0,0,0],["743","Rockruff",12,-1,1,1,1,1,0,0,0],["744","Lycanroc",12,-1,0,0,3,1,0,0,0],["745","Wishiwashi",2,-1,1,1,3,1,0,0,0],["746","Mareanie",7,2,1,1,1,1,0,0,0],["747","Toxapex",7,2,0,0,1,1,0,0,0],["748","Mudbray",8,-1,1,1,1,1,0,0,0],["749","Mudsdale",8,-1,0,0,1,1,0,0,0],["750","Dewpider",2,11,1,1,1,1,0,0,0],["751","Araquanid",2,11,0,0,2,1,0,0,0],["752","Fomantis",4,-1,1,1,1,1,0,0,0],["753","Lurantis",4,-1,0,0,2,0,0,0,0],["754","Morelull",4,17,1,1,1,1,0,0,0],["755","Shiinotic",4,17,0,0,1,1,0,0,0],["756","Salandit",7,1,1,1,1,1,0,0,0],["757","Salazzle",7,1,0,0,2,0,0,0,0],["758","Stufful",0,6,1,1,1,1,0,0,0],["759","Bewear",0,6,0,0,1,1,0,0,0],["760","Bounsweet",4,-1,1,1,1,1,1,0,0],["761","Steenee",4,-1,0,0,1,1,0,0,0],["762","Tsareena",4,-1,0,0,1,0,0,0,0],["763","Comfey",17,-1,1,1,1,1,0,0,0],["764","Oranguru",0,10,1,1,1,1,0,0,0],["765","Passimian",6,-1,1,1,1,1,0,0,0],["766","Wimpod",11,2,1,1,1,1,0,0,0],["767","Golisopod",11,2,0,0,1,1,0,0,0],["768","Sandygast",13,8,1,1,1,1,0,0,0],["769","Palossand",13,8,0,0,1,0,0,0,0],["770","Pyukumuku",2,-1,1,1,1,1,0,0,0],["771","Type: Null",0,-1,1,0,1,0,0,0,0],["772","Silvally",0,-1,0,0,18,0,0,0,0],["773","Minior",12,9,1,1,2,1,0,0,0],["774","Komala",0,-1,1,1,1,1,0,0,0],["775","Turtonator",1,14,1,1,1,1,0,0,0],["776","Togedemaru",3,16,1,1,2,1,0,0,0],["777","Mimikyu",13,17,1,1,2,1,0,0,0],["778","Bruxish",2,10,1,1,1,1,0,0,0],["779","Drampa",0,14,1,1,1,1,0,0,0],["780","Dhelmise",13,4,1,1,1,1,0,0,0],["781","Jangmo-o",14,-1,1,1,1,1,0,0,0],["782","Hakamo-o",14,6,0,0,1,0,0,0,0],["783","Kommo-o",14,6,0,0,2,0,0,0,0],["784","Tapu Koko",3,17,1,0,1,0,0,0,0],["785","Tapu Lele",10,17,1,0,1,0,0,0,0],["786","Tapu Bulu",4,17,1,0,1,0,0,0,0],["787","Tapu Fini",2,17,1,0,1,0,0,0,0],["788","Cosmog",10,-1,1,0,1,0,0,0,0],["789","Cosmoem",10,-1,0,0,1,0,0,0,0],["790","Solgaleo",10,16,0,0,1,0,0,0,0],["791","Lunala",10,13,0,0,1,0,0,0,0],["792","Nihilego",12,7,1,0,1,0,0,0,0],["793","Buzzwole",11,6,1,0,1,0,0,0,0],["794","Pheromosa",11,6,1,0,1,0,0,0,0],["795","Xurkitree",3,-1,1,0,1,0,0,0,0],["796","Celesteela",16,9,1,0,1,0,0,0,0],["797","Kartana",4,16,1,0,1,0,0,0,0],["798","Guzzlord",15,14,1,0,1,0,0,0,0],["799","Poipole",7,-1,1,0,1,0,0,0,0],["800","Naganadel",7,14,0,0,1,0,0,0,0],["801","Stakataka",12,16,1,0,1,0,0,0,0],["802","Blacephalon",1,13,1,0,1,0,0,0,0],["803","Necrozma",10,-1,1,0,4,0,0,0,0],["804","Magearna",16,17,1,0,1,0,0,0,0],["805","Marshadow",6,13,1,0,1,0,0,0,0],["806","Zeraora",3,-1,1,0,1,0,0,0,0]],"97":[["000a1","Lunupine",15,-1,1,1,1,1,0,0,0],["000","????????",15,17,0,0,1,0,0,0,0],["000","???????",2,-1,1,0,1,0,0,0,0],["000","???????",2,-1,0,0,1,0,0,0,0],["000a4","Orkit",2,-1,1,0,1,1,0,0,0],["000a6","Orcalot",2,16,0,0,1,1,0,0,0],["000","????????",17,9,1,0,1,0,0,0,0],["000","??????????",17,9,0,0,1,0,0,0,0],["000","?????????",17,9,0,0,1,0,0,0,0],["000","??????",7,17,1,0,1,0,0,0,0],["000","???????????",7,17,0,0,1,0,0,0,0],["000","??????",0,9,1,0,1,0,0,0,0],["000","????????",10,9,0,0,1,0,0,0,0],["000ae","Impyre",15,-1,1,0,1,1,0,0,0],["000","?????????",15,1,0,0,1,0,0,0,0],["000","???????",14,2,1,0,1,0,0,0,0],["000ah","Solynx",1,-1,1,1,1,1,0,0,0],["000","??????",1,3,0,0,1,0,0,0,0],["000","?????",5,-1,1,0,1,0,0,0,0],["000","?????",5,-1,0,0,1,0,0,0,0],["000ak","Boxaby",12,6,1,0,1,1,0,0,0],["000","????????",12,6,0,0,1,0,0,0,0],["000","???????",5,17,1,0,1,0,0,0,0],["000","???????",5,17,0,0,1,0,0,0,0],["000","????????",4,-1,1,0,1,0,0,0,0],["000","????????",4,-1,0,0,1,0,0,0,0],["000","?????????",4,6,0,0,1,0,0,0,0],["000","???????",1,9,1,0,1,0,0,0,0],["000","????????",1,17,0,0,1,0,0,0,0],["000","??????????",1,17,0,0,1,0,0,0,0],["000","???????",2,-1,1,0,1,0,0,0,0],["000","????????",2,-1,0,0,1,0,0,0,0],["000","??????????",2,16,0,0,1,0,0,0,0],["000","??????",13,14,1,0,1,0,0,0,0],["000","???????",13,14,0,0,1,0,0,0,0],["000","????????",13,14,0,0,1,0,0,0,0],["000","????????",15,1,1,0,1,0,0,0,0],["000","??????",4,9,1,0,1,0,0,0,0],["000","??????",4,9,0,0,1,0,0,0,0],["000","??????",4,10,0,0,1,0,0,0,0],["000","????????",8,-1,1,0,1,0,0,0,0],["000","????????",8,11,0,0,1,0,0,0,0],["000","??????????",3,9,1,0,1,0,0,0,0],["000","??????????",3,9,0,0,1,0,0,0,0],["000","???????",12,17,1,0,1,0,0,0,0],["000","?????????",10,-1,1,0,1,0,0,0,0],["000","?????????",10,13,0,0,1,0,0,0,0],["000","???????",12,13,1,0,1,0,0,0,0],["000","?????????",0,15,1,0,1,0,0,0,0],["000","???????",11,-1,1,0,1,0,0,0,0],["000","??????????",11,-1,0,0,1,0,0,0,0],["000","??????????",11,-1,0,0,1,0,0,0,0],["000","???????",0,-1,1,0,1,0,0,0,0],["000bh","Glaquine",5,-1,1,0,1,1,0,0,0],["000","?????????",5,-1,0,0,1,0,0,0,0],["000","????????",16,-1,1,0,1,0,0,0,0],["000","????????",16,-1,0,0,1,0,0,0,0],["000","????????",16,-1,0,0,1,0,0,0,0],["000","???????",8,-1,1,0,1,0,0,0,0],["000","???????",8,-1,0,0,1,0,0,0,0],["000","????????",2,15,1,0,1,0,0,0,0],["000","?????????",2,15,0,0,1,0,0,0,0],["000","?????????",2,15,0,0,1,0,0,0,0],["000","??????",0,10,1,0,1,0,0,0,0],["000","?????????",0,13,0,0,1,0,0,0,0],["000","???????",2,13,1,0,1,0,0,0,0],["000","??????????",2,13,0,0,1,0,0,0,0],["000","????????????",11,-1,1,0,1,0,0,0,0],["000","??????????",11,-1,0,0,1,0,0,0,0],["000","???????????",11,10,0,0,1,0,0,0,0],["000","???????",11,7,1,0,1,0,0,0,0],["000","???????",10,17,1,0,1,0,0,0,0],["000","???????",10,17,0,0,1,0,0,0,0],["000","??????",8,-1,1,0,1,0,0,0,0],["000","???????",8,6,0,0,1,0,0,0,0],["000","?????????",8,6,0,0,1,0,0,0,0],["000","?????????",12,-1,1,0,1,0,0,0,0],["000","???????",12,14,0,0,1,0,0,0,0],["000","?????????",12,14,0,0,1,0,0,0,0],["000","?????????",12,7,0,0,1,0,0,0,0],["000","????????",12,7,0,0,1,0,0,0,0],["000","???????",4,17,1,0,1,0,0,0,0],["000","???????",4,17,0,0,1,0,0,0,0],["000","??????",7,0,1,0,1,0,0,0,0],["000","???????",7,0,0,0,1,0,0,0,0],["000","??????",4,-1,1,0,1,0,0,0,0],["000","????????",4,15,0,0,1,0,0,0,0],["000","???????",5,12,1,0,1,0,0,0,0],["000","????????",5,12,0,0,1,0,0,0,0]],"98":[["012-Q","Butterfree/Mega Forme Q",11,10,0,0,1,0,0,0,0],["024-Q","Arbok/Mega Forme Q",7,15,0,0,1,0,0,0,0],["027-Q","Raichu/Mega Forme Q",3,6,0,0,1,0,0,0,0],["039-Q","Ninetales/Mega Forme Q",1,10,0,0,1,0,0,0,0],["057-Q","Persian/Mega Forme Q",0,13,0,0,1,0,0,0,0],["063-Q","Arcanine/Mega Forme Q",1,14,0,0,1,0,0,0,0],["083-Q","Rapidash/Mega Forme Q",1,9,0,0,1,0,0,0,0],["090-Q","Farfetch"d/Mega Forme Q",0,9,0,0,1,0,0,0,0],["094-Q","Dewgong/Mega Forme Q",2,5,0,0,1,0,0,0,0],["113-Q","Marowak/Alolan Mega Forme Q",1,13,0,0,1,0,0,0,0],["136-Q","Jynx/Mega Forme Q",5,10,0,0,1,0,0,0,0],["141-Q","Lapras/Mega Forme Q",2,5,0,0,1,0,0,0,0],["144-Q","Vaporeon/Mega Forme Q",2,-1,0,0,1,0,0,0,0],["145-Q","Jolteon/Mega Forme Q",3,-1,0,0,1,0,0,0,0],["146-Q","Flareon/Mega Forme Q",1,-1,0,0,1,0,0,0,0],["147-Q","Espeon/Mega Forme Q",10,-1,0,0,1,0,0,0,0],["148-Q","Umbreon/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["149-Q","Leafeon/Mega Forme Q",4,-1,0,0,1,0,0,0,0],["150-Q","Glaceon/Mega Forme Q",5,-1,0,0,1,0,0,0,0],["151-Q","Sylveon/Mega Forme Q",17,-1,0,0,1,0,0,0,0],["164-Q","Dragonite/Mega Forme Q",14,9,0,0,1,0,0,0,0],["166-Q","Mew/Mega Forme Q",10,-1,0,0,1,0,0,0,0],["177-Q","Furret/Mega Forme Q",0,14,0,0,1,0,0,0,0],["201-Q","Jumpluff/Mega Forme Q",4,17,0,0,1,0,0,0,0],["215-Q","Girafarig/Mega Forme Q",0,10,0,0,1,1,0,0,0],["218-Q","Dunsparce/Mega Forme Q",0,14,0,0,1,0,0,0,0],["227-Q","Weavile/Mega Forme Q",15,5,0,0,1,0,0,0,0],["239-Q","Skarmory/Mega Forme Q",16,14,0,0,1,0,0,0,0],["263-Q","Lugia/Mega Forme Q",10,9,0,0,1,0,0,0,0],["264-Q","Ho-oh/Mega Forme Q",1,9,0,0,1,0,0,0,0],["276-Q","Mightyena/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["301-Q","Breloom/Mega Forme Q",4,6,0,0,1,0,0,0,0],["325-Q","Manectric/Mega Forme Q",3,1,0,0,1,0,0,0,0],["335-Q","Wailord/Mega Forme Q",2,9,0,0,1,0,0,0,0],["344-Q","Flygon/Mega Forme Q",8,14,0,0,1,0,0,0,0],["349-Q","Zangoose/Mega Forme Q",0,15,0,0,1,0,0,0,0],["350-Q","Seviper/Mega Forme Q",7,2,0,0,1,0,0,0,0],["364-Q","Milotic/Mega Forme Q",2,17,0,0,1,0,0,0,0],["380-Q","Froslass/Mega Forme Q",5,13,0,0,1,0,0,0,0],["403-Q","Jirachi/Mega Forme Q",16,10,0,0,1,0,0,0,0],["423-Q","Luxray/Mega Forme Q",3,15,0,0,1,0,0,0,0],["438-Q","Floatzel/Mega Forme Q",2,-1,0,0,1,0,0,0,0],["487-Q","Giratina/Mega Forme Q",13,14,0,0,1,0,0,0,0],["510-Q","Liepard/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["571-Q","Zoroark/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["612-Q","Haxorus/Mega Forme Q",14,16,0,0,1,0,0,0,0],["621-Q","Druddigon/Mega Forme Q",14,12,0,0,1,0,0,0,0],["668-Q","Pyroar/Mega Forme Q",1,0,0,0,1,1,0,0,0],["673-Q","Gogoat/Mega Forme Q",4,-1,0,0,1,0,0,0,0],["695-Q","Heliolisk/Mega Forme Q",3,1,0,0,1,0,0,0,0],["700-Q","Hawlucha/Mega Forme Q",6,9,0,0,1,0,0,0,0],["714-Q","Noivern/Mega Forme Q",9,14,0,0,1,0,0,0,0]],"99":[["019s1","Saiyan Rattata",0,6,1,0,1,0,0,0,0],["019s2","Super-Saiyan Rattata",0,6,0,0,1,0,0,0,0],["020s1","Super-Saiyan Raticate",0,6,0,0,1,0,0,0,0],["020s2","Super-Saiyan 2 Raticate",0,6,0,0,1,0,0,0,0],["020-S","Super-Saiyan 3 Raticate",0,6,0,0,1,0,0,0,0],["020-T","Super-Saiyan 4 Raticate",0,6,0,0,1,0,0,0,0],["025f","Flying Pichu",3,-1,1,0,1,0,0,0,0],["025s","Surfing Pichu",3,-1,1,0,1,0,0,0,0],["026f","Flying Pikachu",3,-1,0,0,1,0,0,0,0],["026s","Surfing Pikachu",3,-1,0,0,1,0,0,0,0],["026w","Snowboarding Pikachu",3,-1,0,0,1,0,0,0,0],["027f","Flying Raichu",3,9,0,0,1,0,0,0,0],["027s","Surfing Raichu",3,2,0,0,1,0,0,0,0],["027w","Snowboarding Raichu",3,5,0,0,1,0,0,0,0],["035s","Shooting Star Cleffa",17,-1,1,0,1,1,0,0,0],["036s","Shooting Star Clefairy",17,-1,0,0,1,0,0,0,0],["037s","Shooting Star Clefable",17,-1,0,0,1,0,0,0,0],["038a","Koroku",1,5,1,0,1,0,0,0,0],["039-A","Kyukori",1,5,0,0,1,0,0,0,0],["040g","Guild Igglybuff",0,17,1,0,1,0,0,0,0],["041g","Guild Jigglypuff",0,17,0,0,1,0,0,0,0],["042g","Guild Wigglytuff",0,17,0,0,1,0,0,0,0],["062x","Apocalyptic Growlithe",1,-1,1,0,1,1,0,0,0],["063x","Apocalyptic Arcanine",1,1,0,0,1,0,0,0,0],["084s","Snowpoke",5,10,1,0,1,0,0,0,0],["085s","Snowbro",5,10,0,0,1,0,0,0,0],["086s","Snowking",5,10,0,0,1,0,0,0,0],["108ds","Death Star Voltorb",3,-1,1,0,1,0,0,0,0],["109ds","Death Star Electrode",3,-1,0,0,1,0,0,0,0],["189e","Early Bird Natu",10,9,1,0,1,0,0,0,0],["190e","Early Bird Xatu",10,9,0,0,1,0,0,0,0],["219v","Gligar/Vampire",8,9,1,0,1,0,0,0,0],["220v","Gliscor/Vampire",8,9,0,0,1,0,0,0,0],["230bm","Blue Moon Slugma",2,-1,1,0,1,0,0,0,0],["231bm","Blue Moon Magcargo",2,12,0,0,1,0,0,0,0],["240i","Frosdour",15,5,1,0,1,0,0,0,0],["241i","Chilldoom",15,5,0,0,1,0,0,0,0],["263xd","XD001",10,9,1,0,1,0,0,0,0],["275x","Apocalyptic Poochyena",15,13,1,0,1,1,0,0,0],["276x","Apocalyptic Mightyena",15,13,0,0,1,0,0,0,0],["300x","Apocalyptic Shroomish",4,7,1,0,1,0,0,0,0],["301x","Apocalyptic Breloom",4,7,0,0,1,0,0,0,0],["402m","Magquaza",14,13,1,0,1,0,0,0,0],["405s","Seasonal Turtwig",4,-1,1,0,1,0,0,0,0],["406s","Seasonal Grotle",4,-1,0,0,1,0,0,0,0],["407s","Seasonal Torterra",4,-1,0,0,1,0,0,0,0],["421f","Shinxel",3,2,1,0,1,0,0,0,0],["422f","Fluxio",3,2,0,0,1,0,0,0,0],["423f","Fluxray",3,2,0,0,1,0,0,0,0],["423-F","Fluxray/Mega Forme Q",3,2,0,0,1,0,0,0,0],["434s","Snow Combee",11,5,1,0,1,0,0,0,0],["435s","Snow Vespiquen",11,5,0,0,1,0,0,0,0],["483p","Dialga/Primal Forme Q",16,14,0,0,1,0,0,0,0],["484p","Palkia/Primal Forme Q",2,14,0,0,1,0,0,0,0],["509h","Purrloin/Hallowe"en Witch",15,-1,1,0,1,1,0,0,0],["510h","Liepard/Hallowe"en Witch",15,-1,0,0,1,1,0,0,0],["622x","Apocalyptic Golett",12,16,1,0,1,0,0,0,0],["623x","Apocalyptic Golurk",12,16,0,0,1,0,0,0,0],["740q","Oricorio/Pointe Style",4,9,0,0,1,0,0,0,0]]}}',
        TYPE_LIST : ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"],
        NATURE_LIST : ["Lonely", "Mild", "Hasty", "Gentle", "Bold", "Modest", "Timid", "Calm",
            "Impish", "Adamant", "Jolly", "Careful", "Relaxed", "Brave", "Quiet", "Sassy",
            "Lax", "Naughty", "Rash", "Näive", "Hardy", "Docile", "Serious", "Bashful", "Quirky"],
        EGG_GROUP_LIST : ["Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Undiscovered", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon"],
        SHELTER_TYPE_TABLE : [
                "0", "Normal", '<img src="//pfq-static.com/img/types/normal.png/t=1262702646">',
                "1", "Fire", '<img src="//pfq-static.com/img/types/fire.png/t=1262702645">',
                "2", "Water", '<img src="//pfq-static.com/img/types/water.png/t=1262702646">',
                "3", "Electric", '<img src="//pfq-static.com/img/types/electric.png/t=1262702645">',
                "4", "Grass", '<img src="//pfq-static.com/img/types/grass.png/t=1262702645">',
                "5", "Ice", '<img src="//pfq-static.com/img/types/ice.png/t=1262702646">',
                "6", "fighting", '<img src="//pfq-static.com/img/types/fighting.png/t=1262702645">',
                "7", "Poison", '<img src="//pfq-static.com/img/types/poison.png/t=1262702646">',
                "8", "Ground", '<img src="//pfq-static.com/img/types/ground.png/t=1262702646">',
                "9", "Flying", '<img src="//pfq-static.com/img/types/flying.png/t=1262702645">',
                "10", "Psychic", '<img src="//pfq-static.com/img/types/psychic.png/t=1262702646">',
                "11", "Bug", '<img src="//pfq-static.com/img/types/bug.png/t=1262702645">',
                "12", "Rock", '<img src="//pfq-static.com/img/types/rock.png/t=1262702646">',
                "13", "Ghost", '<img src="//pfq-static.com/img/types/ghost.png/t=1262702645">',
                "14", "Dragon", '<img src="//pfq-static.com/img/types/dragon.png/t=1263605747">',
                "15", "Dark", '<img src="//pfq-static.com/img/types/dark.png/t=1262702645">',
                "16", "Steel", '<img src="//pfq-static.com/img/types/steel.png/t=1262702646">',
                "17", "Fairy", '<img src="//pfq-static.com/img/types/fairy.png/t=1374419124">',
            ],
		SHELTER_SEARCH_DATA : [
			"findNewEgg", "Egg", "new egg", '<img src="//pfq-static.com/img/pkmn/egg.png/t=1451852195">',
			"findNewPokemon", "Pokémon", "new Pokémon", '<img src="//pfq-static.com/img/pkmn/pkmn.png/t=1451852507">',
			"findShiny", "[SHINY]", "Shiny", '<img src="//pfq-static.com/img/pkmn/shiny.png/t=1400179603">',
			"findAlbino","[ALBINO]", "Albino", '<img src="//pfq-static.com/img/pkmn/albino.png/t=1414662094">',
			"findMelanistic", "[MELANISTIC]", "Melanistic", '<img src="//pfq-static.com/img/pkmn/melanistic.png/t=1435353274">',
			"findPrehistoric", "[PREHISTORIC]", "Prehistoric", '<img src="//pfq-static.com/img/pkmn/prehistoric.png/t=1465558964">',
			"findDelta", "[DELTA]", "Delta", "Delta", '<img src="//pfq-static.com/img/pkmn/_delta/dark.png/t=1501325214">',
			"findMega", "[MEGA]", "Mega", '<img src="//pfq-static.com/img/pkmn/mega.png/t=1400179603">',
			"findStarter", "[STARTER]", "Starter", '<img src="//pfq-static.com/img/pkmn/starter.png/t=1484919510">',
			"findCustomSprite", "[CUSTOM SPRITE]", "Custom Sprite", '<img src="//pfq-static.com/img/pkmn/cs.png/t=1405806997">',
			"findMale", "[M]", "Male", '<img src="//pfq-static.com/img/pkmn/gender_m.png/t=1401213006">',
			"findFemale", "[F]", "Female", '<img src="//pfq-static.com/img/pkmn/gender_f.png/t=1401213007">',
			"findNoGender", "[N]", "No Gender", '<img src="//pfq-static.com/img/pkmn/gender_n.png/t=1401213004">',
		],
	}
    GLOBALS.TYPE_OPTIONS = Helpers.buildOptionsString(GLOBALS.TYPE_LIST);
	GLOBALS.NATURE_OPTIONS = Helpers.buildOptionsString(GLOBALS.NATURE_LIST);
	GLOBALS.EGG_GROUP_OPTIONS = Helpers.buildOptionsString(GLOBALS.EGG_GROUP_LIST);

    let ShelterPage = (function ShelterPage() {
        const SETTINGS_SAVE_KEY = 'QoLShelter';
        const DEFAULT_SETTINGS = {
            findCustom: "",
            findType: "",
            findTypeEgg: true,
            findTypePokemon: false,
            findNewEgg: true,
            NewEggDuplicate: "",
            findNewPokemon: true,
            findShiny: true,
            findAlbino: true,
            findMelanistic: true,
            findPrehistoric: true,
            findDelta: true,
            findMega: true,
            findStarter: true,
            findCustomSprite: true,
            findMale: true,
            findFemale: true,
            findNoGender: true,
            customEgg: true,
            customPokemon: true,
            customPng: false,
            shelterGrid: true,
        };
        let settings = DEFAULT_SETTINGS;
        let customArray = [];
        let typeArray = [];
        let eggNoDuplicateArray = [];
        let dexData = "";
        const shelterObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                API.customSearch();
            });
        });
        const API = {
            loadSettings() { // initial settings on first run and setting the variable settings key
                settings = Helpers.loadSettings(SETTINGS_SAVE_KEY, DEFAULT_SETTINGS, settings);
            },
            saveSettings() { // Save changed settings
                Helpers.saveSettings(SETTINGS_SAVE_KEY, settings)
            },
            getSettings() {
                return settings;
            },
            populateSettings() {
                for(let key in settings) {
                    if (!settings.hasOwnProperty(key)) {
                        continue;
                    }
                    let value = settings[key];
                    if (typeof value === 'boolean') {
                        Helpers.toggleSetting(key, value, false);
                        continue;
                    }
                }
            },
            settingsChange(element, textElement, customClass, typeClass) {
                console.log('brioche')
                console.log('Before')
                console.log(settings)
                if(JSON.stringify(settings).indexOf(element) >= 0) { // shelter settings
                    console.log(settings[element])
                    if (settings[element] === false ) {
                        settings[element] = true;
                    } else if (settings[element] === true ) {
                        settings[element] = false;
                    } else if (typeof settings[element] === 'string') {
                        if (element === 'findType') {
                            if (textElement === 'none') {
                                let tempIndex = typeClass - 1;
                                typeArray.splice(tempIndex, tempIndex);
                                settings.findType = typeArray.toString();
                            } else {
                                let tempIndex = typeClass - 1;
                                typeArray[tempIndex] = textElement;
                                settings.findType = typeArray.toString();
                            }
                        }
                        if (element === 'findCustom') {
                            let tempIndex = customClass - 1;
                            customArray[tempIndex] = textElement;
                            settings.findCustom = customArray.toString();
                        }
                    }
                    console.log('After')
                    console.log(settings)
                    return true;
                } else { return false; }
            },
            setupHTML() {
                $('.tabbed_interface.horizontal>div').removeClass('tab-active');
                $('.tabbed_interface.horizontal>ul>li').removeClass('tab-active');
                document.querySelector('.tabbed_interface.horizontal>ul').insertAdjacentHTML('afterbegin', '<li class="tab-active"><label>Search</label></li>');
                document.querySelector('.tabbed_interface.horizontal>ul>li').insertAdjacentHTML('afterend', '<li class=""><label>Sort</label></li>');
                document.querySelector('.tabbed_interface.horizontal>ul').insertAdjacentHTML('afterend', TEMPLATES.shelterSettingsHTML);
                document.querySelector('#shelteroptionsqol').insertAdjacentHTML('afterend', '<div id="qolsheltersort"><label><input type="checkbox" class="qolsetting" data-key="shelterGrid"/><span>Sort by Grid</span></label>');
                $('#shelteroptionsqol').addClass('tab-active');

                document.querySelector('#sheltercommands').insertAdjacentHTML('beforebegin', '<div id="sheltersuccess"></div>');

                let theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="findCustom"/></label><input type='button' value='Remove' id='removeShelterTextfield'></div>`;
                customArray = settings.findCustom.split(',');
                let numberOfValue = customArray.length;

                for (let i = 0; i < numberOfValue; i++) {
                    let rightDiv = i + 1;
                    let rightValue = customArray[i];
                    $('#searchkeys').append(theField);
                    $('.numberDiv').removeClass('numberDiv').addClass(""+rightDiv+"").find('.qolsetting').val(rightValue);
                }

                let theType = `<div class='typeNumber'> <select name="types" class="qolsetting" data-key="findType"> ` + GLOBALS.TYPE_OPTIONS + ` </select> <input type='button' value='Remove' id='removeShelterTypeList'> </div>`;
                typeArray = settings.findType.split(',');
                let numberOfType = typeArray.length;

                for (let o = 0; o < numberOfType; o++) {
                    let rightDiv = o + 1;
                    let rightValue = typeArray[o];
                    $('#shelterTypes').append(theType);
                    $('.typeNumber').removeClass('typeNumber').addClass(""+rightDiv+"").find('.qolsetting').val(rightValue);
                }

                $('[data-shelter=reload]').addClass('customSearchOnClick');
                $('[data-shelter=whiteflute]').addClass('customSearchOnClick');
                $('[data-shelter=blackflute]').addClass('customSearchOnClick');

                dexData = GLOBALS.DEX_DATA.split(',');
            },
            setupCSS() {
                let shelterSuccessCss = $('#sheltercommands').css('background-color');
                $('#sheltersuccess').css('background-color', shelterSuccessCss);
            },
            setupObserver() {
                shelterObserver.observe(document.querySelector('#shelterarea'), {
                    childList: true,
                });
            },
            setupHandlers() {
                $(document).on('change', '#shelteroptionsqol input', (function() { //shelter search
                    console.log('pizza - begin')
                    console.log(settings)
                    PFQoL.shelterCustomSearch();
                    console.log('pizza - end')
                }));

                $(document).on('change', '.qolsetting', (function() {
                    console.log('calzone')
                    console.log(settings)
                    PFQoL.shelterCustomSearch();
                }));

                $('.customSearchOnClick').on('click', (function() {
                    PFQoL.shelterCustomSearch();
                }));

                $('*[data-hatch]').on('click', (function() {
                    PFQoL.shelterRemoveEgg($(this).parent().prev().prev().prev().children().css('background-image'));
                }));

                $(document).on('click', '#addShelterTextfield', (function() { //add shelter text field
                    PFQoL.shelterAddTextField();
                }));

                $(document).on('click', '#removeShelterTextfield', (function() { //remove shelter text field
                    PFQoL.shelterRemoveTextfield(this, $(this).parent().find('input').val());
                    PFQoL.shelterCustomSearch();
                }));

                $(document).on('click', '#addShelterTypeList', (function() { //add shelter type list
                    PFQoL.shelterAddTypeList();
                }));

                $(document).on('click', '#removeShelterTypeList', (function() { //remove shelter type list
                    PFQoL.shelterRemoveTypeList(this, $(this).parent().find('select').val());
                    PFQoL.shelterCustomSearch();
                }));
            },
            addTextField() {
                let theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="findCustom"/></label><input type='button' value='Remove' id='removeShelterTextfield'></div>`;
                let numberDiv = $('#searchkeys>div').length;
                $('#searchkeys').append(theField);
                $('.numberDiv').removeClass('numberDiv').addClass(""+numberDiv+"");
            },
            removeTextField(byebye, key) {
                customArray = $.grep(customArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
                    return value != key;
                });
                settings.findCustom = customArray.toString()

                $(byebye).parent().remove();

                let i;
                for(i = 0; i < $('#searchkeys>div').length; i++) {
                    let rightDiv = i + 1;
                    $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                }
            },
            addTypeList() {
                let theList = `<div class='typeNumber'> <select name="types" class="qolsetting" data-key="findType"> ` + GLOBALS.TYPE_OPTIONS + `</select> <input type='button' value='Remove' id='removeShelterTypeList'> </div>`;
                let numberTypes = $('#shelterTypes>div').length;
                $('#shelterTypes').append(theList);
                $('.typeNumber').removeClass('typeNumber').addClass(""+numberTypes+"");
            },
            removeTypeList(byebye, key) {
                typeArray = $.grep(typeArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
                    return value != key;
                });
                settings.findType = typeArray.toString()

                $(byebye).parent().remove();

                let i;
                for(i = 0; i < $('#shelterTypes>div').length; i++) {
                    let rightDiv = i + 1;
                    $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                }
            },
            customSearch() {
                // search whatever you want to find in the shelter & grid
                let lengthEggs = 0;

                //sort in grid
                $('#shelterarea').removeClass('qolshelterareagrid');
                $('.mq2 #shelterarea').removeClass('qolshelterareagridmq2');
                $('#shelterarea .tooltip_content').removeClass('qoltooltipgrid');
                $('#shelterpage #shelter #shelterarea > .pokemon').removeClass('qolpokemongrid');
                $('#sheltergridthingy').remove();

                if (settings.shelterGrid === true) { //shelter grid
                    $('#shelterarea').addClass('qolshelterareagrid');
                    $('.mq2 #shelterarea').addClass('qolshelterareagridmq2');
                    $('#shelterarea .tooltip_content').addClass('qoltooltipgrid');
                    $('#shelterpage #shelter #shelterarea > .pokemon').addClass('qolpokemongrid');
                    $('#shelterpage #shelter #shelterarea:before').css({'display' : 'none!important'});
                    $('<pseudo:before>').attr('style', 'display: none!important');
                    $('head').append('<style id="sheltergridthingy">#shelterarea:before{display:none !important;}</style>');
                }

                //search values depending on settings
                const shelterValueArray = [];
                //emptying the sheltersuccess div to avoid duplicates
                document.querySelector('#sheltersuccess').innerHTML="";
                $('#shelterarea>div>img').removeClass('shelterfoundme');

                //loop to find all search values for the top checkboxes
                for (let key in settings) {
                    let value = settings[key];
                    if (value === true && Helpers.shelterKeyIsTopCheckbox(key)) {
                        let searchKey = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(key) + 1];
                        shelterValueArray.push(searchKey);
                    }
                }

                //loop to find the top checkboxes in the shelter
                for (let key in shelterValueArray) {
                    let value = shelterValueArray[key];

                    //img[TITLE] search. everything aside from new pokémon & new eggs || Image for Delta fails
                    if (value.startsWith('[')) {
                        if ($('img[title*="'+value+'"]').length) {
                            let searchResult = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(value) + 1]; //type of Pokémon found
                            let imgResult = $("img[title*='"+value+"']").length+" "+searchResult; //amount + type found
                            let imgFitResult = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(value) + 2]; //image for type of Pokémon
                            let shelterImgSearch = $('img[title*="'+value+'"]');
                            let shelterBigImg = shelterImgSearch.parent().prev().children('img.big');
                            $(shelterBigImg).addClass('shelterfoundme');

                            if ($("img[title*='"+value+"']").length > 1) {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+imgResult+'s found '+imgFitResult+'</div>');
                            } else {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+imgResult+' found '+imgFitResult+'</div>');
                            }
                        }
                    }
                    //new Pokémon search.
                    if (value === 'Pokémon') {
                        if ($("#shelterarea .tooltip_content:contains("+value+")").length) {
                            let searchResult = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(value) + 1];
                            let tooltipResult = $("#shelterarea .tooltip_content:contains("+value+")").length+" "+searchResult;
                            let imgFitResult = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(value) + 2];
                            let shelterImgSearch = $("#shelterarea .tooltip_content:contains("+value+")")
                            let shelterBigImg = shelterImgSearch.prev().children('img.big');
                            $(shelterBigImg).addClass('shelterfoundme');

                            if ($("#shelterarea .tooltip_content:contains("+value+")").length > 1) {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+'s found '+imgFitResult+'</div>');
                            } else {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' found '+imgFitResult+'</div>');
                            }
                        }
                    }
                    //new egg search.
                    if (value === "Egg") { //tooltip_content search. new egg.
                        if ($("#shelterarea .tooltip_content:contains("+value+")").length) {
                            eggNoDuplicateArray = settings.NewEggDuplicate.split(',');
                            eggNoDuplicateArray = eggNoDuplicateArray.filter(v=>v!='');

                            let eggList = eggNoDuplicateArray.length;
                            let i;
                            for (i = 0; i < eggList; i++) {
                                let value = eggNoDuplicateArray[i];
                                if ($('img[src*="//'+value+'"]').length) {
                                    lengthEggs = $('img[src*="//'+value+'"]').length + lengthEggs;
                                }
                            }

                            let allEggFinds = $("#shelterarea .tooltip_content:contains("+value+")").length;
                            let allKnownEggFinds = $("#shelterarea .tooltip_content:contains( "+value+")").length;
                            let newEggDup = lengthEggs / 2;
                            let newEggFinds = allEggFinds - allKnownEggFinds - newEggDup;

                            let searchResult = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(value) + 1];
                            let newEggResult = newEggFinds+" "+searchResult;
                            let imgFitResult = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(value) + 2];

                            if (newEggFinds <1) {
                                let thisDoesNothing = 0;
                            } else {
                                let shelterImgSearch = $("#shelterarea .tooltip_content:contains("+value+")");
                                let shelterBigImg = shelterImgSearch.prev().children('img.big');
                                $(shelterBigImg).addClass('shelterfoundme');
                                let shelterImgRemove = $("#shelterarea .tooltip_content:contains( "+value+")");
                                let shelterBigImgRemove = shelterImgRemove.prev().children('img.big');
                                $(shelterBigImgRemove).removeClass('shelterfoundme');

                                if (newEggFinds > 1) {
                                    document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+newEggResult+'s found '+imgFitResult+'</div>');
                                } else if (newEggFinds === 1) {
                                    document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+newEggResult+' found '+imgFitResult+'</div>');
                                }
                            }
                        }
                    }

                    //New egg no duplicates
                    let newEggAdopt = '';
                    if ($('#shelterarea .lock').next('.tooltip_content:contains("Egg")').length && $('#shelterarea .lock').next('.tooltip_content:not(:contains(" Egg")').length < 1) {
                        newEggAdopt = $('#shelterarea .lock').children('img').attr('src').substring(2);
                    }

                    if ($('div.panel:contains("Adoption successful!")').length) {
                        if ($('.egg').css('background-image') === 'url("https://'+newEggAdopt+'")') {
                            eggNoDuplicateArray = settings.NewEggDuplicate.split(',');
                            eggNoDuplicateArray.push(newEggAdopt);
                            settings.NewEggDuplicate = eggNoDuplicateArray.toString();
                            newEggAdopt = "";
                        }
                    }
                }

                //loop to find all search genders for the custom
                const shelterValueArrayCustom = [];
                for (let key in settings) {
                    let value = settings[key];
                    if (value === true) {
                        if(key === 'findMale' || key === 'findFemale' || key === 'findNoGender') {
                            let searchKey = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(key) + 1];
                            shelterValueArrayCustom.push(searchKey);
                        }
                    }
                }

                //loop to find all the custom search parameters
                let customSearchAmount = customArray.length;
                for (let i = 0; i < customSearchAmount; i++) {
                    let value = customArray[i];
                    if (value != "") {
                        //custom pokemon search
                        if (settings.customPokemon === true) {
                            //Males
                            if (shelterValueArrayCustom.indexOf("[M]") > -1) {
                                if ($("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[M]']").length) {
                                    let searchResult = value;
                                    let imgGender = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf("[M]") +2];
                                    let tooltipResult = $("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[M]']").length+" Male "+imgGender+" "+searchResult;
                                    let imgFitResult = `<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952">`;
                                    let shelterImgSearch = $("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[M]']")
                                    let shelterBigImg = shelterImgSearch.parent().prev().children('img.big');
                                    $(shelterBigImg).addClass('shelterfoundme');

                                    if ($("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[M]']").length > 1) {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+'s found '+imgFitResult+'</div>');
                                    } else {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' found '+imgFitResult+'</div>');
                                    }
                                }
                            }
                            //Females
                            if (shelterValueArrayCustom.indexOf("[F]") > -1) {
                                if ($("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[F]']").length) {
                                    let searchResult = value;
                                    let imgGender = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf("[F]") +2];
                                    let tooltipResult = $("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[F]']").length+" Female "+imgGender+" "+searchResult;
                                    let imgFitResult = `<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952">`;
                                    let shelterImgSearch = $("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[F]']")
                                    let shelterBigImg = shelterImgSearch.parent().prev().children('img.big');
                                    $(shelterBigImg).addClass('shelterfoundme');

                                    if ($("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[F]']").length > 1) {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+'s found '+imgFitResult+'</div>');
                                    } else {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' found '+imgFitResult+'</div>');
                                    }
                                }
                            }
                            //Genderless
                            if (shelterValueArrayCustom.indexOf("[N]") > -1) {
                                if ($("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[N]']").length) {
                                    let searchResult = value;
                                    let imgGender = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf("[N]") +2];
                                    let tooltipResult = $("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[N]']").length+" Genderless "+imgGender+" "+searchResult;
                                    let imgFitResult = `<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952">`;
                                    let shelterImgSearch = $("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[N]']")
                                    let shelterBigImg = shelterImgSearch.parent().prev().children('img.big');
                                    $(shelterBigImg).addClass('shelterfoundme');

                                    if ($("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[N]']").length > 1) {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+'s found '+imgFitResult+'</div>');
                                    } else {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' found '+imgFitResult+'</div>');
                                    }
                                }
                            }
                            //No genders
                            if (shelterValueArrayCustom.length === 0) {
                                if ($('#shelterarea .tooltip_content:containsIN('+value+'):not(:containsIN("Egg"))').length) {
                                    let searchResult = value;
                                    let tooltipResult = $('#shelterarea .tooltip_content:containsIN('+value+'):not(:containsIN("Egg"))').length+" "+searchResult;
                                    let imgFitResult = `<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952">`;
                                    let shelterImgSearch = $('#shelterarea .tooltip_content:containsIN('+value+'):not(:containsIN("Egg"))')
                                    let shelterBigImg = shelterImgSearch.parent().prev().children('img.big');
                                    $(shelterBigImg).addClass('shelterfoundme');

                                    if ($("#shelterarea .tooltip_content:containsIN("+value+") img[title*='[N]']").length > 1) {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+'s found '+imgFitResult+'</div>');
                                    } else {
                                        document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' found '+imgFitResult+'</div>');
                                    }
                                }
                            }
                        }

                        //custom egg
                        if (settings.customEgg === true) {
                            let name_matches = $('#shelterarea .tooltip_content:containsIN('+value+'):contains("Egg")');
                            let num_matches = name_matches.length;

                            if (num_matches) {
                                let searchResult = value;
                                let tooltipResult = num_matches+" "+searchResult;
                                let imgFitResult = `<img src="//pfq-static.com/img/pkmn/egg.png/t=1451852195">`;
                                let shelterImgSearch = name_matches;
                                let shelterBigImg = shelterImgSearch.prev().children('img.big');
                                $(shelterBigImg).addClass('shelterfoundme');

                                if (num_matches > 1) {
                                    document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' Eggs found '+imgFitResult+'</div>');
                                } else {
                                    document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' egg found '+imgFitResult+'</div>');
                                }
                            }
                        }

                        //imgSearch with Pokémon
                        if (settings.customPng === true) {
                            if ($('#shelterarea img[src*="'+value+'"]').length) {
                                let searchResult = $('#shelterarea img[src*="'+value+'"]').parent().next().text().split('(')[0]
                                let tooltipResult = $('#shelterarea img[src*="'+value+'"]').length+" "+searchResult+' (Custom img search)';
                                let imgFitResult = `<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952">`;
                                let shelterImgSearch = $('#shelterarea img[src*="'+value+'"]');
                                $(shelterImgSearch).addClass('shelterfoundme');

                                if ($('#shelterarea img[src*="'+value+'"]').length > 1) {
                                    document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' found '+imgFitResult+'</div>');
                                } else {
                                    document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+tooltipResult+' found '+imgFitResult+'</div>');
                                }
                            }
                        }
                    }
                }

                //loop to find all the types

                const filteredTypeArray = typeArray.filter(v=>v!='');

                if (filteredTypeArray.length > 0) {
                    for (let i = 0; i < filteredTypeArray.length; i++) {
                        let value = filteredTypeArray[i];
                        let foundType = GLOBALS.SHELTER_TYPE_TABLE[GLOBALS.SHELTER_TYPE_TABLE.indexOf(value) + 2];

                        if (settings.findTypeEgg === true) {
                            let typePokemonNames = [];
                            $('#shelterarea>.tooltip_content:contains("Egg")').each(function() {
                                let searchPokemon = ($(this).text().split(' ')[0]);
                                let searchPokemonIndex = dexData.indexOf('"'+searchPokemon+'"');
                                let searchTypeOne = dexData[searchPokemonIndex + 1];
                                let searchTypeTwo = dexData[searchPokemonIndex + 2];

                                if ((searchTypeOne === value) || (searchTypeTwo === value)) {
                                    typePokemonNames.push(searchPokemon);
                                }
                            })

                            for (let o = 0; o < typePokemonNames.length; o++) {
                                let shelterImgSearch = $("#shelterarea .tooltip_content:containsIN('"+typePokemonNames[o]+" Egg')");
                                let shelterBigImg = shelterImgSearch.prev().children('img.big');
                                $(shelterBigImg).addClass('shelterfoundme');
                            }

                            if (typePokemonNames.length == 1) {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+typePokemonNames.length+' '+foundType+' egg type found! ('+typePokemonNames.toString()+')</div>');
                            } else if (typePokemonNames.length > 1) {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+typePokemonNames.length+' '+foundType+' egg types found! ('+typePokemonNames.toString()+')</div>');
                            }
                        }

                        if (settings.findTypePokemon === true) {
                            let typePokemonNames = [];

                            $('#shelterarea>.tooltip_content').not(':contains("Egg")').each(function() {
                                let searchPokemon = ($(this).text().split(' ')[0]);
                                let searchPokemonIndex = dexData.indexOf('"'+searchPokemon+'"');
                                let searchTypeOne = dexData[searchPokemonIndex + 1];
                                let searchTypeTwo = dexData[searchPokemonIndex + 2];
                                if ((searchTypeOne === value) || (searchTypeTwo === value)) {
                                    typePokemonNames.push(searchPokemon);
                                }
                            })

                            let typeImgStandOutLength = typePokemonNames.length;
                            for (let o = 0; o < typeImgStandOutLength; o++) {
                                let shelterImgSearch = $("#shelterarea .tooltip_content:containsIN('"+typePokemonNames[o]+" (')")
                                let shelterBigImg = shelterImgSearch.prev().children('img.big');
                                $(shelterBigImg).addClass('shelterfoundme');
                            }

                            if (typePokemonNames.length == 1) {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+typePokemonNames.length+' '+foundType+' Pokémon type found! ('+typePokemonNames.toString()+')</div>');
                            } else if (typePokemonNames.length > 1) {
                                document.querySelector('#sheltersuccess').insertAdjacentHTML('beforeend','<div id="shelterfound">'+typePokemonNames.length+' '+foundType+' Pokémon types found! ('+typePokemonNames.toString()+')</div>');
                            }
                        }
                    }
                }
            },
            removeEgg(element) {
                eggNoDuplicateArray = settings.NewEggDuplicate.split(',');
                let eggList = eggNoDuplicateArray.length;
                let i;
                for (i = 0; i < eggList; i++) {
                    let value = eggNoDuplicateArray[i];
                    if (element === 'url("https://'+value+'")') {
                        let index = eggNoDuplicateArray.indexOf(value);
                        if (index > -1) {
                            eggNoDuplicateArray.splice(index, 1);
                            settings.NewEggDuplicate = eggNoDuplicateArray.toString();
                        }
                    }
                }
            },
        };

        return API;
    })(); // ShelterPage

    let PrivateFieldsPage = (function PrivateFieldsPage() {
		const SETTINGS_SAVE_KEY = 'QoLPrivateFields';
		const DEFAULT_SETTINGS = {
			fieldCustom: "",
			fieldType: "",
			fieldNature: "",
			fieldEggGroup: "",
			fieldNewPokemon: true,
			fieldShiny: true,
			fieldAlbino: true,
			fieldMelanistic: true,
			fieldPrehistoric: true,
			fieldDelta: true,
			fieldMega: true,
			fieldStarter: true,
			fieldCustomSprite: true,
			fieldMale: true,
			fieldFemale: true,
			fieldNoGender: true,
			customItem: true,
		};
		let settings = DEFAULT_SETTINGS;
		let customArray = [];
		let typeArray = [];
		let natureArray = [];
		let eggGroupArray = [];
		let dexData = "";
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				API.customSearch();
			});
		});
		
		const API = {
			loadSettings() {
				settings = Helpers.loadSettings(SETTINGS_SAVE_KEY, DEFAULT_SETTINGS, settings);
			},
			saveSettings() {
				Helpers.saveSettings(SETTINGS_SAVE_KEY, settings)
			},
			getSettings() {
				return settings;
			},
			populateSettings() {
				for (let key in settings) {
					if (!settings.hasOwnProperty(key)) {
						continue;
					}
					let value = settings[key];
					if (typeof value === 'boolean') {
						Helpers.toggleSetting(key, value, false);
						continue;
					}
				}
			},
			settingsChange(element, textElement, customClass, typeClass) {
				if (typeof (settings[element]) === 'boolean') {
                    settings[element] = !settings[element];
					return true;
				} else if (settings[element] === 'string') {
					if (element === 'fieldType') {
						if (textElement === 'none') {
							let tempIndex = typeClass - 1;
							typeArray.splice(tempIndex, tempIndex);
							settings.fieldType = typeArray.toString();
						} else {
							let tempIndex = typeClass - 1;
							typeArray[tempIndex] = textElement;
							settings.fieldType = typeArray.toString();
						}
					}
					else if (element === 'fieldNature') {
						if (textElement === 'none') {
							let tempIndex = typeClass - 1;
							natureArray.splice(tempIndex, tempIndex);
							settings.fieldNature = natureArray.toString();
						} else {
							let tempIndex = typeClass - 1;
							natureArray[tempIndex] = textElement;
							settings.fieldNature = natureArray.toString();
						}
					}
					else if (element === 'fieldEggGroup') {
						if (textElement === 'none') {
							let tempIndex = typeClass - 1;
							eggGroupArray.splice(tempIndex, tempIndex);
							settings.fieldEggGroup = eggGroupArray.toString();
						} else {
							let tempIndex = typeClass - 1;
							eggGroupArray[tempIndex] = textElement;
							settings.fieldEggGroup = eggGroupArray.toString();
						}
					}
					else if (element === 'fieldCustom') {
						let tempIndex = customClass - 1;
						customArray[tempIndex] = textElement;
						settings.fieldCustom = customArray.toString();
					}
					return true;
				}
				else { return false; }
			},
			setupHTML() {
				document.querySelector('#field_field').insertAdjacentHTML('afterend', TEMPLATES.privateFieldSearchHTML);
				const theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="fieldCustom"/></label><input type='button' value='Remove' id='removePrivateFieldSearch'></div>`;
				const theType = `<div class='typeNumber'> <select name="types" class="qolsetting" data-key="fieldType"> ` + GLOBALS.TYPE_OPTIONS + ` </select> <input type='button' value='Remove' id='removePrivateFieldTypeSearch'> </div>`;
				const theNature = `<div class='natureNumber'> <select name="natures" class="qolsetting" data-key="fieldNature"> ` + GLOBALS.NATURE_OPTIONS + ` </select> <input type='button' value='Remove' id='removePrivateFieldNature'> </div>`;
				const theEggGroup = `<div class='eggGroupNumber'> <select name="eggGroups" class="qolsetting" data-key="fieldEggGroup"> ` + GLOBALS.EGG_GROUP_OPTIONS + ` </select> <input type='button' value='Remove' id='removePrivateFieldEggGroup'> </div>`;
				customArray = settings.fieldCustom.split(',');
				typeArray = settings.fieldType.split(',');
				natureArray = settings.fieldNature.split(',');
				eggGroupArray = settings.fieldEggGroup.split(',');
				Helpers.setupFieldArrayHTML(customArray, 'searchkeys', theField, 'numberDiv');
				Helpers.setupFieldArrayHTML(typeArray, 'fieldTypes', theType, 'typeNumber');
				Helpers.setupFieldArrayHTML(natureArray, 'natureTypes', theNature, 'natureNumber');
				Helpers.setupFieldArrayHTML(eggGroupArray, 'eggGroupTypes', theEggGroup, 'eggGroupNumber');

                dexData = GLOBALS.DEX_DATA.split(',');
			},
			setupCSS() {
				// same as public fields
				let fieldOrderCssColor = $('#field_field').css('background-color');
				let fieldOrderCssBorder = $('#field_field').css('border');
				$("#fieldorder").css("background-color", ""+fieldOrderCssColor+"");
				$("#fieldorder").css("border", ""+fieldOrderCssBorder+"");

				$("#fieldsearch").css("background-color", ""+fieldOrderCssColor+"");
				$("#fieldsearch").css("border", ""+fieldOrderCssBorder+"");
			},
			setupObserver() {
				observer.observe(document.querySelector('#field_field'), {
					childList: true,
					characterdata: true,
					subtree: true,
					characterDataOldValue: true,
				});
			},
			setupHandlers() {
				$(window).on('load', (() => {
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('load', '.field', (function() {
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('click', '#addPrivateFieldNatureSearch', (function() { //add field nature search
					PFQoL.privateFieldAddNatureSearch();
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('click', '#removePrivateFieldNature', (function() { //remove field nature search
					PFQoL.privateFieldRemoveNatureSearch(this, $(this).parent().find('select').val());
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('click', '#addPrivateFieldTypeSearch', (function() { //add field type list
					PFQoL.privateFieldAddTypeSearch();
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('click', '#removePrivateFieldTypeSearch', (function() { //remove field type list
					PFQoL.privateFieldRemoveTypeSearch(this, $(this).parent().find('select').val());
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('click', '#addPrivateFieldEggGroupSearch', (function() { //add egg group nature search
					PFQoL.privateFieldAddEggGroupSearch();
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('click', '#removePrivateFieldEggGroup', (function() { //remove egg group nature search
					PFQoL.privateFieldRemoveEggGroupSearch(this, $(this).parent().find('select').val());
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('change', '.qolsetting', (function() {
                    console.log('private calzones')
					PFQoL.privateFieldCustomSearch();
				}));

				$(document).on('click', '*[data-menu="bulkmove"]', (function() { // select all feature
					PFQoL.moveFieldSelectAll();
				}));

			},
			// specific
			customSearch() {
                let bigImgs = document.querySelectorAll('.privatefoundme')
                if(bigImgs !== null) {
                    bigImgs.forEach((b) => {$(b).removeClass('privatefoundme')})
                }

                console.log('pie')
                console.log(typeArray, natureArray, eggGroupArray)
                const filteredTypeArray = typeArray.filter(v=>v!='');
                const filteredNatureArray = natureArray.filter(v=>v!='');
                const filteredEggGroupArray = eggGroupArray.filter(v=>v!='');

                //loop to find all the types
                if (filteredTypeArray.length > 0 || filteredNatureArray.length > 0 || filteredEggGroupArray.length > 0) {
                    $('.fieldmon').each(function() {
                        let searchPokemonBigImg = $(this)[0].childNodes[0];
                        let searchPokemon = searchPokemonBigImg.alt;
                        let searchPokemonIndex = dexData.indexOf('"'+searchPokemon+'"');
                        let searchTypeOne = dexData[searchPokemonIndex + 1];
                        let searchTypeTwo = dexData[searchPokemonIndex + 2];

                        let searchNature = $($(this).next()[0].querySelector('.fieldmontip')).children(':contains(Nature)')[0].innerText.split(" ")[1];
                        if (searchNature.indexOf("(") > -1) { searchNature = searchNature.slice(0, -1); }

                        let searchEggGroup = $($(this).next()[0].querySelector('.fieldmontip')).children(':contains(Egg Group)')[0].innerText.slice("Egg Group: ".length)

                        for (let i = 0; i < filteredTypeArray.length; i++) {
                            if ((searchTypeOne === filteredTypeArray[i]) || (searchTypeTwo === filteredTypeArray[i])) {
                                $(searchPokemonBigImg).addClass('privatefoundme');
                            }
                        }

                        for (let i = 0; i < filteredNatureArray.length; i++) {
                            if(searchNature === GLOBALS.NATURE_LIST[filteredNatureArray[i]]) {
                                $(searchPokemonBigImg).addClass('privatefoundme');
                            }
                        }

                        for (let i = 0; i < filteredEggGroupArray.length; i++) {
                            let value = GLOBALS.EGG_GROUP_LIST[filteredEggGroupArray[i]];
                            if(searchEggGroup === value ||
                               searchEggGroup.indexOf(value + "/") > -1 ||
                               searchEggGroup.indexOf("/" + value) > -1) {
                                $(searchPokemonBigImg).addClass('privatefoundme');
                            }
                        }
                    }) // each
                } // end
            },
            addSelectSearch(cls, name, data_key, options, id, divParent) {
                console.log('panko')
                let theList = `<div class='${cls}'> <select name='${name}' class="qolsetting" data-key='${data_key}'> ${options} </select> <input type='button' value='Remove' id='${id}'> </div>`;
                let number = (`#${divParent}>div`).length;
                $(`#${divParent}`).append(theList);
                $(`.${cls}`).removeClass(cls).addClass(""+number+"");
            },
        };

        return API;
	})(); // PrivateFieldsPage

	let PFQoL = (function PFQoL() {

        const DEFAULT_USER_SETTINGS = { // default settings when the script gets loaded the first time
            //variables
            variData : {
                dexData: '{"columns":["id","name","type1","type2","eggs","eggdex","pkmn","pokedex","shinydex","albidex","melandex"],"types":["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],"regions":{"1":[["001","Bulbasaur",4,7,1,1,1,1,0,0,0],["002","Ivysaur",4,7,0,0,1,1,0,0,0],["003","Venusaur",4,7,0,0,2,1,0,0,0],["004","Charmander",1,-1,1,1,1,1,0,0,0],["005","Charmeleon",1,-1,0,0,1,1,0,0,0],["006","Charizard",1,9,0,0,3,1,0,0,0],["007","Squirtle",2,-1,1,1,1,1,0,0,0],["008","Wartortle",2,-1,0,0,1,1,0,0,0],["009","Blastoise",2,-1,0,0,2,1,0,0,0],["010","Caterpie",11,-1,1,1,1,1,0,0,0],["011","Metapod",11,-1,0,0,1,1,0,0,0],["012","Butterfree",11,9,0,0,1,1,0,0,0],["013","Weedle",11,7,1,1,1,1,0,0,0],["014","Kakuna",11,7,0,0,1,1,0,0,0],["015","Beedrill",11,7,0,0,2,1,0,0,0],["016","Pidgey",0,9,1,1,1,1,0,0,0],["017","Pidgeotto",0,9,0,0,1,1,0,0,0],["018","Pidgeot",0,9,0,0,2,1,0,0,0],["019","Rattata",0,-1,2,2,2,2,0,0,0],["020","Raticate",0,-1,0,0,3,2,0,0,0],["021","Spearow",0,9,1,1,1,1,0,0,0],["022","Fearow",0,9,0,0,1,1,0,0,0],["023","Ekans",7,-1,1,1,1,1,0,0,0],["024","Arbok",7,-1,0,0,1,1,0,0,0],["025","Pichu",3,-1,1,1,1,1,0,0,0],["026","Pikachu",3,-1,0,0,1,1,0,0,0],["027","Raichu",3,-1,0,0,2,0,0,0,0],["028","Sandshrew",8,-1,2,2,2,2,0,0,0],["029","Sandslash",8,-1,0,0,2,1,0,0,0],["030","Nidoran",7,-1,1,1,1,1,0,0,0],["031","Nidorina",7,-1,0,0,1,1,0,0,0],["032","Nidoqueen",7,8,0,0,1,0,0,0,0],["033","Nidorino",7,-1,0,0,1,1,0,0,0],["034","Nidoking",7,8,0,0,1,1,0,0,0],["035","Cleffa",17,-1,1,1,1,1,0,0,0],["036","Clefairy",17,-1,0,0,1,1,0,0,0],["037","Clefable",17,-1,0,0,1,0,0,0,0],["038","Vulpix",1,-1,2,2,2,2,0,0,0],["039","Ninetales",1,-1,0,0,2,1,0,0,0],["040","Igglybuff",0,17,1,1,1,1,0,0,0],["041","Jigglypuff",0,17,0,0,1,1,0,0,0],["042","Wigglytuff",0,17,0,0,1,1,0,0,0],["043","Zubat",7,9,1,1,1,1,0,0,0],["044","Golbat",7,9,0,0,1,1,0,0,0],["045","Crobat",7,9,0,0,1,0,0,0,0],["046","Oddish",4,7,1,1,1,1,0,0,0],["047","Gloom",4,7,0,0,1,1,0,0,0],["048","Vileplume",4,7,0,0,1,1,0,0,0],["049","Bellossom",4,-1,0,0,1,0,0,0,0],["050","Paras",11,4,1,1,1,1,0,0,0],["051","Parasect",11,4,0,0,1,1,0,0,0],["052","Venonat",11,7,1,1,1,1,0,0,0],["053","Venomoth",11,7,0,0,1,1,0,0,0],["054","Diglett",8,-1,2,2,2,2,0,0,0],["055","Dugtrio",8,-1,0,0,2,1,0,0,0],["056","Meowth",0,-1,2,2,2,2,0,0,0],["057","Persian",0,-1,0,0,2,1,0,0,0],["058","Psyduck",2,-1,1,1,1,1,0,0,0],["059","Golduck",2,-1,0,0,1,1,0,0,0],["060","Mankey",6,-1,1,1,1,1,0,0,0],["061","Primeape",6,-1,0,0,1,1,0,0,0],["062","Growlithe",1,-1,1,1,1,1,1,0,0],["063","Arcanine",1,-1,0,0,1,1,0,0,0],["064","Poliwag",2,-1,1,1,1,1,0,0,0],["065","Poliwhirl",2,-1,0,0,1,1,0,0,0],["066","Poliwrath",2,6,0,0,1,0,0,0,0],["067","Politoed",2,-1,0,0,1,1,0,0,0],["068","Abra",10,-1,1,1,1,1,0,0,0],["069","Kadabra",10,-1,0,0,1,1,0,0,0],["070","Alakazam",10,-1,0,0,2,1,0,0,0],["071","Machop",6,-1,1,1,1,1,0,0,0],["072","Machoke",6,-1,0,0,1,1,0,0,0],["073","Machamp",6,-1,0,0,1,1,0,0,0],["074","Bellsprout",4,7,1,1,1,1,0,0,0],["075","Weepinbell",4,7,0,0,1,1,0,0,0],["076","Victreebell",4,7,0,0,1,0,0,0,0],["077","Tentacool",2,7,1,1,1,1,0,0,0],["078","Tentacruel",2,7,0,0,1,1,0,0,0],["079","Geodude",12,8,2,2,2,2,0,0,0],["080","Graveler",12,8,0,0,2,1,0,0,0],["081","Golem",12,8,0,0,2,1,0,0,0],["082","Ponyta",1,-1,1,1,1,1,0,0,0],["083","Rapidash",1,-1,0,0,1,1,0,0,0],["084","Slowpoke",2,10,1,1,1,1,0,0,0],["085","Slowbro",2,10,0,0,2,1,0,0,0],["086","Slowking",2,10,0,0,1,0,0,0,0],["087","Magnemite",3,16,1,1,1,1,0,0,0],["088","Magneton",3,16,0,0,1,1,0,0,0],["089","Magnezone",3,16,0,0,1,1,0,0,0],["090","Farfetch"d",0,9,1,1,1,1,0,0,0],["091","Doduo",0,9,1,1,1,1,0,0,0],["092","Dodrio",0,9,0,0,1,1,0,0,0],["093","Seel",2,-1,1,1,1,1,0,0,0],["094","Dewgong",2,5,0,0,1,0,0,0,0],["095","Grimer",7,-1,2,2,2,2,0,0,0],["096","Muk",7,-1,0,0,2,0,0,0,0],["097","Shellder",2,-1,1,1,1,1,0,0,0],["098","Cloyster",2,5,0,0,1,0,0,0,0],["099","Gastly",13,7,1,1,1,1,0,0,0],["100","Haunter",13,7,0,0,1,1,0,0,0],["101","Gengar",13,7,0,0,2,2,0,0,0],["102","Onix",12,8,1,1,1,1,0,0,0],["103","Steelix",16,8,0,0,2,0,0,0,0],["104","Drowzee",10,-1,1,1,1,1,0,0,0],["105","Hypno",10,-1,0,0,1,1,0,0,0],["106","Krabby",2,-1,1,1,1,1,0,0,0],["107","Kingler",2,-1,0,0,1,0,0,0,0],["108","Voltorb",3,-1,1,1,1,1,0,0,0],["109","Electrode",3,-1,0,0,1,0,0,0,0],["110","Exeggcute",4,10,1,1,1,1,0,0,0],["111","Exeggutor",4,10,0,0,2,1,0,0,0],["112","Cubone",8,-1,1,1,1,1,0,0,0],["113","Marowak",8,-1,0,0,3,1,0,0,0],["114","Lickitung",0,-1,1,1,1,1,0,0,0],["115","Lickilicky",0,-1,0,0,1,0,0,0,0],["116","Koffing",7,-1,1,1,1,1,0,0,0],["117","Weezing",7,-1,0,0,1,1,0,0,0],["118","Rhyhorn",8,12,1,1,1,1,0,0,0],["119","Rhydon",8,12,0,0,1,0,0,0,0],["120","Rhyperior",8,12,0,0,1,0,0,0,0],["121","Tangela",4,-1,1,1,1,1,0,0,0],["122","Tangrowth",4,-1,0,0,1,0,0,0,0],["123","Kangaskhan",0,-1,1,1,2,1,0,0,0],["124","Horsea",2,-1,1,1,1,1,0,0,0],["125","Seadra",2,-1,0,0,1,1,0,0,0],["126","Kingdra",2,14,0,0,1,0,0,0,0],["127","Goldeen",2,-1,1,1,1,1,0,0,0],["128","Seaking",2,-1,0,0,1,1,0,0,0],["129","Staryu",2,-1,1,0,1,0,0,0,0],["130","Starmie",2,10,0,0,1,0,0,0,0],["131","Mime Jr.",10,17,1,1,1,1,0,0,0],["132","Mr. Mime",10,17,1,1,1,1,0,0,0],["133","Scyther",11,9,1,1,1,1,0,0,0],["134","Scizor",11,16,0,0,2,1,0,0,0],["135","Smoochum",5,10,1,1,1,1,0,0,0],["136","Jynx",5,10,0,0,1,1,0,0,0],["137","Pinsir",11,-1,1,1,2,1,0,0,0],["138","Tauros",0,-1,1,1,1,1,0,0,0],["139","Magikarp",2,-1,1,1,1,1,0,0,0],["140","Gyarados",2,9,0,0,2,1,0,0,0],["141","Lapras",2,5,1,1,1,1,0,0,0],["142","Ditto",0,-1,1,0,1,0,0,0,0],["143","Eevee",0,-1,1,1,1,1,0,0,0],["144","Vaporeon",2,-1,0,0,1,0,0,0,0],["145","Jolteon",3,-1,0,0,1,0,0,0,0],["146","Flareon",1,-1,0,0,1,1,0,0,0],["147","Espeon",10,-1,0,0,1,1,0,0,0],["148","Umbreon",15,-1,0,0,1,1,0,0,0],["149","Leafeon",4,-1,0,0,1,1,0,0,0],["150","Glaceon",5,-1,0,0,1,1,0,0,0],["151","Sylveon",17,-1,0,0,1,0,0,0,0],["152","Omanyte",12,2,1,1,1,1,0,0,0],["153","Omastar",12,2,0,0,1,0,0,0,0],["154","Kabuto",12,2,1,1,1,1,0,0,0],["155","Kabutops",12,2,0,0,1,0,0,0,0],["156","Aerodactyl",12,9,1,1,2,1,0,0,0],["157","Munchlax",0,-1,1,1,1,1,0,0,0],["158","Snorlax",0,-1,1,1,1,1,0,0,0],["159","Articuno",5,9,1,0,1,0,0,0,0],["160","Zapdos",3,9,1,0,1,0,0,0,0],["161","Moltres",1,9,1,0,1,0,0,0,0],["162","Dratini",14,-1,1,1,1,1,0,0,0],["163","Dragonair",14,-1,0,0,1,1,0,0,0],["164","Dragonite",14,9,0,0,1,0,0,0,0],["165","Mewtwo",10,-1,1,0,3,0,0,0,0],["166","Mew",10,-1,1,1,1,1,0,0,0]],"2":[["167","Chikorita",4,-1,1,1,1,1,0,0,0],["168","Bayleef",4,-1,0,0,1,1,0,0,0],["169","Meganium",4,-1,0,0,1,1,0,0,0],["170","Cyndaquil",1,-1,1,1,1,1,0,0,0],["171","Quilava",1,-1,0,0,1,1,0,0,0],["172","Typhlosion",1,-1,0,0,1,1,0,0,0],["173","Totodile",2,-1,1,1,1,1,0,0,0],["174","Croconaw",2,-1,0,0,1,1,0,0,0],["175","Feraligator",2,-1,0,0,1,1,0,0,0],["176","Sentret",0,-1,1,1,1,1,0,0,0],["177","Furret",0,-1,0,0,1,1,0,0,0],["178","Hoothoot",0,9,1,1,1,1,0,0,0],["179","Noctowl",0,9,0,0,1,1,0,0,0],["180","Ledyba",11,9,1,1,1,1,0,0,0],["181","Ledian",11,9,0,0,1,1,0,0,0],["182","Spinarak",11,7,1,1,1,1,0,0,0],["183","Ariados",11,7,0,0,1,1,0,0,0],["184","Chinchou",2,3,1,1,1,1,0,0,0],["185","Lanturn",2,3,0,0,1,0,0,0,0],["186","Togepi",17,-1,1,1,1,1,0,0,0],["187","Togetic",17,9,0,0,1,1,0,0,0],["188","Togekiss",17,9,0,0,1,0,0,0,0],["189","Natu",10,9,1,1,1,1,0,0,0],["190","Xatu",10,9,0,0,1,1,0,0,0],["191","Mareep",3,-1,1,1,1,1,0,0,0],["192","Flaaffy",3,-1,0,0,1,1,0,0,0],["193","Ampharos",3,-1,0,0,2,1,0,0,0],["194","Azurill",0,17,1,1,1,1,0,0,0],["195","Marill",2,17,1,1,1,1,0,0,0],["196","Azumarill",2,17,0,0,1,1,0,0,0],["197","Bonsly",12,-1,1,1,1,1,0,0,0],["198","Sudowoodo",12,-1,1,1,1,1,0,0,0],["199","Hoppip",4,9,1,1,1,1,1,0,0],["200","Skiploom",4,9,0,0,1,1,1,0,0],["201","Jumpluff",4,9,0,0,1,1,0,0,0],["202","Aipom",0,-1,1,1,1,1,0,0,0],["203","Ambipom",0,-1,0,0,1,1,0,0,0],["204","Sunkern",4,-1,1,1,1,1,0,0,0],["205","Sunflora",4,-1,0,0,1,0,0,0,0],["206","Yanma",11,9,1,1,1,1,0,0,0],["207","Yanmega",11,9,0,0,1,0,0,0,0],["208","Wooper",2,8,1,1,1,1,0,0,0],["209","Quagsire",2,8,0,0,1,1,0,0,0],["210","Murkrow",15,9,1,1,1,1,0,0,0],["211","Honchkrow",15,9,0,0,1,0,0,0,0],["212","Misdreavus",13,-1,1,1,1,1,0,0,0],["213","Mismagius",13,-1,0,0,1,1,0,0,0],["214|","Unown",10,-1,28,22,28,23,0,0,0],["215","Girafarig",0,10,1,1,1,1,0,0,0],["216","Pineco",11,-1,1,1,1,1,0,0,0],["217","Forretress",11,16,0,0,1,1,0,0,0],["218","Dunsparce",0,-1,1,1,1,1,0,0,0],["219","Gligar",8,9,1,1,1,1,0,0,0],["220","Gliscor",8,9,0,0,1,1,0,0,0],["221","Snubbull",17,-1,1,1,1,1,0,0,0],["222","Granbull",17,-1,0,0,1,1,0,0,0],["223","Qwilfish",2,7,1,1,1,1,0,0,0],["224","Shuckle",11,12,1,1,1,1,0,0,0],["225","Heracross",11,6,1,1,2,1,0,0,0],["226","Sneasel",15,5,1,1,1,1,0,0,0],["227","Weavile",15,5,0,0,1,1,0,0,0],["228","Teddiursa",0,-1,1,1,1,1,0,0,0],["229","Ursaring",0,-1,0,0,1,1,0,0,0],["230","Slugma",1,-1,1,1,1,1,0,0,0],["231","Magcargo",1,12,0,0,1,1,0,0,0],["232","Swinub",5,8,1,1,1,1,0,0,0],["233","Piloswine",5,8,0,0,1,0,0,0,0],["234","Mamoswine",5,8,0,0,1,0,0,0,0],["235","Corsola",2,12,1,1,1,1,0,0,0],["236","Remoraid",2,-1,1,1,1,1,0,0,0],["237","Octillery",2,-1,0,0,1,0,0,0,0],["238","Delibird",5,9,1,1,1,1,0,0,0],["239","Skarmory",16,9,1,1,1,1,0,0,0],["240","Houndour",15,1,1,1,1,1,0,0,0],["241","Houndoom",15,1,0,0,2,1,0,0,0],["242","Phanpy",8,-1,1,1,1,1,0,0,0],["243","Donphan",8,-1,0,0,1,1,0,0,0],["244","Stantler",0,-1,1,1,1,1,0,0,0],["245","Smeargle",0,-1,1,1,1,1,0,0,0],["246","Tyrogue",6,-1,1,1,1,1,0,0,0],["247","Hitmonlee",6,-1,0,0,1,1,0,0,0],["248","Hitmonchan",6,-1,0,0,1,0,0,0,0],["249","Hitmontop",6,-1,0,0,1,0,0,0,0],["250","Elekid",3,-1,1,1,1,1,0,0,0],["251","Electabuzz",3,-1,0,0,1,1,0,0,0],["252","Electivire",3,-1,0,0,1,0,0,0,0],["253","Magby",1,-1,1,1,1,1,0,0,0],["254","Magmar",1,-1,0,0,1,0,0,0,0],["255","Magmortar",1,-1,0,0,1,0,0,0,0],["256","Miltank",0,-1,1,1,1,1,0,0,0],["257","Raikou",3,-1,1,0,1,0,0,0,0],["258","Entei",1,-1,1,0,1,0,0,0,0],["259","Suicune",2,-1,1,0,1,0,0,0,0],["260","Larvitar",12,8,1,1,1,1,0,0,0],["261","Pupitar",12,8,0,0,1,1,0,0,0],["262","Tyranitar",12,15,0,0,2,0,0,0,0],["263","Lugia",10,9,1,0,1,0,0,0,0],["264","Ho-oh",1,9,1,0,1,0,0,0,0],["265","Celebi",10,4,1,0,1,0,0,0,0]],"3":[["266","Treecko",4,-1,1,1,1,1,0,0,0],["267","Grovyle",4,-1,0,0,1,1,0,0,0],["268","Sceptile",4,-1,0,0,2,1,0,0,0],["269","Torchic",1,-1,1,1,1,1,1,0,0],["270","Combusken",1,6,0,0,1,1,0,0,0],["271","Blaziken",1,6,0,0,2,1,0,0,0],["272","Mudkip",2,-1,1,1,1,1,0,0,0],["273","Marshtomp",2,8,0,0,1,1,0,0,0],["274","Swampert",2,8,0,0,2,0,0,0,0],["275","Poochyena",15,-1,1,1,1,1,0,0,0],["276","Mightyena",15,-1,0,0,1,1,0,0,0],["277","Zigzagoon",0,-1,1,1,1,1,0,0,0],["278","Linoone",0,-1,0,0,1,1,0,0,0],["279","Wurmple",11,-1,1,1,1,1,0,0,0],["280","Silcoon",11,-1,0,0,1,0,0,0,0],["281","Beautifly",11,9,0,0,1,1,0,0,0],["282","Cascoon",11,-1,0,0,1,1,0,0,0],["283","Dustox",11,7,0,0,1,1,0,0,0],["284","Lotad",2,4,1,1,1,1,0,0,0],["285","Lombre",2,4,0,0,1,1,0,0,0],["286","Ludicolo",2,4,0,0,1,0,0,0,0],["287","Seedot",4,-1,1,1,1,1,0,0,0],["288","Nuzleaf",4,15,0,0,1,1,0,0,0],["289","Shiftry",4,15,0,0,1,1,0,0,0],["290","Taillow",0,9,1,1,1,1,0,0,0],["291","Swellow",0,9,0,0,1,1,1,0,0],["292","Wingull",2,9,1,1,1,1,0,0,0],["293","Pelipper",2,9,0,0,1,1,0,0,0],["294","Ralts",10,17,1,1,1,1,1,0,0],["295","Kirlia",10,17,0,0,1,1,0,0,0],["296","Gardevoir",10,17,0,0,2,1,0,0,0],["297","Gallade",10,6,0,0,2,0,0,0,0],["298","Surskit",11,2,1,1,1,1,0,0,0],["299","Masquerain",11,9,0,0,1,1,0,0,0],["300","Shroomish",4,-1,1,1,1,1,0,0,0],["301","Breloom",4,6,0,0,1,1,0,0,0],["302","Slakoth",0,-1,1,1,1,1,0,0,0],["303","Vigoroth",0,-1,0,0,1,1,0,0,0],["304","Slaking",0,-1,0,0,1,1,0,0,0],["305","Nincada",11,8,1,1,1,1,0,0,0],["306","Ninjask",11,9,0,0,1,1,0,0,0],["307","Shedinja",11,13,0,0,1,0,0,0,0],["308","Whismur",0,-1,1,1,1,1,0,0,0],["309","Loudred",0,-1,0,0,1,1,0,0,0],["310","Exploud",0,-1,0,0,1,1,0,0,0],["311","Makuhita",6,-1,1,1,1,1,0,0,0],["312","Hariyama",6,-1,0,0,1,1,0,0,0],["313","Nosepass",12,-1,1,1,1,1,0,0,0],["314","Probopass",12,16,0,0,1,1,0,0,0],["315","Skitty",0,-1,1,1,1,1,0,0,0],["316","Delcatty",0,-1,0,0,1,1,0,0,0],["317","Sableye",15,13,1,1,2,1,0,0,0],["318","Mawile",16,17,1,1,2,1,0,0,0],["319","Aron",16,12,1,1,1,1,0,0,0],["320","Lairon",16,12,0,0,1,0,0,0,0],["321","Aggron",16,12,0,0,2,1,0,0,0],["322","Meditite",6,10,1,1,1,1,0,0,0],["323","Medicham",6,10,0,0,2,1,0,0,0],["324","Electrike",3,-1,1,1,1,1,0,0,0],["325","Manectric",3,-1,0,0,2,1,0,0,0],["326","Plusle",3,-1,1,1,1,1,0,0,0],["327","Minun",3,-1,1,1,1,1,0,0,0],["328","Volbeat",11,-1,1,1,1,1,0,0,0],["329","Illumise",11,-1,1,1,1,1,0,0,0],["330","Gulpin",7,-1,1,1,1,1,0,0,0],["331","Swalot",7,-1,0,0,1,1,0,0,0],["332","Carvanha",2,15,1,1,1,1,0,0,0],["333","Sharpedo",2,15,0,0,2,1,0,0,0],["334","Wailmer",2,-1,1,1,1,1,0,0,0],["335","Wailord",2,-1,0,0,1,0,0,0,0],["336","Numel",1,8,1,1,1,1,0,0,0],["337","Camerupt",1,8,0,0,2,1,0,0,0],["338","Torkoal",1,-1,1,1,1,1,0,0,0],["339","Spoink",10,-1,1,1,1,1,0,0,0],["340","Grumpig",10,-1,0,0,1,1,0,0,0],["341","Spinda",0,-1,1,1,1,1,0,0,0],["342","Trapinch",8,-1,1,1,1,1,0,0,0],["343","Vibrava",8,14,0,0,1,1,0,0,0],["344","Flygon",8,14,0,0,1,1,0,0,0],["345","Cacnea",4,-1,1,1,1,1,0,0,0],["346","Cacturne",4,15,0,0,1,1,0,0,0],["347","Swablu",0,9,1,1,1,1,0,0,0],["348","Altaria",14,9,0,0,2,1,0,0,0],["349","Zangoose",0,-1,1,1,1,1,0,0,0],["350","Seviper",7,-1,1,1,1,1,0,0,0],["351","Lunatone",12,10,1,1,1,1,0,0,0],["352","Solrock",12,10,1,1,1,1,0,0,0],["353","Barboach",2,8,1,1,1,1,0,0,0],["354","Whiscash",2,8,0,0,1,0,0,0,0],["355","Corphish",2,-1,1,1,1,1,0,0,0],["356","Crawdaunt",2,15,0,0,1,0,0,0,0],["357","Baltoy",8,10,1,1,1,1,0,0,0],["358","Claydol",8,10,0,0,1,1,0,0,0],["359","Lileep",12,4,1,1,1,1,0,0,0],["360","Cradily",12,4,0,0,1,1,0,0,0],["361","Anorith",12,11,1,1,1,1,0,0,0],["362","Armaldo",12,11,0,0,1,0,0,0,0],["363","Feebas",2,-1,1,1,1,1,0,0,0],["364","Milotic",2,-1,0,0,1,0,0,0,0],["365","Castform",0,-1,1,1,4,1,0,0,0],["366","Kecleon",0,-1,1,1,1,1,0,0,0],["367","Shuppet",13,-1,1,1,1,1,0,0,0],["368","Banette",13,-1,0,0,2,1,0,0,0],["369","Duskull",13,-1,1,1,1,1,0,0,0],["370","Dusclops",13,-1,0,0,1,0,0,0,0],["371","Dusknoir",13,-1,0,0,1,0,0,0,0],["372","Tropius",4,9,1,1,1,1,0,0,0],["373","Chingling",10,-1,1,1,1,1,0,0,0],["374","Chimecho",10,-1,1,1,1,1,0,0,0],["375","Absol",15,-1,1,1,2,1,0,0,0],["376","Wynaut",10,-1,1,1,1,1,0,0,0],["377","Wobbuffet",10,-1,1,1,1,1,0,0,0],["378","Snorunt",5,-1,1,1,1,1,0,0,0],["379","Glalie",5,-1,0,0,2,1,0,0,0],["380","Froslass",5,13,0,0,1,0,0,0,0],["381","Spheal",5,2,1,1,1,1,0,0,0],["382","Sealeo",5,2,0,0,1,1,0,0,0],["383","Walrein",5,2,0,0,1,0,0,0,0],["384","Clamperl",2,-1,1,1,1,1,0,0,0],["385","Huntail",2,-1,0,0,1,0,0,0,0],["386","Gorebyss",2,-1,0,0,1,1,0,0,0],["387","Relicanth",2,12,1,1,1,1,0,0,0],["388","Luvdisc",2,-1,1,1,1,1,0,0,0],["389","Bagon",14,-1,1,1,1,1,0,0,0],["390","Shelgon",14,-1,0,0,1,1,0,0,0],["391","Salamence",14,9,0,0,2,0,0,0,0],["392","Beldum",16,10,1,1,1,1,0,0,0],["393","Metang",16,10,0,0,1,1,0,0,0],["394","Metagross",16,10,0,0,2,0,0,0,0],["395","Regirock",12,-1,1,0,1,0,0,0,0],["396","Regice",5,-1,1,0,1,0,0,0,0],["397","Registeel",16,-1,1,0,1,0,0,0,0],["398","Latias",14,10,1,0,2,0,0,0,0],["399","Latios",14,10,1,0,2,0,0,0,0],["400","Kyogre",2,-1,1,0,2,0,0,0,0],["401","Groudon",8,-1,1,0,2,0,0,0,0],["402","Rayquaza",14,9,1,0,2,1,0,0,0],["403","Jirachi",16,10,1,0,1,1,0,0,0],["404","Deoxys",10,-1,1,0,4,0,0,0,0]],"4":[["405","Turtwig",4,-1,1,1,1,1,0,0,0],["406","Grotle",4,-1,0,0,1,1,0,0,0],["407","Torterra",4,8,0,0,1,0,0,0,0],["408","Chimchar",1,-1,1,1,1,1,0,0,0],["409","Monferno",1,6,0,0,1,1,0,0,0],["410","Infernape",1,6,0,0,1,1,0,0,0],["411","Piplup",2,-1,1,1,1,1,0,0,0],["412","Prinplup",2,-1,0,0,1,0,0,0,0],["413","Empoleon",2,16,0,0,1,0,0,0,0],["414","Starly",0,9,1,1,1,1,0,0,0],["415","Staravia",0,9,0,0,1,1,0,0,0],["416","Staraptor",0,9,0,0,1,1,0,0,0],["417","Bidoof",0,-1,1,1,1,1,0,0,0],["418","Bibarel",0,2,0,0,1,1,0,0,0],["419","Kricketot",11,-1,1,1,1,1,0,0,0],["420","Kricketune",11,-1,0,0,1,1,0,0,0],["421","Shinx",3,-1,1,1,1,1,0,0,0],["422","Luxio",3,-1,0,0,1,1,0,0,0],["423","Luxray",3,-1,0,0,1,1,0,0,0],["424","Budew",4,7,1,1,1,1,0,0,0],["425","Roselia",4,7,1,1,1,1,0,0,0],["426","Roserade",4,7,0,0,1,0,0,0,0],["427","Cranidos",12,-1,1,1,1,1,0,0,0],["428","Rampardos",12,-1,0,0,1,1,0,0,0],["429","Shieldon",12,16,1,1,1,1,0,0,0],["430","Bastiodon",12,16,0,0,1,0,0,0,0],["431","Burmy",11,-1,1,1,3,1,0,0,0],["432","Wormadam",11,4,0,0,3,0,0,0,0],["433","Mothim",11,9,0,0,1,1,0,0,0],["434","Combee",11,9,1,1,1,1,0,0,0],["435","Vespiquen",11,9,0,0,1,0,0,0,0],["436","Pachirisu",3,-1,1,1,1,1,0,0,0],["437","Buizel",2,-1,1,1,1,1,0,0,0],["438","Floatzel",2,-1,0,0,1,1,0,0,0],["439","Cherubi",4,-1,1,1,1,1,0,0,0],["440","Cherrim",4,-1,0,0,2,1,0,0,0],["441","Shellos",2,-1,1,1,2,2,0,0,0],["442","Gastrodon",2,8,0,0,2,1,0,0,0],["443","Drifloon",13,9,1,1,1,1,0,0,0],["444","Drifblim",13,9,0,0,1,1,0,0,0],["445","Buneary",0,-1,1,1,1,1,0,0,0],["446","Lopunny",0,-1,0,0,2,1,0,0,0],["447","Glameow",0,-1,1,1,1,1,0,0,0],["448","Purugly",0,-1,0,0,1,0,0,0,0],["449","Stunky",7,15,1,1,1,1,0,0,0],["450","Skuntank",7,15,0,0,1,1,0,0,0],["451","Bronzor",16,10,1,1,1,1,0,0,0],["452","Bronzong",16,10,0,0,1,1,0,0,0],["453","Happiny",0,-1,1,1,1,1,0,0,0],["454","Chansey",0,-1,1,1,1,1,0,0,0],["455","Blissey",0,-1,0,0,1,0,0,0,0],["456","Chatot",0,9,1,1,1,1,0,0,0],["457","Spiritomb",13,15,1,1,1,1,0,0,0],["458","Gible",14,8,1,1,1,1,0,0,0],["459","Gabite",14,8,0,0,1,1,0,0,0],["460","Garchomp",14,8,0,0,2,1,0,0,0],["461","Riolu",6,-1,1,1,1,1,0,0,0],["462","Lucario",6,16,0,0,2,1,0,0,0],["463","Hippopotas",8,-1,1,1,1,1,0,0,0],["464","Hippowdon",8,-1,0,0,1,1,0,0,0],["465","Skorupi",7,11,1,1,1,1,0,0,0],["466","Drapion",7,15,0,0,1,0,0,0,0],["467","Croagunk",7,6,1,1,1,1,0,0,0],["468","Toxicroak",7,6,0,0,1,1,0,0,0],["469","Carnivine",4,-1,1,1,1,1,0,0,0],["470","Finneon",2,-1,1,1,1,1,0,0,0],["471","Lumineon",2,-1,0,0,1,0,0,0,0],["472","Mantyke",2,9,1,1,1,1,0,0,0],["473","Mantine",2,9,1,1,1,1,0,0,0],["474","Snover",5,4,1,1,1,1,0,0,0],["475","Abomasnow",5,4,0,0,2,0,0,0,0],["476","Porygon",0,-1,1,1,1,1,0,0,0],["477","Porygon2",0,-1,0,0,1,1,0,0,0],["478","Porygon-Z",0,-1,0,0,1,0,0,0,0],["479","Rotom",3,13,1,1,6,1,0,0,0],["480","Uxie",10,-1,1,0,1,0,0,0,0],["481","Mesprit",10,-1,1,0,1,0,0,0,0],["482","Azelf",10,-1,1,0,1,0,0,0,0],["483","Dialga",16,14,1,0,1,0,0,0,0],["484","Palkia",2,14,1,0,1,0,0,0,0],["485","Heatran",1,16,1,0,1,0,0,0,0],["486","Regigigas",0,-1,1,0,1,0,0,0,0],["487","Giratina",13,14,1,0,2,0,0,0,0],["488","Cresselia",10,-1,1,0,1,0,0,0,0],["489","Phione",2,-1,1,1,1,1,0,0,0],["490","Manaphy",2,-1,1,0,1,0,0,0,0],["491","Darkrai",15,-1,1,0,1,0,0,0,0],["492","Shaymin",4,-1,1,0,2,0,0,0,0],["493","Arceus",0,-1,1,0,18,0,0,0,0]],"5":[["494","Victini",10,1,1,0,1,0,0,0,0],["495","Snivy",4,-1,1,1,1,1,0,0,0],["496","Servine",4,-1,0,0,1,0,0,0,0],["497","Serperior",4,-1,0,0,1,1,0,0,0],["498","Tepig",1,-1,1,1,1,1,0,0,0],["499","Pignite",1,6,0,0,1,1,0,0,0],["500","Emboar",1,6,0,0,1,1,0,0,0],["501","Oshawott",2,-1,1,1,1,1,0,0,0],["502","Dewott",2,-1,0,0,1,1,0,0,0],["503","Samurott",2,-1,0,0,1,1,0,0,0],["504","Patrat",0,-1,1,1,1,1,0,0,0],["505","Watchog",0,-1,0,0,1,1,0,0,0],["506","Lillipup",0,-1,1,1,1,1,0,0,0],["507","Herdier",0,-1,0,0,1,1,0,0,0],["508","Stoutland",0,-1,0,0,1,1,0,0,0],["509","Purrloin",15,-1,1,1,1,1,0,0,0],["510","Liepard",15,-1,0,0,1,1,0,0,0],["511","Pansage",4,-1,1,1,1,1,0,0,0],["512","Simisage",4,-1,0,0,1,0,0,0,0],["513","Pansear",1,-1,1,1,1,1,0,0,0],["514","Simisear",1,-1,0,0,1,0,0,0,0],["515","Panpour",2,-1,1,1,1,1,0,0,0],["516","Simipour",2,-1,0,0,1,0,0,0,0],["517","Munna",10,-1,1,1,1,1,0,0,0],["518","Musharna",10,-1,0,0,1,1,0,0,0],["519","Pidove",0,9,1,1,1,1,0,0,0],["520","Tranquill",0,9,0,0,1,1,0,0,0],["521","Unfezant",0,9,0,0,1,0,0,0,0],["522","Blitzle",3,-1,1,1,1,1,0,0,0],["523","Zebstrika",3,-1,0,0,1,1,0,0,0],["524","Roggenrola",12,-1,1,1,1,1,0,0,0],["525","Boldore",12,-1,0,0,1,1,0,0,0],["526","Gigalith",12,-1,0,0,1,1,0,0,0],["527","Woobat",10,9,1,1,1,1,0,0,0],["528","Swoobat",10,9,0,0,1,1,0,0,0],["529","Drilbur",8,-1,1,1,1,1,0,0,0],["530","Excadrill",8,16,0,0,1,1,0,0,0],["531","Audino",0,-1,1,1,2,1,0,0,0],["532","Timburr",6,-1,1,1,1,1,0,0,0],["533","Gurdurr",6,-1,0,0,1,0,0,0,0],["534","Conkeldurr",6,-1,0,0,1,0,0,0,0],["535","Tympole",2,-1,1,1,1,1,0,0,0],["536","Palpitoad",2,8,0,0,1,0,0,0,0],["537","Seismitoad",2,8,0,0,1,0,0,0,0],["538","Throh",6,-1,1,1,1,1,0,0,0],["539","Sawk",6,-1,1,1,1,1,0,0,0],["540","Sewaddle",11,4,1,1,1,1,0,0,0],["541","Swadloon",11,4,0,0,1,1,0,0,0],["542","Leavanny",11,4,0,0,1,0,0,0,0],["543","Venipede",11,7,1,1,1,1,0,0,0],["544","Whirlipede",11,7,0,0,1,1,0,0,0],["545","Scolipede",11,7,0,0,1,1,0,0,0],["546","Cottonee",4,17,1,1,1,1,0,0,0],["547","Whimsicott",4,17,0,0,1,0,0,0,0],["548","Petilil",4,-1,1,1,1,1,0,0,0],["549","Lilligant",4,-1,0,0,1,1,0,0,0],["550","Basculin",2,-1,1,1,2,1,0,0,0],["551","Sandile",8,15,1,1,1,1,0,0,0],["552","Krokorok",8,15,0,0,1,1,0,0,0],["553","Krookodile",8,15,0,0,1,0,0,0,0],["554","Darumaka",1,-1,1,1,1,1,0,0,0],["555","Darmanitan",1,-1,0,0,2,1,0,0,0],["556","Maractus",4,-1,1,1,1,1,0,0,0],["557","Dwebble",11,12,1,1,1,1,0,0,0],["558","Crustle",11,12,0,0,1,0,0,0,0],["559","Scraggy",15,6,1,1,1,1,0,0,0],["560","Scrafty",15,6,0,0,1,0,0,0,0],["561","Sigilyph",10,9,1,1,1,1,0,0,0],["562","Yamask",13,-1,1,1,1,1,0,0,0],["563","Cofagrigus",13,-1,0,0,1,0,0,0,0],["564","Tirtouga",2,12,1,1,1,1,0,0,0],["565","Carracosta",2,12,0,0,1,0,0,0,0],["566","Archen",12,9,1,1,1,1,0,0,0],["567","Archeops",12,9,0,0,1,0,0,0,0],["568","Trubbish",7,-1,1,1,1,1,0,0,0],["569","Garbodor",7,-1,0,0,1,1,0,0,0],["570","Zorua",15,-1,1,1,1,1,0,0,0],["571","Zoroark",15,-1,0,0,1,1,0,0,0],["572","Minccino",0,-1,1,1,1,1,0,0,0],["573","Cinccino",0,-1,0,0,1,1,0,0,0],["574","Gothita",10,-1,1,1,1,1,0,0,0],["575","Gothorita",10,-1,0,0,1,1,0,0,0],["576","Gothitelle",10,-1,0,0,1,0,0,0,0],["577","Solosis",10,-1,1,1,1,1,0,0,0],["578","Duosion",10,-1,0,0,1,1,0,0,0],["579","Reuniclus",10,-1,0,0,1,1,0,0,0],["580","Ducklett",2,9,1,1,1,1,0,0,0],["581","Swanna",2,9,0,0,1,0,0,0,0],["582","Vanillite",5,-1,1,1,1,1,0,0,0],["583","Vanillish",5,-1,0,0,1,0,0,0,0],["584","Vanilluxe",5,-1,0,0,1,0,0,0,0],["585","Deerling",0,4,1,1,1,1,0,0,0],["586","Sawsbuck",0,4,0,0,1,1,0,0,0],["587","Emolga",3,9,1,1,1,1,0,0,0],["588","Karrablast",11,-1,1,1,1,1,0,0,0],["589","Escavalier",11,16,0,0,1,0,0,0,0],["590","Foongus",4,7,1,1,1,1,0,0,0],["591","Amoonguss",4,7,0,0,1,1,0,0,0],["592","Frillish",2,13,1,1,1,1,0,0,0],["593","Jellicent",2,13,0,0,1,0,0,0,0],["594","Alomomola",2,-1,1,1,1,1,0,0,0],["595","Joltik",11,3,1,1,1,1,0,0,0],["596","Galvantula",11,3,0,0,1,1,0,0,0],["597","Ferroseed",4,16,1,1,1,1,0,0,0],["598","Ferrothorn",4,16,0,0,1,0,0,0,0],["599","Klink",16,-1,1,1,1,1,0,0,0],["600","Klang",16,-1,0,0,1,0,0,0,0],["601","Klinklang",16,-1,0,0,1,0,0,0,0],["602","Tynamo",3,-1,1,1,1,1,0,0,0],["603","Eelektrik",3,-1,0,0,1,1,0,0,0],["604","Eelektross",3,-1,0,0,1,1,0,0,0],["605","Elgyem",10,-1,1,1,1,1,0,0,0],["606","Beheeyem",10,-1,0,0,1,0,0,0,0],["607","Litwick",13,1,1,1,1,1,0,0,0],["608","Lampent",13,1,0,0,1,0,0,0,0],["609","Chandelure",13,1,0,0,1,0,0,0,0],["610","Axew",14,-1,1,1,1,1,0,0,0],["611","Fraxure",14,-1,0,0,1,0,0,0,0],["612","Haxorus",14,-1,0,0,1,0,0,0,0],["613","Cubchoo",5,-1,1,1,1,1,0,0,0],["614","Beartic",5,-1,0,0,1,0,0,0,0],["615","Cryogonal",5,-1,1,1,1,1,0,0,0],["616","Shelmet",11,-1,1,1,1,1,0,0,0],["617","Accelgor",11,-1,0,0,1,0,0,0,0],["618","Stunfisk",8,3,1,1,1,1,0,0,0],["619","Mienfoo",6,-1,1,1,1,1,0,0,0],["620","Mienshao",6,-1,0,0,1,0,0,0,0],["621","Druddigon",14,-1,1,1,1,1,0,0,0],["622","Golett",8,13,1,1,1,1,0,0,0],["623","Golurk",8,13,0,0,1,0,0,0,0],["624","Pawniard",15,16,1,1,1,1,0,0,0],["625","Bisharp",15,16,0,0,1,0,0,0,0],["626","Bouffalant",0,-1,1,1,1,1,0,0,0],["627","Rufflet",0,9,1,1,1,1,0,0,0],["628","Braviary",0,9,0,0,1,1,0,0,0],["629","Vullaby",15,9,1,1,1,1,0,0,0],["630","Mandibuzz",15,9,0,0,1,0,0,0,0],["631","Heatmor",1,-1,1,1,1,1,0,0,0],["632","Durant",11,16,1,1,1,1,0,0,0],["633","Deino",15,14,1,1,1,1,0,0,0],["634","Zweilous",15,14,0,0,1,0,0,0,0],["635","Hydreigon",15,14,0,0,1,0,0,0,0],["636","Larvesta",11,1,1,1,1,1,0,0,0],["637","Volcarona",11,1,0,0,1,0,0,0,0],["638","Cobalion",16,6,1,0,1,0,0,0,0],["639","Terrakion",12,6,1,0,1,0,0,0,0],["640","Virizion",4,6,1,0,1,0,0,0,0],["641","Tornadus",9,-1,1,0,2,0,0,0,0],["642","Thundurus",3,9,1,0,2,0,0,0,0],["643","Reshiram",14,1,1,0,1,0,0,0,0],["644","Zekrom",14,3,1,0,1,0,0,0,0],["645","Landorus",8,9,1,0,2,0,0,0,0],["646","Kyurem",14,5,1,0,3,0,0,0,0],["647","Keldeo",2,6,1,0,2,0,0,0,0],["648","Meloetta",0,10,1,0,2,0,0,0,0],["649","Genesect",11,16,1,0,5,0,0,0,0]],"6":[["650","Chespin",4,-1,1,1,1,1,0,0,0],["651","Quilladin",4,-1,0,0,1,0,0,0,0],["652","Chesnaught",4,6,0,0,1,0,0,0,0],["653","Fennekin",1,-1,1,1,1,1,0,0,0],["654","Braixen",1,-1,0,0,1,1,0,0,0],["655","Delphox",1,10,0,0,1,0,0,0,0],["656","Froakie",2,-1,1,1,1,1,0,0,0],["657","Frogadier",2,-1,0,0,1,1,0,0,0],["658","Greninja",2,15,0,0,1,0,0,0,0],["659","Bunnelby",0,-1,1,1,1,1,0,0,0],["660","Diggersby",0,8,0,0,1,1,0,0,0],["661","Fletchling",0,9,1,1,1,1,0,0,0],["662","Fletchinder",1,9,0,0,1,1,0,0,0],["663","Talonflame",1,9,0,0,1,1,0,0,0],["664","Scatterbug",11,-1,1,1,1,1,1,0,0],["665","Spewpa",11,-1,0,0,1,1,1,0,0],["666","Vivillon",11,9,0,0,1,1,0,0,0],["667","Litleo",1,0,1,1,1,1,0,0,0],["668","Pyroar",1,0,0,0,1,1,0,0,0],["669","Flab\u00e9b\u00e9",17,-1,1,1,1,1,0,0,0],["670","Floette",17,-1,0,0,1,1,0,0,0],["671","Florges",17,-1,0,0,1,1,0,0,0],["672","Skiddo",4,-1,1,1,1,1,0,0,0],["673","Gogoat",4,-1,0,0,1,1,0,0,0],["674","Pancham",6,-1,1,1,1,1,0,0,0],["675","Pangoro",6,15,0,0,1,0,0,0,0],["676","Furfrou",0,-1,1,1,1,1,0,0,0],["677","Espurr",10,-1,1,1,1,1,0,0,0],["678","Meowstic",10,-1,0,0,1,1,0,0,0],["679","Honedge",16,13,1,1,1,1,0,0,0],["680","Doublade",16,13,0,0,1,1,0,0,0],["681","Aegislash",16,13,0,0,2,1,0,0,0],["682","Spritzee",17,-1,1,1,1,1,0,0,0],["683","Aromatisse",17,-1,0,0,1,0,0,0,0],["684","Swirlix",17,-1,1,1,1,1,0,0,0],["685","Slurpuff",17,-1,0,0,1,1,0,0,0],["686","Inkay",15,10,1,1,1,1,0,0,0],["687","Malamar",15,10,0,0,1,0,0,0,0],["688","Binacle",12,2,1,1,1,1,0,0,0],["689","Barbaracle",12,2,0,0,1,0,0,0,0],["690","Skrelp",7,2,1,1,1,1,0,0,0],["691","Dragalge",7,14,0,0,1,0,0,0,0],["692","Clauncher",2,-1,1,1,1,1,0,0,0],["693","Clawitzer",2,-1,0,0,1,0,0,0,0],["694","Helioptile",3,0,1,1,1,1,0,0,0],["695","Heliolisk",3,0,0,0,1,0,0,0,0],["696","Tyrunt",12,14,1,1,1,1,0,0,0],["697","Tyrantrum",12,14,0,0,1,0,0,0,0],["698","Amaura",12,5,1,1,1,1,0,0,0],["699","Aurorus",12,5,0,0,1,1,0,0,0],["700","Hawlucha",6,9,1,1,1,1,0,0,0],["701","Dedenne",3,17,1,1,1,1,0,0,0],["702","Carbink",12,17,1,1,1,1,0,0,0],["703","Goomy",14,-1,1,1,1,1,0,0,0],["704","Sliggoo",14,-1,0,0,1,0,0,0,0],["705","Goodra",14,-1,0,0,1,0,0,0,0],["706","Klefki",16,17,1,1,1,1,0,0,0],["707","Phantump",13,4,1,1,1,1,0,0,0],["708","Trevenant",13,4,0,0,1,1,0,0,0],["709","Pumpkaboo",13,4,1,1,4,3,0,0,0],["710","Gourgeist",13,4,0,0,4,3,0,0,0],["711","Bergmite",5,-1,1,1,1,1,0,0,0],["712","Avalugg",5,-1,0,0,1,1,0,0,0],["713","Noibat",9,14,1,1,1,1,0,0,0],["714","Noivern",9,14,0,0,1,1,0,0,0],["715","Xerneas",17,-1,1,0,1,0,0,0,0],["716","Yveltal",15,9,1,0,1,0,0,0,0],["717","Zygarde",14,8,1,0,4,0,0,0,0],["718","Diancie",12,17,1,1,2,1,0,0,0],["719","Hoopa",10,13,1,0,2,0,0,0,0],["720","Volcanion",1,2,1,0,1,0,0,0,0]],"7":[["721","Rowlet",4,9,1,1,1,1,0,0,0],["722","Dartrix",4,9,0,0,1,1,0,0,0],["723","Decidueye",4,13,0,0,1,1,0,0,0],["724","Litten",1,-1,1,1,1,1,0,0,0],["725","Torracat",1,-1,0,0,1,1,0,0,0],["726","Incineroar",1,15,0,0,1,1,0,0,0],["727","Popplio",2,-1,1,1,1,1,0,0,0],["728","Brionne",2,-1,0,0,1,1,0,0,0],["729","Primarina",2,17,0,0,1,1,0,0,0],["730","Pikipek",0,9,1,1,1,1,0,0,0],["731","Trumbeak",0,9,0,0,1,1,0,0,0],["732","Toucannon",0,9,0,0,1,1,0,0,0],["733","Yungoos",0,-1,1,1,1,1,0,0,0],["734","Gumshoos",0,-1,0,0,2,0,0,0,0],["735","Grubbin",11,-1,1,1,1,1,0,0,0],["736","Charjabug",11,3,0,0,1,1,0,0,0],["737","Vikavolt",11,3,0,0,2,1,0,0,0],["738","Crabrawler",6,-1,1,1,1,1,0,0,0],["739","Crabominable",6,5,0,0,1,1,0,0,0],["740","Oricorio",1,9,1,1,4,3,0,0,0],["741","Cutiefly",11,17,1,1,1,1,0,0,0],["742","Ribombee",11,17,0,0,2,1,0,0,0],["743","Rockruff",12,-1,1,1,1,1,0,0,0],["744","Lycanroc",12,-1,0,0,3,1,0,0,0],["745","Wishiwashi",2,-1,1,1,3,1,0,0,0],["746","Mareanie",7,2,1,1,1,1,0,0,0],["747","Toxapex",7,2,0,0,1,1,0,0,0],["748","Mudbray",8,-1,1,1,1,1,0,0,0],["749","Mudsdale",8,-1,0,0,1,1,0,0,0],["750","Dewpider",2,11,1,1,1,1,0,0,0],["751","Araquanid",2,11,0,0,2,1,0,0,0],["752","Fomantis",4,-1,1,1,1,1,0,0,0],["753","Lurantis",4,-1,0,0,2,0,0,0,0],["754","Morelull",4,17,1,1,1,1,0,0,0],["755","Shiinotic",4,17,0,0,1,1,0,0,0],["756","Salandit",7,1,1,1,1,1,0,0,0],["757","Salazzle",7,1,0,0,2,0,0,0,0],["758","Stufful",0,6,1,1,1,1,0,0,0],["759","Bewear",0,6,0,0,1,1,0,0,0],["760","Bounsweet",4,-1,1,1,1,1,1,0,0],["761","Steenee",4,-1,0,0,1,1,0,0,0],["762","Tsareena",4,-1,0,0,1,0,0,0,0],["763","Comfey",17,-1,1,1,1,1,0,0,0],["764","Oranguru",0,10,1,1,1,1,0,0,0],["765","Passimian",6,-1,1,1,1,1,0,0,0],["766","Wimpod",11,2,1,1,1,1,0,0,0],["767","Golisopod",11,2,0,0,1,1,0,0,0],["768","Sandygast",13,8,1,1,1,1,0,0,0],["769","Palossand",13,8,0,0,1,0,0,0,0],["770","Pyukumuku",2,-1,1,1,1,1,0,0,0],["771","Type: Null",0,-1,1,0,1,0,0,0,0],["772","Silvally",0,-1,0,0,18,0,0,0,0],["773","Minior",12,9,1,1,2,1,0,0,0],["774","Komala",0,-1,1,1,1,1,0,0,0],["775","Turtonator",1,14,1,1,1,1,0,0,0],["776","Togedemaru",3,16,1,1,2,1,0,0,0],["777","Mimikyu",13,17,1,1,2,1,0,0,0],["778","Bruxish",2,10,1,1,1,1,0,0,0],["779","Drampa",0,14,1,1,1,1,0,0,0],["780","Dhelmise",13,4,1,1,1,1,0,0,0],["781","Jangmo-o",14,-1,1,1,1,1,0,0,0],["782","Hakamo-o",14,6,0,0,1,0,0,0,0],["783","Kommo-o",14,6,0,0,2,0,0,0,0],["784","Tapu Koko",3,17,1,0,1,0,0,0,0],["785","Tapu Lele",10,17,1,0,1,0,0,0,0],["786","Tapu Bulu",4,17,1,0,1,0,0,0,0],["787","Tapu Fini",2,17,1,0,1,0,0,0,0],["788","Cosmog",10,-1,1,0,1,0,0,0,0],["789","Cosmoem",10,-1,0,0,1,0,0,0,0],["790","Solgaleo",10,16,0,0,1,0,0,0,0],["791","Lunala",10,13,0,0,1,0,0,0,0],["792","Nihilego",12,7,1,0,1,0,0,0,0],["793","Buzzwole",11,6,1,0,1,0,0,0,0],["794","Pheromosa",11,6,1,0,1,0,0,0,0],["795","Xurkitree",3,-1,1,0,1,0,0,0,0],["796","Celesteela",16,9,1,0,1,0,0,0,0],["797","Kartana",4,16,1,0,1,0,0,0,0],["798","Guzzlord",15,14,1,0,1,0,0,0,0],["799","Poipole",7,-1,1,0,1,0,0,0,0],["800","Naganadel",7,14,0,0,1,0,0,0,0],["801","Stakataka",12,16,1,0,1,0,0,0,0],["802","Blacephalon",1,13,1,0,1,0,0,0,0],["803","Necrozma",10,-1,1,0,4,0,0,0,0],["804","Magearna",16,17,1,0,1,0,0,0,0],["805","Marshadow",6,13,1,0,1,0,0,0,0],["806","Zeraora",3,-1,1,0,1,0,0,0,0]],"97":[["000a1","Lunupine",15,-1,1,1,1,1,0,0,0],["000","????????",15,17,0,0,1,0,0,0,0],["000","???????",2,-1,1,0,1,0,0,0,0],["000","???????",2,-1,0,0,1,0,0,0,0],["000a4","Orkit",2,-1,1,0,1,1,0,0,0],["000a6","Orcalot",2,16,0,0,1,1,0,0,0],["000","????????",17,9,1,0,1,0,0,0,0],["000","??????????",17,9,0,0,1,0,0,0,0],["000","?????????",17,9,0,0,1,0,0,0,0],["000","??????",7,17,1,0,1,0,0,0,0],["000","???????????",7,17,0,0,1,0,0,0,0],["000","??????",0,9,1,0,1,0,0,0,0],["000","????????",10,9,0,0,1,0,0,0,0],["000ae","Impyre",15,-1,1,0,1,1,0,0,0],["000","?????????",15,1,0,0,1,0,0,0,0],["000","???????",14,2,1,0,1,0,0,0,0],["000ah","Solynx",1,-1,1,1,1,1,0,0,0],["000","??????",1,3,0,0,1,0,0,0,0],["000","?????",5,-1,1,0,1,0,0,0,0],["000","?????",5,-1,0,0,1,0,0,0,0],["000ak","Boxaby",12,6,1,0,1,1,0,0,0],["000","????????",12,6,0,0,1,0,0,0,0],["000","???????",5,17,1,0,1,0,0,0,0],["000","???????",5,17,0,0,1,0,0,0,0],["000","????????",4,-1,1,0,1,0,0,0,0],["000","????????",4,-1,0,0,1,0,0,0,0],["000","?????????",4,6,0,0,1,0,0,0,0],["000","???????",1,9,1,0,1,0,0,0,0],["000","????????",1,17,0,0,1,0,0,0,0],["000","??????????",1,17,0,0,1,0,0,0,0],["000","???????",2,-1,1,0,1,0,0,0,0],["000","????????",2,-1,0,0,1,0,0,0,0],["000","??????????",2,16,0,0,1,0,0,0,0],["000","??????",13,14,1,0,1,0,0,0,0],["000","???????",13,14,0,0,1,0,0,0,0],["000","????????",13,14,0,0,1,0,0,0,0],["000","????????",15,1,1,0,1,0,0,0,0],["000","??????",4,9,1,0,1,0,0,0,0],["000","??????",4,9,0,0,1,0,0,0,0],["000","??????",4,10,0,0,1,0,0,0,0],["000","????????",8,-1,1,0,1,0,0,0,0],["000","????????",8,11,0,0,1,0,0,0,0],["000","??????????",3,9,1,0,1,0,0,0,0],["000","??????????",3,9,0,0,1,0,0,0,0],["000","???????",12,17,1,0,1,0,0,0,0],["000","?????????",10,-1,1,0,1,0,0,0,0],["000","?????????",10,13,0,0,1,0,0,0,0],["000","???????",12,13,1,0,1,0,0,0,0],["000","?????????",0,15,1,0,1,0,0,0,0],["000","???????",11,-1,1,0,1,0,0,0,0],["000","??????????",11,-1,0,0,1,0,0,0,0],["000","??????????",11,-1,0,0,1,0,0,0,0],["000","???????",0,-1,1,0,1,0,0,0,0],["000bh","Glaquine",5,-1,1,0,1,1,0,0,0],["000","?????????",5,-1,0,0,1,0,0,0,0],["000","????????",16,-1,1,0,1,0,0,0,0],["000","????????",16,-1,0,0,1,0,0,0,0],["000","????????",16,-1,0,0,1,0,0,0,0],["000","???????",8,-1,1,0,1,0,0,0,0],["000","???????",8,-1,0,0,1,0,0,0,0],["000","????????",2,15,1,0,1,0,0,0,0],["000","?????????",2,15,0,0,1,0,0,0,0],["000","?????????",2,15,0,0,1,0,0,0,0],["000","??????",0,10,1,0,1,0,0,0,0],["000","?????????",0,13,0,0,1,0,0,0,0],["000","???????",2,13,1,0,1,0,0,0,0],["000","??????????",2,13,0,0,1,0,0,0,0],["000","????????????",11,-1,1,0,1,0,0,0,0],["000","??????????",11,-1,0,0,1,0,0,0,0],["000","???????????",11,10,0,0,1,0,0,0,0],["000","???????",11,7,1,0,1,0,0,0,0],["000","???????",10,17,1,0,1,0,0,0,0],["000","???????",10,17,0,0,1,0,0,0,0],["000","??????",8,-1,1,0,1,0,0,0,0],["000","???????",8,6,0,0,1,0,0,0,0],["000","?????????",8,6,0,0,1,0,0,0,0],["000","?????????",12,-1,1,0,1,0,0,0,0],["000","???????",12,14,0,0,1,0,0,0,0],["000","?????????",12,14,0,0,1,0,0,0,0],["000","?????????",12,7,0,0,1,0,0,0,0],["000","????????",12,7,0,0,1,0,0,0,0],["000","???????",4,17,1,0,1,0,0,0,0],["000","???????",4,17,0,0,1,0,0,0,0],["000","??????",7,0,1,0,1,0,0,0,0],["000","???????",7,0,0,0,1,0,0,0,0],["000","??????",4,-1,1,0,1,0,0,0,0],["000","????????",4,15,0,0,1,0,0,0,0],["000","???????",5,12,1,0,1,0,0,0,0],["000","????????",5,12,0,0,1,0,0,0,0]],"98":[["012-Q","Butterfree/Mega Forme Q",11,10,0,0,1,0,0,0,0],["024-Q","Arbok/Mega Forme Q",7,15,0,0,1,0,0,0,0],["027-Q","Raichu/Mega Forme Q",3,6,0,0,1,0,0,0,0],["039-Q","Ninetales/Mega Forme Q",1,10,0,0,1,0,0,0,0],["057-Q","Persian/Mega Forme Q",0,13,0,0,1,0,0,0,0],["063-Q","Arcanine/Mega Forme Q",1,14,0,0,1,0,0,0,0],["083-Q","Rapidash/Mega Forme Q",1,9,0,0,1,0,0,0,0],["090-Q","Farfetch"d/Mega Forme Q",0,9,0,0,1,0,0,0,0],["094-Q","Dewgong/Mega Forme Q",2,5,0,0,1,0,0,0,0],["113-Q","Marowak/Alolan Mega Forme Q",1,13,0,0,1,0,0,0,0],["136-Q","Jynx/Mega Forme Q",5,10,0,0,1,0,0,0,0],["141-Q","Lapras/Mega Forme Q",2,5,0,0,1,0,0,0,0],["144-Q","Vaporeon/Mega Forme Q",2,-1,0,0,1,0,0,0,0],["145-Q","Jolteon/Mega Forme Q",3,-1,0,0,1,0,0,0,0],["146-Q","Flareon/Mega Forme Q",1,-1,0,0,1,0,0,0,0],["147-Q","Espeon/Mega Forme Q",10,-1,0,0,1,0,0,0,0],["148-Q","Umbreon/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["149-Q","Leafeon/Mega Forme Q",4,-1,0,0,1,0,0,0,0],["150-Q","Glaceon/Mega Forme Q",5,-1,0,0,1,0,0,0,0],["151-Q","Sylveon/Mega Forme Q",17,-1,0,0,1,0,0,0,0],["164-Q","Dragonite/Mega Forme Q",14,9,0,0,1,0,0,0,0],["166-Q","Mew/Mega Forme Q",10,-1,0,0,1,0,0,0,0],["177-Q","Furret/Mega Forme Q",0,14,0,0,1,0,0,0,0],["201-Q","Jumpluff/Mega Forme Q",4,17,0,0,1,0,0,0,0],["215-Q","Girafarig/Mega Forme Q",0,10,0,0,1,1,0,0,0],["218-Q","Dunsparce/Mega Forme Q",0,14,0,0,1,0,0,0,0],["227-Q","Weavile/Mega Forme Q",15,5,0,0,1,0,0,0,0],["239-Q","Skarmory/Mega Forme Q",16,14,0,0,1,0,0,0,0],["263-Q","Lugia/Mega Forme Q",10,9,0,0,1,0,0,0,0],["264-Q","Ho-oh/Mega Forme Q",1,9,0,0,1,0,0,0,0],["276-Q","Mightyena/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["301-Q","Breloom/Mega Forme Q",4,6,0,0,1,0,0,0,0],["325-Q","Manectric/Mega Forme Q",3,1,0,0,1,0,0,0,0],["335-Q","Wailord/Mega Forme Q",2,9,0,0,1,0,0,0,0],["344-Q","Flygon/Mega Forme Q",8,14,0,0,1,0,0,0,0],["349-Q","Zangoose/Mega Forme Q",0,15,0,0,1,0,0,0,0],["350-Q","Seviper/Mega Forme Q",7,2,0,0,1,0,0,0,0],["364-Q","Milotic/Mega Forme Q",2,17,0,0,1,0,0,0,0],["380-Q","Froslass/Mega Forme Q",5,13,0,0,1,0,0,0,0],["403-Q","Jirachi/Mega Forme Q",16,10,0,0,1,0,0,0,0],["423-Q","Luxray/Mega Forme Q",3,15,0,0,1,0,0,0,0],["438-Q","Floatzel/Mega Forme Q",2,-1,0,0,1,0,0,0,0],["487-Q","Giratina/Mega Forme Q",13,14,0,0,1,0,0,0,0],["510-Q","Liepard/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["571-Q","Zoroark/Mega Forme Q",15,-1,0,0,1,0,0,0,0],["612-Q","Haxorus/Mega Forme Q",14,16,0,0,1,0,0,0,0],["621-Q","Druddigon/Mega Forme Q",14,12,0,0,1,0,0,0,0],["668-Q","Pyroar/Mega Forme Q",1,0,0,0,1,1,0,0,0],["673-Q","Gogoat/Mega Forme Q",4,-1,0,0,1,0,0,0,0],["695-Q","Heliolisk/Mega Forme Q",3,1,0,0,1,0,0,0,0],["700-Q","Hawlucha/Mega Forme Q",6,9,0,0,1,0,0,0,0],["714-Q","Noivern/Mega Forme Q",9,14,0,0,1,0,0,0,0]],"99":[["019s1","Saiyan Rattata",0,6,1,0,1,0,0,0,0],["019s2","Super-Saiyan Rattata",0,6,0,0,1,0,0,0,0],["020s1","Super-Saiyan Raticate",0,6,0,0,1,0,0,0,0],["020s2","Super-Saiyan 2 Raticate",0,6,0,0,1,0,0,0,0],["020-S","Super-Saiyan 3 Raticate",0,6,0,0,1,0,0,0,0],["020-T","Super-Saiyan 4 Raticate",0,6,0,0,1,0,0,0,0],["025f","Flying Pichu",3,-1,1,0,1,0,0,0,0],["025s","Surfing Pichu",3,-1,1,0,1,0,0,0,0],["026f","Flying Pikachu",3,-1,0,0,1,0,0,0,0],["026s","Surfing Pikachu",3,-1,0,0,1,0,0,0,0],["026w","Snowboarding Pikachu",3,-1,0,0,1,0,0,0,0],["027f","Flying Raichu",3,9,0,0,1,0,0,0,0],["027s","Surfing Raichu",3,2,0,0,1,0,0,0,0],["027w","Snowboarding Raichu",3,5,0,0,1,0,0,0,0],["035s","Shooting Star Cleffa",17,-1,1,0,1,1,0,0,0],["036s","Shooting Star Clefairy",17,-1,0,0,1,0,0,0,0],["037s","Shooting Star Clefable",17,-1,0,0,1,0,0,0,0],["038a","Koroku",1,5,1,0,1,0,0,0,0],["039-A","Kyukori",1,5,0,0,1,0,0,0,0],["040g","Guild Igglybuff",0,17,1,0,1,0,0,0,0],["041g","Guild Jigglypuff",0,17,0,0,1,0,0,0,0],["042g","Guild Wigglytuff",0,17,0,0,1,0,0,0,0],["062x","Apocalyptic Growlithe",1,-1,1,0,1,1,0,0,0],["063x","Apocalyptic Arcanine",1,1,0,0,1,0,0,0,0],["084s","Snowpoke",5,10,1,0,1,0,0,0,0],["085s","Snowbro",5,10,0,0,1,0,0,0,0],["086s","Snowking",5,10,0,0,1,0,0,0,0],["108ds","Death Star Voltorb",3,-1,1,0,1,0,0,0,0],["109ds","Death Star Electrode",3,-1,0,0,1,0,0,0,0],["189e","Early Bird Natu",10,9,1,0,1,0,0,0,0],["190e","Early Bird Xatu",10,9,0,0,1,0,0,0,0],["219v","Gligar/Vampire",8,9,1,0,1,0,0,0,0],["220v","Gliscor/Vampire",8,9,0,0,1,0,0,0,0],["230bm","Blue Moon Slugma",2,-1,1,0,1,0,0,0,0],["231bm","Blue Moon Magcargo",2,12,0,0,1,0,0,0,0],["240i","Frosdour",15,5,1,0,1,0,0,0,0],["241i","Chilldoom",15,5,0,0,1,0,0,0,0],["263xd","XD001",10,9,1,0,1,0,0,0,0],["275x","Apocalyptic Poochyena",15,13,1,0,1,1,0,0,0],["276x","Apocalyptic Mightyena",15,13,0,0,1,0,0,0,0],["300x","Apocalyptic Shroomish",4,7,1,0,1,0,0,0,0],["301x","Apocalyptic Breloom",4,7,0,0,1,0,0,0,0],["402m","Magquaza",14,13,1,0,1,0,0,0,0],["405s","Seasonal Turtwig",4,-1,1,0,1,0,0,0,0],["406s","Seasonal Grotle",4,-1,0,0,1,0,0,0,0],["407s","Seasonal Torterra",4,-1,0,0,1,0,0,0,0],["421f","Shinxel",3,2,1,0,1,0,0,0,0],["422f","Fluxio",3,2,0,0,1,0,0,0,0],["423f","Fluxray",3,2,0,0,1,0,0,0,0],["423-F","Fluxray/Mega Forme Q",3,2,0,0,1,0,0,0,0],["434s","Snow Combee",11,5,1,0,1,0,0,0,0],["435s","Snow Vespiquen",11,5,0,0,1,0,0,0,0],["483p","Dialga/Primal Forme Q",16,14,0,0,1,0,0,0,0],["484p","Palkia/Primal Forme Q",2,14,0,0,1,0,0,0,0],["509h","Purrloin/Hallowe"en Witch",15,-1,1,0,1,1,0,0,0],["510h","Liepard/Hallowe"en Witch",15,-1,0,0,1,1,0,0,0],["622x","Apocalyptic Golett",12,16,1,0,1,0,0,0,0],["623x","Apocalyptic Golurk",12,16,0,0,1,0,0,0,0],["740q","Oricorio/Pointe Style",4,9,0,0,1,0,0,0,0]]}}',
            },
            //userscript settings
            customCss: "",
            shelterEnable: true,
            releaseSelectAll: true,
            fieldSort: true,
            fieldSearch: true,
            privateFieldSearch: true,
            partyMod: true,
            easyEvolve: true,
            labNotifier: true,
            fieldSortSettings : {
                fieldByBerry: false,
                fieldByMiddle: false,
                fieldByGrid: false,
                fieldClickCount: true,
            },
            fieldSearchSettings : {
                fieldCustom: "",
                fieldType: "",
                fieldNature: "",
                fieldNewPokemon: true,
                fieldShiny: true,
                fieldAlbino: true,
                fieldMelanistic: true,
                fieldPrehistoric: true,
                fieldDelta: true,
                fieldMega: true,
                fieldStarter: true,
                fieldCustomSprite: true,
                fieldMale: true,
                fieldFemale: true,
                fieldNoGender: true,
                fieldCustomPokemon: true,
                fieldCustomPng: false,
                fieldItem: true,
                customItem: true,
            },
            partyModSettings : {
                hideDislike: false,
                hideAll: false,
            },
            labNotiferSettings : {
                findLabEgg: "",
                findLabType: "",
            },
        };

        const SETTINGS_SAVE_KEY = GLOBALS.SETTINGS_SAVE_KEY;

        const VARIABLES = { // all the variables that are going to be used in fn
            userSettings : DEFAULT_USER_SETTINGS,
            shelterTypeSearch : GLOBALS.SHELTER_TYPE_TABLE,
            natureList : GLOBALS.NATURE_LIST,
            shelterSearch : GLOBALS.SHELTER_SEARCH_DATA,
            dexDataVar : "",
            evolveListCache : "",
            labSearchArray : [],
            labListArray : [],
            fieldCustomArray : [],
            fieldTypeArray : [],
            fieldNatureArray : [],
        }

        const OBSERVERS = {
            fieldsObserver: new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    fn.API.fieldSorter();
                });
            }),
            partyClickObserver: new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    fn.API.partyModification();
                });
            }),
            labObserver: new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    fn.API.labCustomSearch();
                });
            }),
            evolveObserver: new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    fn.API.easyQuickEvolve();
                });
            }),
        }

        const fn = { // all the functions for the script
            /** background stuff */
            backwork : { // backgrounds stuff
                checkForUpdate() {
                    let version ="";
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://api.github.com/repos/jpgualdarrama/PokeFarmQoL/contents/Poke-Farm-QoL.user.js',
                        responseType: 'json',
                        onload: function(data) {
                            let match = atob(data.response.content).match(/\/\/\s+@version\s+([^\n]+)/);
                            version = match[1];
                            if (compareVersions(GM_info.script.version, version) < 0) {
                                document.querySelector("li[data-name*='QoL']").insertAdjacentHTML('afterend', TEMPLATES.qolHubUpdateLinkHTML);
                            }
                        }
                    });
                },
                loadSettings() { // initial settings on first run and setting the variable settings key
                    if (VARIABLES.userSettings.shelterEnable === true && Helpers.onShelterPage()) {
                        ShelterPage.loadSettings();
                    } else if (VARIABLES.userSettings.privateFieldSearch === true && Helpers.onPrivateFieldsPage()) {
                        PrivateFieldsPage.loadSettings();
                    } else {

                        if (localStorage.getItem(SETTINGS_SAVE_KEY) === null) {
                            fn.backwork.saveSettings();
                        } else {
                            try {
                                let countScriptSettings = Object.keys(VARIABLES.userSettings).length +
                                    Object.keys(VARIABLES.userSettings.shelterSettings).length +
                                    Object.keys(VARIABLES.userSettings.fieldSortSettings).length;
                                let localStorageString = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                                let countLocalStorageSettings = Object.keys(localStorageString).length +
                                    Object.keys(localStorageString.shelterSettings).length +
                                    Object.keys(localStorageString.fieldSortSettings).length;
                                if (countLocalStorageSettings < countScriptSettings) { // adds new objects (settings) to the local storage
                                    let defaultsSetting = VARIABLES.userSettings;
                                    let userSetting = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                                    let newSetting = $.extend(true,{}, defaultsSetting, userSetting);

                                    VARIABLES.userSettings = newSetting;
                                    fn.backwork.saveSettings();
                                }
                                if (countLocalStorageSettings > countScriptSettings) { // removes objects from the local storage if they don't exist anymore. Not yet possible..
                                    //let defaultsSetting = VARIABLES.userSettings;
                                    //let userSetting = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                                    fn.backwork.saveSettings();
                                }
                            }
                            catch(err) {
                                fn.backwork.saveSettings();
                            }
                            if (localStorage.getItem(SETTINGS_SAVE_KEY) != VARIABLES.userSettings) {
                                VARIABLES.userSettings = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                            }
                        }
                    }
                },
                saveSettings() { // Save changed settings
                    console.log('TODO - update PFQoL.saveSettings()')
                    if (VARIABLES.userSettings.shelterEnable === true && Helpers.onShelterPage()) {
                        ShelterPage.saveSettings();
                    } else if (VARIABLES.userSettings.privateFieldSearch === true && Helpers.onPrivateFieldsPage()) {
                        PrivateFieldsPage.saveSettings();
                    }
                    localStorage.setItem(SETTINGS_SAVE_KEY, JSON.stringify(VARIABLES.userSettings));
                },
                populateSettingsPage() { // checks all settings checkboxes that are true in the settings
                    for (let key in VARIABLES.userSettings) {
                        if (!VARIABLES.userSettings.hasOwnProperty(key)) {
                            continue;
                        }
                        let value = VARIABLES.userSettings[key];
                        if (typeof value === 'boolean') {
                            Helpers.toggleSetting(key, value, false);
                            continue;
                        }

                       if (typeof value === 'string') {
                            Helpers.toggleSetting(key, value, false);
                            continue;
                       }
                    }
                    if(VARIABLES.userSettings.shelterEnable === true && Helpers.onShelterPage()) {
                        ShelterPage.populateSettings();
                    }

                    for (let key in VARIABLES.userSettings.fieldSortSettings) {
                        if (!VARIABLES.userSettings.fieldSortSettings.hasOwnProperty(key)) {
                            continue;
                        }
                        let value = VARIABLES.userSettings.fieldSortSettings[key];
                        if (typeof value === 'boolean') {
                            Helpers.toggleSetting(key, value, false);
                            continue;
                        }

                       if (typeof value === 'string') {
                            Helpers.toggleSetting(key, value, false);
                            continue;
                       }
                    }
                    for (let key in VARIABLES.userSettings.fieldSearchSettings) {
                        if (!VARIABLES.userSettings.fieldSearchSettings.hasOwnProperty(key)) {
                            continue;
                        }
                        let value = VARIABLES.userSettings.fieldSearchSettings[key];
                        if (typeof value === 'boolean') {
                            Helpers.toggleSetting(key, value, false);
                            continue;
                        }
                    }
                    if(VARIABLES.userSettings.privateFieldSearch === true && Helpers.onPrivateFieldsPage()) {
                       PrivateFieldsPage.populateSettings();
                    }
                    for (let key in VARIABLES.userSettings.partyModSettings) {
                        if (!VARIABLES.userSettings.partyModSettings.hasOwnProperty(key)) {
                            continue;
                        }
                        let value = VARIABLES.userSettings.partyModSettings[key];
                        if (typeof value === 'boolean') {
                            Helpers.toggleSetting(key, value, false);
                            continue;
                        }

                       if (typeof value === 'string') {
                            Helpers.toggleSetting(key, value, false);
                            continue;
                       }
                    }
                },
                setupHTML() { // injects the HTML changes from TEMPLATES into the site
					// Header link to Userscript settings
                    document.querySelector("li[data-name*='Lucky Egg']").insertAdjacentHTML('afterend', TEMPLATES.qolHubLinkHTML);

                    // shelter Settings Menu
                    if (VARIABLES.userSettings.shelterEnable === true && Helpers.onShelterPage()) {
                        ShelterPage.setupHTML();
                        fn.backwork.populateSettingsPage(ShelterPage.getSettings());
                    }

                    // fishing select all button on caught fishing
                    else if (VARIABLES.userSettings.releaseSelectAll === true && Helpers.onFishingPage() && $('#caughtfishcontainer').length > 0) {
                        document.querySelector('#caughtfishcontainer label').insertAdjacentHTML('beforeend', TEMPLATES.massReleaseSelectHTML);
                    }

                    // private fields search
                    if (VARIABLES.userSettings.privateFieldSearch === true && Helpers.onPrivateFieldsPage()) {
						PrivateFieldsPage.setupHTML();
                        fn.backwork.populateSettingsPage(PrivateFieldsPage.getSettings());
                    }

                    //fields search
                    if (VARIABLES.userSettings.fieldSearch === true && Helpers.onPublicFieldsPage()) {
                        document.querySelector('#field_field').insertAdjacentHTML('afterend', TEMPLATES.fieldSearchHTML);

                        const theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="fieldCustom"/></label><input type='button' value='Remove' id='removeFieldSearch'></div>`;
                        const theType = `<div class='typeNumber'> <select name="types" class="qolsetting" data-key="fieldType"> ` + GLOBALS.TYPE_OPTIONS + ` </select> <input type='button' value='Remove' id='removeFieldTypeList'> </div>`;
                        const theNature = `<div class='natureNumber'> <select name="natures" class="qolsetting" data-key="fieldNature"> ` + GLOBALS.NATURE_OPTIONS + ` </select> <input type='button' value='Remove' id='removeFieldNature'> </div>`;
                        VARIABLES.fieldCustomArray = VARIABLES.userSettings.fieldSearchSettings.fieldCustom.split(',');
                        VARIABLES.fieldTypeArray = VARIABLES.userSettings.fieldSearchSettings.fieldType.split(',');
                        VARIABLES.fieldNatureArray = VARIABLES.userSettings.fieldSearchSettings.fieldNature.split(',');
                        Helpers.setupFieldArrayHTML(VARIABLES.fieldCustomArray, 'searchkeys', theField, 'numberDiv');
                        Helpers.setupFieldArrayHTML(VARIABLES.fieldTypeArray, 'fieldTypes', theType, 'typeNumber');
                        Helpers.setupFieldArrayHTML(VARIABLES.fieldNatureArray, 'natureTypes', theNature, 'natureNumber');

                        fn.backwork.populateSettingsPage();
                        VARIABLES.dexDataVar = VARIABLES.userSettings.variData.dexData.split(',');
                    }

                    // fields sorter
                    if (VARIABLES.userSettings.fieldSort === true && Helpers.onPublicFieldsPage()) {
                        document.querySelector('#field_field').insertAdjacentHTML('afterend', TEMPLATES.fieldSortHTML);
                        fn.backwork.populateSettingsPage();
                    }

                    // party click mods
                    if (VARIABLES.userSettings.partyMod === true && Helpers.onMultiuserPage()) {
                        document.querySelector('#multiuser').insertAdjacentHTML('beforebegin', TEMPLATES.partyModHTML);
                        fn.backwork.populateSettingsPage();
                    }

                    // fast evolve list
                    if (VARIABLES.userSettings.easyEvolve === true && Helpers.onFarmPage()) {
                        $(document).ready(function() {
                            $('#farmnews-evolutions>.scrollable>ul').addClass('evolvepkmnlist');
                            document.querySelector('#farm-evolve>h3').insertAdjacentHTML('afterend', '<label id="qolevolvenormal"><input type="button" class="qolsortnormal" value="Normal list"/></label><label id="qolchangesletype"><input type="button" class="qolsorttype" value="Sort on types"/></label><label id="qolsortevolvename"><input type="button" class="qolsortname" value="Sort on name"/></label><label id="qolevolvenew"><input type="button" class="qolsortnew" value="New dex entry"/>');
                        });
                    }

                    //lab notifier
                    if (VARIABLES.userSettings.labNotifier === true && Helpers.onLabPage()) {
                        document.querySelector('#eggsbox360>p.center').insertAdjacentHTML('afterend', TEMPLATES.labOptionsHTML);
                        document.querySelector('#egglist').insertAdjacentHTML('afterend', '<div id="labsuccess"></div>');

                        let theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="findLabEgg"/></label><input type='button' value='Remove' id='removeLabSearch'></div>`;
                        VARIABLES.labSearchArray = VARIABLES.userSettings.labNotiferSettings.findLabEgg.split(',');
                        let numberOfValue = VARIABLES.labSearchArray.length;

                        let i;
                        for (i = 0; i < numberOfValue; i++) {
                            let rightDiv = i + 1;
                            let rightValue = VARIABLES.labSearchArray[i];
                            $('#searchkeys').append(theField);
                            $('.numberDiv').removeClass('numberDiv').addClass(""+rightDiv+"").find('.qolsetting').val(rightValue);
                        }

                        let theType = `<div class='typeNumber'> <select name="types" class="qolsetting" data-key="findLabType"> ` + GLOBALS.TYPE_OPTIONS + ` </select> <input type='button' value='Remove' id='removeLabTypeList'> </div>`;
                        VARIABLES.labListArray = VARIABLES.userSettings.labNotiferSettings.findLabType.split(',');
                        let numberOfType = VARIABLES.labListArray.length;

                        let o;
                        for (o = 0; o < numberOfType; o++) {
                            let rightDiv = o + 1;
                            let rightValue = VARIABLES.labListArray[o];
                            $('#labTypes').append(theType);
                            $('.typeNumber').removeClass('typeNumber').addClass(""+rightDiv+"").find('.qolsetting').val(rightValue);
                        }

                        fn.backwork.populateSettingsPage();
                        VARIABLES.dexDataVar = VARIABLES.userSettings.variData.dexData.split(',');
                    }
                },
                setupCSS() { // All the CSS changes are added here
                    GM_addStyle(GM_getResourceText('QoLCSS'));

                    if(VARIABLES.userSettings.shelterEnable === true && Helpers.onShelterPage()) {
                        ShelterPage.setupCSS();
                    }

                    //lab css
                    let labSuccessCss = $('#labpage>div').css('background-color');
                    $('#labsuccess').css('background-color', labSuccessCss);

                    //fields css
                    let fieldOrderCssColor = $('#field_field').css('background-color');
                    let fieldOrderCssBorder = $('#field_field').css('border');
                    $("#fieldorder").css("background-color", ""+fieldOrderCssColor+"");
                    $("#fieldorder").css("border", ""+fieldOrderCssBorder+"");
					
                    $("#fieldsearch").css("background-color", ""+fieldOrderCssColor+"");
                    $("#fieldsearch").css("border", ""+fieldOrderCssBorder+"");

                    if(VARIABLES.userSettings.privateFieldSearch === true && Helpers.onPrivateFieldsPage()) {
                        PrivateFieldsPage.setupCSS();
                    }

                    //mass party click css
                    let menuBackground = $('#navigation>#navbtns>li>a, #navigation #navbookmark>li>a').css('background-color');
                    $("#qolpartymod").css("background-color", ""+menuBackground+"");
                    let menuColor = $('#navigation>#navbtns>li>a, #navigation #navbookmark>li>a').css('color');
                    $("#qolpartymod").css("color", ""+menuColor+"");

                    //custom user css
                    let customUserCss = VARIABLES.userSettings.customCss;
                    let customUserCssInject = '<style type="text/css">'+customUserCss+'</style>'
                    //document.querySelector('head').append();
                    $('head').append('<style type="text/css">'+customUserCss+'</style>');
                },
                setupObservers() { // all the Observers that needs to run
                    if (VARIABLES.userSettings.shelterEnable === true && Helpers.onShelterPage()) { //observe changes on the shelter page
						ShelterPage.setupObserver();
                    }
                    else if (VARIABLES.userSettings.fieldSort === true && Helpers.onPublicFieldsPage()) { //observe pokemon changes on the fields page
                        OBSERVERS.fieldsObserver.observe(document.querySelector('#field_field'), {
                            childList: true,
                            attributeFilter: ['class'],
                        });
                    }
                    else if (VARIABLES.userSettings.fieldSearch === true && Helpers.onPublicFieldsPage()) { //observe settings changes on the fields page
                        OBSERVERS.fieldsObserver.observe(document.querySelector('#fieldorder'), {
                            childList: true,
                        });
                    }
                    else if (VARIABLES.userSettings.partyMod === true && Helpers.onMultiuserPage()) { //observe party click changes on the users page
                        OBSERVERS.partyClickObserver.observe(document.querySelector('#multiuser'), {
                            childList: true,
                        });
                    }
                    else if (VARIABLES.userSettings.labNotifier === true && Helpers.onLabPage()) { //observe lab changes on the lab page
                        OBSERVERS.labObserver.observe(document.querySelector('#labpage>div>div>div'), {
                            childList: true,
                            characterdata: true,
                            subtree: true,
                            characterDataOldValue: true,
                        });
                    }
                    else if (VARIABLES.userSettings.easyEvolve === true && Helpers.onFarmPage("tab=1")) {
                        OBSERVERS.evolveObserver.observe(document.querySelector('#farmnews-evolutions'), {
                            childList: true,
                            characterdata: true,
                            subtree: true,
                            characterDataOldValue: true,
                        });
                    }
                    else if (VARIABLES.userSettings.privateFieldSearch === true && Helpers.onPrivateFieldsPage()) {
                        PrivateFieldsPage.setupObserver();
                    }
                },
                setupHandlers() { // all the event handlers
					if (VARIABLES.userSettings.shelterEnable === true && Helpers.onShelterPage()) { //observe changes on the shelter page
						ShelterPage.setupHandlers();
                    }
					else if (VARIABLES.userSettings.privateFieldSearch === true && Helpers.onPrivateFieldsPage()) {
						PrivateFieldsPage.setupHandlers();
					}
				},
				startup() { // All the functions that are run to start the script on Pokéfarm
                    return {
                        'loading Settings'        : fn.backwork.loadSettings,
                        'checking for update'    : fn.backwork.checkForUpdate,
                        'setting up HTML'         : fn.backwork.setupHTML,
                        'setting up CSS'        : fn.backwork.setupCSS,
                        'setting up Observers'    : fn.backwork.setupObservers,
						'setting up Handlers' : fn.backwork.setupHandlers,
                    }
                },
                init() { // Starts all the functions.
                    console.log('Starting up ..');
                    let startup = fn.backwork.startup();
                    for (let message in startup) {
                        if (!startup.hasOwnProperty(message)) {
                            continue;
                        }
                        console.log(message);
                        startup[message]();
                    }
                },
            }, // end of backwork

            /** public stuff */
            API : { // the actual seeable and interactable part of the userscript
                qolHubBuild() {
                    document.querySelector('body').insertAdjacentHTML('beforeend', TEMPLATES.qolHubHTML);
                    $('#core').addClass('scrolllock');
                    let qolHubCssBackgroundHead = $('.qolHubHead.qolHubSuperHead').css('background-color');
                    let qolHubCssTextColorHead = $('.qolHubHead.qolHubSuperHead').css('color');
                    let qolHubCssBackground = $('.qolHubTable').css('background-color');
                    let qolHubCssTextColor = $('.qolHubTable').css('color');
                    $('.qolHubHead').css({"backgroundColor":""+qolHubCssBackgroundHead+"","color":""+qolHubCssTextColorHead+""});
                    $('.qolChangeLogHead').css({"backgroundColor":""+qolHubCssBackgroundHead+"","color":""+qolHubCssTextColorHead+""});
                    $('.qolopencloselist.qolChangeLogContent').css({"backgroundColor":""+qolHubCssBackground+"","color":""+qolHubCssTextColor+""});

                    fn.backwork.populateSettingsPage();
                    let customCss = VARIABLES.userSettings.customCss;

                    $('.textareahub').append('<textarea id="qolcustomcss" rows="15" cols="60" class="qolsetting" data-key="customCss"/></textarea>');
                    if (VARIABLES.userSettings.customCss === "") {
                        $('.textareahub textarea').val(`#thisisanexample {\n    color: yellow;\n}\n\n.thisisalsoanexample {\n    background-color: blue!important;\n}\n\nhappycssing {\n    display: absolute;\n}`);
                    } else {
                        $('.textareahub textarea').val(customCss);
                    }

                    $('#qolcustomcss').on('keydown', function(e) {
                        if (e.keyCode == 9 || e.which == 9) {
                            e.preventDefault();
                            var s = this.selectionStart;
                            $(this).val(function(i, v) {
                            return v.substring(0, s) + "\t" + v.substring(this.selectionEnd)
                            });
                            this.selectionEnd = s + 1;
                        }
                     });

                },
                qolHubClose() {
                    $('.dialog').remove();
                    $('#core').removeClass('scrolllock');
                },

                settingsChange(element, textElement, customClass, typeClass) {
                    console.log('baguette')
                    if (JSON.stringify(VARIABLES.userSettings).indexOf(element) >= 0) { // userscript settings
                        if (VARIABLES.userSettings[element] === false ) {
                            VARIABLES.userSettings[element] = true;
                        } else if (VARIABLES.userSettings[element] === true ) {
                            VARIABLES.userSettings[element] = false;
                        } else if (typeof VARIABLES.userSettings[element] === 'string') {
                            VARIABLES.userSettings[element] = textElement;
                        }
                    }
                    else if (ShelterPage.settingsChange(element, textElement, customClass, typeClass)) {
                        console.log('baguette - after')
                        console.log(ShelterPage.getSettings());
                        ShelterPage.saveSettings();
                        console.log('baguette - after 2')
                        console.log(ShelterPage.getSettings());
                    }

                    else if (JSON.stringify(VARIABLES.userSettings.fieldSortSettings).indexOf(element) >= 0) { // field sort settings
                        if (VARIABLES.userSettings.fieldSortSettings[element] === false ) {
                            VARIABLES.userSettings.fieldSortSettings[element] = true;
                            if (element === "fieldByBerry") {
                                VARIABLES.userSettings.fieldSortSettings.fieldByMiddle = false;
                                VARIABLES.userSettings.fieldSortSettings.fieldByGrid = false;
                            } else if (element === "fieldByMiddle") {
                                VARIABLES.userSettings.fieldSortSettings.fieldByBerry = false;
                                VARIABLES.userSettings.fieldSortSettings.fieldByGrid = false;
                            } else if (element === "fieldByGrid") {
                                VARIABLES.userSettings.fieldSortSettings.fieldByBerry = false;
                                VARIABLES.userSettings.fieldSortSettings.fieldByMiddle = false;
                            }
                        } else if (VARIABLES.userSettings.fieldSortSettings[element] === true ) {
                            VARIABLES.userSettings.fieldSortSettings[element] = false;
                        } else if (typeof VARIABLES.userSettings.fieldSortSettings[element] === 'string') {
                            VARIABLES.userSettings.fieldSortSettings[element] = textElement;
                        }
                    }

                    else if (JSON.stringify(VARIABLES.userSettings.fieldSearchSettings).indexOf(element) >= 0) { // field search settings
                        if (VARIABLES.userSettings.fieldSearchSettings[element] === false ) {
                            VARIABLES.userSettings.fieldSearchSettings[element] = true;
                        } else if (VARIABLES.userSettings.fieldSearchSettings[element] === true ) {
                            VARIABLES.userSettings.fieldSearchSettings[element] = false;
                        } else if (typeof VARIABLES.userSettings.fieldSearchSettings[element] === 'string') {
                            if (element === 'fieldType') {
                                if (textElement === 'none') {
                                    let tempIndex = typeClass - 1;
                                    VARIABLES.fieldTypeArray.splice(tempIndex, tempIndex);
                                    VARIABLES.userSettings.fieldSearchSettings.fieldType = VARIABLES.fieldTypeArray.toString();
                                } else {
                                    let tempIndex = typeClass - 1;
                                    VARIABLES.fieldTypeArray[tempIndex] = textElement;
                                    VARIABLES.userSettings.fieldSearchSettings.fieldType = VARIABLES.fieldTypeArray.toString();
                                }
                            }
                            if (element === 'fieldNature') {
                                if (textElement === 'none') {
                                    let tempIndex = typeClass - 1;
                                    VARIABLES.fieldNatureArray.splice(tempIndex, tempIndex);
                                    VARIABLES.userSettings.fieldSearchSettings.fieldNature = VARIABLES.fieldNatureArray.toString();
                                } else {
                                    let tempIndex = typeClass - 1;
                                    VARIABLES.fieldNatureArray[tempIndex] = textElement;
                                    VARIABLES.userSettings.fieldSearchSettings.fieldNature = VARIABLES.fieldNatureArray.toString();
                                }
                            }
                            if (element === 'fieldCustom') {
                                let tempIndex = customClass - 1;
                                VARIABLES.fieldCustomArray[tempIndex] = textElement;
                                VARIABLES.userSettings.fieldSearchSettings.fieldCustom = VARIABLES.fieldCustomArray.toString();
                            }
                        }
                    }

                    else if (PrivateFieldsPage.settingsChange(element, textElement, customClass, typeClass)) {
						PrivateFieldsPage.saveSettings();
                    }

                    else if (JSON.stringify(VARIABLES.userSettings.partyModSettings).indexOf(element) >= 0) { // partymod settings
                        if (VARIABLES.userSettings.partyModSettings[element] === false ) {
                            VARIABLES.userSettings.partyModSettings[element] = true;
                            if (element === "hideAll") {
                                VARIABLES.userSettings.partyModSettings.hideDislike = false;
                                VARIABLES.userSettings.partyModSettings.niceTable = false;
                            } else if (element === "hideDislike") {
                                VARIABLES.userSettings.partyModSettings.hideAll = false;
                                VARIABLES.userSettings.partyModSettings.niceTable = false;
                            } else if (element === "niceTable") {
                                VARIABLES.userSettings.partyModSettings.hideDislike = false;
                                VARIABLES.userSettings.partyModSettings.hideAll = false;
                            }
                        } else if (VARIABLES.userSettings.partyModSettings[element] === true ) {
                            VARIABLES.userSettings.partyModSettings[element] = false;
                        } else if (typeof VARIABLES.userSettings.partyModSettings[element] === 'string') {
                            VARIABLES.userSettings.partyModSettings[element] = textElement;
                        }
                    }

                    if (JSON.stringify(VARIABLES.userSettings.labNotiferSettings).indexOf(element) >= 0) { // lab notifier settings
                        if (element === 'findLabEgg') {
                            let tempIndex = customClass - 1;
                            VARIABLES.labSearchArray[tempIndex] = textElement;
                            VARIABLES.userSettings.labNotiferSettings.findLabEgg = VARIABLES.labSearchArray.toString();
                        }
                        else if(element === 'findLabType') {
                            if (textElement === 'none') {
                                let tempIndex = typeClass - 1;
                                VARIABLES.labListArray.splice(tempIndex, tempIndex);
                                VARIABLES.userSettings.labNotiferSettings.findLabType = VARIABLES.labListArray.toString();
                            } else {
                                let tempIndex = typeClass - 1;
                                VARIABLES.labListArray[tempIndex] = textElement;
                                VARIABLES.userSettings.labNotiferSettings.findLabType = VARIABLES.labListArray.toString();
                            }
                        }
                    }

//                     console.log('baguette - double after')
//                     console.log(ShelterPage.getSettings());
                    fn.backwork.saveSettings();
//                     console.log('baguette - triple after')
//                     console.log(ShelterPage.getSettings());
                },

                shelterAddTextField() { ShelterPage.addTextField(); },
                shelterRemoveTextfield(byebye, key) {
                    ShelterPage.removeTextField(byebye, key);
                    fn.backwork.saveSettings(ShelterPage.settings);
                },
                shelterAddTypeList() { ShelterPage.addTypeList(); },
                shelterRemoveTypeList(byebye, key) {
                    ShelterPage.removeTypeList(byebye, key);
                    fn.backwork.saveSettings(ShelterPage.settings);
                },
                shelterCustomSearch() {
                    console.log('crumb')
                    ShelterPage.loadSettings();
                    ShelterPage.customSearch();
                    console.log('bmurc')
                    ShelterPage.saveSettings();
                },
                shelterRemoveEgg(element) {
                    ShelterPage.loadSettings();
                    ShelterPage.removeEgg(element)
                    ShelterPage.saveSettings();
                },

                releaseFieldSelectAll() {
                    if (VARIABLES.userSettings.releaseSelectAll === true) {
                        document.querySelector('.dialog>div>div>div>div>button').insertAdjacentHTML('afterend', '<label id="selectallfield"><input id="selectallfieldcheckbox" type="checkbox">Select all  </label><label id="selectallfieldany"><input id="selectallfieldanycheckbox" type="checkbox">Select Any  </label><label id="selectallfieldsour"><input id="selectallfieldsourcheckbox" type="checkbox">Select Sour  </label><label id="selectallfieldspicy"><input id="selectallfieldspicycheckbox" type="checkbox">Select Spicy</label><label id="selectallfielddry"><input id="selectallfielddrycheckbox" type="checkbox">Select Dry  </label><label id="selectallfieldsweet"><input id="selectallfieldsweetcheckbox" type="checkbox">Select Sweet  </label><label id="selectallfieldbitter"><input id="selectallfieldbittercheckbox" type="checkbox">Select Bitter  </label>');
                        $('#selectallfieldcheckbox').click(function() {
                            $('#massreleaselist>ul>li>label>input').not(this).prop('checked', this.checked);
                        });

                        $('#selectallfieldanycheckbox').click(function() {
                            let selectAny = $('.icons:contains("Any")').prev().prev().prev('input');
                            $(selectAny).not(this).prop('checked', this.checked);
                        });

                        $('#selectallfieldsourcheckbox').click(function() {
                            let selectSour = $('.icons:contains("Sour")').prev().prev().prev('input');
                            $(selectSour).not(this).prop('checked', this.checked);
                        });

                        $('#selectallfieldspicycheckbox').click(function() {
                            let selectSpicy = $('.icons:contains("Spicy")').prev().prev().prev('input');
                            $(selectSpicy).not(this).prop('checked', this.checked);
                        });

                        $('#selectallfielddrycheckbox').click(function() {
                            let selectDry = $('.icons:contains("Dry")').prev().prev().prev('input');
                            $(selectDry).not(this).prop('checked', this.checked);
                        });

                        $('#selectallfieldsweetcheckbox').click(function() {
                            let selectSweet = $('.icons:contains("Sweet")').prev().prev().prev('input');
                            $(selectSweet).not(this).prop('checked', this.checked);
                        });

                        $('#selectallfieldbittercheckbox').click(function() {
                            let selectBitter = $('.icons:contains("Bitter")').prev().prev().prev('input');
                            $(selectBitter).not(this).prop('checked', this.checked);
                        });

                    }
                },
                moveFieldSelectAll() {
                    if (VARIABLES.userSettings.releaseSelectAll === true) {
                        document.querySelector('.dialog>div>div>div>div>button').insertAdjacentHTML('afterend', '<label id="movefieldselectall"><input id="movefieldselectallcheckbox" type="checkbox">Select all  </label><label id="movefieldselectany"><input id="movefieldselectanycheckbox" type="checkbox">Select Any  </label><label id="movefieldselectsour"><input id="movefieldselectsourcheckbox" type="checkbox">Select Sour  </label><label id="movefieldselectspicy"><input id="movefieldselectspicycheckbox" type="checkbox">Select Spicy</label><label id="movefieldselectdry"><input id="movefieldselectdrycheckbox" type="checkbox">Select Dry  </label><label id="movefieldselectsweet"><input id="movefieldselectsweetcheckbox" type="checkbox">Select Sweet  </label><label id="movefieldselectbitter"><input id="movefieldselectbittercheckbox" type="checkbox">Select Bitter  </label>');
                        $('#movefieldselectallcheckbox').click(function() {
                            $('#massmovelist>ul>li>label>input').not(this).prop('checked', this.checked);
                        });

                        $('#movefieldselectanycheckbox').click(function() {
                            let selectAny = $('.icons:contains("Any")').prev().prev().prev('input');
                            $(selectAny).not(this).prop('checked', this.checked);
                        });

                        $('#movefieldselectsourcheckbox').click(function() {
                            let selectSour = $('.icons:contains("Sour")').prev().prev().prev('input');
                            $(selectSour).not(this).prop('checked', this.checked);
                        });

                        $('#movefieldselectspicycheckbox').click(function() {
                            let selectSpicy = $('.icons:contains("Spicy")').prev().prev().prev('input');
                            $(selectSpicy).not(this).prop('checked', this.checked);
                        });

                        $('#movefieldselectdrycheckbox').click(function() {
                            let selectDry = $('.icons:contains("Dry")').prev().prev().prev('input');
                            $(selectDry).not(this).prop('checked', this.checked);
                        });

                        $('#movefieldselectsweetcheckbox').click(function() {
                            let selectSweet = $('.icons:contains("Sweet")').prev().prev().prev('input');
                            $(selectSweet).not(this).prop('checked', this.checked);
                        });

                        $('#movefieldselectbittercheckbox').click(function() {
                            let selectBitter = $('.icons:contains("Bitter")').prev().prev().prev('input');
                            $(selectBitter).not(this).prop('checked', this.checked);
                        });
                    }
                },
                releaseFishSelectAll() {
                    if (VARIABLES.userSettings.releaseSelectAll === true) {
                        $("#selectallfishcheckbox").click(function(){
                            $('input:checkbox').not(this).prop('checked', this.checked);
                        });

                        $('#movefishselectanycheckbox').click(function() {
                            let selectAny = $('.icons:contains("Any")').prev().prev('input');
                            $(selectAny).not(this).prop('checked', this.checked);
                        });

                        $('#movefishselectsourcheckbox').click(function() {
                            let selectSour = $('.icons:contains("Sour")').prev().prev('input');
                            $(selectSour).not(this).prop('checked', this.checked);
                        });

                        $('#movefishselectspicycheckbox').click(function() {
                            let selectSpicy = $('.icons:contains("Spicy")').prev().prev('input');
                            $(selectSpicy).not(this).prop('checked', this.checked);
                        });

                        $('#movefishselectdrycheckbox').click(function() {
                            let selectDry = $('.icons:contains("Dry")').prev().prev('input');
                            $(selectDry).not(this).prop('checked', this.checked);
                        });

                        $('#movefishselectsweetcheckbox').click(function() {
                            let selectSweet = $('.icons:contains("Sweet")').prev().prev('input');
                            $(selectSweet).not(this).prop('checked', this.checked);
                        });

                        $('#movefishselectbittercheckbox').click(function() {
                            let selectBitter = $('.icons:contains("Bitter")').prev().prev('input');
                            $(selectBitter).not(this).prop('checked', this.checked);
                        });
                    }
                },

                fieldSorter() {
                    if (VARIABLES.userSettings.fieldSort === true) {
                        $('input.qolalone').on('change', function() { //only 1 textbox may be true
                            $('input.qolalone').not(this).prop('checked', false);
                        });

                        if (VARIABLES.userSettings.fieldSortSettings.fieldByBerry === true) { //sort field by berries
                            $('.fieldmon').removeClass("qolSortMiddle");
                            $('.field').removeClass("qolGridField");
                            $('.fieldmon').removeClass("qolGridPokeSize");
                            $('.fieldmon>img').removeClass("qolGridPokeImg");

                            if($('#field_field [data-flavour*="any-"]').length) {
                                $('#field_field [data-flavour*="any-"]').addClass("qolAnyBerry");
                            }
                            if($('#field_field [data-flavour*="sour-"]').length) {
                                $('#field_field [data-flavour*="sour-"]').addClass("qolSourBerry");
                            }
                            if($('#field_field [data-flavour*="spicy-"]').length) {
                                $('#field_field [data-flavour*="spicy-"]').addClass("qolSpicyBerry");
                            }
                            if($('#field_field [data-flavour*="dry-"]').length) {
                                $('#field_field [data-flavour*="dry-"]').addClass("qolDryBerry");
                            }
                            if($('#field_field [data-flavour*="sweet-"]').length) {
                                $('#field_field [data-flavour*="sweet-"]').addClass("qolSweetBerry");
                            }
                            if($('#field_field [data-flavour*="bitter-"]').length) {
                                $('#field_field [data-flavour*="bitter-"]').addClass("qolBitterBerry");
                            }
                        }
                        if (VARIABLES.userSettings.fieldSortSettings.fieldByMiddle === true) { //sort field in the middle
                            $('#field_field [data-flavour*="any-"]').removeClass("qolAnyBerry");
                            $('#field_field [data-flavour*="sour-"]').removeClass("qolSourBerry");
                            $('#field_field [data-flavour*="spicy-"]').removeClass("qolSpicyBerry");
                            $('#field_field [data-flavour*="dry-"]').removeClass("qolDryBerry");
                            $('#field_field [data-flavour*="sweet-"]').removeClass("qolSweetBerry");
                            $('#field_field [data-flavour*="bitter-"]').removeClass("qolBitterBerry");
                            $('.field').removeClass("qolGridField");
                            $('.fieldmon').removeClass("qolGridPokeSize");
                            $('.fieldmon>img').removeClass("qolGridPokeImg");

                            $('.fieldmon').addClass("qolSortMiddle");
                        }

                        if (VARIABLES.userSettings.fieldSortSettings.fieldByGrid === true) { //sort field in a grid
                            $('#field_field [data-flavour*="any-"]').removeClass("qolAnyBerry");
                            $('#field_field [data-flavour*="sour-"]').removeClass("qolSourBerry");
                            $('#field_field [data-flavour*="spicy-"]').removeClass("qolSpicyBerry");
                            $('#field_field [data-flavour*="dry-"]').removeClass("qolDryBerry");
                            $('#field_field [data-flavour*="sweet-"]').removeClass("qolSweetBerry");
                            $('#field_field [data-flavour*="bitter-"]').removeClass("qolBitterBerry");
                            $('.fieldmon').removeClass("qolSortMiddle");

                            $('.field').addClass("qolGridField");
                            $('.fieldmon').addClass("qolGridPokeSize");
                            $('.fieldmon>img').addClass("qolGridPokeImg");
                        }

                        if (VARIABLES.userSettings.fieldSortSettings.fieldByBerry === false && VARIABLES.userSettings.fieldSortSettings.fieldByMiddle === false && VARIABLES.userSettings.fieldSortSettings.fieldByGrid === false) {
                            $('#field_field [data-flavour*="any-"]').removeClass("qolAnyBerry");
                            $('#field_field [data-flavour*="sour-"]').removeClass("qolSourBerry");
                            $('#field_field [data-flavour*="spicy-"]').removeClass("qolSpicyBerry");
                            $('#field_field [data-flavour*="dry-"]').removeClass("qolDryBerry");
                            $('#field_field [data-flavour*="sweet-"]').removeClass("qolSweetBerry");
                            $('#field_field [data-flavour*="bitter-"]').removeClass("qolBitterBerry");
                            $('.fieldmon').removeClass("qolSortMiddle");
                            $('.field').removeClass("qolGridField");
                            $('.fieldmon').removeClass("qolGridPokeSize");
                            $('.fieldmon>img').removeClass("qolGridPokeImg");
                        }

                        //Pokémon click counter
                        if (VARIABLES.userSettings.fieldSortSettings.fieldClickCount === false) {
                            $('#pokemonclickcount').remove();
                        } else if (VARIABLES.userSettings.fieldSortSettings.fieldClickCount === true) {
                            let pokemonFed = $(".fieldmon").map(function(){return $(this).attr("data-fed");}).get();

                            let pokemonClicked = 0;
                            for (var i = 0; i < pokemonFed.length; i++) {
                                pokemonClicked += pokemonFed[i] << 0;
                            }

                            let pokemonInField = $('.fieldpkmncount').text();

                            $('#pokemonclickcount').remove(); //make sure no duplicates are being produced
                            document.querySelector('.fielddata').insertAdjacentHTML('beforeend','<div id="pokemonclickcount">'+pokemonClicked+' / '+pokemonInField+' Clicked</div>');
                            if (JSON.stringify(pokemonClicked) === pokemonInField) {
                                $('#pokemonclickcount').css({"color" : "#059121"});
                            }
                            if (pokemonClicked !== JSON.parse(pokemonInField)) {
                                $('#pokemonclickcount').css({"color" : "#a30323"});
                            }
                        }
                    }
                },

                privateFieldCustomSearch() {
                    PrivateFieldsPage.customSearch();
                },

                partyModification() {
                    if (VARIABLES.userSettings.partyMod === true) {
                        $('input.qolalone').on('change', function() { //only 1 textbox may be true
                            $('input.qolalone').not(this).prop('checked', false);
                        });

                        if (VARIABLES.userSettings.partyModSettings.hideDislike === false && VARIABLES.userSettings.partyModSettings.hideAll === false && VARIABLES.userSettings.partyModSettings.niceTable === false) {
                            $('#trainerimage').removeClass('qolpartyclickhide');
                            $('#profilebox').removeClass('qolpartyclickhide');
                            $('#multiuser .pkmn').removeClass('qolpartyclickhide');
                            $('#multiuser .name').removeClass('qolpartyclickhide');
                            $('#multiuser .expbar').removeClass('qolpartyclickhide');
                            $('#multiuser .taste').removeClass('qolpartyclickhide');
                            $('#partybox .party>div>.action.working').removeClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons:not([data-up='sour'])>[data-berry='aspear'], .party>div>.action>.berrybuttons:not([data-up='spicy'])>[data-berry='cheri'], .party>div>.action>.berrybuttons:not([data-up='dry'])>[data-berry='chesto'], .party>div>.action>.berrybuttons:not([data-up='sweet'])>[data-berry='pecha'], .party>div>.action>.berrybuttons:not([data-up='bitter'])>[data-berry='rawst']").removeClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons[data-up='sour']>[data-berry='aspear'], .party>div>.action>.berrybuttons[data-up='spicy']>[data-berry='cheri'], .party>div>.action>.berrybuttons[data-up='dry']>[data-berry='chesto'], .party>div>.action>.berrybuttons[data-up='sweet']>[data-berry='pecha'], .party>div>.action>.berrybuttons[data-up='bitter']>[data-berry='rawst']").removeClass('qolpartyclickwidth');
                            $(".party>div>.action>.berrybuttons[data-up='any']>[data-berry]").removeClass('qolpartyclickblock');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').removeClass('qolpartyclickhide');
                            $('#multiuser .party>div').removeClass('qolpartyclickalot');
                            $('#multiuser .party>div>.action a[data-berry]').removeClass('qolpartyclickz');
                            $('.mu_navlink.next').removeClass('qolpartyclicknav');
                            $('#multiuser .party').removeClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').removeClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').removeClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').removeClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').removeClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').removeClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').removeClass('qolpartyclickborderfive');
                            $('#multiuser.tabbed_interface.horizontal>ul').removeClass('qolpartyclickul');
                            $('#multiuser.tabbed_interface>ul>li>label').removeClass('qolpartyclicklilabel');
                            $('#multiuser .pkmn').removeClass('qolpartyclickhide');
                            $('#multiuser .name').removeClass('qolpartyclickhide');
                            $('#multiuser .expbar').removeClass('qolpartyclickhide');
                            $('#multiuser .taste').removeClass('qolpartyclickhide');
                            $('#multiuser .party').removeClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').removeClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').removeClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').removeClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').removeClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').removeClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').removeClass('qolpartyclickborderfive');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').removeClass('qolpartyclickhide');

                            $('.party>div>.action>.berrybuttons').removeClass('qolpartyclicktextalign');
                        }

                        if (VARIABLES.userSettings.partyModSettings.hideDislike === true) {
                            $('#trainerimage').removeClass('qolpartyclickhide');
                            $('#profilebox').removeClass('qolpartyclickhide');
                            $('#multiuser .pkmn').removeClass('qolpartyclickhide');
                            $('#multiuser .name').removeClass('qolpartyclickhide');
                            $('#multiuser .expbar').removeClass('qolpartyclickhide');
                            $('#multiuser .taste').removeClass('qolpartyclickhide');
                            $('#partybox .party>div>.action.working').removeClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons:not([data-up='sour'])>[data-berry='aspear'], .party>div>.action>.berrybuttons:not([data-up='spicy'])>[data-berry='cheri'], .party>div>.action>.berrybuttons:not([data-up='dry'])>[data-berry='chesto'], .party>div>.action>.berrybuttons:not([data-up='sweet'])>[data-berry='pecha'], .party>div>.action>.berrybuttons:not([data-up='bitter'])>[data-berry='rawst']").removeClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons[data-up='sour']>[data-berry='aspear'], .party>div>.action>.berrybuttons[data-up='spicy']>[data-berry='cheri'], .party>div>.action>.berrybuttons[data-up='dry']>[data-berry='chesto'], .party>div>.action>.berrybuttons[data-up='sweet']>[data-berry='pecha'], .party>div>.action>.berrybuttons[data-up='bitter']>[data-berry='rawst']").removeClass('qolpartyclickwidth');
                            $(".party>div>.action>.berrybuttons[data-up='any']>[data-berry]").removeClass('qolpartyclickblock');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').removeClass('qolpartyclickhide');
                            $('#multiuser .party>div').removeClass('qolpartyclickalot');
                            $('#multiuser .party>div>.action a[data-berry]').removeClass('qolpartyclickz');
                            $('.mu_navlink.next').removeClass('qolpartyclicknav');
                            $('#multiuser .party').removeClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').removeClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').removeClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').removeClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').removeClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').removeClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').removeClass('qolpartyclickborderfive');
                            $('#multiuser.tabbed_interface.horizontal>ul').removeClass('qolpartyclickul');
                            $('#multiuser.tabbed_interface>ul>li>label').removeClass('qolpartyclicklilabel');
                            $('#multiuser .pkmn').removeClass('qolpartyclickhide');
                            $('#multiuser .name').removeClass('qolpartyclickhide');
                            $('#multiuser .expbar').removeClass('qolpartyclickhide');
                            $('#multiuser .taste').removeClass('qolpartyclickhide');
                            $('#multiuser .party').removeClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').removeClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').removeClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').removeClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').removeClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').removeClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').removeClass('qolpartyclickborderfive');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').removeClass('qolpartyclickhide');

                            $('.party>div>.action>.berrybuttons').addClass('qolpartyclicktextalign');
                            $(".party>div>.action>.berrybuttons:not([data-up='sour'])>[data-berry='aspear'], .party>div>.action>.berrybuttons:not([data-up='spicy'])>[data-berry='cheri'], .party>div>.action>.berrybuttons:not([data-up='dry'])>[data-berry='chesto'], .party>div>.action>.berrybuttons:not([data-up='sweet'])>[data-berry='pecha'], .party>div>.action>.berrybuttons:not([data-up='bitter'])>[data-berry='rawst']").addClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons[data-up='sour']>[data-berry='aspear'], .party>div>.action>.berrybuttons[data-up='spicy']>[data-berry='cheri'], .party>div>.action>.berrybuttons[data-up='dry']>[data-berry='chesto'], .party>div>.action>.berrybuttons[data-up='sweet']>[data-berry='pecha'], .party>div>.action>.berrybuttons[data-up='bitter']>[data-berry='rawst']").addClass('qolpartyclickwidth');
                            $(".party>div>.action>.berrybuttons[data-up='any']>[data-berry]").addClass('qolpartyclickblock');
                        }

                        if (VARIABLES.userSettings.partyModSettings.niceTable === true) {
                            $('#trainerimage').removeClass('qolpartyclickhide');
                            $('#profilebox').removeClass('qolpartyclickhide');
                            $('#multiuser .pkmn').removeClass('qolpartyclickhide');
                            $('#multiuser .name').removeClass('qolpartyclickhide');
                            $('#multiuser .expbar').removeClass('qolpartyclickhide');
                            $('#multiuser .taste').removeClass('qolpartyclickhide');
                            $('#partybox .party>div>.action.working').removeClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons:not([data-up='sour'])>[data-berry='aspear'], .party>div>.action>.berrybuttons:not([data-up='spicy'])>[data-berry='cheri'], .party>div>.action>.berrybuttons:not([data-up='dry'])>[data-berry='chesto'], .party>div>.action>.berrybuttons:not([data-up='sweet'])>[data-berry='pecha'], .party>div>.action>.berrybuttons:not([data-up='bitter'])>[data-berry='rawst']").removeClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons[data-up='sour']>[data-berry='aspear'], .party>div>.action>.berrybuttons[data-up='spicy']>[data-berry='cheri'], .party>div>.action>.berrybuttons[data-up='dry']>[data-berry='chesto'], .party>div>.action>.berrybuttons[data-up='sweet']>[data-berry='pecha'], .party>div>.action>.berrybuttons[data-up='bitter']>[data-berry='rawst']").removeClass('qolpartyclickwidth');
                            $(".party>div>.action>.berrybuttons[data-up='any']>[data-berry]").removeClass('qolpartyclickblock');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').removeClass('qolpartyclickhide');
                            $('#multiuser .party>div').removeClass('qolpartyclickalot');
                            $('#multiuser .party>div>.action a[data-berry]').removeClass('qolpartyclickz');
                            $('.mu_navlink.next').removeClass('qolpartyclicknav');
                            $('#multiuser .party').removeClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').removeClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').removeClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').removeClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').removeClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').removeClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').removeClass('qolpartyclickborderfive');
                            $('#multiuser.tabbed_interface.horizontal>ul').removeClass('qolpartyclickul');
                            $('#multiuser.tabbed_interface>ul>li>label').removeClass('qolpartyclicklilabel');
                            $('.party>div>.action>.berrybuttons').removeClass('qolpartyclicktextalign');

                            $('#multiuser .pkmn').addClass('qolpartyclickhide');
                            $('#multiuser .name').addClass('qolpartyclickhide');
                            $('#multiuser .expbar').addClass('qolpartyclickhide');
                            $('#multiuser .taste').addClass('qolpartyclickhide');
                            $('#multiuser .party').addClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').addClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').addClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').addClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').addClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').addClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').addClass('qolpartyclickborderfive');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').addClass('qolpartyclickhide');
                            $('.party>div>.action>.berrybuttons').addClass('qolpartyclicktextalign');
                            $(".party>div>.action>.berrybuttons:not([data-up='sour'])>[data-berry='aspear'], .party>div>.action>.berrybuttons:not([data-up='spicy'])>[data-berry='cheri'], .party>div>.action>.berrybuttons:not([data-up='dry'])>[data-berry='chesto'], .party>div>.action>.berrybuttons:not([data-up='sweet'])>[data-berry='pecha'], .party>div>.action>.berrybuttons:not([data-up='bitter'])>[data-berry='rawst']").addClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons[data-up='sour']>[data-berry='aspear'], .party>div>.action>.berrybuttons[data-up='spicy']>[data-berry='cheri'], .party>div>.action>.berrybuttons[data-up='dry']>[data-berry='chesto'], .party>div>.action>.berrybuttons[data-up='sweet']>[data-berry='pecha'], .party>div>.action>.berrybuttons[data-up='bitter']>[data-berry='rawst']").addClass('qolpartyclickwidth');
                            $(".party>div>.action>.berrybuttons[data-up='any']>[data-berry]").addClass('qolpartyclickblock');
                        }


                        if (VARIABLES.userSettings.partyModSettings.hideAll === true) {
                            $('.party>div>.action>.berrybuttons').removeClass('qolpartyclicktextalign');
                            $(".party>div>.action>.berrybuttons:not([data-up='sour'])>[data-berry='aspear'], .party>div>.action>.berrybuttons:not([data-up='spicy'])>[data-berry='cheri'], .party>div>.action>.berrybuttons:not([data-up='dry'])>[data-berry='chesto'], .party>div>.action>.berrybuttons:not([data-up='sweet'])>[data-berry='pecha'], .party>div>.action>.berrybuttons:not([data-up='bitter'])>[data-berry='rawst']").removeClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons[data-up='sour']>[data-berry='aspear'], .party>div>.action>.berrybuttons[data-up='spicy']>[data-berry='cheri'], .party>div>.action>.berrybuttons[data-up='dry']>[data-berry='chesto'], .party>div>.action>.berrybuttons[data-up='sweet']>[data-berry='pecha'], .party>div>.action>.berrybuttons[data-up='bitter']>[data-berry='rawst']").removeClass('qolpartyclickwidth');
                            $(".party>div>.action>.berrybuttons[data-up='any']>[data-berry]").removeClass('qolpartyclickblock');
                            $('#multiuser .pkmn').removeClass('qolpartyclickhide');
                            $('#multiuser .name').removeClass('qolpartyclickhide');
                            $('#multiuser .expbar').removeClass('qolpartyclickhide');
                            $('#multiuser .taste').removeClass('qolpartyclickhide');
                            $('#multiuser .party').removeClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').removeClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').removeClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').removeClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').removeClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').removeClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').removeClass('qolpartyclickborderfive');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').removeClass('qolpartyclickhide');

                            $('#trainerimage').addClass('qolpartyclickhide');
                            $('#profilebox').addClass('qolpartyclickhide');
                            $('#multiuser .pkmn').addClass('qolpartyclickhide');
                            $('#multiuser .name').addClass('qolpartyclickhide');
                            $('#multiuser .expbar').addClass('qolpartyclickhide');
                            $('#multiuser .taste').addClass('qolpartyclickhide');
                            $('#partybox .party>div>.action.working').addClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons:not([data-up='sour'])>[data-berry='aspear'], .party>div>.action>.berrybuttons:not([data-up='spicy'])>[data-berry='cheri'], .party>div>.action>.berrybuttons:not([data-up='dry'])>[data-berry='chesto'], .party>div>.action>.berrybuttons:not([data-up='sweet'])>[data-berry='pecha'], .party>div>.action>.berrybuttons:not([data-up='bitter'])>[data-berry='rawst']").addClass('qolpartyclickhide');
                            $(".party>div>.action>.berrybuttons[data-up='sour']>[data-berry='aspear'], .party>div>.action>.berrybuttons[data-up='spicy']>[data-berry='cheri'], .party>div>.action>.berrybuttons[data-up='dry']>[data-berry='chesto'], .party>div>.action>.berrybuttons[data-up='sweet']>[data-berry='pecha'], .party>div>.action>.berrybuttons[data-up='bitter']>[data-berry='rawst']").addClass('qolpartyclickwidth');
                            $(".party>div>.action>.berrybuttons[data-up='any']>[data-berry]").addClass('qolpartyclickblock');
                            $('#multiuser .party>div>.action>.berrybuttons>.tooltip_content').addClass('qolpartyclickhide');
                            $('#multiuser .party>div').addClass('qolpartyclickalot');
                            $('#multiuser .party>div>.action a[data-berry]').addClass('qolpartyclickz');
                            $('.mu_navlink.next').addClass('qolpartyclicknav');
                            $('#multiuser .party').addClass('qolpartyclickpartywidth');
                            $('#multiuser .party>div').addClass('qolpartyclickpartydivwidth');
                            $('#multiuser .party>div:nth-child(1)').addClass('qolpartyclickborderone');
                            $('#multiuser .party>div:nth-child(2)').addClass('qolpartyclickbordertwo');
                            $('#multiuser .party>div:nth-child(5)').addClass('qolpartyclickborderthree');
                            $('#multiuser .party>div:nth-child(6)').addClass('qolpartyclickborderfour');
                            $('#multiuser .party>div:nth-child(2n+1)').addClass('qolpartyclickborderfive');
                            $('#multiuser.tabbed_interface.horizontal>ul').addClass('qolpartyclickul');
                            $('#multiuser.tabbed_interface>ul>li>label').addClass('qolpartyclicklilabel');
                        }
                    }
                },

                savingDexData() {
                    fn.backwork.loadSettings();
                    let dexTempData = ($('#dexdata').html());
                    let dexTempArray = dexTempData.split(',');

                    //Experiment with Flabebe (It's better to just make the new data dex save function)
                    //let dexTempArrayFlabebe = dexTempArray.indexOf(Flab\u00e9b\u00e9)
                    //Flab\u00e9b\u00e9 > Flabébé

                    //let dexArray = dexTempArray.splice(0, 29);




                    if (VARIABLES.userSettings.variData.dexData != dexTempArray.toString()) {
                        VARIABLES.userSettings.variData.dexData = dexTempArray.toString();
                        fn.backwork.saveSettings();
                        console.log('your dexdata has been updated');
                    }
                },

                easyEvolveNormalList() {
                    if (VARIABLES.userSettings.easyEvolve === true) {
                        // first remove the sorted pokemon type list to avoid duplicates
                        $('.evolvepkmnlist').show();
                        try {
                            document.querySelector('.qolEvolveTypeList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNameList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNewList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                    }
                },
                easyEvolveTypeList() {
                    if (VARIABLES.userSettings.easyEvolve === true) {
                        // first remove the sorted pokemon type list to avoid duplicates
                        $('.evolvepkmnlist').show();
                        try {
                            document.querySelector('.qolEvolveTypeList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNameList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNewList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }

                        // turn the saved dexData in an array to search pokemons out of the evolve list
                        let searchDexData = VARIABLES.userSettings.variData.dexData.split(',');

                        $('#farmnews-evolutions>.scrollable>ul').addClass('evolvepkmnlist');
                        document.querySelector('#farmnews-evolutions>.scrollable').insertAdjacentHTML('afterbegin', TEMPLATES.evolveFastHTML);
                        let typeBackground = $('.panel>h3').css('background-color');
                        let typeBorder = $('.panel>h3').css('border');
                        let typeColor = $('.panel>h3').css('color');
                        $(".expandlist").css("background-color", ""+typeBackground+"");
                        $(".expandlist").css("border", ""+typeBorder+"");
                        $(".expandlist").css("color", ""+typeColor+"");

                        let typeListBackground = $('.tabbed_interface>div').css('background-color');
                        let typeListColor = $('.tabbed_interface>div').css('color');
                        $(".qolChangeLogContent").css("background-color", ""+typeListBackground+"");
                        $(".qolChangeLogContent").css("color", ""+typeListColor+"");



                        $('#farmnews-evolutions>.scrollable>.evolvepkmnlist>Li').each(function (index, value) {
                            // getting the <li> element from the pokemon & the pokemon evolved name
                            let getEvolveString = $(this).html();
                            let evolvePokemon = getEvolveString.substr(getEvolveString.indexOf("into</span> ") + 12);

                            // first looks if you know the type out of your dexdata, if it's there then the <li> will be moved in it's corresponding type
                            if (searchDexData.indexOf('"'+evolvePokemon+'"') != -1 || evolvePokemon === 'Gastrodon [Orient]' || evolvePokemon === 'Gastrodon [Occident]' || evolvePokemon === 'Wormadam [Plant Cloak]' || evolvePokemon === 'Wormadam [Trash Cloak]' || evolvePokemon.includes('[Alolan Forme]')) {
                                let evolveTypeOne = searchDexData[searchDexData.indexOf('"'+evolvePokemon+'"') + 1];
                                let evolveTypeTwo = searchDexData[searchDexData.indexOf('"'+evolvePokemon+'"') + 2];
                                let evolveTypePrevOne = searchDexData[searchDexData.indexOf('"'+evolvePokemon+'"') - 10];
                                let evolveTypePrevTwo = searchDexData[searchDexData.indexOf('"'+evolvePokemon+'"') - 9];

                                if (getEvolveString.includes('title="[DELTA') || evolvePokemon === 'Vaporeon' || evolvePokemon === 'Jolteon' || evolvePokemon === 'Flareon' || evolvePokemon === 'Espeon' || evolvePokemon === 'Umbreon' || evolvePokemon === 'Leafeon' || evolvePokemon === 'Glaceon' || evolvePokemon === 'Sylveon' || evolvePokemon === 'Nidorino' || evolvePokemon === 'Gastrodon [Orient]' || evolvePokemon === 'Gastrodon [Occident]' || evolvePokemon === 'Wormadam [Plant Cloak]' || evolvePokemon === 'Wormadam [Trash Cloak]' || evolvePokemon.includes('[Alolan Forme]') || evolvePokemon.includes('Chilldoom')) {
                                    if (getEvolveString.includes('title="[DELTA')) {
                                        console.log(getEvolveString);
                                        let deltaType = getEvolveString.match('DELTA-(.*)]">');
                                        console.log(deltaType[1]);

                                        if (deltaType[1] === 'NORMAL') {
                                            $(this).clone().appendTo('.0');
                                        }

                                        if (deltaType[1] === 'FIRE') {
                                            $(this).clone().appendTo('.1');
                                        }

                                        if (deltaType[1] === 'WATER') {
                                            $(this).clone().appendTo('.2');
                                        }

                                        if (deltaType[1] === 'ELECTRIC') {
                                            $(this).clone().appendTo('.3');
                                        }

                                        if (deltaType[1] === 'GRASS') {
                                            $(this).clone().appendTo('.4');
                                        }

                                        if (deltaType[1] === 'ICE') {
                                            $(this).clone().appendTo('.5');
                                        }

                                        if (deltaType[1] === 'FIGHTING') {
                                            $(this).clone().appendTo('.6');
                                        }

                                        if (deltaType[1] === 'POISON') {
                                            $(this).clone().appendTo('.7');
                                        }

                                        if (deltaType[1] === 'GROUND') {
                                            $(this).clone().appendTo('.8');
                                        }

                                        if (deltaType[1] === 'FLYING') {
                                            $(this).clone().appendTo('.9');
                                        }

                                        if (deltaType[1] === 'PSYCHIC') {
                                            $(this).clone().appendTo('.10');
                                        }

                                        if (deltaType[1] === 'BUG') {
                                            $(this).clone().appendTo('.11');
                                        }

                                        if (deltaType[1] === 'ROCK') {
                                            $(this).clone().appendTo('.12');
                                        }

                                        if (deltaType[1] === 'GHOST') {
                                            $(this).clone().appendTo('.13');
                                        }

                                        if (deltaType[1] === 'DRAGON') {
                                            $(this).clone().appendTo('.14');
                                        }

                                        if (deltaType[1] === 'DARK') {
                                            $(this).clone().appendTo('.15');
                                        }

                                        if (deltaType[1] === 'STEEL') {
                                            $(this).clone().appendTo('.16');
                                        }

                                        if (deltaType[1] === 'FAIRY') {
                                            $(this).clone().appendTo('.17');
                                        }
                                    }

                                    if (evolvePokemon === 'Vaporeon' || evolvePokemon === 'Jolteon' || evolvePokemon === 'Flareon' || evolvePokemon === 'Espeon' || evolvePokemon === 'Umbreon' || evolvePokemon === 'Leafeon' || evolvePokemon === 'Glaceon' || evolvePokemon === 'Sylveon') {
                                        // normal type from eevee
                                        $(this).clone().appendTo('.0');
                                        // type one
                                        $(this).clone().appendTo('.'+evolveTypeOne+'');
                                        // type two
                                        if (evolveTypeTwo < 0) {
                                            let thisAlsoDoeSNothing = true;
                                        } else {
                                            $(this).clone().appendTo('.'+evolveTypeTwo+'');
                                        }
                                    }
                                    if (evolvePokemon === 'Nidorino') {
                                        // poison type from Nidoran
                                        $(this).clone().appendTo('.7');
                                    }

                                    if (evolvePokemon === 'Gastrodon [Orient]' || evolvePokemon === 'Gastrodon [Occident]') {
                                        // water type
                                        $(this).clone().appendTo('.2');
                                        // ground type
                                        $(this).clone().appendTo('.8');
                                    }

                                    if (evolvePokemon === 'Wormadam [Plant Cloak]') {
                                        // bug type
                                        $(this).clone().appendTo('.11');
                                        // grass type
                                        $(this).clone().appendTo('.4');
                                    }

                                    if (evolvePokemon === 'Wormadam [Trash Cloak]') {
                                        // bug type (burmy)
                                        $(this).clone().appendTo('.11');
                                        // steel type
                                        $(this).clone().appendTo('.16');
                                        // grass type
                                        $(this).clone().appendTo('.4');
                                    }

                                    if (evolvePokemon === 'Chilldoom') {
                                        // dark type
                                        $(this).clone().appendTo('.15');
                                        // ice type
                                        $(this).clone().appendTo('.5');
                                    }

                                    if (evolvePokemon.includes('[Alolan Forme]')) { //alolan formes
                                        // raticate
                                        if (evolvePokemon.includes('Raticate')) {
                                            // dark type
                                            $(this).clone().appendTo('.15');
                                            // normal type
                                            $(this).clone().appendTo('.0');
                                        }

                                        // ninetales
                                        if (evolvePokemon.includes('Ninetales')) {
                                            // ice type
                                            $(this).clone().appendTo('.5');
                                            // fairy type
                                            $(this).clone().appendTo('.17');
                                        }

                                        // exeggutor
                                        if (evolvePokemon.includes('Exeggutor')) {
                                            // grass type
                                            $(this).clone().appendTo('.4');
                                            // dragon type
                                            $(this).clone().appendTo('.14');
                                        }

                                        // marowak
                                        if (evolvePokemon.includes('Marowak')) {
                                            // fire type
                                            $(this).clone().appendTo('.1');
                                            // ghost type
                                            $(this).clone().appendTo('.13');
                                        }

                                        // dugtrio
                                        if (evolvePokemon.includes('Dugtrio')) {
                                            // ground type
                                            $(this).clone().appendTo('.8');
                                            // steel type
                                            $(this).clone().appendTo('.16');
                                        }

                                        // graveler
                                        if (evolvePokemon.includes('Graveler')) {
                                            // rock type
                                            $(this).clone().appendTo('.12');
                                            // electric type
                                            $(this).clone().appendTo('.3');
                                        }

                                        // golem
                                        if (evolvePokemon.includes('Golem')) {
                                            // rock type
                                            $(this).clone().appendTo('.12');
                                            // electric type
                                            $(this).clone().appendTo('.3');
                                        }

                                        // muk
                                        if (evolvePokemon.includes('Muk')) {
                                            // poison type
                                            $(this).clone().appendTo('.7');
                                            // dark type
                                            $(this).clone().appendTo('.15');
                                        }

                                        // raichu
                                        if (evolvePokemon.includes('Raichu')) {
                                            // electric type
                                            $(this).clone().appendTo('.3');
                                            // psychic type
                                            $(this).clone().appendTo('.10');
                                        }
                                    }

                                } else { //no exceptions
                                    // type one
                                    $(this).clone().appendTo('.'+evolveTypeOne+'');
                                    // type two
                                    if (evolveTypeTwo < 0) {
                                        let thisAlsoDoeSNothing = true;
                                    } else {
                                        $(this).clone().appendTo('.'+evolveTypeTwo+'');
                                    }
                                    // extra type from prev pokemon
                                    if([evolveTypeOne, evolveTypeTwo].indexOf(evolveTypePrevOne) == -1){
                                       $(this).clone().appendTo('.'+evolveTypePrevOne+'');
                                    }

                                    if([evolveTypeOne, evolveTypeTwo].indexOf(evolveTypePrevTwo) == -1){
                                       $(this).clone().appendTo('.'+evolveTypePrevTwo+'');
                                    }
                                }
                            } else {
                                $(this).clone().appendTo('.18');
                            }
                        });

                        $('#farmnews-evolutions>.scrollable>.qolEvolveTypeList>Li').each(function (index, value) {
                            let amountOfEvolves = $(this).children().children().length;
                            let evolveTypeName = $(this).children('.slidermenu').html();

                            $(this).children('.slidermenu').html(evolveTypeName+' ('+amountOfEvolves+')')
                        });

                        $('.evolvepkmnlist').hide();
                    }
                },
                easyEvolveNameList() {
                    if (VARIABLES.userSettings.easyEvolve === true) {
                        // first remove the sorted pokemon type list to avoid duplicates
                        $('.evolvepkmnlist').show();

                        try {
                            document.querySelector('.qolEvolveTypeList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNameList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNewList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }

                        // turn the saved dexData in an array to search pokemons out of the evolve list
                        let searchDexData = VARIABLES.userSettings.variData.dexData.split(',');

                        $('#farmnews-evolutions>.scrollable>ul').addClass('evolvepkmnlist');
                        document.querySelector('#farmnews-evolutions>.scrollable').insertAdjacentHTML('afterbegin', '<ul class="qolEvolveNameList">');


                        $('#farmnews-evolutions>.scrollable>.evolvepkmnlist>Li').each(function (index, value) {
                            // getting the <li> element from the pokemon & the pokemon evolved name
                            let getEvolveString = $(this).html();
                            let beforeEvolvePokemon = $(this).children().children().text().slice(0,-6);
                            let evolvePokemon = getEvolveString.substr(getEvolveString.indexOf("into</span> ") + 12);
                            let evolvePokemonChange = evolvePokemon.split(' ').join('').replace('[','').replace(']','');

                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNameList>Li>Ul').hasClass(evolvePokemon.split(' ').join('')) === false) {
                                document.querySelector('.qolEvolveNameList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">'+beforeEvolvePokemon+' > '+evolvePokemon+'</h3><ul class="'+evolvePokemonChange+' qolChangeLogContent"></ul></li><br>');
                            }
                            $(this).clone().appendTo('.'+evolvePokemonChange+'');
                        });

                        $('#farmnews-evolutions>.scrollable>.qolEvolveNameList>Li').each(function (index, value) {
                            let amountOfEvolves = $(this).children().children().length;
                            let getEvolveString = $(this).children().children().html();
                            let beforeEvolvePokemon = $(this).children().children().children().children().first().text().split(' ').join('');
                            let evolvePokemon = getEvolveString.substr(getEvolveString.indexOf("into</span> ") + 12);

                            $(this).children('.slidermenu').html(beforeEvolvePokemon+' > '+evolvePokemon+' ('+amountOfEvolves+')')
                        });

                        $('.evolvepkmnlist').hide();

                        //layout of the created html
                        let typeBackground = $('.panel>h3').css('background-color');
                        let typeBorder = $('.panel>h3').css('border');
                        let typeColor = $('.panel>h3').css('color');
                        $(".expandlist").css("background-color", ""+typeBackground+"");
                        $(".expandlist").css("border", ""+typeBorder+"");
                        $(".expandlist").css("color", ""+typeColor+"");

                        let typeListBackground = $('.tabbed_interface>div').css('background-color');
                        let typeListColor = $('.tabbed_interface>div').css('color');
                        $(".qolChangeLogContent").css("background-color", ""+typeListBackground+"");
                        $(".qolChangeLogContent").css("color", ""+typeListColor+"");
                    }
                },
                easyEvolveNewList() {
                    if (VARIABLES.userSettings.easyEvolve === true) {
                        // first remove the sorted pokemon type list to avoid duplicates
                        $('.evolvepkmnlist').show();

                        try {
                            document.querySelector('.qolEvolveTypeList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNameList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }
                        try {
                            document.querySelector('.qolEvolveNewList').remove();
                        }
                        catch(err){
                            let thisdoesnothing = true;
                        }

                        // turn the saved dexData in an array to search pokemons out of the evolve list
                        let searchDexData = VARIABLES.userSettings.variData.dexData.split(',');

                        // add a class to the original pokemon evolve list to be able to manipulate the element more easily and add the ul for the new dex search
                        $('#farmnews-evolutions>.scrollable>ul').addClass('evolvepkmnlist');
                        document.querySelector('#farmnews-evolutions>.scrollable').insertAdjacentHTML('afterbegin', '<ul class="qolEvolveNewList">');

                        $('#farmnews-evolutions>.scrollable>.evolvepkmnlist>Li').each(function (index, value) { //the actual search
                            // getting the <li> element from the pokemon & the pokemon evolved name
                            let getEvolveString = $(this).html();

                            // every pokemon is a normal unless shiny, albino or melanistic pokemon is found
                            let pokemonIsNormal = true;
                            let pokemonIsShiny = false;
                            let pokemonIsAlbino = false;
                            let pokemonIsMelanistic = false;

                            if (getEvolveString.includes('title="[SHINY]')) {
                                pokemonIsShiny = true;
                                pokemonIsNormal = false;
                            }
                            if (getEvolveString.includes('title="[ALBINO]')) {
                                pokemonIsAlbino = true;
                                pokemonIsNormal = false;
                            }
                            if (getEvolveString.includes('title="[MELANISTIC]')) {
                                pokemonIsMelanistic = true;
                                pokemonIsNormal = false;
                            }

                            let evolvePokemonName = getEvolveString.substr(getEvolveString.indexOf("into</span> ") + 12);
                            var evolveNewCheck = searchDexData[searchDexData.indexOf('"'+evolvePokemonName+'"') + 6];
                            var evolveNewShinyCheck = searchDexData[searchDexData.indexOf('"'+evolvePokemonName+'"') + 7];
                            var evolveNewAlbinoCheck = searchDexData[searchDexData.indexOf('"'+evolvePokemonName+'"') + 8];
                            var evolveNewMelaCheck = searchDexData[searchDexData.indexOf('"'+evolvePokemonName+'"') + 9].replace(']','');
                            var evolveNewTotal = searchDexData[searchDexData.indexOf('"'+evolvePokemonName+'"') + 5];

                            try { //if a pokemon has a name like gligar [Vampire] it won't be found. This try tries to change the name as it's recorded in the pokedex data array
                                var pokemonDexKeepFirstName = evolvePokemonName.split(' ')[0];
                                var pokemonDexKeepSecondName = evolvePokemonName.split(' ')[1];
                                var pokemonDexKeepThirdName = evolvePokemonName.split(' ')[2];
                                var pokemonDexKeepFourthName = evolvePokemonName.split(' ')[3];
                                var pokemonDexKeepFifthName = evolvePokemonName.split(' ')[4];
                                var pokemonDexKeepSixthName = evolvePokemonName.split(' ')[5];

                                var evolvePokemonNameOne = pokemonDexKeepFirstName;
                                var evolveNewCheckOne = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameOne+'"') + 6];
                                var evolveNewShinyCheckOne = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameOne+'"') + 7];
                                var evolveNewAlbinoCheckOne = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameOne+'"') + 8];
                                var evolveNewMelaCheckOne = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameOne+'"') + 9].replace(']','');
                                var evolveNewTotalOne = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameOne+'"') + 5];

                                let evolvePokemonNameTwoBefore = pokemonDexKeepFirstName+'/'+pokemonDexKeepSecondName;
                                var evolvePokemonNameTwo = evolvePokemonNameTwoBefore.replace('[','').replace(']','');
                                var evolveNewCheckTwo = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') + 6];
                                var evolveNewShinyCheckTwo = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') + 7];
                                var evolveNewAlbinoCheckTwo = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') + 8];
                                var evolveNewMelaCheckTwo = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') + 9].replace(']','');
                                var evolveNewTotalTwo = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') + 5];

                                let evolvePokemonNameThreeBefore = pokemonDexKeepFirstName+'/'+pokemonDexKeepSecondName+' '+pokemonDexKeepThirdName;
                                var evolvePokemonNameThree = evolvePokemonNameThreeBefore.replace('[','').replace(']','');
                                var evolveNewCheckThree = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameThree+'"') + 6];
                                var evolveNewShinyCheckThree = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameThree+'"') + 7];
                                var evolveNewAlbinoCheckThree = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameThree+'"') + 8];
                                var evolveNewMelaCheckThree = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameThree+'"') + 9].replace(']','');
                                var evolveNewTotalThree = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameThree+'"') + 5];

                                let evolvePokemonNameFourBefore = pokemonDexKeepFirstName+'/'+pokemonDexKeepSecondName+' '+pokemonDexKeepThirdName+' '+pokemonDexKeepFourthName;
                                var evolvePokemonNameFour = evolvePokemonNameFourBefore.replace('[','').replace(']','');
                                var evolveNewCheckFour = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFour+'"') + 6];
                                var evolveNewShinyCheckFour = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFour+'"') + 7];
                                var evolveNewAlbinoCheckFour = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFour+'"') + 8];
                                var evolveNewMelaCheckFour = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFour+'"') + 9].replace(']','');
                                var evolveNewTotalFour = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFour+'"') + 5];

                                let evolvePokemonNameFiveBefore = pokemonDexKeepFirstName+'/'+pokemonDexKeepSecondName+' '+pokemonDexKeepThirdName+' '+pokemonDexKeepFourthName+' '+pokemonDexKeepFifthName;
                                var evolvePokemonNameFive = evolvePokemonNameFiveBefore.replace('[','').replace(']','');
                                var evolveNewCheckFive = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFive+'"') + 6];
                                var evolveNewShinyCheckFive = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFive+'"') + 7];
                                var evolveNewAlbinoCheckFive = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFive+'"') + 8];
                                var evolveNewMelaCheckFive = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFive+'"') + 9].replace(']','');
                                var evolveNewTotalFive = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameFive+'"') + 5];

                                let evolvePokemonNameSixBefore = pokemonDexKeepFirstName+'/'+pokemonDexKeepSecondName+' '+pokemonDexKeepThirdName+' '+pokemonDexKeepFourthName+' '+pokemonDexKeepFifthName+' '+pokemonDexKeepSixthName;
                                var evolvePokemonNameSix = evolvePokemonNameSixBefore.replace('[','').replace(']','');
                                var evolveNewCheckSix = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameSix+'"') + 6];
                                var evolveNewShinyCheckSix = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameSix+'"') + 7];
                                var evolveNewAlbinoCheckSix = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameSix+'"') + 8];
                                var evolveNewMelaCheckSix = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameSix+'"') + 9].replace(']','');
                                var evolveNewTotalSix = searchDexData[searchDexData.indexOf('"'+evolvePokemonNameSix+'"') + 5];

                            }
                            catch(err) {
                                console.log(err);
                            }

                            //prep done now the search
                            if (searchDexData.indexOf('"'+evolvePokemonName+'"') != -1) { //Looks for the Pokémon name in which it evolves to check if it's in your Pokédex
                                if (pokemonIsNormal == true) { //normal Pokémon search
                                    if (evolveNewCheckOne == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Pokédex entry</h3><ul class="newpokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newpokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newpokedexentry');
                                        }

                                    } else if (evolveNewTotal > evolveNewCheck && evolveNewCheck > 0) { //looks for Pokémon that you have at least 1 from, but there are more possible (mega/Totem only because alolan won't be found due to the name)
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpossiblepokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible Mega/Totem forme</h3><ul class="newpossiblepokedexentry qolChangeLogContent"></ul></li><br>');
                                        }
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newpossiblepokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newpossiblepokedexentry');
                                        }

                                    } else { // the rest of the pokemon that could be found by name that you already have in the dex
                                        //console.log('Normal '+evolvePokemonName+' already in dex');
                                    }
                                } else if (pokemonIsShiny == true) { //shiny Pokemon search
                                    if (evolveNewShinyCheck == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newshinypokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Shiny Pokédex entry</h3><ul class="newshinypokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newshinypokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newshinypokedexentry');
                                        }

                                    } else if (evolveNewTotal > evolveNewShinyCheck && evolveNewShinyCheck > 0) { //looks for Pokémon that you have at least 1 from, but there are more possible (mega/Totem only because alolan won't be found due to the name)
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpossibleshinypokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible Shiny Mega/Totem forme</h3><ul class="newpossibleshinypokedexentry qolChangeLogContent"></ul></li><br>');
                                        }
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newpossibleshinypokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newpossibleshinypokedexentry');
                                        }

                                    } else {
                                        //console.log('Shiny '+evolvePokemonName+' already in dex');
                                    }
                                } else if (pokemonIsAlbino == true) { //albino pokemon search
                                    if (evolveNewAlbinoCheck == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newalbinopokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Albino Pokédex entry</h3><ul class="newalbinopokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newalbinopokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newalbinopokedexentry');
                                        }

                                    } else if (evolveNewTotal > evolveNewAlbinoCheck && evolveNewAlbinoCheck > 0) { //looks for Pokémon that you have at least 1 from, but there are more possible (mega/Totem only because alolan won't be found due to the name)
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpossiblealbinopokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible Albino Mega/Totem forme</h3><ul class="newpossiblealbinopokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newalbinopokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newpossiblealbinopokedexentry');
                                        }

                                    } else {
                                        //console.log('albino '+evolvePokemonName+' already in dex');
                                    }
                                } else if (pokemonIsMelanistic == true) { //melanistic pokemon search
                                    if (evolveNewMelaCheck == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newamelanisticpokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Melanistic Pokédex entry</h3><ul class="newamelanisticpokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newamelanisticpokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newamelanisticpokedexentry');
                                        }

                                    } else if (evolveNewTotal > evolveNewMelaCheck && evolveNewMelaCheck > 0) { //looks for Pokémon that you have at least 1 from, but there are more possible (mega/Totem only because alolan won't be found due to the name)
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpossiblemelanisticpokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible Melanistic Mega/Totem forme</h3><ul class="newpossiblemelanisticpokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newpossiblemelanisticpokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newpossiblemelanisticpokedexentry');
                                        }

                                    } else {
                                        //console.log('Melanistic '+evolvePokemonName+' already in dex');
                                    }
                                }



                            } else if (searchDexData.indexOf('"'+evolvePokemonName+'"') == -1) { //Looks for the Pokémon name in which it evolves to check if it's in your Pokédex{
                                if (pokemonIsNormal == true) {
                                    if (evolveNewCheckTwo == 0 || evolveNewCheckThree == 0 || evolveNewCheckFour == 0 || evolveNewCheckFive == 0 || evolveNewCheckSix == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Pokédex entry</h3><ul class="newpokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newpokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newpokedexentry');
                                        }

                                    } else if (evolvePokemonName.includes('[Alolan Forme]')) { // for alolans
                                        if ((evolveNewTotalOne > evolveNewCheckOne && evolveNewCheckOne > 0) || (evolveNewTotalTwo > evolveNewCheckTwo && evolveNewCheckTwo > 0) || (evolveNewTotalThree > evolveNewCheckThree && evolveNewCheckThree > 0) || (evolveNewTotalFour > evolveNewCheckFour && evolveNewCheckFour > 0) || (evolveNewTotalFive > evolveNewCheckFive && evolveNewCheckFive > 0) || (evolveNewTotalSix > evolveNewCheckSix && evolveNewCheckSix > 0)) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possiblealolan') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new Alolan entry</h3><ul class="possiblealolan qolChangeLogContent"></ul></li><br>');
                                            }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possiblealolan>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.possiblealolan');
                                        }

                                        }
                                    } else if (evolvePokemonName.indexOf('[') >= 0) {
                                        if (evolvePokemonName.indexOf('[Alolan Forme]') == -1 && searchDexData.indexOf('"'+evolvePokemonNameOne+'"') >= 0 && evolveNewTotalOne > evolveNewCheckOne) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possibledifferent') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new forme/cloak entry</h3><ul class="possibledifferent qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possibledifferent>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.possibledifferent');
                                            }

                                        } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpokedexentry') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Pokédex entry</h3><ul class="newpokedexentry qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newpokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.newpokedexentry');
                                            }
                                        }

                                    } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newpokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Pokédex entry</h3><ul class="newpokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newpokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newpokedexentry');
                                        }

                                    } else {
                                        //END
                                        //console.log(evolvePokemonName+' still needs to be searched');
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('errornotfound') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Error contact Bentomon!</h3><ul class="errornotfound qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.errornotfound>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.errornotfound');
                                        }
                                    }


                                } else if (pokemonIsShiny == true) {
                                    if (evolveNewShinyCheckTwo == 0 || evolveNewShinyCheckThree == 0 || evolveNewShinyCheckFour == 0 || evolveNewShinyCheckFive == 0 || evolveNewShinyCheckSix == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newshinypokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Shiny Pokédex entry</h3><ul class="newshinypokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newshinypokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newshinypokedexentry');
                                        }
                                    } else if (evolvePokemonName.includes('[Alolan Forme]')) { // for alolans
                                        if ((evolveNewTotalOne > evolveNewCheckOne && evolveNewCheckOne > 0) || (evolveNewTotalTwo > evolveNewCheckTwo && evolveNewCheckTwo > 0) || (evolveNewTotalThree > evolveNewCheckThree && evolveNewCheckThree > 0) || (evolveNewTotalFour > evolveNewCheckFour && evolveNewCheckFour > 0) || (evolveNewTotalFive > evolveNewCheckFive && evolveNewCheckFive > 0) || (evolveNewTotalSix > evolveNewCheckSix && evolveNewCheckSix > 0)) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possibleshinyalolan') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new Shiny Alolan entry</h3><ul class="possibleshinyalolan qolChangeLogContent"></ul></li><br>');
                                            }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possibleshinyalolan>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.possibleshinyalolan');
                                        }

                                        }
                                    } else if (evolvePokemonName.indexOf('[') >= 0) {
                                        if (evolvePokemonName.indexOf('[Alolan Forme]') == -1 && searchDexData.indexOf('"'+evolvePokemonNameOne+'"') >= 0 && evolveNewTotalOne > evolveNewCheckOne) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possibleshinydifferent') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new Shiny forme/cloak entry</h3><ul class="possibleshinydifferent qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possibleshinydifferent>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.possibleshinydifferent');
                                            }

                                        } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newshinypokedexentry') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Shiny Pokédex entry</h3><ul class="newshinypokedexentry qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newshinypokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.newshinypokedexentry');
                                            }
                                        }

                                    } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newshinypokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Shiny Pokédex entry</h3><ul class="newshinypokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newshinypokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newshinypokedexentry');
                                        }

                                    } else {
                                        //END
                                        //console.log(evolvePokemonName+' still needs to be searched');
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('errornotfound') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Error contact Bentomon!</h3><ul class="errornotfound qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.errornotfound>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.errornotfound');
                                        }
                                    }

                                } else if (pokemonIsAlbino == true) {
                                    if (evolveNewAlbinoCheckTwo == 0 || evolveNewAlbinoCheckThree == 0 || evolveNewAlbinoCheckFour == 0 || evolveNewAlbinoCheckFive == 0 || evolveNewAlbinoCheckSix == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newalbinopokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Albino Pokédex entry</h3><ul class="newalbinopokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newalbinopokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newalbinopokedexentry');
                                        }
                                    } else if (evolvePokemonName.includes('[Alolan Forme]')) { // for alolans
                                        if ((evolveNewTotalOne > evolveNewCheckOne && evolveNewCheckOne > 0) || (evolveNewTotalTwo > evolveNewCheckTwo && evolveNewCheckTwo > 0) || (evolveNewTotalThree > evolveNewCheckThree && evolveNewCheckThree > 0) || (evolveNewTotalFour > evolveNewCheckFour && evolveNewCheckFour > 0) || (evolveNewTotalFive > evolveNewCheckFive && evolveNewCheckFive > 0) || (evolveNewTotalSix > evolveNewCheckSix && evolveNewCheckSix > 0)) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possiblealbinoalolan') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new Albino Alolan entry</h3><ul class="possiblealbinoalolan qolChangeLogContent"></ul></li><br>');
                                            }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possiblealbinoalolan>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.possiblealbinoalolan');
                                        }

                                        }
                                    } else if (evolvePokemonName.indexOf('[') >= 0) {
                                        if (evolvePokemonName.indexOf('[Alolan Forme]') == -1 && searchDexData.indexOf('"'+evolvePokemonNameOne+'"') >= 0 && evolveNewTotalOne > evolveNewCheckOne) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possiblealbinodifferent') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new Albino forme/cloak entry</h3><ul class="possiblealbinodifferent qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possiblealbinodifferent>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.possiblealbinodifferent');
                                            }

                                        } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newalbinopokedexentry') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Albino Pokédex entry</h3><ul class="newalbinopokedexentry qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newalbinopokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.newalbinopokedexentry');
                                            }
                                        }

                                    } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newalbinopokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Albino Pokédex entry</h3><ul class="newalbinopokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newalbinopokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newalbinopokedexentry');
                                        }

                                    } else {
                                        //END
                                        //console.log(evolvePokemonName+' still needs to be searched');
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('errornotfound') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Error contact Bentomon!</h3><ul class="errornotfound qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.errornotfound>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.errornotfound');
                                        }
                                    }

                                } else if (pokemonIsMelanistic == true) {
                                    if (evolveNewMelaCheckTwo == 0 || evolveNewMelaCheckThree == 0 || evolveNewMelaCheckFour == 0 || evolveNewMelaCheckFive == 0 || evolveNewMelaCheckSix == 0) { //looks for Pokémon that you have 0 from. Those are always new.
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('newamelanisticpokedexentry') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Melanistic Pokédex entry</h3><ul class="newamelanisticpokedexentry qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.newamelanisticpokedexentry>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.newamelanisticpokedexentry');
                                        }
                                    } else if (evolvePokemonName.includes('[Alolan Forme]')) { // for alolans
                                        if ((evolveNewTotalOne > evolveNewCheckOne && evolveNewCheckOne > 0) || (evolveNewTotalTwo > evolveNewCheckTwo && evolveNewCheckTwo > 0) || (evolveNewTotalThree > evolveNewCheckThree && evolveNewCheckThree > 0) || (evolveNewTotalFour > evolveNewCheckFour && evolveNewCheckFour > 0) || (evolveNewTotalFive > evolveNewCheckFive && evolveNewCheckFive > 0) || (evolveNewTotalSix > evolveNewCheckSix && evolveNewCheckSix > 0)) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possiblemelanalolan') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new Melanistic Alolan entry</h3><ul class="possiblemelanalolan qolChangeLogContent"></ul></li><br>');
                                            }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possiblemelanalolan>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.possiblemelanalolan');
                                        }

                                        }
                                    } else if (evolvePokemonName.indexOf('[') >= 0) {
                                        if (evolvePokemonName.indexOf('[Alolan Forme]') == -1 && searchDexData.indexOf('"'+evolvePokemonNameOne+'"') >= 0 && evolveNewTotalOne > evolveNewCheckOne) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possiblemelandifferent') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Possible new Melanistic forme/cloak entry</h3><ul class="possiblemelandifferent qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possiblemelandifferent>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.possiblemelandifferent');
                                            }

                                        } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possiblemelanalolan') === false) {
                                                document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Melanistic Pokédex entry</h3><ul class="possiblemelanalolan qolChangeLogContent"></ul></li><br>');
                                            }

                                            if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possiblemelanalolan>li:contains('+evolvePokemonName+')').length == 0) {
                                                $(this).clone().appendTo('.possiblemelanalolan');
                                            }
                                        }

                                    } else if (searchDexData.indexOf('"'+evolvePokemonNameOne+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameTwo+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameThree+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFour+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameFive+'"') == -1 && searchDexData.indexOf('"'+evolvePokemonNameSix+'"') == -1) {
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('possiblemelanalolan') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">New Melanistic Pokédex entry</h3><ul class="possiblemelanalolan qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.possiblemelanalolan>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.possiblemelanalolan');
                                        }

                                    } else {
                                        //END
                                        //console.log(evolvePokemonName+' still needs to be searched');
                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>Ul').hasClass('errornotfound') === false) {
                                            document.querySelector('.qolEvolveNewList').insertAdjacentHTML('beforeend', '<li class="expandlist"><h3 class="slidermenu">Error contact Bentomon!</h3><ul class="errornotfound qolChangeLogContent"></ul></li><br>');
                                        }

                                        if ($('#farmnews-evolutions>.scrollable>.qolEvolveNewList>Li>.errornotfound>li:contains('+evolvePokemonName+')').length == 0) {
                                            $(this).clone().appendTo('.errornotfound');
                                        }
                                    }
                                }
                            }
                        });

                        $('.evolvepkmnlist').hide();

                        //layout
                        let typeBackground = $('.panel>h3').css('background-color');
                        let typeBorder = $('.panel>h3').css('border');
                        let typeColor = $('.panel>h3').css('color');
                        $(".expandlist").css("background-color", ""+typeBackground+"");
                        $(".expandlist").css("border", ""+typeBorder+"");
                        $(".expandlist").css("color", ""+typeColor+"");

                        let typeListBackground = $('.tabbed_interface>div').css('background-color');
                        let typeListColor = $('.tabbed_interface>div').css('color');
                        $(".qolChangeLogContent").css("background-color", ""+typeListBackground+"");
                        $(".qolChangeLogContent").css("color", ""+typeListColor+"");
                    }
                },

                easyQuickEvolve() {
                    if ($('.canevolve:contains("evolved into")').parent().length != 0) {
                        $('.canevolve:contains("evolved into")').parent().remove();
                    }
                },
                labAddTypeList() {
                    let theList = `<div class='typeNumber'> <select name="types" class="qolsetting" data-key="findLabType"> ` + GLOBALS.TYPE_OPTIONS + `</select> <input type='button' value='Remove' id='removeLabTypeList'> </div>`;
                    let numberTypes = $('#labTypes>div').length;
                    $('#labTypes').append(theList);
                    $('.typeNumber').removeClass('typeNumber').addClass(""+numberTypes+"");
                },
                labRemoveTypeList(byebye, key) {
                    VARIABLES.labListArray = $.grep(VARIABLES.labListArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
                        return value != key;
                    });
                    VARIABLES.userSettings.labNotiferSettings.findLabType = VARIABLES.labListArray.toString()

                    fn.backwork.saveSettings();
                    $(byebye).parent().remove();

                    let i;
                    for(i = 0; i < $('#shelterTypes>div').length; i++) {
                        let rightDiv = i + 1;
                        $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                    }
                },

                labAddTextField() {
                    let theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="findLabEgg"/></label><input type='button' value='Remove' id='removeLabSearch'></div>`;
                    let numberDiv = $('#searchkeys>div').length;
                    $('#searchkeys').append(theField);
                    $('.numberDiv').removeClass('numberDiv').addClass(""+numberDiv+"");

                },
                labRemoveTextfield(byebye, key) { //add a loop to change all the classes of divs (amount of divs) so it fits with the save keys
                    VARIABLES.labSearchArray = $.grep(VARIABLES.labSearchArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
                        return value != key;
                    });
                    VARIABLES.userSettings.labNotiferSettings.findLabEgg = VARIABLES.labSearchArray.toString()

                    fn.backwork.saveSettings();
                    $(byebye).parent().remove();

                    let i;
                    for(i = 0; i < $('#searchkeys>div').length; i++) {
                        let rightDiv = i + 1;
                        $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                    }

                },

                labCustomSearch() {
                    document.querySelector('#labsuccess').innerHTML="";
                    $('#egglist>div>img').removeClass('shelterfoundme');

                    if (VARIABLES.labListArray.length == 1 && VARIABLES.labListArray[0] == "") {
                        let iDontWork = true;
                    } else {
                        let typesArrayNoEmptySpace = VARIABLES.labListArray.filter(v=>v!='');
                        let typeSearchAmount = typesArrayNoEmptySpace.length;
                        let i;
                        for (i = 0; i < typeSearchAmount; i++) {
                            let value = typesArrayNoEmptySpace[i];
                            let amountOfTypesFound = [];
                            let typePokemonNames = [];

                            $('#egglist>div>h3').each(function() {
                                let searchPokemon = ($(this).text().split(' ')[0]);
                                let searchTypeOne = VARIABLES.dexDataVar[VARIABLES.dexDataVar.indexOf('"'+searchPokemon+'"') + 1];
                                let searchTypeTwo = VARIABLES.dexDataVar[VARIABLES.dexDataVar.indexOf('"'+searchPokemon+'"') + 2];
                                if (searchTypeOne === value) {
                                    amountOfTypesFound.push('found');
                                    typePokemonNames.push(searchPokemon);
                                }

                                if (searchTypeTwo === value) {
                                    amountOfTypesFound.push('found');
                                    typePokemonNames.push(searchPokemon);
                                }
                            })

                            let foundType = VARIABLES.shelterTypeSearch[VARIABLES.shelterTypeSearch.indexOf(value) + 2];

                            let typeImgStandOutLength = typePokemonNames.length;
                            let o;
                            for (o = 0; o < typeImgStandOutLength; o++) {
                                let value = typePokemonNames[o];
                                let shelterImgSearch = $("#egglist>div>h3:containsIN("+value+")")
                                let shelterBigImg = shelterImgSearch.next();
                                $(shelterBigImg).addClass('shelterfoundme');
                            }


                            if (amountOfTypesFound.length < 1) {
                                let iDontDoAnything = true;
                            } else if (amountOfTypesFound.length > 1) {
                                document.querySelector('#labsuccess').insertAdjacentHTML('beforeend','<div id="labfound">'+amountOfTypesFound.length+' '+foundType+' egg types found! ('+typePokemonNames.toString()+')</div>');
                            } else {
                                document.querySelector('#labsuccess').insertAdjacentHTML('beforeend','<div id="labfound">'+amountOfTypesFound.length+' '+foundType+' egg type found! ('+typePokemonNames.toString()+')</div>');
                            }
                        }
                    }

                    if (VARIABLES.labSearchArray.length == 1 && VARIABLES.labSearchArray[0] == "") {
                        let iDontDoAnything = true;
                    } else {
                        let customSearchAmount = VARIABLES.labSearchArray.length;
                        let i;
                        for (i = 0; i < customSearchAmount; i++) {
                        let value = VARIABLES.labSearchArray[i];
                            if ($("#egglist>div>h3:containsIN("+value+")").length) {
                                let searchResult = value;

                                let shelterImgSearch = $("#egglist>div>h3:containsIN("+value+")")
                                let shelterBigImg = shelterImgSearch.next();
                                $(shelterBigImg).addClass('shelterfoundme');

                                if ($("#egglist>div>h3:containsIN("+value+")").length > 1) {
                                    document.querySelector('#labsuccess').insertAdjacentHTML('beforeend','<div id="labfound">'+searchResult+' found!<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952"></div>');
                                } else {
                                    document.querySelector('#labsuccess').insertAdjacentHTML('beforeend','<div id="labfound">'+searchResult+' found!<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952"></div>');
                                }
                            }

                            if ($('#egglist>div img[src*="'+value+'"]').length) {
                                let searchResult = $('#egglist>div img[src*="'+value+'"]').prev().text();

                                let shelterImgSearch = $('#egglist>div img[src*="'+value+'"]')
                                $(shelterImgSearch).addClass('shelterfoundme');

                                if ($('#egglist>div img[src*="'+value+'"]').length > 1) {
                                    document.querySelector('#labsuccess').insertAdjacentHTML('beforeend','<div id="labfound">'+searchResult+' found!<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952"></div>');
                                } else {
                                    document.querySelector('#labsuccess').insertAdjacentHTML('beforeend','<div id="labfound">'+searchResult+' found!<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952"></div>');
                                }
                            }
                        }
                    }
                },

                privateFieldAddSelectSearch(cls, name, data_key, options, id, divParent) {
                    let theList = `<div class='${cls}'> <select name='${name}' class="qolsetting" data-key='${data_key}'> ${options} </select> <input type='button' value='Remove' id='${id}'> </div>`;
                    let number = (`#${divParent}>div`).length;
                    $(`#${divParent}`).append(theList);
                    $(`.${cls}`).removeClass(cls).addClass(""+number+"");
                },
                privateFieldRemoveSelectSearch(arr, byebye, key, settingsKey, divParent) {
                    arr = $.grep(arr, function(value) { return value != key; });
                    VARIABLES.userSettings.privateFieldSearchSettings[settingsKey] = arr.toString();

                    fn.backwork.saveSettings();
                    $(byebye).parent().remove();

                    for(let i = 0; i < $(`#${divParent}>div`).length; i++) {
                        let rightDiv = i + 1;
                        $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                    }

                    return arr;
                },
                privateFieldAddTypeSearch() {
                    console.log('garlic bread')
                    PrivateFieldsPage.addSelectSearch('typeNumber', 'types', 'fieldType', GLOBALS.TYPE_OPTIONS, 'removePrivateFieldTypeSearch', 'fieldTypes');
                },
                privateFieldAddNatureSearch() {
                    PrivateFieldsPage.addSelectSearch('natureNumber', 'natures', 'fieldNature', GLOBALS.NATURE_OPTIONS, 'removePrivateFieldNature', 'natureTypes')
                },
                privateFieldAddEggGroupSearch() {
                    PrivateFieldsPage.addSelectSearch('eggGroupNumber', 'eggGroups', 'fieldEggGroup', GLOBALS.EGG_GROUP_OPTIONS, 'removePrivateFieldEggGroupSearch', 'eggGroupTypes')
                },
                privateFieldRemoveTypeSearch(byebye, key) {
                    VARIABLES.typeArray = fn.API.privateFieldRemoveSelectSearch(VARIABLES.typeArray, byebye, key, 'fieldType', 'fieldTypes')
                },
                privateFieldRemoveNatureSearch(byebye, key) {
                    VARIABLES.natureArray = fn.API.privateFieldRemoveSelectSearch(VARIABLES.natureArray, byebye, key, 'fieldNature', 'natureTypes')
                },
                privateFieldRemoveEggGroupSearch(byebye, key) {
                    VARIABLES.eggGroupArray = fn.API.privateFieldRemoveSelectSearch(VARIABLES.eggGroupArray, byebye, key, 'fieldEggGroup', 'eggGroupTypes')
                },

                privateFieldAddTextField() {
                    let theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="fieldCustom"/></label><input type='button' value='Remove' id='removePrivateFieldSearch'></div>`;
                    let numberDiv = $('#searchkeys>div').length;
                    $('#searchkeys').append(theField);
                    $('.numberDiv').removeClass('numberDiv').addClass(""+numberDiv+"");
                },
                privateFieldRemoveTextField(byebye, key) {
                    VARIABLES.customArray =
                        $.grep(VARIABLES.customArray,
                               //when textfield is removed, the value will be deleted from the localstorage
                               function(value) {
                                   return value != key;
                               });
                    VARIABLES.userSettings.privateFieldSearchSettings.fieldCustom = VARIABLES.customArray.toString()

                    fn.backwork.saveSettings();
                    $(byebye).parent().remove();

                    let i;
                    for(i = 0; i < $('#searchkeys>div').length; i++) {
                        let rightDiv = i + 1;
                        $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                    }
                },

                fieldAddTypeList() {
                    fn.API.privateFieldAddSelectSearch('typeNumber', 'types', 'fieldType', GLOBALS.TYPE_OPTIONS, 'removeFieldTypeList', 'fieldTypes');
                },
                fieldAddNatureSearch() {
                    fn.API.privateFieldAddSelectSearch('natureNumber', 'natures', 'fieldNature', GLOBALS.NATURE_OPTIONS, 'removeFieldNature', 'natureTypes');
                },
                fieldRemoveTypeList(byebye, key) {
                    VARIABLES.fieldTypeArray = $.grep(VARIABLES.fieldTypeArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
                        return value != key;
                    });
                    VARIABLES.userSettings.fieldSearchSettings.fieldType = VARIABLES.fieldTypeArray.toString()

                    fn.backwork.saveSettings();
                    $(byebye).parent().remove();

                    let i;
                    for(i = 0; i < $('#fieldTypes>div').length; i++) {
                        let rightDiv = i + 1;
                        $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                    }
                },
                fieldRemoveNatureSearch(byebye, key) {
                    VARIABLES.fieldNatureArray = $.grep(VARIABLES.fieldNatureArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
                        return value != key;
                    });
                    VARIABLES.userSettings.fieldSearchSettings.fieldNature = VARIABLES.fieldNatureArray.toString()

                    fn.backwork.saveSettings();
                    $(byebye).parent().remove();

                    let i;
                    for(i = 0; i < $('#natureTypes>div').length; i++) {
                        let rightDiv = i + 1;
                        $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                    }
                },

                fieldAddTextField() {
                    let theField = `<div class='numberDiv'><label><input type="text" class="qolsetting" data-key="fieldCustom"/></label><input type='button' value='Remove' id='removeFieldSearch'></div>`;
                    let numberDiv = $('#searchkeys>div').length;
                    $('#searchkeys').append(theField);
                    $('.numberDiv').removeClass('numberDiv').addClass(""+numberDiv+"");
                },
                fieldRemoveTextField(byebye, key) {
                    VARIABLES.fieldCustomArray = $.grep(VARIABLES.fieldCustomArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
                        return value != key;
                    });
                    VARIABLES.userSettings.fieldSearchSettings.fieldCustom = VARIABLES.fieldCustomArray.toString()

                    fn.backwork.saveSettings();
                    $(byebye).parent().remove();

                    let i;
                    for(i = 0; i < $('#searchkeys>div').length; i++) {
                        let rightDiv = i + 1;
                        $('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
                    }
                },
                fieldCustomSearch() {
                    if (VARIABLES.userSettings.fieldSearch === true) {
                        console.log('search activated');
                    }
                },
            }, // end of API
        }; // end of fn

        fn.backwork.init();

        return fn.API;
    })(); // end of PFQoL function

    $(document).on('click', 'li[data-name*="QoL"]', (function() { //open QoL hub
        PFQoL.qolHubBuild();
    }));

    $(document).on('click', '.closeHub', (function() { //close QoL hub
        PFQoL.qolHubClose();
    }));

    $(document).on('click', 'h3.slidermenu', (function() { //show hidden li in change log
        $(this).next().slideToggle();
    }));

    $(document).on('input', '.qolsetting', (function() { //Changes QoL settings
        console.log('naan - begin')
        PFQoL.settingsChange(this.getAttribute('data-key'), $(this).val(), $(this).parent().parent().attr('class'), $(this).parent().attr('class'));
        console.log('naan - end')
    }));

    if(Helpers.onFishingPage()) {
        $(document).on('mouseover', '#caughtfishcontainer', (function() { //select all feature
            PFQoL.releaseFishSelectAll();
        }));
    }

    if(Helpers.onMultiuserPage()) {
        $(window).on('load', (function() {
            PFQoL.partyModification();
        }));

        $(document).on('click input', '#qolpartymod', (function() { // partymods
            PFQoL.partyModification();
        }));

        $(document).on('click', '.tabbed_interface', (function() {
            PFQoL.partyModification();
        }));
    }

    if(Helpers.onDexPage()) {
        $(window).on('load', (function() {
            PFQoL.savingDexData();
        }));
    }

    if(Helpers.onFarmPage("tab=1")) {
        $(document).on('click', '#qolevolvenormal', (function() {
            PFQoL.easyEvolveNormalList();
        }));

        $(document).on('click', '#qolchangesletype', (function() {
            PFQoL.easyEvolveTypeList();
        }));

        $(document).on('click', '#qolsortevolvename', (function() {
            PFQoL.easyEvolveNameList();
        }));

        $(document).on('click', '#qolevolvenew', (function() {
            PFQoL.easyEvolveNewList();
        }));
    }

    if(Helpers.onLabPage()) {
        $(document).on('click', '#addLabSearch', (function() { //add lab text field
            PFQoL.labAddTextField();
        }));

        $(document).on('click', '#removeLabSearch', (function() { //remove lab text field
            PFQoL.labRemoveTextfield(this, $(this).parent().find('input').val());
        }));

        $(document).on('click', '#addLabTypeList', (function() { //add lab type list
            PFQoL.labAddTypeList();
        }));

        $(document).on('click', '#removeLabTypeList', (function() { //remove lab type list
            PFQoL.labRemoveTypeList(this, $(this).parent().find('select').val());
        }));

        $(document).on('change', '#labCustomSearch input', (function() { //lab search
            PFQoL.labCustomSearch();
        }));

        $(document).on('click', '#labpage', (function() { //shelter search
            PFQoL.labCustomSearch();
        }));

        $(window).on('load', (function() {
            PFQoL.labCustomSearch();
        }));
    }

    if(Helpers.onPublicFieldsPage()) {
        $(document).on('click', '*[data-menu="release"]', (function() { //select all feature
            PFQoL.releaseFieldSelectAll();
        }));

         $(document).on('click input', '#fieldorder, #field_field, #field_berries, #field_nav', (function() { //field sort
            PFQoL.fieldSorter();
            //PFQoL.fieldCustomSearch();
        }));

        $(window).on('load', (function() {
            PFQoL.fieldSorter();
            //PFQoL.fieldCustomSearch();
        }));

        document.addEventListener("keydown", function(event) {
            PFQoL.fieldSorter();
            //PFQoL.fieldCustomSearch();
        });

        $(document).on('click', '#addFieldSearch', (function() { //add field text field
            PFQoL.fieldAddTextField();
        }));

        $(document).on('click', '#removeFieldSearch', (function() { //remove field text field
            PFQoL.fieldRemoveTextField(this, $(this).parent().find('input').val());
        }));

        $(document).on('click', '#addFieldNatureSearch', (function() { //add field nature search
            PFQoL.fieldAddNatureSearch();
        }));

        $(document).on('click', '#removeFieldNature', (function() { //remove field nature search
            PFQoL.fieldRemoveNatureSearch(this, $(this).parent().find('select').val());
        }));

        $(document).on('click', '#addFieldTypeList', (function() { //add field type list
            PFQoL.fieldAddTypeList();
        }));

        $(document).on('click', '#removeFieldTypeList', (function() { //remove field type list
            PFQoL.fieldRemoveTypeList(this, $(this).parent().find('select').val());
        }));
    }
})(jQuery); //end of userscript
