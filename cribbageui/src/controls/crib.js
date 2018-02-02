// eslint-disable-next-line
import React, { Component } from 'react';
import { roundRect } from "../helper_functions";
import { printCanvasInfo } from "../helper_functions";
import iSVG from 'react-inlinesvg';


class CribCanvas extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
            {
                cribOwner: "Computer",

            }

        this.cribOwnerChanged = this.cribOwnerChanged.bind(this);




    }


    cribOwnerChanged(e, newOwner)
    {
        console.log("cribOwnerChanged to: " + newOwner);
        this.setState({ cribOwner: newOwner }, function ()
        {
            var top = 0;
            if (newOwner === "Player") 
            {
                // this.mySvg.style['transform'] = "rotate(180deg)"; //"translate(0, 361px);" //
                this.mySvg.style['transform'] = "translate(0px, 361px)";
                this.mySvg.top = "361px";

            }
            else
            {
                //this.mySvg.style['transform'] =  "rotate(0deg)"; //"translate(0,0px)"; //
                this.mySvg.style['transform'] = "translate(0px, 0px)";
                this.mySvg.top = "0px";
            }


        });


    }


    render()
    {
        return (


            <svg className="cribSvg" width="127px" height="535px" ref={mySvg => this.mySvg = mySvg} >
                <defs>
                    <filter id="filter1" x="0" y="0">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                    </filter>

                    <filter id="filter2" x="0" y="0" width="110%" height="150%">
                        <feOffset result="offOut" in="SourceAlpha" dx="10" dy="10" />
                        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
                        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                    </filter>
                </defs>
                <g y="10px" >
                    <rect className="cribCard" width={125} height={175} fill={'rgba(128,0,0,1)'} ref={cribCard => this.cribCard = cribCard}/* y={this.state.cribOwner === "Computer" ? 0 : 535 - 177} */ filter="url(#filter2)" />
                    <text x={10} y={40} fill='white'>
                        {this.state.cribOwner}
                    </text>
                </g>
            </svg>



        );
    }






}

export default CribCanvas;