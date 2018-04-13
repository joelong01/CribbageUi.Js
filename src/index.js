/*eslint no-unused-vars: off*/
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CribbageGame from './game'
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<CribbageGame />, document.getElementById('root'));
registerServiceWorker();


