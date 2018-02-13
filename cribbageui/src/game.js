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
                cardDataObjs: []
            }


        this.renderMenu = this.renderMenu.bind(this);
        this.handleChooseCribPlayer = this.handleChooseCribPlayer.bind(this);
        this.toggleZoomWindow = this.toggleZoomWindow.bind(this);
        this.getNextCardXposition = this.getNextCardXposition.bind(this);
        this.closeMenuAndReset = this.closeMenuAndReset.bind(this);


    }

    componentDidMount() 
    {
        console.log("game mounted");
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
        console.log("tranform: ", t);
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

    handleChooseCribPlayer = (changeEvent) =>
    {
        this.burgerMenu.isOpen = false;
        changeEvent.preventDefault();
        let newOwner = changeEvent.target.value;
        this.setState({ cribOwner: newOwner }, () =>
        {


            var cmd = "translate(0px, ";

            if (newOwner === "Player") 
            {
                cmd += "485px)";
            }
            else
            {
                cmd += "0px)";
            }

            this.myCribDiv.style['transform'] = cmd;

        });
    }

    closeMenuAndReset = async () =>
    {
        console.log("closeMenuAndReset");
        await this.closeMenuAsync();
        return this.onReset();
    }



    onReset = async () =>
    {
        let flipPromises = [];
        flipPromises = await this.flipCards(["player", "computer", "shared"], "facedown");
        await Promise.all(flipPromises);


        let dealPromisis = await this.animateCardsToOwner(true, true);
        await Promise.all(dealPromisis);
    }


    onGetHandAsync = async () =>
    {
        try
        {
            await this.onReset();
            let url = 'http://localhost:8080/api/getrandomhand/true'; // computer's crib
            let res = await fetch(url);
            let jObj = await res.json();
            let cardList = jObj["RandomCards"];
            await setStateAsync(this, "cardDataObjs", cardList);
            await wait(500);
            await this.onDeal();
            await wait(500);
            cardList = jObj["ComputerCribCards"];
            await this.animateCribCards(cardList);
        }
        catch (e)
        {
            console.log(e);
        }

    }



    flipCards = async (names, orientation) =>
    {
        let flipPromises = [];
        this.state.cardDataObjs.forEach(async (card, index) =>
        {
            if (names.includes(card.owner))
            {
                let cardUiElement = this.refs[card.name];
                flipPromises.push(cardUiElement.setOrientationAsync(orientation));
            }
        });

        return flipPromises;
    }

    onDeal = async () =>
    {
        await this.closeMenuAsync();

        this.state.cardDataObjs.forEach(async (card, index) =>
        {
            let cardUiElement = this.refs[card.name];            
            await cardUiElement.setStateAsync("location", card.owner);     
            util.log("setStateAsync for %s returned. location: %s", cardUiElement.state.cardName, cardUiElement.state.location);
        });

        let computerPromises = this.redoCardLayout("computer");
        let playerPromises = this.redoCardLayout("player");
        let allP = [];
        for (let i = 0; i < computerPromises.length; i++)
        {
            allP.append(computerPromises[i]);
            allP.append(playerPromises[i]);
        }

        await Promise.all(allP);
        await wait(1000); /// ??? huh
        let flipPromises = [];
        flipPromises = await this.flipCards(["player"], "faceup");
        await Promise.all(flipPromises);

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
        await this.animateCribCards(cribcards);
    }
    animateCribCards = async (cribCards) =>
    {
        util.log("crib cards: %s", cribCards);
        let pos = {};
        let promises = [];
        cribCards.forEach(async (card, index) => 
        {
            card.location = "counted";
            card.owner = this.state.cribOwner;
            let cardUiElement = this.refs[card.name];
            await cardUiElement.updateCardInfoAsync("counted", this.state.cribOwner);
            pos = this.getCardPosition("counted", index);
            let p = cardUiElement.animateAsync(pos["xPos"], pos["yPos"], 360);
            promises.push(p);
        });

        await Promise.all(promises);
        await Promise.all(this.redoCardLayout("computer"));

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
                let pos = {};
                pos = this.getCardPosition("crib", 0);
                promises.push(cardUiElement.updateCardInfoAsync("crib", cardUiElement.state.owner));
                promises.push(cardUiElement.animateAsync(pos["xPos"], pos["yPos"], 360));
            }
        });

        await Promise.all(promises);
    }

    redoCardLayout = async (gridName) =>
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
                promises.push(cardUiElement.animateAsync(pos["xPos"], pos["yPos"], 360));
            }
        });

        return promises;

    }

    getCardPosition(gridName, index)
    {
        var animationTopCoordinates = [];
        animationTopCoordinates["computer"] = 308;
        animationTopCoordinates["crib"] = 308;
        animationTopCoordinates["counted"] = 550;
        animationTopCoordinates["player"] = 788;
        animationTopCoordinates["deck"] = 550;
        let cardWidthPlusGap = 157;
        let marginLeft = 236;
        if (gridName === "crib") marginLeft = 57;
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
        util.log("card clicked: %s", card.state.cardName);
        let promises = [];
        promises.push(card.setStateAsync("location", "counted"));
        promises.push(card.setOrientationAsync("facedown"));
        await Promise.all(promises);
        util.log("finished setting loc and orientation");
        promises = [];
        try
        {
            promises = this.redoCardLayout("counted");
            if (Array.isArray(promises) && promises.length > 0)
            {
                Promise.All(promises);
                util.log("finished counted update");
            }

            await Promise.all(this.redoCardLayout("player"));
            util.log("finished player update");
        }
        catch (e)
        {
            util.log("caught exception in callback: %s", e);
        }
    }

    animateCardsToOwner = async (toDeck, spin) =>
    {
        let nPlayer = 0;
        let nComputer = 0;
        let dealPromises = [];
        this.state.cardDataObjs.forEach(async (card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            let pos = {};
            let owner = card.owner;
            if (toDeck) owner = "deck";
            switch (owner)
            {
                case "shared":
                    return;
                case "player":
                    pos = this.getCardPosition("player", nPlayer);
                    nPlayer++;
                    break;
                case "computer":
                    pos = this.getCardPosition("computer", nComputer);
                    nComputer++;
                    break;
                case "crib":
                case "deck":
                    pos = this.getCardPosition(owner, 0);
                    break;
                default:
                    return;
            }



            dealPromises.push(cardUiElement.updateCardInfoAsync(card.owner, card.owner));
            dealPromises.push(cardUiElement.animateAsync(pos["xPos"], pos["yPos"], spin ? 360 : 0));


        });

        return dealPromises;
        //await Promise.all(dealPromises);
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
        await setStateAsync(this, "menuOpen", false);
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

                    </div>
                    <fieldset>
                        <legend> Crib Owner </legend>
                        <div className="Menu_radioButton">
                            <label>
                                <input type="radio" value="Computer"
                                    checked={this.state.cribOwner === 'Computer'}
                                    onChange={this.handleChooseCribPlayer} />
                                <span className="radioTextBlock">
                                    Computer
                        </span>
                            </label>
                        </div>
                        <div className="Menu_radioButton">
                            <label>
                                <input type="radio" value="Player"
                                    checked={this.state.cribOwner === 'Player'}
                                    onChange={this.handleChooseCribPlayer} />
                                <span className="radioTextBlock">
                                    Player
                        </span>
                            </label>
                        </div>
                    </fieldset>
                    <fieldset className="Menu_TestButtons"  >
                        <legend> Test Buttons </legend>
                        <button onClick={this.onReset.bind(this)} className="menu-item--large" >Reset</button>
                        <button onClick={this.onDeal.bind(this)} className="menu-item--large" ref="mnu_onGetHand">Deal</button>
                        <button onClick={this.onGetHandAsync.bind(this)} className="menu-item--large" ref="mnu_onGetHand">GetHandAsync</button>
                        <button onClick={this.getComputerCribCards.bind(this)} className="menu-item--large" ref="mnu_animateComputerCribCards">Crib Cards</button>
                        <button onClick={this.animateCardsToCrib.bind(this)} className="menu-item--large" ref="mnu_animateCardsToCrib">Move Cards to Crib</button>
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
                    cardClickedCallback={this.onClickCard}
                />
            </div>


        );
    }

    renderCards = (cardsList) =>
    {
        var cardUI = [];
        console.log("renderCards.  cardList: %s", cardsList);
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

                        <div className="DIV_crib" ref={myCribDiv => this.myCribDiv = myCribDiv}  >
                            {<CardGrid
                                cardNames={[]}
                                cribOwner={"Computer"}
                                orientation={"facedown"}
                                ref={cribGrid => this.cribGrid = cribGrid}
                            />}
                        </div>
                        <div className="DIV_computer" >
                            <CardGrid
                                cardCount={6} stacked={false} gridName={"computer"}
                                cardNames={[]}
                                orientation={"facedown"}
                                ref={computerGrid => this.computerGrid = computerGrid}
                            />
                        </div>
                        <div className="DIV_deck">
                            <CardGrid
                                cardCount={1} stacked={true} gridName={"deck"}
                                key={"deck"} cardNames={[]}
                                ref={deckGrid => this.deckGrid = deckGrid}
                            />
                        </div>
                        <div className="DIV_counted">
                            <CardGrid
                                cardCount={6} stacked={false} gridName={"counted"}
                                key={"counted"} cardNames={[]}
                                ref={countedGrid => this.countedGrid = countedGrid}
                                orientation={"faceup"}
                            />
                        </div>
                        <div className="DIV_player">
                            <CardGrid
                                cardCount={6} stacked={false} gridName={"player"}
                                key={"player"} cardNames={[]}
                                ref={playerGrid => this.playerGrid = playerGrid}
                                orientation={"faceup"}
                            />
                        </div>
                    </div>
                </main>
            </div >

        );
    }

}

export default DragDropContext(HTML5Backend)(CribbageGame);
//export default CribbageGame;
