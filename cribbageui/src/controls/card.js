/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages from './deck';
import './card.css';

export default class Card extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
            {
                cardOrientation: "facedown",
                cardName: "ErrorCard"
            }

        this.translate = this.translate.bind(this);
        this.setCard = this.setCard.bind(this);
        this.handleClick = this.handleClick.bind(this);


    }
    componentDidMount()
    {
        this.setState({ cardName: this.props.cardName }, () =>
        {
            this.setOrientation(this.props.cardOrientation);
        });


    }
    setOrientation(o)
    {
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

    translate(x, y)
    {
        var cmd = "translate(" + x + "px, " + y + "px)";
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
