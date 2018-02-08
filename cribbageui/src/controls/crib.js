/*eslint-disable no-unused-vars*/
import React, { Component } from 'react';
import cardImages from './deck';
import Card from "./card";
import "./crib.css";

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

    componentDidMount() 
    {


    }

    cribOwnerChanged(e, newOwner)
    {
        console.log("cribOwnerChanged to: " + newOwner);
        this.setState({ cribOwner: newOwner }, function ()
        {
            var cmd = "translate(0px, ";
            
            if (newOwner === "Player") 
            {
                cmd += "485px)";
            }
            else
            {
                cmd += "0px)";
            }
            
            this.cribDiv.style['transform'] = cmd;

        });


    }


    render()
    {

        return (
            <div className="cribDiv" ref={cribDiv => this.cribDiv = cribDiv}  >
                <Card ref={cribCard => this.cribCard = cribCard}
                    cardName={"KingOfClubs"} cardOrientation={"facedown"}
                    class="cribCard"

                />
            </div>
        );
    }

}


export default CribCanvas;