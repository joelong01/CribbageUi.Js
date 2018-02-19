/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages from './deck';
import './card.css';
import util from 'util';
import { wait } from './../helper_functions';
import { DragSource } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';


var PropTypes = require('prop-types');



const cardSource =
    {
        beginDrag(props)
        {
            console.log("beginDrag %s", props);
            return { cardName: props.cardName };
        },
        isDragging(props, monitor)
        {
            util.log("dragging %s", props.cardName);
            return props.cardName === monitor.getItem().cardName;
        },
        endDrag(props, monitor)
        {
            util.log("end drag");
            const item = monitor.getItem();
            const dropResult = monitor.getDropResult();
            if (dropResult)
            {
                util.log("dropped %s", props.cardName);
            }
        },
    }

/**
 * Specifies the props to inject into your component.
 */
function collect(connect, monitor)
{
    util.log("collect called");
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging(),
    }
}

const propTypes =
    {
        cardName: PropTypes.string.isRequired,
        orientation: PropTypes.string.isRequired,
        location: PropTypes.string.isRequired,
        owner: PropTypes.string.isRequired,
        // Injected by React DnD:
        /*  isDragging: PropTypes.bool.isRequired,
         connectDragSource: PropTypes.func.isRequired */
    };


export class Card extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
            {
                orientation: "facedown",
                cardName: "ErrorCard",
                location: "deck",
                owner: "shared",
                value: 0,
                countable: true,
                cardClickedCallback: null,


            }

        this.translate = this.translate.bind(this);
        this.setCard = this.setCard.bind(this);
        this.handleClick = this.handleClick.bind(this);


    }

    componentDidMount()
    {
        this.setState({
            value: this.props.value,
            location: this.props.location,
            owner: this.props.owner,
            cardClickedCallback: this.props.cardClickedCallback,
            cardName: this.props.cardName,
        }, () =>
            {
                this.setState({ orientation: this.props.orientation });
            });



    }

    //
    //  i'm setting animations in the board, so i dont' want to rerender the cards, but I still
    //  want to make the visual layer dependent on props/state *only* -- so I set the state of the card
    //  and cath it here.  i do the transform and then tell react to not redo render()
    //
    shouldComponentUpdate = (nextProps, nextState) =>
    {
        if (this.state.orientation !== nextState.orientation)
        {
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

    setStateAsync = (newState) =>
    {

        return new Promise((resolve, reject) =>
        {
            this.setState(newState, () => 
            {
                resolve();
            });

        });
    }

    setOrientationAsync = async (orientation) =>
    {
        var div = this.myFlipper;
        var myTimeout;
        return new Promise((resolve, reject) =>
        {
            this.setStateAsync
                ({
                    orientation: orientation
                });

            var endAnimationAndResolvePromise = () =>
            {
                try
                {

                    clearTimeout(myTimeout);
                    util.log("[%s] resolving animateAsync", this.state.cardName);
                    resolve();
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                }
                catch (e)
                {
                    util.log("[%s] error in setOrientationAsync: %s", this.state.cardName, e);
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                    reject();
                }

            }

            div.addEventListener("transitionend", endAnimationAndResolvePromise);
            try
            {
                var cmd = util.format("rotateY(%sdeg)", orientation === "faceup" ? 180 : 0);
                if (cmd !== div.style['tranfrom'])
                {
                    div.style['transform'] = cmd;
                }
                else
                {
                    util.log("[%s] orientation is already [%s]. resolving promise. ", this.state.cardName, orientation);
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                    resolve();
                }
                myTimeout = setTimeout(() =>
                {
                    util.log("[%s] timeout hit in flip.  resolving promise", this.state.cardName);
                    endAnimationAndResolvePromise();


                }, 1500);
            }
            catch (e)
            {
                util.log("[%s] error in setOrientationAsync setting animation: %s", this.state.cardName, e);
            }

        });
    }

    handleClick = () =>
    {
        this.state.cardClickedCallback(this);

    }

    animate = (x, y, deg) =>
    {
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
        if (cmd !== this.myCard.style['transform'])
        {
            this.myCard.style['transform'] = cmd;
        }
    }

    animateAsync = async (x, y, deg) =>
    {
        var div = this.myCard;
        var myTimeout;
        return new Promise((resolve_func, reject_func) =>
        {
            var endAnimationAndResolvePromise = () =>
            {
                try
                {

                    clearTimeout(myTimeout);
                    //  util.log("[%s] resolving animateAsync", this.state.cardName);
                    resolve_func();
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                }
                catch (e)
                {
                    util.log("[%s] error in animate async: %s", this.state.cardName, e);
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                    reject_func();
                }
            };

            div.addEventListener("transitionend", endAnimationAndResolvePromise);


            try
            {
                var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
                if (cmd !== div.style['transform'])
                {
                    div.style['transform'] = cmd;
                }
                else
                {
                    util.log("[%s] xform is the same.  resolving promise", this.state.cardName);
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                    resolve_func();
                }

                //
                //  if the animation ends too soon, the event won't fire.  resolve it by timer then.
                myTimeout = setTimeout(() =>
                {
                    util.log("[%s] timeout hit in AnimateAsync.  resolving promise", this.state.cardName);
                    endAnimationAndResolvePromise();

                }, 2000);
            }
            catch (e)
            {
                util.log("[%s] error in animate async setting animation: %s", this.state.cardName, e);
            }

        });

    }
    getTransform = () =>
    {
        return this.myCard.style['transform'];
    }
    translate(x, y, deg)
    {
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
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

        const { cardName, orientation, location, owner, isDragging, connectDragSource } = this.props;

        const opacity = isDragging ? 0.5 : 1;

        //     return connectDragSource(            
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
            </div>
        );
    }
}

Card.propTypes = propTypes;
export const ItemTypes =
    {
        CARD: 'card'
    };

export default DragSource(ItemTypes.CARD, cardSource, collect)(Card);