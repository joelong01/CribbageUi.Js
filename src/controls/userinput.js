// eslint-disable-next-line
import React, { Component } from 'react';
import { roundRect } from "../helper_functions";
import { printCanvasInfo } from "../helper_functions";
// eslint-disable-next-line
import CribCanvas from "./crib";

class ControlCanvas extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = 
        {
            cribOwner: "Computer",           
        }
       
    }

    render()
    {
        this.handleOptionChange = this.handleOptionChange.bind(this);
        return (
            <div>
                <canvas ref="controlCanvas" />
                <fieldset>
                    <form className="optionForm">
                        <div className="radioButton">
                            <label>
                                <input type="radio" value="Computer" 
                                checked={this.state.cribOwner === 'Computer'} 
                                 onChange={this.handleOptionChange}/>
                                 <span className="radioTextBlock">
                                    Computer Crib
                                </span>
                            </label>
                        </div>
                        <div className="radioButton">
                            <label>
                                <input type="radio" value="Player" 
                                checked={this.state.cribOwner === 'Player'} 
                                onChange={this.handleOptionChange}/>                             
                                <span className="radioTextBlock">
                                    Player Crib
                                </span>
                            </label>
                        </div>
                    </form>
                </fieldset>
            </div>
        );
    }
    handleOptionChange(changeEvent)
    {
        this.setState({cribOwner: changeEvent.target.value});
        this.props.cribOwnerChanged(this, changeEvent.target.value);
    }
   
    draw()
    {
        var canvas = this.refs.controlCanvas;
        canvas.width = 1275;
        canvas.height = 400;
        canvas.left = 0;
        canvas.top = 0;
        const hdc = this.refs.controlCanvas.getContext('2d');
        hdc.fillStyle = 'rgba(0,128,128, .75)';
        hdc.fillRect(0, 0, canvas.width, canvas.height);
        hdc.fillStyle = 'rgba(0, 64, 64, 1)';
        hdc.strokeStyle = 'rgba(255, 0, 255, 1)';
        roundRect(hdc, 4, 4, 1270, 392, true, true);
        printCanvasInfo(hdc, "control", canvas.left, canvas.top, canvas.width, canvas.height);
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

export default ControlCanvas;