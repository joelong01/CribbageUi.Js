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


export default CribCanvas;