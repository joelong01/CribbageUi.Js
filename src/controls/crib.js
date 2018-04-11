/*eslint-disable no-unused-vars*/
import React, { Component } from 'react';
import cardImages from './deck';
import Card from "./card";
import "./crib.css";
import CardGrid from './cardGrid';

class CribGrid extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state =
            {
                cribOwner: "Computer",              // this not only gives the owner but changing it changes the crib position                
                cards: []
            }

        this.cribOwnerChanged = this.cribOwnerChanged.bind(this);
        this.reset = this.reset.bind(this);
    }

    componentDidMount() 
    {
        this.setState({ cards: this.props.cards });
        this.setState({ cribOwner: this.props.cribOwner }, () =>
        {
            this.cribOwnerChanged(null, this.props.cribOwner);
        });

    
        

    }

    reset()
    {

    }

    

    render()
    {
        
        return (
            
                <CardGrid
                    orientation={"facedown"}
                    cardCount={1} stacked={true} gridName={"crib"}
                    key={"crib"} cards={this.props.cards}
                    ref={cribGrid => this.cribGrid = cribGrid}
                />
            
        );
    }

}


export default CribGrid;