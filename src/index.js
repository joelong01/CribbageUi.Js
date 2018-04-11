/*eslint no-unused-vars: off*/
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CribbageGame from './game'
import registerServiceWorker from './registerServiceWorker';


const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const values = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];

ReactDOM.render(<CribbageGame />, document.getElementById('root'));
registerServiceWorker();


