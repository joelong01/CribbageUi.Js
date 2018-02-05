/*eslint-disable no-unused-vars*/
import React, { Component } from 'react';
import cardImages from './deck';
import Card from "./card";


class CribCanvas extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
            {
                cribOwner: "Computer",              // this not only gives the owner but changing it changes the crib position                

            }

        this.cribOwnerChanged = this.cribOwnerChanged.bind(this);




    }

    cribOwnerChanged(e, newOwner)
    {
        console.log("cribOwnerChanged to: " + newOwner);
        this.setState({ cribOwner: newOwner }, function ()
        {            
            if (newOwner === "Player") 
            {
                // this.mySvg.style['transform'] = "rotate(180deg)"; //"translate(0, 361px);" //
                this.cribCard.translate(0, 460);
                this.cribCard.setCard("AceOfSpades");
              //  this.cribCard.setOrientation("faceup");

            }
            else
            {
                //this.mySvg.style['transform'] =  "rotate(0deg)"; //"translate(0,0px)"; //
                this.cribCard.translate(0, 0);
                this.cribCard.setCard("JackOfDiamonds");
               // this.cribCard.setOrientation("facedown");
            }


        });


    }


    render()
    {
        
        return (            
                <Card ref={cribCard => this.cribCard = cribCard} cardName={"KingOfClubs"} cardOrientation={"facedown"}/>               
        );
    }

}


                      
            
            /* <div>
            <svg className="cribSvg" width="127px" height="535px" ref={mySvg => this.mySvg = mySvg} use={"./BackOfCard.svg"} >
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
                <g>
                    
                    <rect className="cribCard" width={150} height={225} fill={'rgba(128,0,0,1)'} ref={cribCard => this.cribCard = cribCard} filter="url(#filter2)" /> 

                    <BackOfCard/>

                    <text x={10} y={40} fill='white'>
                        {this.state.cribOwner}
                    </text>
                   
                   

                        
                </g>
            </svg>
            
            </div>  */


/* 
export class BackOfCard extends Component
{
    render()
    {
        return (
            <div>
                <img className="backOfCard" src={require("../images/Cards/AceOfClubs.png")} srcSet={require("../images/BackOfCard.svg")} alt={""} />
            </div>
        );
    }
} */

export default CribCanvas;