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
                txtScore: null,
                txtMsg: null,
               
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
        var self = this;
        var svgDoc = this.scoreBrowser.contentDocument;
        svgDoc.getElementById("nextButton").addEventListener('click', () => 
        {
            self.state.nextScoreCallback();
        });

        svgDoc.getElementById("prevButton").addEventListener('click', () => 
        {
            self.state.prevScoreCallback();
        });

        svgDoc.getElementById("btnHigherScore").addEventListener('click', this.onUpScore);
        svgDoc.getElementById("btnLowerScore").addEventListener('click', this.onDownScore);
       
        for (let name of buttonNames)
        {
            svgDoc.getElementById(name).addEventListener('mouseenter', this.onMouseEnter);
            svgDoc.getElementById(name).addEventListener('mouseleave', this.onMouseLeave);
        }

        this.setState({
            txtScore: svgDoc.getElementById("txtScore"),
            txtMsg: svgDoc.getElementById("txtMessage"),            
        }, () => 
        {
            this.resetMessages();
            this.showPrevNextButtons(false);
            this.showUpDownButtons(false);
            this.setMessage("Click the check below to the right to continue in this game.");
            svgDoc.getElementById("txtScore").textContent = "Use the menu to start a new game";
        });

      
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


        scoreMsg.textContent = score;
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

        scoreMsg.textContent = score;
    }

    resetMessages = () =>
    {
        let scoreMsg = this.state.txtScore; // this gets rid of a React warning about setting state directly
        if (scoreMsg !== null)
        {
            scoreMsg.textContent = "";
            this.setMessage("");
        }
    }

    setScoreText = (n, m, score) =>
    {
        let scoreMsg = this.state.txtScore; // this gets rid of a React warning about setting state directly
        scoreMsg.textContent = util.format("(%s of %s) Score: %s", n, m, score);
    }

    setMessage = (msg) =>
    {
        let txtMsg = this.state.txtMsg;
        txtMsg.textContent = msg;
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