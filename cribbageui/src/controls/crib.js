// eslint-disable-next-line
import React, { Component } from 'react';
import { roundRect } from "../helper_functions";
import { printCanvasInfo } from "../helper_functions";

class CribCanvas extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
            {
                cribOwner: "Computer",
                clientHeight: 340
            }

        this.cribOwnerChanged = this.cribOwnerChanged.bind(this);
        this.draw = this.draw.bind(this);
        this.animateCribToOwner = this.animateCribToOwner.bind(this);


    }
    animateCribToOwner(computerOwns)
    {
        this.setState({ isComputerOwned: computerOwns });

    }

    cribOwnerChanged(e, newOwner)
    {
        
        this.setState({ cribOwner: newOwner}, () => 
        {
            console.log("cribOwnerChanged to: " + this.state.newOwner);
            this.draw(); 
        });

    }


    render()
    {
        return (
            <canvas ref={canvas => this.canvas = canvas} />
        );
    }
    


    draw()
    {
        const hdc = this.canvas.getContext('2d');
        hdc.clearRect(0, 0, this.canvas.width, this.canvas.height);

        hdc.fillStyle = 'rgba(128,128,128, .75)';
        let cribTop = 2;
        console.log("in draw cribOwner is " + this.state.cribOwner);
        if (this.state.cribOwner !== "Computer")
        {
            cribTop = this.canvas.clientHeight - 177;
        }
        hdc.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        hdc.fillStyle = 'rgba(0, 64, 0, 1)';
        hdc.strokeStyle = 'rgba(255, 0, 0, 1)';
        roundRect(hdc, 1, cribTop, 125, 175, 4, true, true);
        printCanvasInfo(hdc, "crib", 0, cribTop, this.canvas.width, this.canvas.height);
        hdc.font = "12px Courier New";
        hdc.fillStyle = 'rgba(255,255,255,1)';
        hdc.fillText(this.state.isComputerOwned ? "Computer's Crib" : "Player's Crib", 10, 80 + cribTop);
        console.log("in crib.draw.  cribOwner: " + this.state.cribOwner);
    }

    componentDidUpdate(prevProps, prevState) 
    {
        if (this.props.cribOwner !== prevProps.cribOwner || this.props.clientHeight !== prevProps.clientHeight) 
        {
            console.log("state changed. call draw()");
            this.draw();
        }
        else
        {
            console.log("state didn't change");
        }
    }

    componentDidMount()
    {
        window.addEventListener('resize', (value, e) => this.handleResize(this, false));
        this.canvas.width = 127;
        this.canvas.height = 535;
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