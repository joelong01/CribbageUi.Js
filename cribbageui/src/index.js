import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CribbageGame from './game'
//import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<CribbageGame />, document.getElementById('root'));
registerServiceWorker();
