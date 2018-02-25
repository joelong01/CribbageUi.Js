/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages from './deck';
import './card.css';
import util from 'util';
import { wait, StaticHelpers } from './../helper_functions';
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
                selected: false,
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
            selected: this.props.selected
        }, () =>
            {
                this.setState({ orientation: this.props.orientation });
            });

            if (this.props.selected === false)
            {
                this.mySelectSvg.style['opacity'] = 0;
            }

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

    setOrientationAsync = (orientation) =>
    {
        var cmd = util.format("rotateY(%sdeg)", orientation === "faceup" ? 180 : 0);
        this.setState({ orientation: orientation });
        return StaticHelpers.animateAsync(this.myFlipper, cmd, 1000);
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

    animateAsync = (x, y, deg) =>
    {
        var cmd = util.format("translate(%spx, %spx) rotate(%sdeg)", x, y, deg);
        return StaticHelpers.animateAsync(this.myCard, cmd, 2000);
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
    setCard = (cName) =>
    {
        this.setState({ cardName: cName });
    }

    select = async (isSelected) =>
    {
        await this.setStateAsync({ selected: isSelected });
        this.mySelectSvg.style['opacity'] = isSelected ? 1 : 0;
    }

    isSelected = () =>
    {
        return this.state.selected;
    }

    render()
    {


        let cardClassName = this.state.cardName + "_card";
        let faceupName = this.state.cardName + "_faceup";
        let facedownName = this.state.cardName + "_facedown";
        let faceupImage = cardImages[this.state.cardName];
        let facedownImage = cardImages["BackOfCard"];
        let flipperName = this.state.cardName + "_flipper";
        let selectedName = this.state.cardName + "_selected";

        const { cardName, orientation, location, owner, isDragging, connectDragSource, selected } = this.props;

        const opacity = isDragging ? 0.5 : 1;
        console.log("[%s].selected = %s", this.props.cardName, this.props.selected);
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
                <div className={selectedName} 
                    ref={mySelectSvg => this.mySelectSvg = mySelectSvg}>
                    <img
                        alt={require("../images/Cards/error.png")}
                        srcSet={require("../images/selectCard.svg")}

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