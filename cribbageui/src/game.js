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
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import DragDropContextProvider from 'react-dnd/lib/DragDropContextProvider';
import { CribbageServiceProxy } from './serviceProxy';
import { ScoreCtrl } from './controls/scoreCtrl';
import { randomBytes } from 'crypto';
import scoreBrowser, { ScoreBrowser } from './controls/scoreBrowser';


const allGridNames = ["deck", "player", "computer", "crib", "counted"];

export class CribbageGame extends Component
{


    constructor(props)
    {

        super(props);
        let gridList = {}
        for (var grid of allGridNames)        
        {
            gridList[grid] = [];
        };


        this.state =
            {
                cribOwner: "player", // aka "dealer"
                doZoomWindow: false,
                menuOpen: false,
                cardDataObjs: [],   // the cards returned from the service
                cardViews: [],          // an array of all the UI cards
                cardViewsInGrid: gridList,     // a map of grid -> cards
                sharedCardView: null,
                gameState: "starting",
                waitForUserCallback: null,
                hisNibs: false,
                currentCount: 0,
                userFrontScore: 0,
                userBackScore: 0,
                computerBackScore: 0,
                playerBackScore: 0,
                computerFrontScore: 0,
                playerFrontScore: 0,
                scoreIndex: 0,
                waitingForContinue: false,
                scoreList: []

            }


        this.renderMenu = this.renderMenu.bind(this);
        this.handleChooseCribPlayer = this.handleChooseCribPlayer.bind(this);
        this.toggleZoomWindow = this.toggleZoomWindow.bind(this);

        this.closeMenuAndReset = this.closeMenuAndReset.bind(this);


    }

    resetScoreList = async () =>
    {
        await this.setStateAsync({ scoreIndex: 0, scoreList: [] });
        this.myScoreBrowser.resetMessages();
        let promises = await this.redoGridLayoutAsync(["counted"]);
        await Promise.all(promises);
    }

    componentDidMount() 
    {
        this.resetScoreList();
        window.addEventListener('resize', this.handleResize);

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

        var ratio = Math.min(xRatio, yRatio);

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

        while (true)
        {
            loopCount++;
            util.log("state: %s", this.state.gameState);
            switch (this.state.gameState)
            {
                case "Start":
                    await this.resetScoreList();
                    //
                    //  need a way to pick the dealer
                    await this.setStateAsync({ gameState: "Deal" });
                    this.myScoreBrowser.showUpDownButtons(false);
                    this.myScoreBrowser.showPrevNextButtons(false);
                    break;
                case "Deal":
                    await this.animateCribToOwner(Dealer);
                    PlayerTurn = (Dealer === "computer") ? "player" : "computer";
                    util.log("Dealer: %s", Dealer);
                    CurrentCount = 0;
                    await this.getHandAsync();
                    await this.setStateAsync({ gameState: "PlayerSelectsCribCards" });
                    break;
                case "PlayerSelectsCribCards":
                    await this.waitForUserCribCards();
                    await this.setStateAsync({ gameState: "GiveToCrib" });
                    break;
                case "GiveToCrib":
                    await this.animateCardsToCrib();
                    nextState = (this.state.cribOwner === "computer") ? "playerCount" : "computerCount";
                    if (this.state.hisNibs)
                    {
                        let scoreObj = this.createScoreObject(2, "Nibs", [this.state.sharedCardView]);
                        await this.addScore(Dealer, scoreObj);
                    }
                    await this.setStateAsync({ gameState: "Count" });
                    break;
                case "Count":
                    await this.setStateAsync({ currentCount: 0 });
                    nextState = (PlayerTurn === "player") ? "CountPlayer" : "CountComputer";
                    await this.setStateAsync({ gameState: nextState });
                    this.setState({ scoreList: [] });                    
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
                    // await this.scoreLastCard();
                    await this.moveCountingCardsBackToOwner();
                    this.myScoreBrowser.showPrevNextButtons(false);
                    nextState = Dealer === "computer" ? "ScorePlayerHand" : "ScoreComputerHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScorePlayerHand":
                    await this.resetScoreList();
                    let score = await this.getScoreForHand("player", false);
                    await this.addScore("player", score);
                    nextState = Dealer === "computer" ? "ScoreComputerHand" : "ScorePlayerCrib";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScoreComputerHand":
                    await this.resetScoreList();
                    score = await this.getScoreForHand("computer", false);
                    await this.addScore("computer", score);
                    nextState = Dealer === "computer" ? "ScoreComputerCrib" : "ScorePlayerHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScoreComputerCrib":
                    await this.resetScoreList();
                    await this.moveCribCardsToOwner();
                    score = await this.getScoreForHand("computer", true);
                    await this.addScore("computer", score);
                    nextState = "EndOfHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScorePlayerCrib":
                    await this.resetScoreList();
                    await this.moveCribCardsToOwner();
                    score = await this.getScoreForHand("player", true);
                    await this.addScore("player", score);
                    nextState = "EndOfHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "EndOfHand":
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
    }

    endOfTurn = async () =>
    {
        try
        {

            await Promise.all(this.flipAllCardsInGridAsync(allGridNames, "facedown"));
            await this.markAllCardsToLocation("deck");
            let promises = [];
            promises = this.redoCardLayoutAsync("deck");
            await Promise.all(promises);
            await StaticHelpers.wait(50);
            let resetCards = {};
            allGridNames.map(grid => resetCards[grid] = []);
            await this.setStateAsync({
                cardViewsInGrid: resetCards,
                cardViews: [],
                cardDataObjs: [],
                sharedCardView: null,
                hisNibs: false,
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
            util.log("go score: %o", scoreObj);
            await this.addScore(lastCardPlayed.state.owner, scoreObj);
        }

        this.myScoreBrowser.setMessage("hit the check to continue.");
        await this.nextScoreCallback();
        await this.waitForContinue();


        await this.setStateAsync({ currentCount: 0 });
        await this.resetScoreList();
        await Promise.all(this.flipAllCardsInGridAsync(["counted"], "facedown"));
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
        StaticHelpers.dumpObject("counted cards", cardsInThisCountedRun);
        return cardsInThisCountedRun;
    }

    doCountForComputer = async () =>
    {
        let countedCardObj = await CribbageServiceProxy.getComputerCountCardAsync(this.state.cardViewsInGrid["computer"],
            this.getCountedCardsForThisRun(), this.state.currentCount);

        let cardCtrl = this.refs[countedCardObj.countedCard.name];


        await this.markAndMoveMultipleCardsAsync([cardCtrl], "computer", "counted");
        //  await this.flipCardAsync(cardCtrl, "faceup");

        util.log("setting %s to faceup", cardCtrl.state.cardName);
        await cardCtrl.setOrientationAsync("faceup");
        await StaticHelpers.wait(500);
        util.log("finished %s to faceup", cardCtrl.state.cardName);
        let count = this.state.currentCount + cardCtrl.state.value;
        await this.setStateAsync({ currentCount: count });
        return countedCardObj.Scoring;
    }

    doCountForPlayer = async () =>
    {

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

        this.myScoreBrowser.showPrevNextButtons(true);

        if (who === "computer")
        {
            let frontScore = this.state.computerFrontScore;
            let backScore = this.state.computerBackScore;
            this.setPegColor("computer", backScore, "black"); // turn it off

            await this.setStateAsync({
                computerBackScore: frontScore,
                computerFrontScore: (frontScore + scoreObject.Score)
            });
            this.setPegColor("computer", (frontScore + scoreObject.Score), "red"); // turn it on

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
            this.setPegColor("player", (frontScore + scoreObject.Score), "red"); // turn it on
        }
        try
        {
            if (scoreObject.Score === 1)
            {
                if (scoreObject.ScoreInfo[0].ScoreName === "Go")
                    debugger;
            }
            if (scoreObject !== null && scoreObject.ScoreInfo.length > 0)
            {
                let lst = this.state.scoreList.concat(scoreObject.ScoreInfo);
                await this.setStateAsync({ scoreList: lst });
                if (scoreObject.Score > 0)
                {
                    this.myScoreBrowser.setMessage("browse scores and then hit the check to continue");
                    this.myScoreBrowser.showPrevNextButtons(true);
                    let scoreObj = this.state.scoreList[this.state.scoreIndex];
                    this.myScoreBrowser.setScoreText(this.state.scoreIndex + 1, this.state.scoreList.length, util.format("%s for %s", scoreObj.ScoreName, scoreObj.Score));
                    await this.waitForContinue();

                    this.myScoreBrowser.resetMessages();
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
        let promises = await this.redoGridLayoutAsync(["counted", "player", "computer", "deck"], 100);
        await Promise.all(promises);
    }

    createScoreObject = (score, name, cards) =>
    {
        let scoreInfo =[
            {
                ScoreName: name,
                Score: score,
                Cards: cards
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
        await this.animateCribToOwner(newOwner);
    }

    animateCribToOwner = async (newOwner) =>
    {
        await this.setStateAsync({ cribOwner: newOwner });

        var cmd;


        if (newOwner === "player") 
        {
            cmd = "translate(0px, 563px)";

        }
        else
        {
            cmd = "translate(0px, 0px)";
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
            await Promise.all(this.flipAllCardsInGridAsync(allGridNames, "facedown"));

            await this.markAllCardsToLocation("deck");
            let promises = [];
            promises = this.redoCardLayoutAsync("deck");
            await Promise.all(promises);
            await StaticHelpers.wait(50);
            let resetCards = {};
            allGridNames.map(grid => resetCards[grid] = []);
            await this.setStateAsync({
                cardsInGrid: resetCards,
                cards: [],
                cardDataObjs: [],
                sharedCardView: null,
                hisNibs: false,
                currentCount: 0,
                gameState: "starting",
                computerFrontScore: 0,
                computerBackScore: -1,
                playerFrontScore: 0,
                playerBackScore: -1,
                countedCards: []
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
            StaticHelpers.dumpObject("after setting cardDataObjs", this.state);
            let uiCardList = [];
            let sharedCardView = null;
            for (let cardData of this.state.cardDataObjs) // deliberately using these since it requires that setStateAsync have worked
            {
                let uiCard = this.refs[cardData.name];
                uiCardList.push(uiCard); // put it in the "all cards collection"
                this.state.cardViewsInGrid[uiCard.state.location].push(uiCard); // stuff it in the location collect - should all be in "deck" at this point
                if (uiCard.state.owner === "shared")
                {
                    sharedCardView = uiCard;
                }
            }


            await this.setStateAsync({
                cards: uiCardList,
                hisNibs: serviceObj.HisNibs,
                sharedCardView: sharedCardView
            });

            await this.onDeal();
            await this.markAndMoveMultipleCardsAsync([this.refs[serviceObj.ComputerCribCards[0].name], this.refs[serviceObj.ComputerCribCards[1].name]], "computer", "counted");

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
            let promises = await this.redoGridLayoutAsync(["computer", "player"]);
            await Promise.all(promises);
            await Promise.all(this.flipAllCardsInGridAsync(["player"], "faceup"));
        }
        catch (e)
        {
            util.log("error in Deal. %s", e.message);
        }

        this.state.cardViewsInGrid['player'].sort((c1, c2) => 
        {

            let val1 = this.getOrdinalValue(c1);
            let val2 = this.getOrdinalValue(c2);

            return val1 - val2;
        });

        this.state.cardViewsInGrid['player'].map(cardView => cardView.translateSpeed(1500));
        let promises = await this.redoGridLayoutAsync(["player"]);
        await Promise.all(promises);
        this.state.cardViewsInGrid['player'].map(cardView => cardView.translateSpeed(500));
    }

    getOrdinalValue = (cardView) =>
    {
        let firstLetter = cardView.state.cardName.substring(0, 1);
        switch (firstLetter)
        {
            case "J":
                return 11;
            case "Q":
                return 12;
            case "K":
                return 13;
            default:

        }

        return cardView.state.value;
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
        util.log("cribOwner is %s", this.state.cribOwner);
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

        allGridNames.map(grid => this.redoCardLayout(grid));
    }

    showSharedCard = () =>
    {
        let cardView = this.state.sharedCardView;
        cardView.setState({ orientation: "faceup" });
        this.setCardZIndex(cardView, 99);

    }

    setCardZIndex = (cardView, zIndex) =>
    {
        //util.log("[%s] - zIndex:%s", card.state.cardName, zIndex);
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
            this.setCardZIndex(cardView, 10 + index);
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
            this.setCardZIndex(cardView, 10 + index);
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

        util.log("[%s].clicked.  countable:%s state:%s", cardView.state.cardName, cardView.state.countable, this.state.gameState);
        if (this.state.gameState === "PlayerSelectsCribCards")
        {
            await this.markAndMoveMultipleCardsAsync([cardView], "player", "counted");
            if (this.state.cardViewsInGrid["counted"].length === 4)            
            {
                this.state.waitForUserCallback();
            }
        }

        if (this.state.gameState === "CountPlayer")
        {
          
            if (!cardView.state.countable)
            {
                this.myScoreBrowser.setMessage(util.format("$s is not playable at this time, card.cardName.  hit the check mark to continue..."));
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
                        <legend> Crib Owner </legend>
                        <div className="Menu_radioButton">
                            <label>
                                <input type="radio" value="computer"
                                    checked={this.state.cribOwner === 'computer'}
                                    onChange={this.handleChooseCribPlayer} />
                                <span className="radioTextBlock">
                                    Computer
                        </span>
                            </label>
                        </div>
                        <div className="Menu_radioButton">
                            <label>
                                <input type="radio" value="player"
                                    checked={this.state.cribOwner === 'player'}
                                    onChange={this.handleChooseCribPlayer} />
                                <span className="radioTextBlock">
                                    Player
                        </span>
                            </label>
                        </div>
                    </fieldset>
                    <fieldset className="Menu_TestButtons"  >
                        <legend> Test Buttons </legend>
                        <div>
                            <button onClick={this.onReset.bind(this)} className="menu-item--large" >Reset</button>
                        </div>
                        <div>
                            <div>
                                <button onClick={this.onDeal.bind(this)} className="menu-item--large" ref="mnu_onGetHand">Deal</button>
                            </div>
                            <button onClick={this.onGetHandAsync.bind(this)} className="menu-item--large" ref="mnu_onGetHand">GetHandAsync</button>
                            <div>
                                <button onClick={this.getComputerCribCards.bind(this)} className="menu-item--large" ref="mnu_animateComputerCribCards">Crib Cards</button>
                            </div>
                            <button onClick={this.animateCardsToCrib.bind(this)} className="menu-item--large" ref="mnu_animateCardsToCrib">Move Cards to Crib</button>
                            <button onClick={this.onAnimateCribCardsToOwner.bind(this)} className="menu-item--large" ref="mnu_onAnimateCribCardsToOwner">Crib back to owner</button>
                            <button onClick={this.onTestMoveToCounted.bind(this)} className="menu-item--large" ref="mnu_onTestMoveToCounted">Move Cards to Counted</button>
                            <button onClick={this.onTestSetScore.bind(this)} className="menu-item--large" ref="mnu_onTestSetScore">Test Set Score</button>
                            <button onClick={this.onTestScoreBrowser.bind(this)} className="menu-item--large" ref="mnu_onTestScoreBrowser">Test Score Browser</button>
                            <button onClick={this.onTestBump.bind(this)} className="menu-item--large" >Test Bump</button>
                            <button onClick={this.onRedoPlayerLayout.bind(this)} className="menu-item--large" >onRedoPlayerLayout</button>
                        </div>
                    </fieldset>
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

    renderOneCard = (serviceCard) =>
    {
        let n = "main_" + serviceCard.name;
        let divName = "CARDDIV_" + serviceCard.name;

        return (

            <div className={divName} key={divName} ref={divName}>
                <CardView ref={serviceCard.name}
                    cardName={serviceCard.name}
                    orientation={serviceCard.orientation}
                    owner={serviceCard.owner}
                    location={"deck"}
                    className={n}
                    selected={false}
                    value={serviceCard.value}
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
                            data={require("./images/board.svg")}
                            type="image/svg+xml"
                            ref={myBoard => this.myBoard = myBoard}
                            title="Cribbage Board"
                        />
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
        let newCardsFrom = cardsFrom.splice(index, 1);
        this.state.cardViewsInGrid[to].push(cardView);
        console.assert(newCardsFrom.cardName === cardView.cardName, "splice returned a different card than the one passed in");
        await cardView.setStateAsync({ location: to });
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
        promises = await this.redoGridLayoutAsync([to, from]);
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

        for (let grid of allGridNames)
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
        promises = await this.redoGridLayoutAsync(["player", "computer"]);
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
        let promises = await this.redoGridLayoutAsync(["player"], 100);
        await Promise.all(promises);
    }
    nextScoreCallback = async () =>
    {
        console.log("nextScoreCallback");
        if (this.state.scoreList.length === 0)
            return;
        let index = this.state.scoreIndex + 1;
        if (index > this.state.scoreList.length - 1)
            index = this.state.scoreList.length - 1;

        let scoreObj = this.state.scoreList[index];
        if (scoreObj !== null)
        {
            await this.highlightCards(index + 1, this.state.scoreList.length, scoreObj);
        }

        await this.setStateAsync({ scoreIndex: index });
    }

    getImportantGridsForGameState =  () =>
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

    highlightCards = async (n, m, scoreObj) =>
    {
        
        console.log("highlightCards");
        let promises = await this.redoGridLayoutAsync(this.getImportantGridsForGameState(), 100);
        await Promise.all(promises);
        this.myScoreBrowser.setScoreText(n, m, util.format("%s for %s", scoreObj.ScoreName, scoreObj.Score));

        //
        //  oh boy
        //          most of the time the cards that are involved in scoring come from the service 
        //          sometimes they are created in the client
        for (let cdo of scoreObj.Cards)
        {
            let cardView = this.refs[cdo.name];
            promises.push(cardView.bump());
        }

        await Promise.all(promises);
    }

    prevScoreCallback = async () =>
    {
        console.log("prevScoreCallback");
        if (this.state.scoreList.length === 0)
            return;

        let index = this.state.scoreIndex - 1;
        if (index < 0) index = 0;
        let scoreObj = this.state.scoreList[index];
        if (scoreObj !== null)
        {
            await this.highlightCards(index + 1, this.state.scoreList.length, scoreObj);
        }

        await this.setStateAsync({ scoreIndex: index });
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
            let cardCtrl = this.refs[countedCardObj.name];
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
            let cardView = this.refs[cribcards[0].name];
            if (cardView !== null)
            {
                cardView.select(true);
            }
            cardView = this.refs[cribcards[1].name];
            if (cardView !== null)
            {
                cardView.select(true);
            }

        }

    }

    redoGridLayoutAsync = async (grids, timeoutMs) => // grids is an array for grid names
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
                pos = self.getCardPosition(grid, index);
                promises.push(cardView.animateAsync(pos["xPos"], pos["yPos"], 360, timeoutMs));
                this.setCardZIndex(cardView, 20 + index);
            };
        }

        return promises;
    }

}

export default DragDropContext(HTML5Backend)(CribbageGame);
//export default CribbageGame;
