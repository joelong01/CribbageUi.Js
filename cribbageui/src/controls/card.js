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

    setStateAsync = async (key, value) =>
    {
        var newState = {};
        newState[key] = value;
        return new Promise((resolve, reject) =>
        {
            this.setState(newState, () => 
            {
                resolve();
            });

        });
    }

    updateCardInfoAsync = async (loc, own) =>
    {

        var newState = {};
        newState["location"] = loc;
        newState["owner"] = own;
        return new Promise((resolve, reject) =>
        {
            this.setState(newState, () => 
            {
                resolve();
            });

        });
        
    }


    setOrientation(o)
    {

        if (this.state.cardOrientation === o)
            return;

        var deg = 0;


        if (o === "faceup")
            deg = 180;

        var cmd = util.format("rotateY(%sdeg)", deg);

        this.setState({ cardOrientation: o }, () => 
        {
            this.myFlipper.style['transform'] = cmd;
        });

    }

    setOrientationAsync = async (o) =>
    {

        if (this.state.cardOrientation === o)
            return;

        await this.setStateAsync("cardOrientation", o);
        var div = this.myFlipper;
        return new Promise((resolve_func, reject_func) =>
        {

            div.addEventListener("transitionend", function endAnimationAndResolvePromise() 
            {
                resolve_func();
                div.removeEventListener("transitionend", endAnimationAndResolvePromise);
            });

            var cmd = util.format("rotateY(%sdeg)", o === "faceup" ? 180 : 0);
            div.style['transform'] = cmd;

        });
    }



    handleClick = async () =>
    {

        if (this.state.cardOrientation === "facedown")
        {
            await this.setOrientationAsync("faceup");
        }
        else
        {
            await this.setOrientationAsync("facedown");
        }
    }

    animateAsync = async (x, y, deg) =>
    {
        var div = this.myCard;
        return new Promise((resolve_func, reject_func) =>
        {
            div.addEventListener("transitionend", function endAnimationAndResolvePromise() 
            {
                resolve_func();
                div.removeEventListener("transitionend", endAnimationAndResolvePromise);
            });

            var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
            this.myCard.style['transform'] = cmd;            

        });

    }

    translate(x, y, deg)
    {
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
        //  util.log("[%s] old: %s new transform: %s", this.state.cardName, this.myCard.style['transform'], cmd);
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
