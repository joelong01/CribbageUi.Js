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

    renderCard(name)
    {
        return (<Card ref={name => this.name = name} cardName={name} key={name} />);
    }

    render() 
    {
        
        let gridName = "grid_" + this.state.gridName;
        var w = this.state.cardCount * 150;
        let h = 225; // 4 for the padding
        switch (this.state.gridName)
        {
            case "uninitialized":
                w = 0;
                break;
            case "player":
            case "computer":
                w = 900;
                break;
            case "deck":
                w = 150;
                break;
            case "counted":
                w = 748; // 2 for the right margin
                break;
            default:
                console.log("warning:  gridname", this.state.gridName, " unexpected.");

        }
        
        let c = [];

        for (let i = 0; i < this.state.cardCount; i++)
        {
            let x = this.renderCard(cardNames[i]);
            c.push(x);
        }

        return (

            <svg className={gridName} ref={myGrid => this.myGrid = myGrid} width={w} height = {h}>
               
            </svg>

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