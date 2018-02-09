/*eslint no-unused-vars: off*/
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CribbageGame from './game'
//import App from './App';
import registerServiceWorker from './registerServiceWorker';

const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const values = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];

ReactDOM.render(<CribbageGame cribOwner={"computer"} />, document.getElementById('root'));
registerServiceWorker();
function newFunction()
{
    console.log("let cardFiles = {");
    suits.forEach((suit) =>
    {
        values.forEach((value) =>
        {
            let name = value + 'Of' + suit;
            let s = name + ": require('../images/cards/" + name + "'),";
            console.log(s);

        });
    });

    console.log("}")
}

