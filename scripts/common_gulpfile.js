const path = require('path');

exports.commonSources = [
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/polyfill.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/resources.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/helpers.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/globals.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/localStorageManager.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/qolHub.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/basePage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/daycarePage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/dexPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/farmPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/fishingPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/labPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/multiuserPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/privateFieldsPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/publicFieldsPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/shelterPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/wishforgePage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/pagesManager.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/common/pfqol.js',
];

exports.sanctionedSources = [
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/resources.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/globals.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/localStorageManager.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/qolHub.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/shelterPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/privateFieldsPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/labPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/farmPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/dexPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/sanctioned/pfqol.js',
];

exports.userSources = [
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/resources.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/globals.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/evolutionTreeParser.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/dexPageParser.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/localStorageManager.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/dexUtilities.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/qolHub.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/shelterPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/privateFieldsPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/labPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/farmPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/dexPage.js',
    '/home/jonpaul/code/javascript/PokeFarmQoL/requires/user/pfqol.js',
];

exports.sanctionedHeaderPath = path.join(__dirname, '..', 'requires', 'sanctioned', 'header.txt');
exports.userHeaderPath = path.join(__dirname, '..', 'requires', 'user', 'header.txt');