// Daily mode
//
// TODO: generate random numbers using the current date as a seed.

import { getData, setDailyMode, tweetData, voteData, partyCodeData } from './game.js';

let currentIndex = 0;
let currentRow = [];

let dailyIndex = 0;
let dailyString = ["⬜", "⬜", "⬜", "⬜", "⬜"];
let dailyWins = 0;
let dailyLosses = 0;
let dailyAnswers = [];


let historyRecord = [];

// source for prngs and hash functions: https://stackoverflow.com/a/47593316
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4); h2 ^= h1; h3 ^= h1; h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

// https://stackoverflow.com/a/47593316
function sfc32(a, b, c, d) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}


// Build the string that is to be copied
function buildOutputString() {
    let stringBuilder = ["Daily British Voter Quiz - " + window.localStorage.British_voter_quiz_datetime];
    stringBuilder.push(dailyString.join("") + " " + dailyWins + "/5");
    stringBuilder.push("https://red-autumn.itch.io/british-voter-quiz");
    return stringBuilder.join("\n");
}


// TODO: make this work for daily mode
export function updateDailyMode() {
    let datetime = "";
    if (window.localStorage.British_voter_quiz_datetime) {
        datetime = window.localStorage.British_voter_quiz_datetime;
    } else {
        let date = new Date(Date.now());
        datetime = new Intl.DateTimeFormat("en-UK").format(date);
    }
    let seeds = cyrb128(datetime);
    let prng = sfc32(seeds[0], seeds[1], seeds[2], seeds[3]);
    let idx = 0;
    if (dailyIndex >= 5) {
        // TODO: do something when the answers run out
        let outputString = buildOutputString();
        document.getElementById('tweet').textContent = outputString;
        document.getElementById('correct_vote').textContent = '';
        document.getElementById('response').textContent = '';
        document.getElementById("next").style.display = "none";
        document.getElementById("question").style.display = "none";
        document.getElementById("buttons").style.display = "none";
        document.getElementById("copy_post").style.display = "block";
        document.getElementById("copy_post_button").onclick = () => {
            document.getElementById("copy_post_button").textContent = "✓ Copied!";
            navigator.clipboard.writeText(outputString);
        };
        var old_tweets = [];
        for (idx = 0; idx < dailyIndex; idx++) {
            var i = Math.floor(prng()*(tweetData.length - 1)) + 1;
            old_tweets.push(tweetData[i] + "\n\n" + voteData[i]);
        }
        document.getElementById('old_tweet').textContent = old_tweets.join("\n\n---\n\n");
        document.getElementById('date').scrollIntoView();
    } else {
        // use the date component of the date.
        for (idx = 0; idx < dailyIndex; idx++) {
            prng();
        }
        let i = Math.floor(prng()*(tweetData.length - 1)) + 1;
        currentIndex = i;
        currentRow = tweetData[i];
        document.getElementById('tweet').textContent = currentRow;

        document.getElementById('correct_vote').textContent = '';
        document.getElementById('response').textContent = '';
        for (var button of document.getElementsByClassName('party')) {
            button.removeAttribute('disabled');
            button.classList.remove('chosen_party_correct');
            button.classList.remove('chosen_party_incorrect');
        }
        document.getElementById("next").style.display = "none";
        document.getElementById('tweet').scrollIntoView();
    }
}


export function onAnswer(answer) {
    let party_codes = partyCodeData[currentIndex];
    if (party_codes[0] == answer || party_codes[1] == answer) {
        dailyWins += 1;
        dailyAnswers.push(1);
        dailyString[dailyIndex] = "🟩";
        document.getElementById('response').textContent = 'CORRECT ✅';
        document.getElementById(answer).classList.add('chosen_party_correct');
        if (party_codes[1] && party_codes[1] != party_codes[0]) {
            document.getElementById(String(party_codes[0])).classList.add('chosen_party_correct');
            document.getElementById(String(party_codes[1])).classList.add('chosen_party_correct');
        }
    } else {
        dailyLosses += 1;
        dailyAnswers.push(0);
        dailyString[dailyIndex] = "🟥";
        document.getElementById('response').textContent = 'INCORRECT ❌';
        document.getElementById(answer).classList.add('chosen_party_incorrect');
        document.getElementById(String(party_codes[0])).classList.add('chosen_party_correct');
    }
    document.getElementById('correct_vote').textContent = voteData[currentIndex];
    document.getElementById('current_score').textContent = dailyString.join('');
    for (var button of document.getElementsByClassName('party')) {
        button.disabled = true;
    }
    document.getElementById("next").style.display = "block";
    document.getElementById("next").scrollIntoView();
    // update localStorage + daily indices
    dailyIndex += 1;
    window.localStorage.British_voter_quiz_dailyIndex = dailyIndex;
    window.localStorage.British_voter_quiz_dailyString = JSON.stringify(dailyString);
    window.localStorage.British_voter_quiz_dailyWins = dailyWins;
    window.localStorage.British_voter_quiz_dailyLosses = dailyLosses;
    window.localStorage.British_voter_quiz_dailyAnswers = JSON.stringify(dailyAnswers);
}


// initializes base states...
function initialUpdate() {
    let date = new Date(Date.now());
    let datetime = new Intl.DateTimeFormat("en-UK").format(date);
    document.getElementById('date').textContent = "Daily British Voter Quiz - " + datetime;
    if (window.localStorage.British_voter_quiz_datetime) {
        if (window.localStorage.British_voter_quiz_datetime != datetime) {
            window.localStorage.removeItem("British_voter_quiz_dailyIndex");
            window.localStorage.removeItem("British_voter_quiz_dailyString");
            window.localStorage.removeItem("British_voter_quiz_dailyWins");
            window.localStorage.removeItem("British_voter_quiz_dailyLosses");
            window.localStorage.removeItem("British_voter_quiz_dailyAnswers");
        }
    }
    window.localStorage.British_voter_quiz_datetime = datetime;
    if (window.localStorage.British_voter_quiz_dailyIndex) {
        dailyIndex = Number.parseInt(window.localStorage.British_voter_quiz_dailyIndex);
    }
    if (window.localStorage.British_voter_quiz_dailyString) {
        dailyString = JSON.parse(window.localStorage.British_voter_quiz_dailyString);
    }
    if (window.localStorage.British_voter_quiz_dailyWins) {
        dailyWins = Number.parseInt(window.localStorage.British_voter_quiz_dailyWins);
    }
    if (window.localStorage.British_voter_quiz_dailyLosses) {
        dailyLosses = Number.parseInt(window.localStorage.British_voter_quiz_dailyLosses);
    }
    if (window.localStorage.British_voter_quiz_dailyAnswers) {
        dailyAnswers = JSON.parse(window.localStorage.British_voter_quiz_dailyAnswers);
    }
    if (window.localStorage.British_voter_quiz_historyRecord) {
        dailyAnswers = JSON.parse(window.localStorage.British_voter_quiz_historyRecord);
    }
    document.getElementById('current_score').textContent = dailyString.join('');
}


window.onload = async function() {
    await getData();
    initialUpdate();
    setDailyMode(1);
    updateDailyMode();
    document.getElementById('1').onclick = () => onAnswer('1');
    document.getElementById('2').onclick = () => onAnswer('2');
    document.getElementById('3').onclick = () => onAnswer('3');
    document.getElementById('4').onclick = () => onAnswer('4');
    document.getElementById('5').onclick = () => onAnswer('5');
    document.getElementById('7').onclick = () => onAnswer('7');
    document.getElementById('9').onclick = () => onAnswer('9');
    document.getElementById('12').onclick = () => onAnswer('12');
    document.getElementById('13').onclick = () => onAnswer('13');
    document.getElementById('next_button').onclick = () => updateDailyMode();
};

