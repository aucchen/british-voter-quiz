// Unlimited mode
//


import { getData, onAnswer, update } from './game.js';

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
