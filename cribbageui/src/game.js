/*eslint no-unused-vars: off*/
import React, { Component } from 'react';
import CribbageBoard from './controls/CribbageBoard';
import CountCtrl from './controls/countCtrl';
import Menu from 'react-burger-menu/lib/menus/slide'
import util, { debuglog } from 'util';
import { StaticHelpers } from './helper_functions';
import { Card } from './controls/card';
import "./game.css";
import "./menu.css";
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import DragDropContextProvider from 'react-dnd/lib/DragDropContextProvider';
import { CribbageServiceProxy } from './serviceProxy';
import { ScoreCtrl } from './controls/scoreCtrl';


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
                cribOwner: "computer", // aka "dealer"
                doZoomWindow: false,
                menuOpen: false,
                cardDataObjs: [],   // the cards returned from the service
                cards: [],          // an array of all the UI cards
                cardsInGrid: gridList,     // a map of grid -> cards
                sharedCard: null,
                gameState: "starting",
                waitForUserCallback: null,
                hisNibs: false,
                currentCount: 0,
                userFrontScore: 0,
                userBackScore: 0,
                computerBackScore: 0,
                playerBackScore: 0,
                computerFrontScore: 0,
                playerFrontScore: 0

            }


        this.renderMenu = this.renderMenu.bind(this);
        this.handleChooseCribPlayer = this.handleChooseCribPlayer.bind(this);
        this.toggleZoomWindow = this.toggleZoomWindow.bind(this);
        this.getNextCardXposition = this.getNextCardXposition.bind(this);
        this.closeMenuAndReset = this.closeMenuAndReset.bind(this);


    }

    componentDidMount() 
    {
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
            if (loopCount === 25)
            {
                debugger;
                loopCount = 0;
            }
            util.log("state: %s", this.state.gameState);
            switch (this.state.gameState)
            {
                case "Start":
                    //
                    //  need a way to pick the dealer
                    await this.setStateAsync({ gameState: "Deal" });                    
                    break;
                case "Deal":
                    PlayerTurn = (Dealer === "computer") ? "player" : "computer";
                    util.log("Dealer: %s", Dealer);
                    CurrentCount = 0;
                    await this.onGetHandAsync();
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
                        await this.addScore(Dealer, 1);
                    }
                    await this.setStateAsync({ gameState: "Count" });
                    break;
                case "Count":
                    await this.setStateAsync({ currentCount: 0 });
                    nextState = (PlayerTurn === "player") ? "CountPlayer" : "CountComputer";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "CountPlayer":
                    {
                        let canPlay = await this.canPlay();
                        PlayerTurn = "player";

                        if (canPlay.playerCanPlay)
                        {
                            let score = await this.doCountForPlayer();
                            await this.addScore("player", score);
                        }

                        canPlay = await this.canPlay();
                        nextState = "CountComputer";
                        if (!canPlay.computerCanPlay && !canPlay.playerCanPlay)
                        {
                            if (this.state.cardsInGrid["player"].length === 0 &&
                                this.state.cardsInGrid["computer"].length === 0)
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
                            let score = await this.doCountForComputer();
                            await this.addScore("computer", score);
                        }
                        canPlay = await this.canPlay();

                        nextState = "CountPlayer";

                        if (!canPlay.computerCanPlay && canPlay.playerCanPlay)
                        {
                            //_gameView.AddMessage("Computer can't play.  Go again.");
                        }

                        if (canPlay.computerCanPlay === false && canPlay.playerCanPlay === false)
                        {
                            if (this.state.cardsInGrid["player"].length === 0 &&
                                this.state.cardsInGrid["computer"].length === 0)
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
                    await this.moveCountingCardsBackToOwner();
                    nextState = Dealer === "computer" ? "ScorePlayerHand" : "ScoreComputerHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScorePlayerHand":
                    let score = await this.getScoreForHand("player", false);
                    await this.addScore("player", score);
                    nextState = Dealer === "computer" ? "ScoreComputerHand" : "ScorePlayerCrib";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScoreComputerHand":
                    score = await this.getScoreForHand("computer", false);
                    await this.addScore("computer", score);
                    nextState = Dealer === "computer" ? "ScoreComputerCrib" : "ScorePlayerHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScoreComputerCrib":
                    await this.moveCribCardsToOwner();
                    score = await this.getScoreForHand("computer", true);
                    await this.addScore("computer", score);
                    nextState = "EndOfHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "ScorePlayerCrib":
                    await this.moveCribCardsToOwner();
                    score = await this.getScoreForHand("player", true);
                    await this.addScore("player", score);
                    nextState = "EndOfHand";
                    await this.setStateAsync({ gameState: nextState });
                    break;
                case "EndOfHand":
                    debugger;
                    Dealer = this.toggleDealer(Dealer);
                    await this.setStateAsync({ cribOwner: Dealer, gameState: "Deal" });

                    break;
                default:
                    alert(this.state.gameState + " exiting game loop");
                    return;
            }
        }
    }

    scoreGo = async () =>
    {

        //
        //  you can't use Array.slice() to pick off the last element of the array
        //  here because it does a "shallow copy"
        //
        let length = this.state.cardsInGrid.counted.length;
        var lastCardPlayed = this.state.cardsInGrid.counted[length - 1];
        await this.addScore(lastCardPlayed.state.owner, 1);

        this.flipAllCardsInGrid(["counted"], "facedown");
        alert(lastCardPlayed.state.owner + " scored go!");
        await this.setStateAsync({ currentCount: 0 });
        return lastCardPlayed.state.owner;

    }
    cardArrayToCardNameCsv = (cards) =>
    {
        let csv = "";
        for (let card of cards)
        {
            csv += card.state.cardName;
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
        for (let card of this.state.cardsInGrid["counted"])
        {
            if (card.state.orientation === "faceup")
            {
                cardsInThisCountedRun.push(card);
            }
        }
        StaticHelpers.dumpObject("counted cards", cardsInThisCountedRun);
        return cardsInThisCountedRun;
    }

    doCountForComputer = async () =>
    {
        let countedCardObj = await CribbageServiceProxy.getComputerCountCardAsync(this.state.cardsInGrid["computer"],
                                                        this.getCountedCardsForThisRun(), this.state.currentCount);

        let cardCtrl = this.refs[countedCardObj.name];


        await this.markAndMoveMultipleCardsAsync([cardCtrl], "computer", "counted");
      //  await this.flipCardAsync(cardCtrl, "faceup");

      await cardCtrl.setOrientationAsync("faceup");

        let count = this.state.currentCount + cardCtrl.state.value;
        await this.setStateAsync({ currentCount: count });
        let score = countedCardObj.score;
        return score;
    }

    doCountForPlayer = async () =>
    {

        let countedCard = await this.getCountCard();

        let score = await CribbageServiceProxy.getCountedScoreAsync(countedCard, this.state.currentCount, this.getCountedCardsForThisRun());
        let count = this.state.currentCount + countedCard.state.value;
        console.log("player scored: %s for playing %s", score, countedCard.state.cardName);
        await this.setStateAsync({ currentCount: count });

        return score;
    }

    getScoreForHand = async (player, isCrib) =>
    {
        //  getScoreForHandAsync = async (hand, sharedCard, isCrib) =>

        let score = await CribbageServiceProxy.getScoreForHandAsync(this.state.cardsInGrid[player], this.state.sharedCard, isCrib);

        return score;
    }

    getCountCard = async () =>
    {
        return new Promise(async (resolve_func, reject_func) =>
        {

            var endUserPickCards = (card) =>
            {
                util.log("resolving getCountCard card:%s ", card.state.cardName);
                resolve_func(card);
            }

            await this.setStateAsync({ waitForUserCallback: endUserPickCards });
        });

    }



    canPlay = async () =>
    {
        var retObj = { playerCanPlay: false, computerCanPlay: false };
        for (let card of this.state.cardsInGrid["computer"])        
        {
            if (card.state.value + this.state.currentCount <= 31)
            {
                retObj.computerCanPlay = true;
                break;
            }

        }
        let cards = this.state.cardsInGrid["player"];
        for (let card of cards)
        {
            if (card.state.value + this.state.currentCount <= 31)
            {
                await card.setStateAsync({ countable: true });
                retObj.playerCanPlay = true;
            }
            else
            {
                await card.setStateAsync({ countable: false });
            }
        }

        return retObj;
    }

    addScore = async (who, count) =>
    {
        if (count === 0)
            return;
        alert(util.format("adding %s to %s ", count, who));
        if (who === "computer")
        {
            let frontScore = this.state.computerFrontScore;
            let backScore = this.state.computerBackScore;
            await this.setStateAsync({
                computerBackScore: frontScore,
                computerFrontScore: (frontScore + count)
            });
        }
        else
        {
            let frontScore = this.state.playerFrontScore;
            let backScore = this.state.playerBackScore;
            await this.setStateAsync({
                playerBackScore: frontScore,
                playerFrontScore: (frontScore + count)
            });
        }
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
                console.log("setStateAsync: key= %s state = %o", key, this.state[key]);

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
        await this.setStateAsync({ cribOwner: newOwner });

        var cmd;


        if (newOwner === "player") 
        {
            cmd = "translate(0px, 481px)";

        }
        else
        {
            cmd = "translate(0px, 0px)";
        }

        this.myCribDiv.style['transform'] = cmd;

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
            await StaticHelpers.wait(500);
            let resetCards = {};
            allGridNames.map(grid => resetCards[grid] = []);
            await this.setStateAsync({
                cardsInGrid: resetCards,
                cards: [],
                cardDataObjs: [],
                sharedCard: null,
                gameState: "starting",
                hisNibs: false,
                currentCount: 0,
                userFrontScore: 0,
                userBackScore: 0,
                computerFrontScore: 0,
                computerBackScore: 0,
                countedCards: []
            });

            // this.dumpCardState("in Reset", allGridNames);
        }
        catch (e)
        {
            util.log("caught exception in onReset. %s", e);
        }
    }


    onGetHandAsync = async () =>
    {
        try
        {

            await this.closeMenuAsync();
            await this.onReset();
            StaticHelpers.dumpObject("after onReset", this.state);
            let serviceObj = await CribbageServiceProxy.getHandAsync(this.setState.cribOwner === "computer");

            await this.setStateAsync({ cardDataObjs: serviceObj.allCards }); // this causes the cards to render
            console.assert(this.state.cardDataObjs.length === 13, "setStateAsync didn't work or we recieved the wrong number of cards from the service");
            StaticHelpers.dumpObject("after setting cardDataObjs", this.state);
            let uiCardList = [];
            let sharedCard = null;
            for (let cardData of this.state.cardDataObjs) // deliberately using these since it requires that setStateAsync have worked
            {
                let uiCard = this.refs[cardData.name];
                uiCardList.push(uiCard); // put it in the "all cards collection"
                this.state.cardsInGrid[uiCard.state.location].push(uiCard); // stuff it in the location collect - should all be in "deck" at this point
                if (uiCard.state.owner === "shared")
                {
                    sharedCard = uiCard;
                }
            }


            await this.setStateAsync({
                cards: uiCardList,
                hisNibs: serviceObj.hisNibs,
                sharedCard: sharedCard
            });

            await this.onDeal();
            await this.markAndMoveMultipleCardsAsync([this.refs[serviceObj.computerCrib[0].name], this.refs[serviceObj.computerCrib[1].name]], "computer", "counted");
        }
        catch (error)
        {
            util.log("error thrown in GetHandAsync %s", error.message);
        }

    }

    flipAllCardsInGrid = (grids, orientation) =>
    {
        for (const grid of grids)        
        {

            let cards = this.state.cardsInGrid[grid];
            if (cards == null)
                return;

            if (cards.length === 0)
                return;

            for (let card of cards)
            {

                this.flipCard(card, orientation);
            }
        };
    }

    flipAllCardsInGridAsync = (grids, orientation) =>
    {
        let promises = [];
        for (let grid of grids)
        {
            let cards = this.state.cardsInGrid[grid];
            if (cards != null)
            {
                for (let card of cards)
                {
                    let p = card.setStateAsync({ orientation: orientation });
                    promises.push(p);
                }
            }
        }

        return promises;
    }

    flipCard = (card, orientation) =>
    {
        card.setState({ orientation: orientation });
    }

    flipCardAsync = async (card, orientation) =>
    {
        await card.setStateAsync({ orientation: orientation });
    }




    onDeal = async () =>
    {
        try
        {
            await StaticHelpers.wait(0);

            //this.dumpCardState("before deal loop", allGridNames);
            let cards = this.state.cardsInGrid["deck"];
            for (let i = cards.length - 1; i >= 0; i--)        
            {
                let card = cards[i];
                if (card.state.owner === "shared") continue;
                await this.markCardToMoveAsync(card, i, card.state.location, card.state.owner);

            };
            let promises = await this.redoGridLayoutAsync(["computer", "player"]);
            await Promise.all(promises);
            await Promise.all(this.flipAllCardsInGridAsync(["player"], "faceup"));
        }
        catch (e)
        {
            util.log("error in Deal. %s", e.message);
        }




    }

    getComputerCribCards = async () =>
    {
        await this.closeMenuAsync();
        let cribcards = await CribbageServiceProxy.getCribCardsAsync(this.state.cardsInGrid["computer"], this.state.cribOwner === "computer");
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

        this.flipAllCardsInGrid(grids, "facedown");
        for (let grid of grids)
        {
            let cards = this.state.cardsInGrid[grid];
            await this.markAndMoveMultipleCardsAsync(cards, grid, "deck");
        }


        await this.markAndMoveMultipleCardsAsync(this.state.cardsInGrid["crib"], "crib", this.state.cribOwner);
        util.log("cribOwner is %s", this.state.cribOwner);
        this.flipAllCardsInGrid([this.state.cribOwner], "faceup");

    }

    dumpCardState = (msg, grids) => 
    {
        util.log("msg: %s", msg);
        for (let grid of grids)
        {
            for (let card of this.state.cardsInGrid[grid])
            {
                util.log("\t [%s] grid: %s owner:%s location:%s orientation:%s",
                    card.state.cardName, grid, card.state.owner, card.state.location, card.state.orientation);
            }
        }

    }

    doFullLayout = () =>
    {

        allGridNames.map(grid => this.redoCardLayout(grid));
    }

    showSharedCard = () =>
    {
        let card = this.state.sharedCard;
        card.setState({ orientation: "faceup" });
        this.setCardZIndex(card, 99);

    }

    setCardZIndex = (card, zIndex) =>
    {
        //util.log("[%s] - zIndex:%s", card.state.cardName, zIndex);
        let divName = "CARDDIV_" + card.state.cardName;
        let div = this.refs[divName];
        div.style["z-index"] = zIndex;
    }

    animateCardsToCrib = async () =>
    {
        await Promise.all(this.flipAllCardsInGridAsync(["counted"], "facedown"));
        await this.markAndMoveMultipleCardsAsync(this.state.cardsInGrid["counted"], "counted", "crib");
        this.redoCardLayout("player");
        this.showSharedCard();
    }



    redoCardLayout = (gridName) =>
    {
        for (let [index, card] of this.state.cardsInGrid[gridName].entries())        
        {
            let pos = {};
            pos = this.getCardPosition(gridName, index);
            card.animate(pos["xPos"], pos["yPos"], 360);
            this.setCardZIndex(card, 10 + index);
        }

    }

    redoCardLayoutAsync = (gridName) =>
    {

        let promises = [];
        for (let [index, card] of this.state.cardsInGrid[gridName].entries())        
        {
            let pos = {};
            pos = this.getCardPosition(gridName, index);
            promises.push(card.animateAsync(pos["xPos"], pos["yPos"], (gridName === "deck") ? 0 : 360));
            this.setCardZIndex(card, 10 + index);
        }

        return promises;

    }

    getCardPosition(gridName, index)
    {
        var animationTopCoordinates = [];
        animationTopCoordinates["computer"] = 308;
        animationTopCoordinates["counted"] = 550;
        animationTopCoordinates["player"] = 788;
        animationTopCoordinates["deck"] = 550;

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
            yPos = 550;
        }

        xPos = xPos - 1022; // this are in game.css as margin-left and margin-top
        yPos = yPos - 550;

        let pos = {};
        pos["xPos"] = xPos;
        pos["yPos"] = yPos;
        return pos;
    }

    onClickCard = async (card) =>
    {
        util.log("[%s].clicked.  countable:%s state:%s", card.state.cardName, card.state.countable, this.state.gameState);
        if (this.state.gameState === "PlayerSelectsCribCards")
        {
            await this.markAndMoveMultipleCardsAsync([card], "player", "counted");
            if (this.state.cardsInGrid["counted"].length === 4)            
            {
                this.state.waitForUserCallback();
            }
        }

        if (this.state.gameState === "CountPlayer")
        {
            if (!card.state.countable)
            {

                alert(util.format("$s is not playable at this time, card.cardName"));
                return;
            }

            await this.markAndMoveMultipleCardsAsync([card], "player", "counted");
            this.state.waitForUserCallback(card);
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

    getNextCardXposition(grid, width, count)
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
                    <div className="Menu_buttonDiv">
                        <button onClick={this.onNewGame.bind(this)} className="menu-item--large" >New Game</button>
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
                            <button onClick={this.onDeal.bind(this)} className="menu-item--large" ref="mnu_onGetHand">Deal</button>
                            <button onClick={this.onGetHandAsync.bind(this)} className="menu-item--large" ref="mnu_onGetHand">GetHandAsync</button>
                            <button onClick={this.getComputerCribCards.bind(this)} className="menu-item--large" ref="mnu_animateComputerCribCards">Crib Cards</button>
                            <button onClick={this.animateCardsToCrib.bind(this)} className="menu-item--large" ref="mnu_animateCardsToCrib">Move Cards to Crib</button>
                            <button onClick={this.onAnimateCribCardsToOwner.bind(this)} className="menu-item--large" ref="mnu_onAnimateCribCardsToOwner">Crib back to owner</button>
                            <button onClick={this.onTestMoveToCounted.bind(this)} className="menu-item--large" ref="mnu_onTestMoveToCounted">Move Cards to Counted</button>
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
                <Card ref={serviceCard.name}
                    cardName={serviceCard.name}
                    orientation={serviceCard.orientation}
                    owner={serviceCard.owner}
                    location={"deck"}
                    className={n}
                    value={serviceCard.value}
                    cardClickedCallback={this.onClickCard}
                />
            </div>


        );
    }

    renderCards = (cardsList) =>
    {
        var cardUIList = [];
        for (var card of cardsList)
        {
            cardUIList.push(this.renderOneCard(card));

        };
        return cardUIList;
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
                        <div className="DIV_cribbageBoard">
                            {<CribbageBoard />}
                        </div>
                        <div className="DIV_crib" ref={myCribDiv => this.myCribDiv = myCribDiv} />
                        <CountCtrl ref="myCountCtrl"
                            count={this.state.currentCount} visible={this.isCountState()}
                        />
                        <ScoreCtrl frontScore={this.state.computerFrontScore} backScore={this.state.computerBackScore} player={"computer"} />
                        <ScoreCtrl frontScore={this.state.playerFrontScore} backScore={this.state.playerBackScore} player={"player"} />
                        <div className="DIV_computer" />
                        <div className="DIV_deck" />
                        <div className="DIV_counted" />
                        <div className="DIV_player" />
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

    markCardToMoveAsync = async (card, index, from, to) =>
    {
        //util.log("[%s]: markCardToMoveAsync from %s to %s", card.state.cardName, from, to);
        let cardsFrom = this.state.cardsInGrid[from];
        let newCardsFrom = cardsFrom.splice(index, 1);
        this.state.cardsInGrid[to].push(card);
        console.assert(newCardsFrom.cardName === card.cardName, "splice returned a different card than the one passed in");
        await card.setStateAsync({ location: to });
    }


    //
    //  marks the array of cards to move.
    //  returns only the one promise of the async method.
    markAndMoveMultipleCardsAsync = async (cards, from, to) =>
    {
        this.dumpCardState("before markAndMoveMultipleCardsAsync", [to, from]);
        let promises = [];
        let cardsFrom = this.state.cardsInGrid[from];
        let cardsTo = this.state.cardsInGrid[to];
        for (let i = cards.length - 1; i >= 0; i--)        
        {
            let card = cards[i];
            let index = cardsFrom.indexOf(card);
            cardsFrom.splice(index, 1);  // remove 
            cardsTo.push(card); 
            await card.setStateAsync({ location: to });            
            

        }
        promises = await this.redoGridLayoutAsync([to, from]);
        await Promise.all(promises);
        this.dumpCardState("after markAndMoveMultipleCardsAsync", [to, from]);
    }

    markAllCardsToLocation = async (location) =>
    {
        let promises = [];
        for (let card of this.state.cards)        
        {
            promises.push(card.setStateAsync({ location: location }));
        };

        for (let grid of allGridNames)
        {
            if (grid !== "deck")
            {
                for (let card of this.state.cardsInGrid[grid])
                {
                    this.state.cardsInGrid.deck.push(card);
                }
            }
        }

        await Promise.all(promises);

    }
    moveCountingCardsBackToOwner = async () =>
    {

        let cards = this.state.cardsInGrid["counted"];
        let promises = [];
        while (cards.length > 0)        
        {
            let card = cards[0];
            await this.markCardToMoveAsync(card, 0, "counted", card.state.owner)
        };

        this.flipAllCardsInGrid(["computer", "player"], "faceup");
        promises = await this.redoGridLayoutAsync(["player", "computer"]);
        await Promise.all(promises);
        await StaticHelpers.wait(0);

    }

    onTestMoveToCounted = async () =>
    {
        await this.markAndMoveMultipleCardsAsync(this.state.cardsInGrid["player"], "player", "counted");
    }

    redoGridLayout = (grids) =>
    {
        grids.map(grid => this.redoCardLayout(grid));
    }

    redoGridLayoutAsync = async (grids) => // grids is an array for grid names
    {
        let promises = [];
        let self = this;
        for (let grid of grids)
        {
            //util.log("grid: %s", grid);
            let cards = self.state.cardsInGrid[grid];
            for (let [index, card] of cards.entries())            
            {
                let pos = {};
                pos = self.getCardPosition(grid, index);
                promises.push(card.animateAsync(pos["xPos"], pos["yPos"], 360));
                this.setCardZIndex(card, 20 + index);
            };
        }

        return promises;
    }

}

export default DragDropContext(HTML5Backend)(CribbageGame);
//export default CribbageGame;
