/*eslint no-unused-vars: off*/
import React, { Component } from 'react';
import util from 'util';
import "./scoreCtrl.css";
import { StaticHelpers } from '../helper_functions';

export class ScoreCtrl extends Component
{
    constructor(props)
    {
        super(props);
        this.state =
            {
                frontScore: 0,
                backScore: 0,
                player: ""
            }

    }



    componentDidMount() 
    {
        
        this.setState({ 
            frontScore: this.props.frontScore, 
            backScore: this.props.backScore,
            player: this.props.player });

    }

    render()
    {

       
        return (

            <div className= {"ScoreControl_" + this.props.player}
                    ref={myScoreCtrl => this.myScoreCtrl = myScoreCtrl}>
                <span>
                  {this.props.player}: {this.props.backScore} - {this.props.frontScore}
                </span>
            </div>

        );
    }

}

export default ScoreCtrl;