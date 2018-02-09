/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages, { cardFiles, cardNames } from './deck';
import Card from "./card";
import './cardGrid.css';

export class CardGrid extends React.Component
{
    constructor(props)
    {

        super(props);

        this.state =
            {
                cardNames: [],
                cardCount: 3,
                stacked: false,
                gridName: "uninitialized",
                orientation: "facedown",
                

            }

        

        this.setCards = this.setCards.bind(this);
        this.clear = this.clear.bind(this);
        this.cardFromName = this.cardFromName.bind(this);
    }

    componentDidMount() 
    {
        this.setState({ cardCount: this.props.cardCount });
        this.setState({ stacked: this.props.stacked });
        this.setState({ gridName: this.props.gridName });
        this.setState({ cardNames: this.props.cardNames });
        this.setState({ orientation: this.props.orientation });
    }

    setCards(cards)
    {
        this.setState({ cardNames: cards });
    }

    clear()
    {
        
        this.setState({ cardNames: [] });
    }

    cardFromName(name)
    {
        return this.refs[name];


    }

    renderCard(name, orientation)
    {
        let n = this.state.gridName + "_" + name;
        let divName = "innerdiv_" + name;
        //<Card cardOrientation={"faceup"} cardName={"KingOfSpades"}  className={ this.state.gridName + "_KingOfClubs_card"}  />           

        return (
            <div className={divName} key={divName}>
                <Card ref={name} cardOrientation={orientation} cardName={name} className={n} key={n} />
            </div>
        );
    }

    render() 
    {

        let gridName = "grid_" + this.state.gridName;
        let h = 225; // 4 for the padding

        let c = [];
        
        for (let i = 0; i < this.state.cardNames.length; i++)
        {
            let x = this.renderCard(this.state.cardNames[i], this.state.orientation);            
            c.push(x);
        }

        

        return (

            <div className={gridName} height={h}>

                {c}

            </div>
        );
    }



}
export default CardGrid;
