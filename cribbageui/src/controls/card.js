/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages from './deck';
import './card.css';
import util from 'util';
import './../helper_functions';
import { DragSource } from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';

var PropTypes = require('prop-types');



const cardSource =
    {
        beginDrag(props)
        {
            console.log("beginDrag %s", props);
            return { cardName: props.cardName };
        } ,
        isDragging(props, monitor)
        {
            util.log("dragging %s", props.cardName);
            return props.cardName === monitor.getItem().cardName;
        },
        endDrag(props, monitor)
        {
            util.log ("end drag");
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
function collect(connect, monitor) {
    util.log("collect called");
	return {
		connectDragSource: connect.dragSource(),		
		isDragging: monitor.isDragging(),
	}
}

const propTypes =
    {
        cardName: PropTypes.string.isRequired,
        orientation:  PropTypes.string.isRequired,        
        location:  PropTypes.string.isRequired,
        owner:  PropTypes.string.isRequired,
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
                cardClickedCallback: null
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
            this.setOrientation(this.props.orientation);
        });
        this.setState({cardClickedCallback: this.props.cardClickedCallback});


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

        if (this.state.orientation === o)
            return;

        var deg = 0;


        if (o === "faceup")
            deg = 180;

        var cmd = util.format("rotateY(%sdeg)", deg);

        this.setState({ orientation: o }, () => 
        {
            this.myFlipper.style['transform'] = cmd;
        });

    }

    setOrientationAsync = async (o) =>
    {

        if (this.state.orientation === o)
            return;

        await this.setStateAsync("orientation", o);
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
        this.state.cardClickedCallback(this);

        /* if (this.state.orientation === "facedown")
        {
            await this.setOrientationAsync("faceup");
        }
        else
        {
            await this.setOrientationAsync("facedown");
        } */
    }

    animateAsync = async (x, y, deg) =>
    {
        var div = this.myCard;
        return new Promise((resolve_func, reject_func) =>
        {
            div.addEventListener("transitionend", function endAnimationAndResolvePromise() 
            {
                try
                {
                    resolve_func();
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                }
                catch (e)
                {
                    util.log("error in animate async: %s", e);
                    div.removeEventListener("transitionend", endAnimationAndResolvePromise);
                    reject_func();
                }
            });

            try
            {
                var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
                this.myCard.style['transform'] = cmd;
            }
            catch (e)
            {
                util.log("error in animate async setting animation: %s", e);
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
        util.log("render props: %s", this.props);
        
        const {cardName, orientation, location, owner, isDragging, connectDragSource} = this.props;

        const opacity = isDragging ? 0.5 : 1;
        
   //     return connectDragSource(            
       return (
                <div className={cardClassName} ref={myCard => this.myCard = myCard}
                    onClick={this.handleClick}
                    style={{ opacity: opacity }}>

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