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
            svgDoc.getElementById(name).addEventListener('mousedown', this.onMouseDown);
            svgDoc.getElementById(name).addEventListener('mouseup', this.onMouseUp);
            
        }

        this.setState({
            txtScore: svgDoc.getElementById("txtScore"),
            txtMsg: svgDoc.getElementById("txtMessage"),            
        }, () => 
        {
            this.resetMessages();
            this.showPrevNextButtons(false);
            this.showUpDownButtons(false);
            this.setMessage("Use menu to start a new game. The check is to 'continue' in the game.  ");            
        });

        this.showContinueButton(true);        
        
    }

    showContinueButton = (bShow) =>
    {
        let vis = (bShow) ? "visible" : "hidden";
        var svgDoc = this.scoreBrowser.contentDocument;
        svgDoc.getElementById("btnContinue").style.visibility = vis;
        svgDoc.getElementById("btnContinue_glyph").style.visibility = vis;
    }
    
    onMouseDown = (e) =>
    {
        var svgDoc = this.scoreBrowser.contentDocument;
        let glyph = e.currentTarget.id + "_glyph";
        svgDoc.getElementById(glyph).style.fill = 'darkgray';
    }

    onMouseUp = (e) =>
    {
        var svgDoc = this.scoreBrowser.contentDocument;
        let glyph = e.currentTarget.id + "_glyph";
        svgDoc.getElementById(glyph).style.fill = 'black';
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
        
        this.showContinueButton(true);
        return new Promise((resolve_func, reject_func) =>
        {
            var onContinue = () =>
            {
                try
                {
          //          util.log("resolving waitForContinue");
                    this.showContinueButton(false);
                    resolve_func();

                }
                catch (e)
                {
                    this.showContinueButton(false);
                    reject_func();
                }
            };

            var svgDoc = this.scoreBrowser.contentDocument;
            svgDoc.getElementById("btnContinue").addEventListener('click', onContinue);

        });

    }

    //
    //  called by game.js when the user clicks on a card to play it during counting phase.
    //  treat that as clicking the check mark
    simulateClick = (scoreBrowser) =>
    {
        
        var event = document.createEvent("SVGEvents"); 
        event.initEvent("click",true,true);
        scoreBrowser.scoreBrowser.contentDocument.getElementById("btnContinue").dispatchEvent(event);
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
     //   console.log("showPrevNextButtons: %s", show);
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