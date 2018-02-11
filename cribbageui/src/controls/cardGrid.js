/*eslint-disable no-unused-vars*/

import React, { Component } from 'react';
import cardImages, { cardFiles, cardNames } from './deck';
import Card from "./card";
import './cardGrid.css';
import { delay, wait } from '../helper_functions';

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

        this.reset = this.reset.bind(this);
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




    setCardsAsync = async (cards) =>
    {
        return new Promise((resolve, reject) =>
        {
            this.setState({ cardNames: cards }, async () =>             
            {
                this.state.cardNames.forEach(async (name) =>
                {
                    let card = this.cardFromName(name);
                    await card.setOrientationAsync("facedown");
                    card.translate(0, 0, 0);
                    await card.updateCardInfoAsync("deck", "shared");

                });
                
                resolve();
            });

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

    reset = async () =>
    {
        var promises = [];
        if (this.state.gridName === "deck")
        {
            this.state.cardNames.forEach(async (name) =>
            {
                let card = this.cardFromName(name);
                promises.push(card.setOrientationAsync("facedown"));
                promises.push(card.animateAsync(0, 0, 0));                
                promises.push(card.updateCardInfoAsync("deck", "shared"));

            });

            await Promise.all(promises);

            return; // leave cards in deck
        }
        /*  this.state.cardNames.forEach((name) =>
         {
             let card = this.cardFromName(name);
             card.setOrientation("facedown");
             card.translate(0, 0, 0);
             delay(500).then(() =>
             {
                 card.updateCardInfo("deck", "shared");
             });
 
         });
 
 
         this.setState({ cardCount: 0 });
         this.setState({ cardNames: [] });
         this.setState({ orientation: "facedown" }); */
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
