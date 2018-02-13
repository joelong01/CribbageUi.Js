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
                cardDataObjs: [],
                sharedCardName: null
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
            await this.setAllCardsOwner("deck");
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
            await setStateAsync(this, "cardDataObjs", cardList);
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

        this.state.cardDataObjs.forEach(async (card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            await cardUiElement.setStateAsync("location", card.owner);
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
            await cardUiElement.updateCardInfoAsync("counted", this.state.cribOwner);
            
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
        this.state.cardDataObjs.forEach((card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            
            if (cardUiElement.state.location === "crib")
            {
                newLoc = this.state.cribOwner;
            }
            else
            {
                newLoc = "deck";
            }

           promises.push(cardUiElement.setStateAsync("location", newLoc ));                             
            
        });

        await Promise.all(promises);

        promises = [];
        promises = this.redoCardLayoutAsync("deck");
        await Promise.all(promises);

        promises = [];
        promises = this.redoCardLayoutAsync(this.state.cribOwner);
        await Promise.all(promises);

        this.flipCards([this.state.cribOwner], "faceup");



    }

    showSharedCard = () =>
    {
        this.state.cardDataObjs.forEach((card, index) =>
        {
           if (card.owner === "shared")
           {
                let cardUiElement = this.refs[card.name];
                cardUiElement.setState({orientation: "faceup"});
                let divName = "CARDDIV_" + cardUiElement.state.cardName;
                let div = this.refs[divName];
                div.style["z-index"]= 99;
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
                promises.push(cardUiElement.updateCardInfoAsync("crib", cardUiElement.state.owner));
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
        util.log ("redoCardLayoutAsync %s:", gridName );
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

    onClickCard = async (card) =>
    {

        let promises = [];
        promises.push(card.setStateAsync("location", "counted"));
        promises.push(card.setOrientationAsync("facedown"));
        await Promise.all(promises);

        promises = [];
        try
        {
            this.redoCardLayout("counted");
            this.redoCardLayout("player");
        }
        catch (e)
        {
            util.log("caught exception in callback: %s", e);
        }
    }

    setAllCardsOwner = async (owner) =>
    {
        let nPlayer = 0;
        let nComputer = 0;
        let dealPromises = [];
        await this.state.cardDataObjs.forEach( async (card, index) =>
        {
            let cardUiElement = this.refs[card.name];
            await cardUiElement.setStateAsync("location", owner);            
        });

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
