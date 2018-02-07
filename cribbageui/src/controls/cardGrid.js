/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages, { cardFiles, cardNames } from './deck';
import Card from "./card";
import './cardGrid.css';

export class CardGrid extends React.Component
{
    constructor(props)
    {
        var cards = [];
        super(props);

        this.state =
            {
                cardCount: 3,
                stacked: false,
                gridName: "uninitialized"
            }


    }

    componentDidMount() 
    {
        this.setState({ cardCount: this.props.cardCount });
        this.setState({ stacked: this.props.stacked });
        this.setState({ gridName: this.props.gridName });
    }

    renderCard(name, orientation)
    {
        let n = this.state.gridName + "_" + name;
        let divName = "innerdiv_" + name;
        //<Card cardOrientation={"faceup"} cardName={"KingOfSpades"}  className={ this.state.gridName + "_KingOfClubs_card"}  />           

        return (
            <div className={divName}>
                <Card ref={name => this.name = name} cardOrientation={orientation} cardName={name} className={n} key={n} />
            </div>
        );
    }

    render() 
    {

        let gridName = "grid_" + this.state.gridName;
        let h = 225; // 4 for the padding

        let c = [];



        for (let i = 0; i < this.state.cardCount; i++)
        {
            console.log("rendering ", this.state.gridName);
            if (this.state.gridName === "deck")
            {

                let x = this.renderCard(cardNames[i], "facedown");
                c.push(x);
            }
            else
            {
                let x = this.renderCard(cardNames[i], "faceup");
                c.push(x);
            }

        }



        return (
            
                <div className={gridName} height={h}>

                    {c}

                </div>            
        );
    }



}
export default CardGrid;

/* <Card ref={card1 => this.card1 = card1} cardName={"AceOfClubs"} />                    
                    <Card ref={card2 => this.card2 = card2} cardName={"TwoOfClubs"} />
                    <Card ref={card3 => this.card3 = card3} cardName={"ThreeOfClubs"} />
                    <Card ref={card4 => this.card4 = card4} cardName={"FourOfClubs"} />
                    <Card ref={card5 => this.card5 = card5} cardName={"FiveOfHearts"} />
                    <Card ref={card6 => this.card6 = card6} cardName={"SixOfDiamonds"} /> */