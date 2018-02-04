// eslint-disable-next-line
import React, { Component } from 'react';
// eslint-disable-next-line
import cardImages, { cardFiles } from './deck';
// eslint-disable-next-line
import Card from "./card";



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
        console.log("count: " + this.state.cardCount)
        let w = this.state.cardCount * 150;
        let h = 225;
        let c = [];
        for (let i = 0; i < this.state.cardCount; i++)
        {
            let x = this.renderCard("BackOfCard");
            c.push(x);
        }

        return (

            <div name="cardGrid">
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