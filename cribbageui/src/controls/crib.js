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
                this.cribCard.translate(0, 470);
                this.cribCard.setCard("AceOfSpades");              

            }
            else
            {
                
                this.cribCard.translate(0, 0);
                this.cribCard.setCard("JackOfDiamonds");
               
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