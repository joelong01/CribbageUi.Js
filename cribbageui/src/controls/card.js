import React, { Component } from 'react';
import cardImages from './deck';

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
        this.setState({ cardName: this.props.cardName });
        this.setState({ cardOrientation: this.props.cardOrientation });

    }
    setOrientation(o)
    {
        if (o === "facedown")
        {
            this.setState({ cardOrientation: "facedown" });
            this.facedownCard.style['opacity'] = 1.0;
        }
        else
        {
            this.setState({ cardOrientation: "faceup" });
            this.facedownCard.style['opacity'] = 0.0;
        }

    }

    handleClick()
    {
        console.log("clicked");
        this.flipper.classList.toggle("flip")
    }

    translate(x, y)
    {
        var cmd = "translate(" + x + "px, " + y + "px)";
        console.log("translate cmd: " + cmd);
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
            <div className={cardClassName} ref={myCard => this.myCard = myCard} onClick={this.handleClick}>
                <div classNaem={flipperName} ref={flipper => this.flipper = flipper}>
                    <img className={faceupName}
                        alt={require("../images/Cards/error.png")}
                        srcSet={faceupImage}
                        width={150} height={225}
                        ref={faceupCard => this.faceupCard = faceupCard}

                    />
                    <img className={facedownName}
                        //style={facedownTranslateStyle}
                        alt={require("../images/Cards/error.png")}
                        srcSet={facedownImage}
                        width={150} height={225}
                        ref={facedownCard => this.facedownCard = facedownCard}
                    />
                </div>
            </div>
        );
    }
}
