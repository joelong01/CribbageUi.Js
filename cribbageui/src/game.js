/*eslint no-unused-vars: off*/
import React, { Component } from 'react';
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import Menu from 'react-burger-menu/lib/menus/slide'
import util from 'util';
import { setStateAsync, wait } from './helper_functions';
import { Card } from './controls/card';
import "./game.css";
import "./menu.css";

import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import DragDropContextProvider from 'react-dnd/lib/DragDropContextProvider';
import { Rect } from 'react-konva';



export class CribbageGame extends Component
{
    constructor(props)
    {
        super(props);
        this.state =
            {
                cribOwner: "computer", // aka "dealer"
                doZoomWindow: false,
                menuOpen: false,
                cardDataObjs: [],
                sharedCard: null,
                gameState: "starting",
                waitForUserCallback: null,
                hisNibs: false,
                currentCount: 0,
                userFrontScore: 0,
                userBackScore: 0,
                computerFrontScore: 0,
                computerBackScore: 0



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
        await this.setGameState("Start");
        await this.doGameLoop();
    }

    doGameLoop = async () =>
    {
        var PlayerTurn = "";
        var Dealer = this.state.cribOwner;
        var CurrentCount = 0;
        let nextState = "";
        while (true)
        {

            switch (this.state.gameState)
            {
                case "Start":
                    //
                    //  need a way to pick the dealer
                    await this.setGameState("Deal");
                    break;
                case "Deal":
                    PlayerTurn = (Dealer === "computer") ? "player" : "computer";
                    Dealer = this.toggleDealer(Dealer);
                    CurrentCount = 0;
                    await this.onGetHandAsync();
                    await this.setGameState("PlayerSelectsCribCards");
                    break;
                case "PlayerSelectsCribCards":
                    await this.waitForUserCribCards();
                    await this.setGameState("GiveToCrib");
                    break;
                case "GiveToCrib":
                    await this.animateCardsToCrib();
                    nextState = (this.state.cribOwner === "computer") ? "playerCount" : "computerCount";
                    if (this.state.hisNibs)
                    {
                        this.addScore(Dealer, 1);
                    }
                    await this.setGameState("Count");
                    break;
                case "Count":
                    await this.setStateAsync({ currentCount: 0 });
                    nextState = (Dealer === "player") ? "CountComputer" : "CountPlayer";
                    await this.setGameState(nextState);
                    break;
                case "CountPlayer":
                    {
                        let canPlay = await this.canPlay();
                        PlayerTurn = "player";
                        await this.setGameState("CountComputer");
                        if (canPlay.playerCanPlay)
                        {
                            let score = await this.doCountForPlayer();
                            this.addScore("player", score);
                        }
                        break;
                    }
                case "CountComputer":
                    let canPlay = await this.canPlay();
                    break;

                default:
                    return;
            }
        }
    }

    doCountForPlayer = async () =>
    {
        let countedCard = await this.getCountCard();
        let count = this.state.currentCount + countedCard.state.value;

        let url = "http://localhost:8080/api/scorecountedcards/";
        url += countedCard.cardName;
        url += "/";
        url += count;

        let countedCards = [];
        this.state.cardDataObjs.forEach((dataCard) =>
        {
            let card = this.refs[dataCard.name];
            if (card.state.location === "counted" && card.state.orientation === "faceup")
            {
                if (countedCard.state.cardName !== card.state.cardName)
                {
                    countedCards.push(card);
                }
            }

        });

        countedCards.sort((card1, card2) =>
        {
            return card2.state.countIndex - card1.state.countIndex;
        });

        countedCards.forEach((card) =>
        {
            url += "/";
            url += card.state.cardName;
        });

        let res = await fetch(url);
        let jObj = await res.json();
        let score = JSON.parseInt(jObj["Score"]);
        return score;
    }

    getCountCard = async () =>
    {
        return new Promise(async (resolve_func, reject_func) =>
        {

            var endUserPickCards = (card) =>
            {
                resolve_func(card);
            }

            await setStateAsync(this, "waitForUserCallback", endUserPickCards);
        });

    }

    canPlay = async () =>
    {
        let retObj = { playerCanPlay: false, computerCanPlay: false };
        await this.state.cardDataObjs.forEach(async (dataCard) =>
        {
            let card = this.refs[dataCard.name];
            if (card.state.owner === "computer")
            {
                if (card.state.value + this.state.currentCount < 31)
                {
                    await card.setStateAsync({ countable: true });
                    retObj.computerCanPlay = true;
                }
                else
                {
                    await card.setStateAsync({ countable: true });
                }
            }
            if (card.state.owner === "player")
            {
                if (card.state.value + this.state.currentCount < 31)
                {
                    await card.setStateAsync({ countable: true });
                    retObj.playerCanPlay = true;
                }
                else
                {
                    await card.setStateAsync({ countable: true });
                }
            }


        });
    }

    addScore = async (who, count) =>
    {
        if (who === "computer")
        {
            let frontScore = this.state.computerFrontScore;
            let backScore = this.state.computerBackScore;
            await this.setStateAsync({ computerBackScore: frontScore });
            await this.setStateAsync({ computerFrontScore: (frontScore + count) });
        }
        else
        {
            let frontScore = this.state.playerFrontScore;
            let backScore = this.state.playerBackScore;
            await this.setStateAsync({ playerBackScore: frontScore });
            await this.setStateAsync({ computeplayerFrontScore: (frontScore + count) });
        }
    }
    setStateAsync = async (newState) =>
    {

        return new Promise((resolve, reject) =>
        {
            this.setState(newState, () => 
            {
                resolve();
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

            await setStateAsync(this, "waitForUserCallback", endUserPickCards);
        });

    }


    setGameState = (state) =>
    {
        return setStateAsync(this, "gameState", state);
    }

    handleChooseCribPlayer = async (event) =>
    {
        event.persist();
        event.preventDefault();
        await this.closeMenuAsync();

        let newOwner = event.target.value;
        this.setState({ cribOwner: newOwner }, async () =>
        {

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



        });
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
            this.flipCards(["player", "computer", "shared", "counted"], "facedown");
            await this.setAllCardsLocation("deck");
            this.redoCardLayout("deck");

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

            let url = 'http://localhost:8080/api/getrandomhand/true'; // computer's crib

            let res = await fetch(url);
            let jObj = await res.json();
            let cardList = jObj["RandomCards"];
            await setStateAsync(this, "sharedCard", jObj["SharedCard"]);
            await setStateAsync(this, "cardDataObjs", cardList);
            await setStateAsync(this, "hisNibs", jObj["HisNibs"]);
            await wait(0);
            await this.onDeal();
            await wait(0);
            cardList = jObj["ComputerCribCards"];
            await this.animateComputerCribCards(cardList);
        }
        catch (error)
        {
            util.log("error thrown in GetHandAsync %s", error.message);
        }

    }



    flipCards = (names, orientation) =>
    {

        this.state.cardDataObjs.forEach((card, index) =>
        {
            if (names.includes(card.owner))
            {
                let cardUiElement = this.refs[card.name];
                cardUiElement.setState({ orientation: orientation });
            }
        });

    }

    onDeal = async () =>
    {
        await this.closeMenuAsync();

        await this.state.cardDataObjs.forEach(async (card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            if (card.owner === "shared") return;

            await cardUiElement.setStateAsync({ location: card.owner });
        });

        let computerPromises = this.redoCardLayoutAsync("computer");
        let playerPromises = this.redoCardLayoutAsync("player");
        let allP = [];
        for (let i = 0; i < computerPromises.length; i++)
        {
            allP.push(computerPromises[i]);
            allP.push(playerPromises[i]);
        }

        await Promise.all(allP);
        await wait(5); /// ??? huh


        this.flipCards(["player"], "faceup");



    }

    getComputerCribCards = async () =>
    {
        await this.closeMenuAsync();
        let url = 'http://localhost:8080/api/getcribcards/'; // computer's crib
        this.state.cardDataObjs.forEach((card, index) =>
        {
            if (card.owner === "computer")
            {
                url += card.name;
                url += ",";
            }
        });

        url = url.slice(0, -1); // take off the last ","
        if (this.state.cribOwner === "computer")
            url += "/true";
        else
            url += "/false";

        let res = await fetch(url);
        let cribcards = await res.json();
        await this.animateComputerCribCards(cribcards);
    }
    animateComputerCribCards = async (cribCards) =>
    {

        let pos = {};

        await cribCards.forEach(async (card, index) => 
        {
            let cardUiElement = this.refs[card.name];
            await cardUiElement.setStateAsync({ location: "counted", owner: this.state.cribOwner });

        });

        this.redoCardLayout("counted");
        this.redoCardLayout("computer");

    }

    onAnimateCribCardsToOwner = async () =>
    {
        await this.animateCribCardsToOwner();
    }

    animateCribCardsToOwner = async () =>
    {
        this.closeMenuAsync();
        this.flipCards(["player", "computer"], "facedown");
        let promises = [];
        let newLoc = "";
        let orientation = "";
        this.state.cardDataObjs.forEach((card, index) =>
        {
            let cardUiElement = this.refs[card.name];

            if (cardUiElement.state.location === "crib")
            {
                newLoc = this.state.cribOwner;
                orientation = "faceup";
            }
            else
            {
                if (cardUiElement.state.owner === "shared")
                {
                    orientation = "faceup";
                    newLoc = "deck";
                }
                else
                {

                    orientation = "facedown";
                    newLoc = "deck";
                }
            }


            promises.push(cardUiElement.setStateAsync({ location: newLoc, orientation: orientation }));

        });

        await Promise.all(promises);

        this.doFullLayout();


    }

    dumpCardState = (msg) => 
    {
        util.log("msg: %s", msg);
        this.state.cardDataObjs.forEach((card, index) =>
        {
            let c = this.refs[card.name];
            util.log("\t [%s] owner:%s location:%s orientation:%s", c.state.cardName, c.state.owner, c.state.location, c.state.orientation);
        });
    }

    doFullLayout = () =>
    {
        let grids = ["deck", "computer", "counted", "crib", "player"];
        grids.forEach((grid) =>
        {
            this.redoCardLayout(grid);

        });
    }

    showSharedCard = () =>
    {
        this.state.cardDataObjs.forEach((card, index) =>
        {
            if (card.owner === "shared")
            {
                let cardUiElement = this.refs[card.name];
                cardUiElement.setState({ orientation: "faceup" });
                let divName = "CARDDIV_" + cardUiElement.state.cardName;
                let div = this.refs[divName];
                div.style["z-index"] = 99;
            }
        });

    }

    animateCardsToCrib = async () =>
    {
        await this.closeMenuAsync();
        let promises = [];
        this.state.cardDataObjs.forEach(async (card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            if (cardUiElement.state.location === "counted")
            {
                promises.push(cardUiElement.setStateAsync({
                    location: "crib",
                    owner: cardUiElement.state.owner,
                    orientation: "facedown"
                }));
            }
        });

        await Promise.all(promises);
        await Promise.all(this.redoCardLayoutAsync("crib"));

        this.showSharedCard();
    }



    redoCardLayout = (gridName) =>
    {
        let cardCount = 0;
        let promises = [];
        this.state.cardDataObjs.forEach((card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            if (cardUiElement.state.location === gridName)
            {
                let pos = {};
                pos = this.getCardPosition(gridName, cardCount++);
                cardUiElement.animate(pos["xPos"], pos["yPos"], 360);
            }
        });

    }

    redoCardLayoutAsync = (gridName) =>
    {
        util.log("redoCardLayoutAsync %s:", gridName);
        let cardCount = 0;
        let promises = [];

        this.state.cardDataObjs.forEach((card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            if (cardUiElement.state.location === gridName)
            {
                let pos = {};
                pos = this.getCardPosition(gridName, cardCount++);
                promises.push(cardUiElement.animateAsync(pos["xPos"], pos["yPos"], (gridName === "deck") ? 0 : 360));
            }
        });

        return promises;

    }

    getCardPosition(gridName, index)
    {
        var animationTopCoordinates = [];
        animationTopCoordinates["computer"] = 308;
        animationTopCoordinates["counted"] = 550;
        animationTopCoordinates["player"] = 788;
        animationTopCoordinates["deck"] = 550;

        //        util.log("inside getCardPosition. cribOwner: %s", this.state.cribOwner);
        if (this.state.cribOwner === "player")
        {
            animationTopCoordinates["crib"] = animationTopCoordinates["player"];

        }
        else
        {
            animationTopCoordinates["crib"] = animationTopCoordinates["computer"];
        }

        let cardWidthPlusGap = 157;
        let marginLeft = 236;
        if (gridName === "crib")
        {
            marginLeft = 57;
            index = 0;
        }

        let xPos = cardWidthPlusGap * index + marginLeft;
        let yPos = animationTopCoordinates[gridName]
        util.log("yPos is %s", yPos);

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

    cardsAtLocation = (location) =>
    {
        let count = 0;
        this.state.cardDataObjs.forEach((dataObj) =>
        {
            let card = this.refs[dataObj.name];
            if (card.state.location === location)
                count++;

        });

        return count;
    }

    animateCardToCounted = async (card, orientation, owner) =>
    {
        await card.setStateAsync(
            {
                location: "counted",
                orientation: orientation,
                owner: owner
            });


        try
        {
            this.redoCardLayout("counted");
            this.redoCardLayout("player");
            this.redoCardLayout("computer");
        }
        catch (e)
        {
            util.log("caught exception in callback: %s", e);
        }
    }

    onClickCard = async (card) =>
    {

        if (this.state.gameState === "PlayerSelectsCribCards")
        {
            await this.animateCardToCounted(card, "faceup", this.state.cribOwner);

            if (this.cardsAtLocation("counted") === 4)
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
            let index = card.state.countIndex;
            index++;
            await card.setGameState({ countIndex: index });
            await this.animateCardToCounted(card, "faceup", "player");
            this.state.waitForUserCallback(card);

        }
    }

    setAllCardsLocation = async (location) =>
    {
        let promises = [];
        await this.state.cardDataObjs.forEach(async (card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            promises.push(cardUiElement.setStateAsync({ location: location }));
        });

        await Promise.all(promises);

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
        console.log("starting to close window");
        await setStateAsync(this, "menuOpen", false);
        console.log("closed window");
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

    renderOneCard = (card) =>
    {
        let n = "main_" + card.name;
        let divName = "CARDDIV_" + card.name;

        return (

            <div className={divName} key={divName} ref={divName}>
                <Card ref={card.name}
                    cardName={card.name}
                    orientation={card.orientation}
                    owner={card.owner}
                    location={"deck"}
                    className={n}
                    value={card.value}
                    cardClickedCallback={this.onClickCard}
                />
            </div>


        );
    }

    renderCards = (cardsList) =>
    {
        var cardUI = [];
        cardsList.forEach((card) =>
        {
            cardUI.push(this.renderOneCard(card));

        });
        return cardUI;
    }

    render()
    {


        var cardsList = this.renderCards(this.state.cardDataObjs);

        return (
            <div className="outer-container" width={340}>
                {this.renderMenu()}
                <main className="page-wrap">
                    <div className="LayoutRoot">
                        {cardsList}
                        <div className="DIV_cribbageBoard">
                            {<CribbageBoard />}
                        </div>
                        <div className="DIV_crib" ref={myCribDiv => this.myCribDiv = myCribDiv} />
                        <div className="DIV_computer" />
                        <div className="DIV_deck" />
                        <div className="DIV_counted" />
                        <div className="DIV_player" />
                    </div>
                </main>
            </div >

        );
    }

}

export default DragDropContext(HTML5Backend)(CribbageGame);
//export default CribbageGame;
