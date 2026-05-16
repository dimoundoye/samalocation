/**
 * Utility to convert numbers to words in French
 */

const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
const special = {
    11: 'onze',
    12: 'douze',
    13: 'treize',
    14: 'quatorze',
    15: 'quinze',
    16: 'seize',
    71: 'soixante et onze',
    72: 'soixante-douze',
    73: 'soixante-treize',
    74: 'soixante-quatorze',
    75: 'soixante-quinze',
    76: 'soixante-seize',
    80: 'quatre-vingts',
    91: 'quatre-vingt-onze',
    92: 'quatre-vingt-douze',
    93: 'quatre-vingt-treize',
    94: 'quatre-vingt-quatorze',
    95: 'quatre-vingt-quinze',
    96: 'quatre-vingt-seize'
};

function convertGroup(n) {
    if (n === 0) return '';
    
    let words = '';
    
    // Hundreds
    const h = Math.floor(n / 100);
    if (h > 0) {
        if (h === 1) {
            words += 'cent ';
        } else {
            words += units[h] + ' cent' + (n % 100 === 0 ? 's ' : ' ');
        }
    }
    
    // Tens and Units
    const rem = n % 100;
    if (rem === 0) return words.trim();
    
    if (special[rem]) {
        words += special[rem];
    } else if (rem < 10) {
        words += units[rem];
    } else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        
        if (t === 7 || t === 9) {
            words += tens[t - 1] + (u === 1 ? ' et ' : '-') + special[10 + u];
        } else {
            words += tens[t] + (u === 1 ? ' et ' : (u > 0 ? '-' : '')) + units[u];
        }
    }
    
    return words.trim();
}

/**
 * Converts a number to French words
 * @param {number} number 
 * @returns {string}
 */
function numberToWords(number) {
    if (number === 0) return 'zéro';
    
    const parts = [];
    const billions = Math.floor(number / 1000000000);
    const millions = Math.floor((number % 1000000000) / 1000000);
    const thousands = Math.floor((number % 1000000) / 1000);
    const remainder = number % 1000;
    
    if (billions > 0) {
        parts.push(convertGroup(billions) + (billions > 1 ? ' milliards' : ' milliard'));
    }
    if (millions > 0) {
        parts.push(convertGroup(millions) + (millions > 1 ? ' millions' : ' million'));
    }
    if (thousands > 0) {
        if (thousands === 1) {
            parts.push('mille');
        } else {
            parts.push(convertGroup(thousands) + ' mille');
        }
    }
    if (remainder > 0) {
        parts.push(convertGroup(remainder));
    }
    
    return parts.join(' ');
}

/**
 * Formats an amount in words with currency
 * @param {number} amount 
 * @param {string} currencyCode (XOF, EUR, USD, etc.)
 * @returns {string}
 */
function formatAmountInWords(amount, currencyCode = 'XOF') {
    const integerPart = Math.floor(amount);
    const words = numberToWords(integerPart);
    
    let currencyName = '';
    let plural = integerPart > 1;
    
    switch (currencyCode.toUpperCase()) {
        case 'XOF':
        case 'XAF':
            currencyName = 'franc' + (plural ? 's' : '') + ' CFA';
            break;
        case 'EUR':
            currencyName = 'euro' + (plural ? 's' : '');
            break;
        case 'USD':
            currencyName = 'dollar' + (plural ? 's' : '');
            break;
        default:
            currencyName = currencyCode;
    }
    
    // Capitalize first letter
    const result = words + ' ' + currencyName;
    return result.charAt(0).toUpperCase() + result.slice(1);
}

module.exports = { numberToWords, formatAmountInWords };
