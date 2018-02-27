/*eslint no-unused-vars: off*/
import React, { Component } from 'react';
import util from 'util';

import { StaticHelpers } from '../helper_functions';

export class ScoreBrowser extends Component
{
    constructor(props)
    {
        super(props);
        this.state =
            {
                message: "",
                nextScoreCallback: null,
                prevScoreCallback: null,
                playerSetScoreCallback: null,
                txtScore: null
            }

    }



    componentDidMount() 
    {

        this.setState({
            message: this.props.frontScore,
            nextScoreCallback: this.props.nextScoreCallback,
            prevScoreCallback: this.props.prevScoreCallback,
            playerSetScoreCallback: this.props.playerSetScoreCallback
        });

    }




    scoreBrowserLoaded = () =>
    {
        var buttonNames = ["nextButton", "prevButton", "btnHigherScore", "btnLowerScore", "btnContinue"];

        var svgDoc = this.scoreBrowser.contentDocument;
        svgDoc.getElementById("nextButton").addEventListener('click', this.onNextScore);
        svgDoc.getElementById("prevButton").addEventListener('click', this.onPrevScore);
        svgDoc.getElementById("btnHigherScore").addEventListener('click', this.onUpScore);
        svgDoc.getElementById("btnLowerScore").addEventListener('click', this.onDownScore);
        this.setState({ txtScore: svgDoc.getElementById("txtScore") });

        for (let name of buttonNames)
        {
            svgDoc.getElementById(name).addEventListener('mouseenter', this.onMouseEnter);
            svgDoc.getElementById(name).addEventListener('mouseleave', this.onMouseLeave);
        }
        /*
        svgDoc.getElementById("btnHigherScore").addEventListener('mouseenter', this.onMouseEnter)
        svgDoc.getElementById("btnLowerScore").addEventListener('mouseenter', this.onMouseEnter)
        svgDoc.getElementById("btnContinue").addEventListener('mouseenter', this.onMouseEnter)
        svgDoc.getElementById("btnHigherScore").addEventListener('mouseleave', this.onMouseLeave)
        svgDoc.getElementById("btnLowerScore").addEventListener('mouseleave', this.onMouseLeave)
        svgDoc.getElementById("btnContinue").addEventListener('mouseleave', this.onMouseLeave)
        */
    }

    onMouseEnter = (e) =>
    {        
        var svgDoc = this.scoreBrowser.contentDocument;
        let glyph = e.currentTarget.id + "_glyph";
        svgDoc.getElementById(glyph).style.fill = 'white';
    }

    onMouseLeave = (e) =>
    {     
        var svgDoc = this.scoreBrowser.contentDocument;
        let glyph = e.currentTarget.id + "_glyph";
        svgDoc.getElementById(glyph).style.fill = 'black';
    }

    waitForContinue = () =>
    {
        var svgDoc = this.scoreBrowser.contentDocument;
        return new Promise((resolve_func, reject_func) =>
        {
            var onContinue = () =>
            {
                try
                {
                    svgDoc.getElementById("btnContinue").removeEventListener('click', onContinue);                   
                    resolve_func();

                }
                catch (e)
                {

                    reject_func();
                }
            };


            svgDoc.getElementById("btnContinue").addEventListener('click', onContinue);

        });

    }

    showUpDownButtons = (show) =>
    {
        var svgDoc = this.scoreBrowser.contentDocument;
        svgDoc.getElementById("btnHigherScore_glyph").style['opacity'] = show ? 1 : 0;
        svgDoc.getElementById("btnLowerScore_glyph").style['opacity'] = show ? 1 : 0;
        svgDoc.getElementById("btnHigherScore").style['opacity'] = show ? .01 : 0;
        svgDoc.getElementById("btnLowerScore").style['opacity'] = show ? .01 : 0;
    }

    showPrevNextButtons = (show) =>
    {
       
        var svgDoc = this.scoreBrowser.contentDocument;
        svgDoc.getElementById("nextButton_glyph").style['opacity'] = show ? 1 : 0;
        svgDoc.getElementById("prevButton_glyph").style['opacity'] = show ? 1 : 0;
        svgDoc.getElementById("nextButton").style['opacity'] = show ? .01 : 0;
        svgDoc.getElementById("prevButton").style['opacity'] = show ? .01 : 0;
    
    }

    onUpScore = () =>
    {
        let scoreMsg = this.state.txtScore.textContent;
        let score = parseInt(scoreMsg, 10);
        if (isNaN(score))
            score = 0;
        score++;
        if (score > 29)
            score = 29;

        this.setScoreText(score);
    }


    onDownScore = () =>
    {
        let scoreMsg = this.state.txtScore.textContent;
        let score = parseInt(scoreMsg, 10);
        if (isNaN(score))
            score = 1;
        score--;
        if (score < 0)
            score = 0;
        this.setScoreText(score);
    }

    onNextScore = (e) =>
    {
        this.setScoreText("onNextScore %o", e);
    }
    onPrevScore = (e) =>
    {
        this.setScoreText("onPrevScore %o", e);
    }

    setScoreText = (score) =>
    {
        let scoreMsg = this.state.txtScore; // this gets rid of a React warning about setting state directly
        scoreMsg.textContent = score;
    }

    getScoreText = () =>
    {
        return parseInt(this.state.txtScore.textContent, 10);
    }

    render()
    {


        return (

            <div className="DIV_scoreBrowser">
                <object className="ScoreBrowser"
                    data={require("../images/scoreBrowser.svg")}
                    type="image/svg+xml"
                    ref={scoreBrowser => this.scoreBrowser = scoreBrowser}
                    title="scoreBrowser"
                    onLoad={this.scoreBrowserLoaded}
                />
            </div>

        );
    }

}

export default ScoreBrowser;