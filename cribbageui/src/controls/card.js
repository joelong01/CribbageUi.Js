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
        this.setState({ cardName: this.props.cardName });
        this.setState({ cardOrientation: this.props.cardOrientation });

    }
    setOrientation(o)
    {
      //  console.log("old orientation: ", this.state.cardOrientation, "new orientation: ", o, "cardname: ", this.state.cardName);
      //  console.log("transform", this.myFlipper.style['tranform'] );
        if (o === "facedown")
        {
            
            this.setState({ cardOrientation: "facedown" }, () => 
            {
             //   console.log("attempting to flip to faceup");
               /*  let transform = "rotateY(0deg)";
                this.myFlipper.style['tranform'] = transform; */
            });

        }
        else
        {
            this.setState({ cardOrientation: "faceup" }, () => 
            {
              //  console.log("attempting to flip to faceup");
              /*   let tranform = "rotateY(180deg)";
                this.myFlipper.style['tranform'] = tranform; */
            }
            );

        }

    }

    handleClick()
    {
       console.log("classList has flip", this.myCard.classList.contains('flip'));
        this.myCard.classList.toggle('flip');
        if (this.state.cardOrientation === "facedown")
        {
            this.setOrientation("faceup");
        }
        else
        {
            this.setOrientation("facedown");

        }
        /*       console.log("flipper.classList.contains('flip')", this.flipper.classList.contains("flip"));
              this.flipper.classList.toggle("flip") */
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
            <div className={cardClassName} ref={myCard => this.myCard = myCard} onClick={this.handleClick} width={150} height={225}>
                <div className={flipperName} ref={myFlipper => this.myFlipper = myFlipper} width={150} height={225}>
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
