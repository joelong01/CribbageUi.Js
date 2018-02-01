// eslint-disable-next-line
import React, { Component } from 'react';
import {roundRect} from "../helper_functions";
import {printCanvasInfo} from "../helper_functions";
export class CardGrid extends React.Component
{
    constructor(props)
    {
        super(props);
        this.cardCount = props.children[5];
        this.gridName = props.children[9];
        this.state = {
            left: props.children[1],
            top: props.children[3],
            cardCount: props.children[5],
            stacked: props.children[7],
            gridName: props.children[9]
        }
        console.log("cardCount:" + this.cardCount);
        this.draw = this.draw.bind(this);
        this.render = this.render.bind(this);
    }

    render() 
    {
        return (
            <canvas ref="cardCanvas">
                width={(this.state.cardCount * 125) + (2 * this.state.left)}
                height= {175 + 2 * this.state.top}
                left = {this.state.left}
                top = {this.state.top}
            </canvas>
        );
    }

    draw()
    {
        const canvas = this.refs.cardCanvas;
        canvas.width = (this.state.cardCount * 125) + (2 * this.state.left);
        canvas.left = 0;
        canvas.top = 0;
        canvas.height = 177;
        
        const hdc = this.refs.cardCanvas.getContext('2d');
        
        

        hdc.fillStyle = 'rgba(128,128,128, .5)';
        hdc.fillRect(0, 0, canvas.width, canvas.height);

        hdc.fillStyle = 'rgba(0, 64, 0, 1)';
        hdc.strokeStyle = 'rgba(255, 0, 0, 1)';

        roundRect(hdc, 1,1, this.state.cardCount * 125, 175, 10, true, true);
        printCanvasInfo(hdc, this.state.gridName, canvas.left, canvas.top, canvas.width, canvas.height);
        
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
export default CardGrid;