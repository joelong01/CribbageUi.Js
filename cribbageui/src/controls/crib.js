// eslint-disable-next-line
import React, { Component } from 'react';
import { roundRect } from "../helper_functions";
import { printCanvasInfo } from "../helper_functions";

class CribCanvas extends React.Component
{
    constructor(props)
    {
        super(props);
        this.draw = this.draw.bind(this);
        this.state = {
            cribOwner: "Computer"
        }

        this.cribOwnerChanged = this.cribOwnerChanged.bind(this);


    }


    cribOwnerChanged(e, newOwner)
    {
        console.log("cribOwnerChanged to: " + newOwner);
        this.setState({ cribOwner: newOwner }, function ()
        {
            this.draw();
        });


    }


    render()
    {

        return (
            <canvas ref="cribCanvas">
                width={0}
                height= {0}
                left = {0};
                top = {0};
        </canvas>
        );

    }
    draw()
    {
        var canvas = this.refs.cribCanvas;
        canvas.width = 127;
        canvas.height = 535;
        canvas.left = 0;
        canvas.top = 0;
        const hdc = this.refs.cribCanvas.getContext('2d');
        hdc.fillStyle = 'rgba(128,128,128, .75)';
        let cribTop = 2;
        if (this.state.cribOwner === "Player")
        {
            cribTop = canvas.clientHeight - 177;
        }
        hdc.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        hdc.fillStyle = 'rgba(0, 64, 0, 1)';
        hdc.strokeStyle = 'rgba(255, 0, 0, 1)';
        roundRect(hdc, 1, cribTop, 125, 175, 4, true, true);
        printCanvasInfo(hdc, "crib", canvas.left, canvas.top, canvas.width, canvas.height);
        hdc.font = "12px Courier New";
        hdc.fillStyle = 'rgba(255,255,255,1)';
        hdc.fillText(this.state.isComputerOwned ? "Computer's Crib" : "Player's Crib", 10, 80);
        console.log("in crib.draw.  cribOwner: " + this.state.cribOwner);
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

export default CribCanvas;