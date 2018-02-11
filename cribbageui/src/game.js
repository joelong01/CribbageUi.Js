
// eslint-disable-next-line
import React, { Component } from 'react';
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import Menu from 'react-burger-menu/lib/menus/slide'
import util from 'util';
import { wait, setStateAsync } from './helper_functions';
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
                cards: []
            }

        this.showSettings = this.showSettings.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.handleChooseCribPlayer = this.handleChooseCribPlayer.bind(this);
        this.toggleZoomWindow = this.toggleZoomWindow.bind(this);
        this.getNextCardXposition = this.getNextCardXposition.bind(this);
        this.closeMenuAndReset = this.closeMenuAndReset.bind(this);


    }

    componentDidMount() 
    {
        window.addEventListener('resize', this.handleResize);
        this.setState({ cribOwner: this.props.cribOwner });
        this.setState({ menuOpen: this.props.menuOpen });
        this.setState({ cards: this.props.Cards });
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

    showSettings(event) 
    {
        event.preventDefault();
        this.playerGrid.setCards(['FiveOfDiamonds', 'FiveOfClubs', 'FiveOfSpades', 'JackOfHearts']);

    }

    toggleZoomWindow()
    {
        this.setState({ doZoomWindow: !this.state.doZoomWindow }, () =>
        {
            this.handleResize();
        });

    }

    renderCribbageBoard()
    {
        return (
            <CribbageBoard />
        );
    }

    handleChooseCribPlayer(changeEvent)
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
        await this.closeMenuAsync();
        await this.computerGrid.reset();
        await this.playerGrid.reset();
        await this.countedGrid.reset();
        await this.deckGrid.reset();
        return 500; //milliseconds
    }


    onGetHandAsync = async () =>
    {
        try
        {
            await this.closeMenuAsync();
            let url = 'http://localhost:8080/api/getrandomhand';
            let res = await fetch(url);
            let jcards = await res.json();
            util.log("RandomCards (json): %s", jcards);
            let cards = jcards["RandomCards"];
            util.log("RandomCards: %s", cards);
            await setStateAsync(this, "cards", cards);
            await this.deckGrid.setCardsAsync(cards);
            cards.forEach(async (card, index) =>
            {
                let cardObj = this.deckGrid.cardFromName(card);
                await cardObj.setOrientationAsync("facedown");
            });
        }
        catch (e)
        {
            console.log(e);
        }

    }


    onDeal = async () =>
    {
        await this.closeMenuAsync();
        var deckGrid = this.deckGrid;
        var cards = this.state.cards;
        var cardObjs = [];
        util.log("deckGrid.cards.count: %s", this.deckGrid.state.cardNames.length);
        var animationTopCoordinates = [];
        animationTopCoordinates["computer"] = 305;
        animationTopCoordinates["counted"] = 545;
        animationTopCoordinates["player"] = 785;
        let dealer = "player";
        let nonDealer = "computer";
        let sendCardTo = nonDealer;
        let promises = [];
        for (let i = 0; i < 12; i++)
        {
            let cardName = cards[i];
            let card = deckGrid.cardFromName(cardName);
            cardObjs.push(card);
            let xPos = 154 * Math.floor(i / 2) + 234;
            let yPos = animationTopCoordinates[sendCardTo];
            xPos = xPos - 1013;
            yPos = yPos - 545;
            util.log("%s:%s translate(%spx, %sps)", sendCardTo, cardName, xPos, yPos);
            promises.push(card.animateAsync(xPos, yPos, 360));
            await card.updateCardInfoAsync(sendCardTo, sendCardTo);
            if (sendCardTo === dealer)
                sendCardTo = nonDealer;
            else
                sendCardTo = dealer;

        }

        await Promise.all(promises);
        promises = [];
        
        cardObjs.forEach((card, index) =>
        {
            var or = "facedown";
            switch (card.state.owner)                
            {
                case "player":
                    or = "faceup";
                    break;
                case "computer":
                    or = "facedown";
                    break;
                case "shared":
                    or = "facedown";
                    break;
                default:
                    or= "facedown";
                    break;
            }

            promises.push (card.setOrientationAsync(or));
        });

        await Promise.all(promises);
        console.log("finished dealing");
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
                        <button onClick={this.showSettings.bind(this)} className="menu-item--large" href="">Change Cards</button>
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
                        <button onClick={this.onReset.bind(this)} className="menu-item--large" href="">Reset</button>
                        <button onClick={this.onDeal.bind(this)} className="menu-item--large" href="mnu_onGetHand">Deal</button>
                        <button onClick={this.onGetHandAsync.bind(this)} className="menu-item--large" href="mnu_onGetHand">GetHandAsync</button>
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

    render()
    {
        return (

            <div className="outer-container" width={300}>
                {this.renderMenu()}
                <main className="page-wrap">
                    <div className="LayoutRoot">
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
                                key={"deck"} cardNames={this.state.cards}
                                ref={deckGrid => this.deckGrid = deckGrid}
                            />
                        </div>
                        <div className="DIV_counted">
                            <CardGrid
                                cardCount={6} stacked={false} gridName={"counted"}
                                key={"counted"} cardNames={["AceOfSpades"]}
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
