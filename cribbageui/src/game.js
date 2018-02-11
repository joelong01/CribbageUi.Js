/*eslint no-unused-vars: off*/
import React, { Component } from 'react';
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import Menu from 'react-burger-menu/lib/menus/slide'
import util from 'util';
import { setStateAsync } from './helper_functions';
import { Card } from './controls/card';
import "./game.css";
import "./menu.css";


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
            await this.closeMenuAsync();
            let url = 'http://localhost:8080/api/getrandomhand/true'; // computer's crib
            let res = await fetch(url);
            let jcards = await res.json();
            var cardList = this.buildCardObj(jcards, true);
            await setStateAsync(this, "cardDataObjs", cardList);

        }
        catch (e)
        {
            console.log(e);
        }

    }

    buildCardObj = (jcards, computerDeals) =>
    {
        var cardObj = {};
        var cardList = [];
        var dealerValue = computerDeals ? "computer" : "player";
        var nonDealerValue = !computerDeals ? "computer" : "player";

        var allCards = jcards["allCards"];

        for (let i = 0; i < 12; i++)
        {

            cardObj =
                {
                    "name": allCards[i],
                    "orientation": "facedown",
                    "location": "deck",
                    "owner": i % 2 === 0 ? nonDealerValue : dealerValue
                }

            cardList.push(cardObj);
        }

        cardObj =
            {
                "name": jcards["sharedCard"],
                "orientation": "facedown",
                "location": "deck",
                "owner": "shared"
            }

        cardList.push(cardObj);

        return cardList;
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

        let dealPromisis = await this.animateCardsToOwner(false, true);
        await Promise.all(dealPromisis);
        let flipPromises = [];
        flipPromises = await this.flipCards(["player"], "faceup");
        await Promise.all(flipPromises);

    }



    animateCardsToOwner = async (toDeck, spin) =>
    {
        var animationTopCoordinates = [];
        animationTopCoordinates["computer"] = 305;
        animationTopCoordinates["counted"] = 545;
        animationTopCoordinates["player"] = 785;
        animationTopCoordinates["deck"] = 550;
        let degrees = spin ? 360 : 0;
        var dealPromises = [];
        let cardWidthPlusGap = 157;
        let marginLeft = 236;
        let marginTopAdj = 3;
        this.state.cardDataObjs.forEach(async (card, index) =>
        {
            if (card.owner === "shared") return; // return is js' continue
            let cardUiElement = this.refs[card.name];
            util.log("%s and %s", cardUiElement.state.cardName, card.name);
            let xPos = cardWidthPlusGap * Math.floor(index / 2) + marginLeft;
            let yPos = animationTopCoordinates[card.owner] + marginTopAdj;
            if (toDeck)
            {
                xPos = 1022;
                yPos = 550;
                degrees = 0;
            }
            xPos = xPos - 1022; // this are in game.css as margin-left and margin-top
            yPos = yPos - 550;
            dealPromises.push(cardUiElement.updateCardInfoAsync(card.owner, card.owner));
            dealPromises.push(cardUiElement.animateAsync(xPos, yPos, degrees));


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
                    className={n}
                    key={n} />
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

export default CribbageGame;
