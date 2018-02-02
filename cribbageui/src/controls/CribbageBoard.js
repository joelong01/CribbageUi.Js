// eslint-disable-next-line
import React, { Component } from 'react';
// eslint-disable-next-line
import {roundRect} from "./../helper_functions";
import {printCanvasInfo} from "./../helper_functions";


export class CribbageBoard extends React.Component
{
    constructor()
    {
        super();
        this.draw = this.draw.bind(this);
        this.left = 0;
        this.height = 225 * 3 + 10;
        
    }
    render()
    {
        let w = window.innerWidth;
        return (
            <canvas ref="boardCanvas">
                width={w}
                height= {225 * 3 + 10};
                left = {this.left};
            top = {0};
        </canvas>
        );
    }
    draw()
    {

        const canvas = this.refs.boardCanvas;
        canvas.width = 400;
        canvas.height = 3*(225 + 2);
        canvas.left = 0;
        canvas.top = 0;

        const hdc = this.refs.boardCanvas.getContext('2d');
        hdc.fillStyle = 'rgba(0,0,255, 1)';
        hdc.fillRect(0, 0, canvas.width, canvas.height);
        //roundRect(hdc, 0, 0, canvas.width, this.height, 4, true, true);
        
        printCanvasInfo(hdc, "crib", canvas.left, canvas.top, canvas.width, canvas.height);
        
    }

    componentDidMount()
    {
        window.addEventListener('resize', (value, e) => this.handleResize(this, false));

        this.draw();
    }

    componentWillUnmount()
    {
        window.removeEventListener('resize', this.handleResize);

    }

    handleResize(value, e)
    {
        this.draw();
    }
}


export default  CribbageBoard;


