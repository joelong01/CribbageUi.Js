
// eslint-disable-next-line
import React, { Component } from 'react';
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import Menu from 'react-burger-menu/lib/menus/slide'
import util from 'util';
import "./game.css";
import "./menu.css";



export class CribbageGame extends Component
{
    constructor(props)
    {
        super(props);
        this.state =
            {
                cribOwner: "computer",
                doZoomWindow: true
            }
        
        this.showSettings = this.showSettings.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.deal = this.deal.bind(this);
        this.handleChooseCribPlayer = this.handleChooseCribPlayer.bind(this);
        this.toggleZoomWindow = this.toggleZoomWindow.bind(this);
        this.getNextCardXposition = this.getNextCardXposition.bind(this);
        

    }

    componentDidMount() 
    {
        window.addEventListener('resize', this.handleResize);

        this.setState({ cribOwner: this.props.cribOwner });
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
        this.setState({doZoomWindow: !this.state.doZoomWindow}, ()=>
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

    deal()
    {
        this.burgerMenu.isOpen = false;
        this.computerGrid.clear();
        this.playerGrid.clear();    
        this.countedGrid.clear();
        var animationTopCoordinates = [];
        animationTopCoordinates["computer"] = 305;
        animationTopCoordinates["player"] = 544;
        animationTopCoordinates["counted"] = 785;
        let dealer = "player";
        let nonDealer = "computer";

        for (let i=0; i<12; i++)
        {
            let cardName = this.deckGrid.state.cardNames[0];
            let card = this.deckGrid.cardFromName(cardName);
            let xPos = this.getNextCardXposition(nonDealer, 154);
            let yPos = animationTopCoordinates[dealer];
            xPos = 1031 - xPos;
            yPos = 545 - yPos;
            //let cmd = util.format("translate(%spx, %sps)", xPos, yPos);
            card.style["zindex"] = "2";
            card.translate(-xPos, -yPos);
            
        }
        
    }

    getNextCardXposition(grid, width)
    {
        let count = 0;
        if (grid === "computer")
        {
            count = this.computerGrid.state.cardNames.length;
        }
        else if (grid === "player")
        {
            count = this.playerGrid.state.cardNames.length;
        }
        else
        {
            count = 0;
        }

        return count * width + 230;
    }

    renderMenu()
    {
        /* css for this is in ./menu.css */

        return (
            <Menu className="burgerMenu" isOpen={false}
                pageWrapId={"page-wrap"} outerContainerId={"outer-container"}
                ref={burgerMenu => this.burgerMenu = burgerMenu}>
                <div className="Menu_LayoutRoot">
                    <div className="Menu_buttonDiv">
                        <button onClick={this.showSettings} className="menu-item--large" href="">Change Cards</button>
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

                        <button onClick={this.deal} className="menu-item--large" href="">Deal</button>
                    </fieldset>
                    <fieldset>
                        <legend> Options </legend>
                        <label>
                            <input type="checkbox" checked={this.state.doZoomWindow} onChange={this.toggleZoomWindow}/>
                            Zoom Window
                        </label>
                    </fieldset>
                </div>
            </Menu>
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
                                key={"deck"} cardNames={['KingOfHearts', 'AceOfClubs', 'TwoOfClubs', 'ThreeOfClubs', 'FourOfClubs', "FiveOfClubs", "SixOfClubs",
                                                     'ThreeOfSpades', "FourOfSpades", "FiveOfSpades", 'SixOfSpades', 'FiveOfHearts', 'SixOfHearts']}
                                orientation={"facedown"}
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
                                key={"player"} cardNames={['AceOfHearts', 'TwoOfHearts', 'ThreeOfHearts', 'FourOfHearts', 'FiveOfHearts', 'SixOfHearts']}
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
