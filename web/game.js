// 1. load data

//import { parse } from './csv.js';

export let tweetData = [];
export let voteData = [];
export let partyCodeData = [];

export let currentRow = [];
export let currentIndex = 0;

export let wins = 0;
export let losses = 0;

export let dailyMode = 0;
export let dailyIndex = 0;

export let partyNameMap = {
    1: "Conservative",
    2: "Labour",
    3: "Liberal Democrat",
    4: "Scottish National Party (SNP)",
    5: "Plaid Cymru",
    6: "United Kingdom Independence Party (UKIP)",
    7: "Green",
    8: "British National Party (BNP)",
    11: "Change UK",
    12: "Reform UK",
    13: "Independent",
    9: "Other",
};

export let partyEmojiMap = {
    "Conservative": "🟦",
    "Labour": "🟥",
    "Liberal Democrat": "🟧",
    "Green": "🟩",
    "Scottish National Party (SNP)": "🟨",
    "Plaid Cymru": "🟩",
    "United Kingdom Independence Party (UKIP)": "🟪",
    "Reform UK": "🟦",
    "Brexit Party": "🟦",
    "Change UK": "⬛",
    "Independent": "⬜",
    "Other": "⬜",

};

export function setDailyMode(mode) {
    dailyMode = mode;
}

export async function getData() {
    document.getElementById('tweet').textContent = 'LOADING...';
    const response = await fetch('data/tweets.txt');
    const data = await response.text();
    const response2 = await fetch('data/votes.txt');
    const data2 = await response2.text();
    const response3 = await fetch('data/party_codes.txt');
    const data3 = await response3.text();
    const parsed_1 = data.split("\n\n\n");
    let parsed_2 = [];
    let parsed_3 = [];
    for (var line of data2.split("\n")) {
        if (line.length == 0) {
            continue;
        }
        var y = line.split("\t");
        parsed_2.push(y[0]);
        var z = y[1].split(',');
        parsed_3.push([Number.parseInt(z[0]), Number.parseInt(z[1])]);
    }
    tweetData = parsed_1;
    voteData = parsed_2;
    partyCodeData = parsed_3;
    console.log(tweetData.length, voteData.length, partyCodeData.length);
}

export function onAnswer(answer) {
    let party_codes = partyCodeData[currentIndex];
    if (party_codes[0] == answer || party_codes[1] == answer) {
        wins += 1;
        document.getElementById('response').textContent = 'CORRECT ✅';
        document.getElementById(answer).classList.add('chosen_party_correct');
        if (party_codes[1] && party_codes[1] != party_codes[0]) {
            document.getElementById(String(party_codes[0])).classList.add('chosen_party_correct');
            document.getElementById(String(party_codes[1])).classList.add('chosen_party_correct');
        }
    } else {
        losses += 1;
        document.getElementById('response').textContent = 'INCORRECT ❌';
        document.getElementById(answer).classList.add('chosen_party_incorrect');
        document.getElementById(String(party_codes[0])).classList.add('chosen_party_correct');
    }
    document.getElementById('correct_vote').textContent = voteData[currentIndex];
    document.getElementById('current_score').textContent = 'Total correct: ' + wins + '; Total incorrect: ' + losses;
    // omg set timeout based on length of the dmv text?
    for (var button of document.getElementsByClassName('party')) {
        button.disabled = true;
    }
    document.getElementById("next").style.display = "block";
    document.getElementById("next").scrollIntoView();
}

export function update() {
    let i = Math.floor(Math.random()*(tweetData.length - 1)) + 1;
    currentIndex = i;
    //console.log(currentIndex);
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

window.onload = async function() {
    await getData();
    update();
    document.getElementById('1').onclick = () => onAnswer('1');
    document.getElementById('2').onclick = () => onAnswer('2');
    document.getElementById('3').onclick = () => onAnswer('3');
    document.getElementById('4').onclick = () => onAnswer('4');
    document.getElementById('5').onclick = () => onAnswer('5');
    document.getElementById('7').onclick = () => onAnswer('7');
    document.getElementById('9').onclick = () => onAnswer('9');
    document.getElementById('12').onclick = () => onAnswer('12');
    document.getElementById('13').onclick = () => onAnswer('13');
    document.getElementById('next_button').onclick = () => update();
};
