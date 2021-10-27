/*eslint no-unused-vars: off*/
import React, { Component } from 'react';
import CribbageBoard from './controls/CribbageBoard';
import CountCtrl from './controls/countCtrl';
import Menu from 'react-burger-menu/lib/menus/slide'
import util, { debuglog } from 'util';
import { StaticHelpers } from './helper_functions';
import { CardView } from './controls/cardView';
import "./game.css";
import "./menu.css";

import serviceProxy, { CribbageServiceProxy } from './serviceProxy';
import { ScoreCtrl } from './controls/scoreCtrl';
import { randomBytes } from 'crypto';
import scoreBrowser, { ScoreBrowser } from './controls/scoreBrowser';
import Board from './images/board.svg';
import ShowCheckbox from './images/showcheckbox.svg';
import HelpMenu from './images/showmenu.svg';

const g_allGridNames = ["deck", "player", "computer", "crib", "counted"];


export class CribbageGame extends Component
{


    constructor(props)
    {

        super(props);

        let cardViewsInGrid = this.getEmptyGridList();

        this.state =
            {
                cribOwner: "player", // aka "dealer"
                doZoomWindow: true,
                menuOpen: false,
                cardDataObjs: [],   // the cards returned from the service
                cardViews: [],          // an array of all the UI cards
                cardViewsInGrid: cardViewsInGrid,     // a map of grid -> cards
                sharedCardView: null,
                gameState: "starting",
                waitForUserCallback: null,
                nobs: false,
                currentCount: 0,                
                computerBackScore: -1,
                playerBackScore: -1,
                computerFrontScore: 0,
                playerFrontScore: 0,
                scoreIndex: 0,
                waitingForContinue: false,
                scoreList: [],
                WinningScore: 121,
                showHelp: true

            }


        this.renderMenu = this.renderMenu.bind(this);
        this.handleChooseCribPlayer = this.handleChooseCribPlayer.bind(this);
        this.toggleZoomWindow = this.toggleZoomWindow.bind(this);

        this.closeMenuAndReset = this.closeMenuAndReset.bind(this);


    }

    getEmptyGridList = () =>
    {

        let gridList = {}
        for (var grid of g_allGridNames)        
        {
            gridList[grid] = [];
        };

        return gridList;
    }

    resetScoreList = async () =>
    {
        await this.setStateAsync({ scoreIndex: -1, scoreList: [] });
        this.myScoreBrowser.resetMessages();
    }

    componentDidMount() 
    {
        this.resetScoreList();
        window.addEventListener('resize', this.handleResize);
        this.handleResize();

    }

    componentWillUnmount()
    {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => 
    {


        var w = window;
        var body = document.getElementsByTagName('body')[0];
        let xRatio = w.innerWidth / body.clientWidth;
        let yRatio = w.innerHeight / body.clientHeight;

        var ratio = Math.min(xRatio, yRatio) * .99;

        if (!this.state.doZoomWindow)
            ratio = 1.0;

        var t = 'scale(' + ratio + ')';
        body.style['transform'] = t;


    };


    toggleZoomWindow = () =>
    {
        this.setState({ doZoomWindow: !this.state.doZoomWindow }, () =>
        {
            this.handleResize();
        });

    }

    renderCribbageBoard = () =>
    {
        return (
            <CribbageBoard />
        );
    }

    onNewGame = async () =>
    {
        await this.setStateAsync({showHelp: false});
        this.myScoreBrowser.showContinueButton(false);
        await this.onReset();
        await this.setStateAsync({ gameState: "Start" });
        await this.doGameLoop();
    }

    doGameLoop = async () =>
    {
        var PlayerTurn = "";
        var Dealer = this.state.cribOwner;
        var CurrentCount = 0;
        let nextState = "";
        let loopCount = 0;

        while (this.state.computerFrontScore < this.state.WinningScore && this.state.playerFrontScore < this.state.WinningScore)
        {
            loopCount++;
            let score = null;
            util.log("state: %s", this.state.gameState);
            switch (this.state.gameState)
            {
                case "Start":
                    await this.resetScoreList();
                    this.myScoreBrowser.showUpDownButtons(false);
                    this.myScoreBrowser.showPrevNextButtons(false);
                    let startRes = await serviceProxy.cutCards();
                    Dealer = await this.showCutCardAnimation(startRes.CutCards.Player, startRes.CutCards.Computer);
                    await this.onReset();
                    await this.setStateAsync({ gameState: "Deal" });
                    break;
                case "Deal":
                    await this.animateCribGridToOwner(Dealer);
                    PlayerTurn = (Dealer === "computer") ? "player" : "computer";
                    util.log("Dealer: %s", Dealer);
                    CurrentCount = 0;
                    await this.getHandAsync();
                    await this.setStateAsync({ gameState: "PlayerSelectsCribCards" });
                    break;
                case "PlayerSelectsCribCards":
                    this.myScoreBrowser.setMessage("Send two cards to the crib by clicking on them.");
                    await this.waitForUserCribCards();
                    await this.setStateAsync({ gameState: "GiveToCrib" });
                    break;
                case "GiveToCrib":
                    await this.animateCardsToCrib();
                    nextState = (this.state.cribOwner === "computer") ? "playerCount" : "computerCount";
                    if (this.state.nobs)
                    {
                        let scoreObj = this.createScoreObject(2, "Nobs", [this.state.sharedCardView]);
                        await this.addScore(Dealer, scoreObj);
                        this.nextScoreCallback();
                        this.waitForContinue();
                    }
                    await this.setStateAsync({ gameState: "Count" });
                    break;
                case "Count":
                    nextState = (PlayerTurn === "player") ? "CountPlayer" : "CountComputer";
                    await this.setStateAsync({ currentCount: 0, gameState: nextState, scoreList: [], scoreIndex: 0 });
                    break;
                case "CountPlayer":
                    {
                        let canPlay = await this.canPlay();
                        PlayerTurn = "player";

                        if (canPlay.playerCanPlay)
                        {
                            let scoreObj = await this.doCountForPlayer();
                            console.log("do count for player");
                            await this.addScore("player", scoreObj);

                        }

                        canPlay = await this.canPlay();
                        nextState = "CountComputer";
                        if (!canPlay.computerCanPlay && !canPlay.playerCanPlay)
                        {
                            if (this.state.cardViewsInGrid["player"].length === 0 &&
                                this.state.cardViewsInGrid["computer"].length === 0)
                            {
                                await this.setStateAsync({ gameState: "CountingEnded" });
                            }
                            var goPlayer = await this.scoreGo();
                            nextState = (goPlayer === "computer") ? "CountPlayer" : "CountComputer";

                        }

                        await this.setStateAsync({ gameState: nextState });
                        break;
                    }
                case "CountComputer":
                    {
                        this.myScoreBrowser.setMessage("");
                        PlayerTurn = "computer";

                        let canPlay = await this.canPlay();
                        if (canPlay.computerCanPlay)
                        {
                            let scoreObj = await this.doCountForComputer();
                            await this.addScore("computer", scoreObj);

                        }
                        canPlay = await this.canPlay();

                        nextState = "CountPlayer";

                        if (!canPlay.computerCanPlay && canPlay.playerCanPlay)
                        {
                            this.myScoreBrowser.setMessage("Computer can't play.  Play a card.");
                        }

                        if (canPlay.computerCanPlay === false && canPlay.playerCanPlay === false)
                        {
                            if (this.state.cardViewsInGrid["player"].length === 0 &&
                                this.state.cardViewsInGrid["computer"].length === 0)
                            {
                                await StaticHelpers.wait(0);
                                this.myScoreBrowser.setMessage("Counting over.  Hit the check to continue");
                                await this.waitForContinue();
                                nextState = "CountingEnded";
                            }
                            else
                            {
                                goPlayer = await this.scoreGo();

                                nextState = (goPlayer === "computer") ? "CountPlayer" : "CountComputer";
                            }
                        }

                        await this.setStateAsync({ gameState: nextState });
                    }
                    break;
                case "CountingEnded":
                    await this.resetScoreList();
                    await this.moveCountingCardsBackToOwner();
                    this.myScoreBrowser.showPrevNextButtons(false);
                    nextState = Dealer === "computer" ? "ScorePlayerHand" : "ScoreComputerHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScorePlayerHand":
                    await this.moveSharedCard("player");
                    await this.resetScoreList();
                    score = await this.getScoreForHand("player", false);
                    await this.addScore("player", score);
                    await this.waitForContinue();
                    nextState = Dealer === "computer" ? "ScoreComputerHand" : "ScorePlayerCrib";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScoreComputerHand":
                    await this.moveSharedCard("computer");
                    await this.resetScoreList();
                    score = await this.getScoreForHand("computer", false);
                    this.myScoreBrowser.setMessage(util.format("computer scores %s points", score.Score));

                    await this.addScore("computer", score);
                    await this.waitForContinue();
                    nextState = Dealer === "computer" ? "ScoreComputerCrib" : "ScorePlayerHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScoreComputerCrib":
                    await this.resetScoreList();
                    await this.moveCribCardsToOwner();
                    score = await this.getScoreForHand("computer", true);
                    this.myScoreBrowser.setMessage(util.format("computer scores %s points", score.Score));
                    await this.addScore("computer", score);
                    await this.moveSharedCard("computer");
                    await this.waitForContinue();
                    nextState = "EndOfHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScorePlayerCrib":
                    await this.resetScoreList();
                    await this.moveCribCardsToOwner();
                    score = await this.getScoreForHand("player", true);
                    await this.addScore("player", score);
                    await this.moveSharedCard("player");
                    await this.waitForContinue();
                    nextState = "EndOfHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "EndOfHand":
                    this.myScoreBrowser.setMessage("");
                    await this.resetScoreList();
                    await this.endOfTurn();
                    Dealer = this.toggleDealer(Dealer);
                    await this.setStateAsync({ cribOwner: Dealer, gameState: "Deal" });

                    break;
                default:
                    alert(this.state.gameState + " exiting game loop");
                    return;
            }
        }

        if (this.state.computerFrontScore < this.state.WinningScore)
        {
            this.myScoreBrowser.setMessage("Congratulations!  You won!");
        }
        else
        {
            this.myScoreBrowser.setMessage("Sorry, the computer won.  Better luck next time.");
        }
    }

    moveSharedCard = async (to) =>
    {
        let deltaY = (to === "computer") ? -280 : 280;
        await this.state.sharedCardView.animateAsync(0, deltaY, 0, 1000);
    }


    showCutCardAnimation = async (playerDataCard, computerDataCard) =>
    {

        await this.setState({ cardDataObjs: [playerDataCard, computerDataCard] });


        let playerCard = this.refs[playerDataCard.cardName];
        let computerCard = this.refs[computerDataCard.cardName];

        this.state.cardViewsInGrid["deck"] = [playerCard, computerCard];
        await this.markCardToMoveAsync(playerCard, 0, "deck", "player");
        await this.markCardToMoveAsync(computerCard, 0, "deck", "computer");
        await StaticHelpers.wait(250);
        let promises = this.redoGridLayoutAsync(["computer", "player"], 500);
        await Promise.all(promises);

        await playerCard.setOrientationAsync("faceup");
        await computerCard.setOrientationAsync("faceup");

        let Dealer = "computer";

        if (playerDataCard.Ordinal < computerDataCard.Ordinal)
        {
            Dealer = "player";
        }

        this.myScoreBrowser.setMessage(util.format("%s won first deal. Press the Check to continue.", Dealer === "player" ? "You" : "The Computer"));
        await this.waitForContinue();
        return Dealer;
    }

    endOfTurn = async () =>
    {
        try
        {

            await Promise.all(this.flipAllCardsInGridAsync(g_allGridNames, "facedown"));
            await this.markAllCardsToLocation("deck");
            let promises = [];
            promises = this.redoCardLayoutAsync("deck");
            await Promise.all(promises);
            await StaticHelpers.wait(50);
            let resetCards = {};
            g_allGridNames.map(grid => resetCards[grid] = []);
            await this.setStateAsync({
                cardViewsInGrid: resetCards,
                cardViews: [],
                cardDataObjs: [],
                sharedCardView: null,
                nobs: false,
                currentCount: 0,
                countedCards: []
            });

        }
        catch (e)
        {
            util.log("caught exception in onReset. %s", e);
        }

    }

    scoreLastCard = async () =>
    {
        //
        //  you can't use Array.slice() to pick off the last element of the array
        //  here because it does a "shallow copy"
        //
        let length = this.state.cardViewsInGrid.counted.length;
        var lastCardPlayed = this.state.cardViewsInGrid.counted[length - 1];
        /*    await this.addScore(lastCardPlayed.state.owner, 1);
           this.myScoreBrowser.setScoreText(util.format("%s scores 1 for last cards", lastCardPlayed.state.owner));
           await this.myScoreBrowser.waitForContinue();
           await this.setStateAsync({ currentCount: 0 }); */
    }

    scoreGo = async () =>
    {
        //
        //  you can't use Array.slice() to pick off the last element of the array
        //  here because it does a "shallow copy"
        //
        let length = this.state.cardViewsInGrid.counted.length;
        var lastCardPlayed = this.state.cardViewsInGrid.counted[length - 1];

        if (this.state.currentCount !== 31)
        {
            let scoreObj = this.createScoreObject(1, "Go", [lastCardPlayed]);
            //util.log("go score: %o", scoreObj);
            await this.addScore(lastCardPlayed.state.owner, scoreObj);
        }

        this.myScoreBrowser.setMessage("hit the check to continue.");
        await this.nextScoreCallback();
        await this.waitForContinue();


        await this.setStateAsync({ currentCount: 0 });
        await this.resetScoreList();
        await Promise.all(this.flipAllCardsInGridAsync(["counted"], "facedown"));
        await Promise.all(this.redoGridLayoutAsync(["counted", "deck"], 250));

        this.myScoreBrowser.showPrevNextButtons(false);
        return lastCardPlayed.state.owner;

    }
    cardArrayToCardNameCsv = (cardViews) =>
    {
        let csv = "";
        for (let cardView of cardViews)
        {
            csv += cardView.state.cardName;
            csv += ",";
        }
        if (csv !== "")
            return csv.slice(0, -1);
        else
            return csv;
    }

    getCountedCardsForThisRun = () =>
    {
        let cardsInThisCountedRun = [];
        for (let cardView of this.state.cardViewsInGrid["counted"])
        {
            if (cardView.state.orientation === "faceup")
            {
                cardsInThisCountedRun.push(cardView);
            }
        }
      //  StaticHelpers.dumpObject("counted cards", cardsInThisCountedRun);
        return cardsInThisCountedRun;
    }

    doCountForComputer = async () =>
    {
        let countedCardObj = await CribbageServiceProxy.getComputerCountCardAsync(this.state.cardViewsInGrid["computer"],
            this.getCountedCardsForThisRun(), this.state.currentCount);

        let cardCtrl = this.refs[countedCardObj.countedCard.cardName];


        await this.markAndMoveMultipleCardsAsync([cardCtrl], "computer", "counted");
        await cardCtrl.setOrientationAsync("faceup");
        let count = this.state.currentCount + cardCtrl.state.value;
        await this.setStateAsync({ currentCount: count });
        return countedCardObj.Scoring;
    }

    doCountForPlayer = async () =>
    {
        this.myScoreBrowser.setMessage("click on a card to count it");
        let countedCard = await this.getCountCard();
        let scoreObj = await CribbageServiceProxy.getCountedScoreAsync(countedCard, this.state.currentCount, this.getCountedCardsForThisRun());
        let count = this.state.currentCount + countedCard.state.value;
        console.log("player scored: %s for playing %s", scoreObj.Score, countedCard.state.cardName);
        await this.setStateAsync({ currentCount: count });
        return scoreObj;
    }

    getScoreForHand = async (player, isCrib) =>
    {
        //  getScoreForHandAsync = async (hand, sharedCard, isCrib) =>

        let score = await CribbageServiceProxy.getScoreForHandAsync(this.state.cardViewsInGrid[player], this.state.sharedCardView, isCrib);

        return score;
    }

    getCountCard = async () =>
    {
        return new Promise(async (resolve_func, reject_func) =>
        {

            var endUserPickCards = (cardView) =>
            {
                // util.log("resolving getCountCard card:%s ", card.state.cardName);
                resolve_func(cardView);
            }

            await this.setStateAsync({ waitForUserCallback: endUserPickCards });
        });

    }



    canPlay = async () =>
    {

        var retObj = { playerCanPlay: false, computerCanPlay: false };
        for (let cardView of this.state.cardViewsInGrid["computer"])        
        {
            if (cardView.state.value + this.state.currentCount <= 31)
            {
                retObj.computerCanPlay = true;
                break;
            }

        }
        let cardViews = this.state.cardViewsInGrid["player"];
        for (let cardView of cardViews)
        {
            if (cardView.state.value + this.state.currentCount <= 31)
            {
                await cardView.setStateAsync({ countable: true });
                retObj.playerCanPlay = true;
            }
            else
            {
                await cardView.setStateAsync({ countable: false });
            }
        }

        return retObj;
    }

    addScore = async (who, scoreObject) =>    
    {
        if (scoreObject.Score === null || scoreObject.Score === undefined)
        {
            debugger;
            return;
        }
        if ((this.state.gameState === "CountComputer" || this.state.gameState === "CountPlayer") && scoreObject.Score === 0)
            return; // no message for 0 score in counting


        if (who === "computer")
        {
            let frontScore = this.state.computerFrontScore;
            let backScore = this.state.computerBackScore;            
            this.setPegColor("computer", backScore, "black"); // turn it off

            await this.setStateAsync({
                computerBackScore: frontScore,
                computerFrontScore: (frontScore + scoreObject.Score)
            });
            this.setPegColor("computer", (frontScore + scoreObject.Score), "blue"); // turn it on

        }
        else
        {
            let frontScore = this.state.playerFrontScore;
            let backScore = this.state.playerBackScore;
            this.setPegColor("player", backScore, "black"); // turn it off            
            await this.setStateAsync({
                playerBackScore: frontScore,
                playerFrontScore: (frontScore + scoreObject.Score)
            });
            
            this.setPegColor("player", (frontScore + scoreObject.Score), "green"); // turn it on
        }
        try
        {
            if (scoreObject !== null && scoreObject.ScoreInfo.length > 0)
            {
                let lst = this.state.scoreList.concat(scoreObject.ScoreInfo);
                await this.setStateAsync({ scoreList: lst });
                if (scoreObject.Score > 0)
                {
                    this.myScoreBrowser.setMessage("browse scores and then hit the check to continue");
                    this.myScoreBrowser.showPrevNextButtons(true);
                    if (this.state.gameState === "CountPlayer" || this.state.gameState === "CountComputer")
                        await this.nextScoreCallback();
                }
                else
                {
                    this.myScoreBrowser.setMessage("Zero score!");
                }
            }
        }
        catch (e)
        {
            console.log("exception in addScore: %o", e);
        }

    }

    waitForContinue = async () =>
    {
        await this.setStateAsync({ waitingForContinue: true });
        await this.myScoreBrowser.waitForContinue();
        await this.setStateAsync({ waitingForContinue: false });
    }

    createScoreObject = (score, name, cards) =>
    {
        let cardDataObjs = cards.map(card => { return card.state.cardData });
        let scoreInfo = [
            {
                ScoreName: name,
                Score: score,
                Cards: cardDataObjs
            }];
        let scoreObj =
            {
                Score: score,
                ScoreInfo: scoreInfo
            };

        return scoreObj;
    }

    setStateAsync = (newState) =>
    {
        let key = Object.keys(newState)[0];
        // util.log("setStateAsync: key= %s oldVal = %o newVal = %o]", key, this.state[key], newState[key]);
        return new Promise((resolve, reject) =>
        {
            this.setState(newState, () => 
            {
                resolve();
                // console.log("setStateAsync: key= %s state = %o", key, this.state[key]);

            });

        });
    }


    toggleDealer = (Dealer) =>
    {
        return (Dealer === "computer") ? "player" : "computer";
    }

    waitForUserCribCards = async () =>
    {
        return new Promise(async (resolve_func, reject_func) =>
        {

            var endUserPickCards = () =>
            {
                resolve_func();
            }

            await this.setStateAsync({ waitForUserCallback: endUserPickCards });

        });

    }


    handleChooseCribPlayer = async (event) =>
    {
        event.persist();
        event.preventDefault();
        await this.closeMenuAsync();
        let newOwner = event.target.value;
        await this.animateCribGridToOwner(newOwner);
    }

    animateCribGridToOwner = async (newOwner) =>
    {
        await this.setStateAsync({ cribOwner: newOwner });

        var cmd;


        if (newOwner === "player") 
        {
            cmd = "translate(0px, 283px)";

        }
        else
        {
            cmd = "translate(0px, -283px)";
        }

        this.myCribDiv.style['transform'] = cmd;
        this.myCountCtrl.setXform(cmd);

        this.redoCardLayout("crib");
    }

    closeMenuAndReset = async () =>
    {
        await this.closeMenuAsync();
        return this.onReset();
    }




    onReset = async () =>
    {
        try
        {
            await this.closeMenuAsync();
            await Promise.all(this.flipAllCardsInGridAsync(g_allGridNames, "facedown"));

            await this.markAllCardsToLocation("deck");
            let promises = [];
            promises = this.redoCardLayoutAsync("deck");
            await Promise.all(promises);
            await StaticHelpers.wait(50);
            let resetCards = {};
            let cardViewsInGrid = this.getEmptyGridList();
            await this.setStateAsync({
                cribOwner: "player", // aka "dealer"                
                menuOpen: false,
                cardDataObjs: [],   // the cards returned from the service
                cardViews: [],          // an array of all the UI cards
                cardViewsInGrid: cardViewsInGrid,
                sharedCardView: null,
                gameState: "starting",
                nobs: false,
                currentCount: 0,
                userFrontScore: 0,
                userBackScore: 0,
                computerBackScore: -1,
                playerBackScore: -1,
                computerFrontScore: 0,
                playerFrontScore: 0,
                scoreIndex: 0,
                waitingForContinue: false,
                scoreList: []
            });

            for (let i = -1; i < 121; i++)
            {
                this.setPegColor("computer", i, "black");
                this.setPegColor("player", i, "black");
            }

            this.setPegColor("computer", 0, "red");
            this.setPegColor("computer", -1, "red");
            this.setPegColor("player", 0, "red");
            this.setPegColor("player", -1, "red");

            // this.dumpCardState("in Reset", allGridNames);
        }
        catch (e)
        {
            util.log("caught exception in onReset. %s", e);
        }
    }

    onGetHandAsync = async () =>
    {
        await this.closeMenuAsync();
        await this.onReset();
        await this.getHandAsync();
    }

    getHandAsync = async () =>
    {
        try
        {

            let serviceObj = await CribbageServiceProxy.getHandAsync(this.setState.cribOwner === "computer");
            await this.setStateAsync({ cardDataObjs: serviceObj.RandomCards }); // this causes the cards to render
            console.assert(this.state.cardDataObjs.length === 13, "setStateAsync didn't work or we recieved the wrong number of cards from the service");
         //   StaticHelpers.dumpObject("after setting cardDataObjs", this.state);
            let uiCardList = [];
            let sharedCardView = null;
            for (let cardData of this.state.cardDataObjs) // deliberately using these since it requires that setStateAsync have worked
            {
                let uiCard = this.refs[cardData.cardName];
                uiCardList.push(uiCard); // put it in the "all cards collection"
                this.state.cardViewsInGrid[uiCard.state.location].push(uiCard); // stuff it in the location collect - should all be in "deck" at this point
                if (uiCard.state.owner === "shared") {
                    sharedCardView = uiCard;
                }
            }


            await this.setStateAsync({
                cards: uiCardList,
                nobs: serviceObj.HisNobs,
                sharedCardView: sharedCardView
            });

            await this.onDeal();
            await this.markAndMoveMultipleCardsAsync([this.refs[serviceObj.ComputerCribCards[0].cardName], this.refs[serviceObj.ComputerCribCards[1].cardName]], "computer", "counted");

        }
        catch (error)
        {
            util.log("error thrown in GetHandAsync %s", error.message);
        }

    }

    flipAllCardsInGridAsync = (grids, orientation) =>
    {
        let promises = [];
        for (let grid of grids)
        {
            let cardViews = this.state.cardViewsInGrid[grid];
            if (cardViews != null)
            {
                for (let cardView of cardViews)
                {
                    let p = cardView.setOrientationAsync(orientation);
                    promises.push(p);
                }
            }
        }

        return promises;
    }

    flipCard = (cardView, orientation) =>
    {
        cardView.setState({ orientation: orientation });
    }

    flipCardAsync = async (cardView, orientation) =>
    {
        await cardView.setStateAsync({ orientation: orientation });
    }




    onDeal = async () =>
    {
        try
        {
            await StaticHelpers.wait(0);

            //this.dumpCardState("before deal loop", allGridNames);
            let cardViews = this.state.cardViewsInGrid["deck"];
            for (let i = cardViews.length - 1; i >= 0; i--)        
            {
                let cardView = cardViews[i];
                if (cardView.state.owner === "shared") continue;
                await this.markCardToMoveAsync(cardView, i, cardView.state.location, cardView.state.owner);

            };
            let promises = this.redoGridLayoutAsync(["computer", "player"]);
            await Promise.all(promises);
            await Promise.all(this.flipAllCardsInGridAsync(["player"], "faceup"));
        }
        catch (e)
        {
            util.log("error in Deal. %s", e.message);
        }
        //
        //  I want a visual pause while the cards aren't sorted so that the player can see them sort
        await StaticHelpers.wait(500);

        this.state.cardViewsInGrid['player'].sort((c1, c2) => 
        {

            let val1 = this.getOrdinalValue(c1);
            let val2 = this.getOrdinalValue(c2);

            return val1 - val2;
        });

        this.state.cardViewsInGrid['player'].map(cardView => cardView.translateSpeed(1500));
        let promises = this.redoGridLayoutAsync(["player"]);
        await Promise.all(promises);
        this.state.cardViewsInGrid['player'].map(cardView => cardView.translateSpeed(500));
    }

    getOrdinalValue = (cardView) =>
    {
        return cardView.state.cardData.Ordinal;
    }

    getComputerCribCards = async () =>
    {
        await this.closeMenuAsync();
        let cribcards = await CribbageServiceProxy.getCribCardsAsync(this.state.cardViewsInGrid["computer"], this.state.cribOwner === "computer");
        await this.markAndMoveMultipleCardsAsync(cribcards, "computer", "counted");
    }
    //
    //  menu event
    onAnimateCribCardsToOwner = async () =>
    {
        this.closeMenuAsync();
        await this.moveCribCardsToOwner();
    }

    moveCribCardsToOwner = async () =>
    {
        let grids = ["computer", "player"];

        await Promise.all(this.flipAllCardsInGridAsync(grids, "facedown"));

        for (let grid of grids)
        {
            let cardViews = this.state.cardViewsInGrid[grid];
            await this.markAndMoveMultipleCardsAsync(cardViews, grid, "deck");
        }


        await this.markAndMoveMultipleCardsAsync(this.state.cardViewsInGrid["crib"], "crib", this.state.cribOwner);
        //util.log("cribOwner is %s", this.state.cribOwner);
        await Promise.all(this.flipAllCardsInGridAsync([this.state.cribOwner], "faceup"));
        this.showSharedCard();
    }

    dumpCardState = (msg, grids) => 
    {
        util.log("msg: %s", msg);
        for (let grid of grids)
        {
            for (let cardView of this.state.cardViewsInGrid[grid])
            {
                util.log("\t [%s] grid: %s owner:%s location:%s orientation:%s",
                    cardView.state.cardName, grid, cardView.state.owner, cardView.state.location, cardView.state.orientation);
            }
        }

    }

    doFullLayout = () =>
    {

        g_allGridNames.map(grid => this.redoCardLayout(grid));
    }

    showSharedCard = () =>
    {
        //util.log ("Showing sharedCard: %s", this.state.sharedCardView.state.cardName);
        let cardView = this.state.sharedCardView;
        cardView.setState({ orientation: "faceup" });
        this.setCardZIndex(cardView, 99);

    }

    setCardZIndex = (cardView, zIndex) =>
    {
        // util.log("[%s] - zIndex:%s orientation", cardView.state.cardName, zIndex, cardView.state.orientation);
        let divName = "CARDDIV_" + cardView.state.cardName;
        let div = this.refs[divName];
        div.style["z-index"] = zIndex;
    }

    animateCardsToCrib = async () =>
    {
        await Promise.all(this.flipAllCardsInGridAsync(["counted"], "facedown"));
        await this.markAndMoveMultipleCardsAsync(this.state.cardViewsInGrid["counted"], "counted", "crib");
        this.redoCardLayout("player");
        this.showSharedCard();
    }



    redoCardLayout = (gridName) =>
    {
        for (let [index, cardView] of this.state.cardViewsInGrid[gridName].entries())        
        {
            let pos = {};
            pos = this.getCardPosition(gridName, index);
            cardView.animate(pos["xPos"], pos["yPos"], 360);
            let zIndex = 10 + index;
            if (cardView.state.orientation === "faceup" && gridName === "deck") zIndex += 50;
            this.setCardZIndex(cardView, zIndex);
        }

    }

    redoCardLayoutAsync = (gridName) =>
    {

        let promises = [];
        for (let [index, cardView] of this.state.cardViewsInGrid[gridName].entries())        
        {
            let pos = {};
            pos = this.getCardPosition(gridName, index);
            promises.push(cardView.animateAsync(pos["xPos"], pos["yPos"], (gridName === "deck") ? 0 : 360));
            let zIndex = 10 + index;
            if (cardView.state.orientation === "faceup" && gridName === "deck") zIndex += 50;
            this.setCardZIndex(cardView, zIndex);
        }
        console.log("redCardLayoutAsync");
        return promises;

    }

    getCardPosition(gridName, index)
    {
        var animationTopCoordinates = [];
        animationTopCoordinates["computer"] = 22.5;
        animationTopCoordinates["counted"] = 303;
        animationTopCoordinates["player"] = 583;
        animationTopCoordinates["deck"] = 310;

        if (this.state.cribOwner === "player")
        {
            animationTopCoordinates["crib"] = animationTopCoordinates["player"];

        }
        else
        {
            animationTopCoordinates["crib"] = animationTopCoordinates["computer"];
        }

        let cardWidthPlusGap = 157;

        if (gridName === "counted") cardWidthPlusGap = 76;
        let marginLeft = 236;
        if (gridName === "crib")
        {
            marginLeft = 57;
            index = 0;
        }

        let xPos = cardWidthPlusGap * index + marginLeft;
        let yPos = animationTopCoordinates[gridName]

        if (gridName === "deck")
        {
            xPos = 1022;
            yPos = 310;
        }

        xPos = xPos - 1022; // this are in game.css as margin-left and margin-top of [class^="CARDDIV_"]
        yPos = yPos - 305;

        let pos = {};
        pos["xPos"] = xPos;
        pos["yPos"] = yPos;
        return pos;
    }

    onClickCard = async (cardView) =>
    {
        if (cardView.state.owner !== "player")
            return;

        if (this.state.waitingForContinue)
            return;

        if (!cardView.isSelected())
        {
            //
            //  i'm only letting one card be selected at a time
            for (let c of this.state.cardViewsInGrid['player'])
            {
                c.select(false);
            }

            cardView.select(true);
            return;
        }

        cardView.select(false);

        //util.log("[%s].clicked.  countable:%s state:%s", cardView.state.cardName, cardView.state.countable, this.state.gameState);
        if (this.state.gameState === "PlayerSelectsCribCards")
        {
            if (cardView.state.location === "player")  // player wants it in their crib
            {
                await this.markAndMoveMultipleCardsAsync([cardView], "player", "counted");
            }
            else if (cardView.state.location === "counted") // player wants to undo it
            {
                await this.markAndMoveMultipleCardsAsync([cardView], "counted", "player");
                return;
            }
            if (this.state.cardViewsInGrid["counted"].length === 4)            
            {
                this.state.waitForUserCallback();
            }
            else
            {
                this.myScoreBrowser.setMessage(util.format("Click on one more card for %s crib.", this.state.isComputerCrib ? "the computer's" : "your"));
            }
        }

        if (this.state.gameState === "CountPlayer")
        {

            if (!cardView.state.countable)
            {
                this.myScoreBrowser.setMessage(util.format("%s is not playable at this time.", cardView.state.cardName));
                await this.waitForContinue();
                return;
            }

            await this.markAndMoveMultipleCardsAsync([cardView], "player", "counted");
            this.state.waitForUserCallback(cardView);

        }
    }






    // This keeps your state in sync with the opening/closing of the menu
    // via the default means, e.g. clicking the X, pressing the ESC key etc.
    handleStateChange(state)
    {
        this.setState({ menuOpen: state.isOpen })
    }

    // This can be used to close the menu, e.g. when a user clicks a menu item
    closeMenuAsync = async () =>
    {

        await this.setStateAsync({ menuOpen: false });

    }

    // This can be used to toggle the menu, e.g. when using a custom icon
    // Tip: You probably want to hide either/both default icons if using a custom icon
    // See https://github.com/negomi/react-burger-menu#custom-icons
    toggleMenu()
    {
        this.setState({ menuOpen: !this.state.menuOpen })
    }

    getNextCardXposition = (grid, width, count) =>
    {
        return count * width + 234;
    }

    renderMenu()
    {
        /* css for this is in ./menu.css */

        return (
            <Menu className="burgerMenu" isOpen={this.state.menuOpen}
                onStateChange={(state) => this.handleStateChange(state)}
                pageWrapId={"page-wrap"} outerContainerId={"outer-container"}
                ref={burgerMenu => this.burgerMenu = burgerMenu} >
                <div className="Menu_LayoutRoot">

                    <div className="menuItemDiv">
                        <div className="menuItemGlyph">
                            +
                        </div>
                        <button className="burgerItemButton" onClick={this.onNewGame.bind(this)}>New Game</button>
                    </div>
                    <div className="menuItemDiv">
                        <div className="menuItemGlyph">
                            ?
                        </div>
                        <button className="burgerItemButton" onClick={this.getSuggestion.bind(this)}>Suggestion</button>
                    </div>
                    <fieldset>
                        <legend> Options </legend>
                        <label>
                            <input type="checkbox" checked={this.state.doZoomWindow} onChange={this.toggleZoomWindow} />
                            Zoom Window
                        </label>
                    </fieldset>
                </div>
            </Menu >
        );
    }

    renderOneCard = (cardData) =>
    {
        let n = "main_" + cardData.cardName;
        let divName = "CARDDIV_" + cardData.cardName;

        return (

            <div className={divName} key={divName} ref={divName}>
                <CardView ref={cardData.cardName}
                    cardName={cardData.cardName}
                    orientation={"facedown"}
                    owner={cardData.Owner}
                    location={"deck"}
                    className={n}
                    selected={false}
                    value={cardData.Value}
                    cardData={cardData}
                    cardClickedCallback={this.onClickCard}
                />
            </div>


        );
    }

    renderCards = (cardsList) =>
    {
        var cardViews = [];
        for (var cardView of cardsList)
        {
            cardViews.push(this.renderOneCard(cardView));

        };
        return cardViews;
    }


    render()
    {

        var cardsList = this.renderCards(this.state.cardDataObjs); // this is the only place we should be using cardDataObjs        
        return (
            <div className="outer-container" >
                {this.renderMenu()}
                <main className="page-wrap">
                    <div className="LayoutRoot">
                        {cardsList}
                        <object className="cribbageBoard" width={"250"} height={"800"}
                            data={Board}
                            type="image/svg+xml"
                            ref={myBoard => this.myBoard = myBoard}
                            title="Cribbage Board"
                        />
                        {this.state.showHelp && ( // yes this is strange: It works because of how JavaScript resolve logical conditions if showHelp is true it renders the object.  otherwise skips it.
                            <object className="helpContinue" width={100} height={30}
                                data={ShowCheckbox}
                                type="image/svg+xml"
                                ref={myCheckHelp => this.myCheckHelp = myCheckHelp}
                                title="continue helper"
                            />)}
                        {this.state.showHelp && (
                            <object className="helpMenu" width={100} height={30}
                                data={HelpMenu}
                                type="image/svg+xml"
                                ref={myCheckHelp => this.myCheckHelp = myCheckHelp}
                                title="Menu Helper"
                            />)}

                        <div className="DIV_crib" ref={myCribDiv => this.myCribDiv = myCribDiv} />
                        <CountCtrl ref={myCountCtrl => this.myCountCtrl = myCountCtrl} count={this.state.currentCount} visible={this.isCountState()} isComputerCrib={this.state.isComputerCrib} />
                        <div className="DIV_computer" />
                        <div className="DIV_deck" />
                        <div className="DIV_counted" />
                        <div className="DIV_player" />
                        <ScoreBrowser message={"Score: 15 for 2!"}
                            ref={myScoreBrowser => this.myScoreBrowser = myScoreBrowser}
                            nextScoreCallback={this.nextScoreCallback}
                            prevScoreCallback={this.prevScoreCallback}
                            playerSetScoreCallback={this.playerSetScoreCallback}
                        />

                    </div>
                </main>
            </div >

        );
    }

    isCountState = () =>
    {
        if (this.state.gameState === "CountPlayer" ||
            this.state.gameState === "CountComputer")
        {
            return true;
        }

        return false;
    }

    markCardToMoveAsync = async (cardView, index, from, to) =>
    {
        //util.log("[%s]: markCardToMoveAsync from %s to %s", card.state.cardName, from, to);                
        let cardsFrom = this.state.cardViewsInGrid[from];
    //    console.log("index of %s in %s is %s", cardView.state.cardName, from, cardsFrom.indexOf(cardView));
    //   console.log("markCardToMoveAsync - cardsFrom %s", cardsFrom.map(c => c.state.cardName));
        let newCardsFrom = cardsFrom.splice(index, 1);          // take it out of the "from" location
        this.state.cardViewsInGrid[to].push(cardView);          // put it in the "to" location
        await cardView.setStateAsync({ location: to });         // update its location
    }


    //
    //  marks the array of cards to move.
    //  returns only the one promise of the async method.
    markAndMoveMultipleCardsAsync = async (cardViews, from, to) =>
    {
        // this.dumpCardState("before markAndMoveMultipleCardsAsync", [to, from]);
        let promises = [];
        let cardsFrom = this.state.cardViewsInGrid[from];
        let cardsTo = this.state.cardViewsInGrid[to];
        for (let i = cardViews.length - 1; i >= 0; i--)        
        {
            let cardView = cardViews[i];
            let index = cardsFrom.indexOf(cardView);
            cardsFrom.splice(index, 1);  // remove 
            cardsTo.push(cardView);
            await cardView.setStateAsync({ location: to });


        }
        promises = this.redoGridLayoutAsync([to, from]);
        await Promise.all(promises);
        // this.dumpCardState("after markAndMoveMultipleCardsAsync", [to, from]);
    }

    markAllCardsToLocation = async (location) =>
    {
        let promises = [];
        for (let cardView of this.state.cardViews)        
        {
            promises.push(cardView.setStateAsync({ location: location }));
        };

        for (let grid of g_allGridNames)
        {
            if (grid !== "deck")
            {
                for (let cardView of this.state.cardViewsInGrid[grid])
                {
                    this.state.cardViewsInGrid.deck.push(cardView);
                }
            }
        }

        await Promise.all(promises);

    }
    moveCountingCardsBackToOwner = async () =>
    {

        let cardViews = this.state.cardViewsInGrid["counted"];
        let promises = [];
        while (cardViews.length > 0)        
        {
            let cardView = cardViews[0];
            await this.markCardToMoveAsync(cardView, 0, "counted", cardView.state.owner)
        };

        await Promise.all(this.flipAllCardsInGridAsync(["computer", "player"], "faceup"));
        promises = this.redoGridLayoutAsync(["player", "computer"]);
        await Promise.all(promises);
        await StaticHelpers.wait(0);

    }

    onTestMoveToCounted = async () =>
    {
        await this.markAndMoveMultipleCardsAsync(this.state.cardViewsInGrid["player"], "player", "counted");
    }

    redoGridLayout = (grids) =>
    {
        grids.map(grid => this.redoCardLayout(grid));
    }

    setPegColor = (player, num, col) =>
    {
        var name = util.format("%s_%s", player, num);
        //console.log("changing %s to %s", name, col);
        var svgDoc = this.myBoard.contentDocument;
        var hole = svgDoc.getElementById(name);
        if (hole != null)
        {
            hole.style.fill = col;
        }
        else
        {
            console.log("unable to find %s", name);
        }
    }
    onTestScoreBrowser = async () =>
    {
        this.myScoreBrowser.showPrevNextButtons(false);
        this.myScoreBrowser.showUpDownButtons(true);
        await this.waitForContinue();
        console.log("returned from wait for continue. score: %s", this.myScoreBrowser.getScoreText());
        this.myScoreBrowser.showUpDownButtons(false);
    }
    onTestBump = async () =>
    {
        let p = [];
        p.push(this.state.cardViewsInGrid["player"][0].bump());
        p.push(this.state.cardViewsInGrid["player"][1].bump());
        p.push(this.state.cardViewsInGrid["player"][3].bump());
        p.push(this.state.cardViewsInGrid["player"][4].bump());
        await Promise.all(p);
    }

    onRedoPlayerLayout = async () =>
    {
        let promises = this.redoGridLayoutAsync(["player"], 100);
        await Promise.all(promises);
    }
    nextScoreCallback = async () =>
    {
        if (this.state.scoreList.length === 0)
            return; // nothing to do

        this.myScoreBrowser.showPrevNextButtons(true);

        //
        //  if there is only one score, bump it
        if (this.state.scoreList.length === 1)
        {
            await this.highlightCards(1, 1, this.state.scoreList[0], true);
            return;
        }

        let index = this.state.scoreIndex + 1;
        if (index > this.state.scoreList.length - 1)
        {
            return;
        }

        if (this.state.scoreIndex >= 0)
        {
            // un-bump the old cards        
            await this.highlightCards(this.state.scoreIndex + 1, this.state.scoreList.length, this.state.scoreList[this.state.scoreIndex], false);
        }
        // increment the current score index
        await this.setStateAsync({ scoreIndex: index });
        // bump it
        await this.highlightCards(this.state.scoreIndex + 1, this.state.scoreList.length, this.state.scoreList[this.state.scoreIndex], true);
    }
    prevScoreCallback = async () =>
    {
        if (this.state.scoreList.length === 0)
            return; // nothing to do
        //
        //  if there is only one score, bump it
        if (this.state.scoreList.length === 1)
        {
            await this.highlightCards(1, 1, this.state.scoreList[0], true);
            await this.setStateAsync({ scoreIndex: 1 });
            return;
        }
        let index = this.state.scoreIndex - 1;
        if (index < 0) 
        {
            index = 0;
        }

        if (this.state.scoreIndex >= 0)
        {
            // un-bump the old cards        
            await this.highlightCards(this.state.scoreIndex + 1, this.state.scoreList.length, this.state.scoreList[this.state.scoreIndex], false);
        }
        // increment the current score index
        await this.setStateAsync({ scoreIndex: index });
        // bump it
        await this.highlightCards(this.state.scoreIndex + 1, this.state.scoreList.length, this.state.scoreList[this.state.scoreIndex], true);
    }

    getImportantGridsForGameState = () =>
    {
        switch (this.state.gameState)
        {
            case "CountComputer":
            case "CountPlayer":
                return ["counted"];
            case "ScorePlayerHand":
            case "ScorePlayerCrib":
                return ["player", "deck"];
            case "ScoreComputerHand":
            case "ScoreComputerCrib":
                return ["computer", "deck"];
            default:
                return ["counted", "player", "computer", "deck"]
        }
    }

    highlightCards = async (n, m, scoreObj, up) =>
    {
        if (n === 0) return; // the initial -1 state
        let promises = [];
        /*    let promises = await this.redoGridLayoutAsync(this.getImportantGridsForGameState(), 100);
           await Promise.all(promises); */
        this.myScoreBrowser.setScoreText(n, m, util.format("%s for %s", scoreObj.ScoreName, scoreObj.Score));

        for (let cdo of scoreObj.Cards)
        {
            let cardView = this.refs[cdo.cardName];
            promises.push(cardView.bump(up));
        }

        await Promise.all(promises);
    }



    playerSetScoreCallback = (score) =>
    {
        console.log("playerSetScoreCallback: score: %s", score);
    }

    onTestSetScore = () =>
    {

        for (var i = -1; i < 121; i++)
        {
            this.setPegColor("computer", i, "red");
            this.setPegColor("player", i, "yellow");
        }

    }

    getSuggestion = async () =>
    {
        await this.closeMenuAsync();
        if (this.state.gameState === "CountPlayer")
        {
            let countedCardObj = await CribbageServiceProxy.getComputerCountCardAsync(this.state.cardViewsInGrid["player"],
                this.getCountedCardsForThisRun(), this.state.currentCount);
            let cardCtrl = this.refs[countedCardObj.cardName];
            for (let c of this.state.cardViewsInGrid['player'])
            {
                c.select(false);
            }
            cardCtrl.select(true);
            return;

        }

        if (this.state.gameState === 'PlayerSelectsCribCards')
        {
            if (this.state.cardViewsInGrid["player"].length !== 6) return;

            for (let c of this.state.cardViewsInGrid['player'])
            {
                c.select(false);
            }

            let cribcards = await CribbageServiceProxy.getCribCardsAsync(this.state.cardViewsInGrid["player"], this.state.cribOwner === "player");
            let cardView = this.refs[cribcards[0].cardName];
            if (cardView !== null)
            {
                cardView.select(true);
            }
            cardView = this.refs[cribcards[1].cardName];
            if (cardView !== null)
            {
                cardView.select(true);
            }

        }

    }

    redoGridLayoutAsync = (grids, timeoutMs) => // grids is an array for grid names
    {
        let promises = [];
        let self = this;
        if (timeoutMs === undefined)
            timeoutMs = 500;

        for (let grid of grids)
        {
            //util.log("grid: %s", grid);
            let cardViews = self.state.cardViewsInGrid[grid];
            for (let [index, cardView] of cardViews.entries())            
            {
                let pos = {};
                let degrees = 360;
                if (this.state.sharedCardView !== null)
                {
                    degrees = (cardView.state.cardName === this.state.sharedCardView.state.cardName) ? 0 : 360;
                }

                pos = self.getCardPosition(grid, index);
                promises.push(cardView.animateAsync(pos["xPos"], pos["yPos"], degrees, timeoutMs));
                let zIndex = 20 + index;
                if (cardView.state.orientation === "faceup" && grid === "deck") zIndex += 50;
                this.setCardZIndex(cardView, zIndex);
            };
        }

        return promises;
    }

}

export default CribbageGame;
