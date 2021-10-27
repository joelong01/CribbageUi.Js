/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages from './deck';
import './cardView.css';
import util from 'util';
import { StaticHelpers } from './../helper_functions';
import SelectCard from '../images/selectCard.svg';

export class CardView extends React.Component {
    constructor(props) {
        super(props);

        this.state =
        {
            orientation: "facedown",
            cardName: "ErrorCard",
            location: "deck",
            owner: "shared",
            selected: false,
            value: 0,
            countable: true,
            cardClickedCallback: null,
            animateY: 0,
            animateX: 0,
            animateRotate: 0,
            cardData: null


        }

        this.translate = this.translate.bind(this);
        this.setCard = this.setCard.bind(this);
        this.handleClick = this.handleClick.bind(this);


    }

    componentDidMount() {
        this.setState({
            value: this.props.value,
            location: this.props.location,
            owner: this.props.owner,
            cardClickedCallback: this.props.cardClickedCallback,
            cardName: this.props.cardName,
            selected: this.props.selected,
            cardData: this.props.cardData
        }, () => {
            this.setState({ orientation: this.props.orientation });
        });

        if (this.props.selected === false) {
            this.mySelectSvg.style['opacity'] = 0;
        }

    }

    //
    //  i'm setting animations in the board, so i dont' want to rerender the cards, but I still
    //  want to make the visual layer dependent on props/state *only* -- so I set the state of the card
    //  and cath it here.  i do the transform and then tell react to not redo render()
    //
    shouldComponentUpdate = (nextProps, nextState) => {
        if (this.state.orientation !== nextState.orientation) {
            //util.log("[%s]:  orientation to %s", this.state.cardName, nextState.orientation);
            var cmd = util.format("rotateY(%sdeg)", nextState.orientation === "faceup" ? 180 : 0);
            this.myFlipper.style['transform'] = cmd;

            return false;
        }

        return true;

        /*  if (this.state.cardName !== nextState.cardName || nextProps.cardName !== this.state.cardName)
             return true;
 
         util.log("returning false from shouldComponentUpdate.")    
         return false; */
    }

    setStateAsync = (newState) => {

        return new Promise((resolve, reject) => {
            this.setState(newState, () => {
                resolve();
            });

        });
    }

    setOrientationAsync = (orientation) => {
        var cmd = util.format("rotateY(%sdeg)", orientation === "faceup" ? 180 : 0);
        this.setState({ orientation: orientation });
        return StaticHelpers.animateAsync(this.myFlipper, cmd, 500);
    }

    handleClick = () => {
        this.state.cardClickedCallback(this);

    }

    animate = (x, y, deg) => {
        this.setState({ animateY: y, animateX: x, animateRotate: deg });
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
        if (cmd !== this.myCard.style['transform']) {
            this.myCard.style['transform'] = cmd;
        }
    }

    //
    //  move the card up or down 10px
    bump = (up) => {
        let y = this.state.animateY;
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", this.state.animateX, this.state.animateY - (up ? 10 : 0), this.state.animateRotate);
        return StaticHelpers.animateAsync(this.myCard, cmd, 250);

    }

    animateAsync = (x, y, deg, timeoutMs) => {
        if (timeoutMs === undefined)
            timeoutMs = 500;

        this.setState({ animateY: y, animateX: x, animateRotate: deg });
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
        return StaticHelpers.animateAsync(this.myCard, cmd, timeoutMs);
    }
    getTransform = () => {
        return this.myCard.style['transform'];
    }
    translate(x, y, deg) {
        this.setState({ animateY: y, animateX: x, animateRotate: deg });
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
        this.myCard.style['transform'] = cmd;

    }
    setCard = (cName) => {
        this.setState({ cardName: cName });
    }

    translateSpeed = (ms) => {

        this.myCard.style['transition'] = ms + "ms";
        //    util.log ("[%s] translatespeed: %s", this.state.cardName, this.myCard.style['transition']);
    }

    select = async (isSelected) => {
        await this.setStateAsync({ selected: isSelected });
        this.mySelectSvg.style['opacity'] = isSelected ? 1 : 0;
    }

    isSelected = () => {
        return this.state.selected;
    }

    render() {


        let cardClassName = this.state.cardName + "_card";
        let faceupName = this.state.cardName + "_faceup";
        let facedownName = this.state.cardName + "_facedown";
        let faceupImage = cardImages[this.state.cardName];
        let facedownImage = cardImages["BackOfCard"];
        let flipperName = this.state.cardName + "_flipper";
        let selectedName = this.state.cardName + "_selected";

        const { cardName, orientation, location, owner, isDragging, connectDragSource, selected } = this.props;


        //console.log("[%s] rendered .selected = %s", this.props.cardName, this.props.selected);

        return (
            <div className={cardClassName} ref={myCard => this.myCard = myCard}
                onClick={this.handleClick} opacity={this.state.countable ? 1 : 0.5}>
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
                <div className={selectedName}
                    ref={mySelectSvg => this.mySelectSvg = mySelectSvg}>
                    <img
                        alt={require("../images/Cards/error.png")}
                        srcSet={SelectCard}
                    />
                </div>
            </div>
        );
    }
}

CardView.prototype.toString = function cardToString() {
    if (this !== null) {
        try {
            var s = "[" + this.state.cardName + "] owner:" + this.state.owner + " location:" + this.state.location;
            return s;
        }
        catch (e) {
            console.log("%o", e);
        }

    }
    else {
        return "card is null!";
    }
}



export default CardView;