/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages from './deck';
import './card.css';
import util from 'util';
import './../helper_functions';

export default class Card extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
            {
                cardOrientation: "facedown",
                cardName: "ErrorCard",
                location: "deck",
                owner: "shared"
            }

        this.translate = this.translate.bind(this);
        this.setCard = this.setCard.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.updateCardInfo = this.updateCardInfo.bind(this);

    }

    componentDidMount()
    {
        this.setState({ location: this.props.location });
        this.setState({ owner: this.props.owner });
        this.setState({ cardName: this.props.cardName }, () =>
        {
            this.setOrientation(this.props.cardOrientation);
        });


    }

    updateCardInfo(loc, own)
    {
        if (loc !== "undefined")
        {
            this.setState({ location: loc }, () => 
            {

            });
        }
        if (own !== "undefined")
        {
            this.setState({ owner: own }, () => 
            {

            });
        }
    }


    setOrientation(o)
    {
     //   util.log("[%s] from %s to %s", this.state.cardName, this.state.cardOrientation, o);

        if (this.state.cardOrientation === o)
            return;
    
        if (o === "facedown" && this.state.cardOrientation !== "facedown")
        {

            this.setState({ cardOrientation: "facedown" }, () => 
            {
                this.myCard.classList.toggle('flip');
                
            });

        }
        else if (this.state.cardOrientation !== "faceup")
        {
            this.setState({ cardOrientation: "faceup" }, () => 
            {
                this.myCard.classList.toggle('flip');
            }
            );
        }

    }

    handleClick()
    {
        if (this.state.cardOrientation === "facedown")
        {
            this.setOrientation("faceup");
        }
        else
        {
            this.setOrientation("facedown");

        }
    }

    translate(x, y, deg)
    {
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
        util.log("[%s] old: %s new transform: %s", this.state.cardName, this.myCard.style['transform'], cmd);      
        this.myCard.style['transform'] = cmd;
    }
    setCard(cName)
    {
        this.setState({ cardName: cName });
    }
    render()
    {
        let cardClassName = this.state.cardName + "_card";
        let faceupName = this.state.cardName + "_faceup";
        let facedownName = this.state.cardName + "_facedown";
        let faceupImage = cardImages[this.state.cardName];
        let facedownImage = cardImages["BackOfCard"];
        let flipperName = this.state.cardName + "_flipper";
        return (
            <div className={cardClassName} ref={myCard => this.myCard = myCard} onClick={this.handleClick} >
                <div className={flipperName} ref={myFlipper => this.myFlipper = myFlipper} >
                    <img className={faceupName}
                        alt={require("../images/Cards/error.png")}
                        srcSet={faceupImage}
                        ref={faceupCard => this.faceupCard = faceupCard}
                    />
                    <img className={facedownName}
                        alt={require("../images/Cards/error.png")}
                        srcSet={facedownImage}
                        ref={facedownCard => this.facedownCard = facedownCard}
                    />
                </div>
            </div>
        );
    }
}
