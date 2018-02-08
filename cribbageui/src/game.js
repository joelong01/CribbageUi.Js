
// eslint-disable-next-line
import React, { Component } from 'react';
import CribGrid from './controls/crib'
import ControlCanvas from './controls/userinput'
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import cardFiles from './controls/deck';
import Menu from 'react-burger-menu/lib/menus/slide'
import "./game.css";
import "./menu.css";




export class CribbageGame extends Component
{
    constructor()
    {
        super();
        this.state =
            {
                screen:
                    {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        ratio: window.devicePixelRatio || 1,

                    },
                CardGrids: [],
                cribOwner: "Computer",

            }
        this.cribOwnerChanged = this.cribOwnerChanged.bind(this);
        this.showSettings = this.showSettings.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.deal = this.deal.bind(this);
    }

    showSettings(event) 
    {
        event.preventDefault();
        this.playerGrid.setCards(['FiveOfDiamonds', 'FiveOfClubs', 'FiveOfSpades', 'JackOfHearts']);
        this.burgerMenu.isOpen = false;
    }



    renderCribbageBoard()
    {
        return (
            <CribbageBoard />
        );
    }


    cribOwnerChanged(e, ownerName)
    {
        this.setState({ cribOwner: ownerName }, () =>
        {
            this.cribGrid.cribOwnerChanged(this, ownerName);
        });

    }

    deal()
    {
        this.computerGrid.clear();
        this.playerGrid.clear();
        this.deckGrid.clear();
        this.countedGrid.clear();
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
                                    onChange={this.handleOptionChange} />
                                <span className="radioTextBlock">
                                    Computer
                        </span>
                            </label>
                        </div>
                        <div className="Menu_radioButton">
                            <label>
                                <input type="radio" value="Player"
                                    checked={this.state.cribOwner === 'Player'}
                                    onChange={this.handleOptionChange} />
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
                    <table className="GameTable" bgcolor={"transparent"} >
                        <tbody className="tableBody" rows={4} cols={4}>                            
                            <tr className="first_row">
                                <td className="burgerColumn" rowSpan={4}/>
                                <td className="emptySecondColumn" />
                                <td className="cribbageBoard"  >
                                    {<CribbageBoard />}
                                </td>
                                <td className="emptyFourthColumn" />
                            </tr>
                            <tr className="second_row">
                                <td className="cribCell" ref={myCrib => this.myCrib = myCrib} rowSpan={4} colSpan={1}>
                                    {<CribGrid
                                        cards={['TenOfClubs']}
                                        ref={cribGrid => this.cribGrid = cribGrid}
                                        cribOwner={"Computer"}
                                        orientation={"facedown"}
                                        cardName={cardFiles["KingOfSpades"]}
                                    />}
                                </td>
                                <td className="computerCell" >
                                    <CardGrid
                                        colSpan={3}
                                        cardCount={6} stacked={false} gridName={"computer"}
                                        key={"computer"}
                                        cards={['AceOfClubs', 'TwoOfClubs', 'ThreeOfClubs', 'FourOfClubs', "FiveOfClubs"]}
                                        orientation={"facedown"}
                                        ref={computerGrid => this.computerGrid = computerGrid}
                                    />
                                </td>

                                <td className="deckCell" rowSpan={3}>
                                    <CardGrid
                                        cardCount={1} stacked={true} gridName={"deck"}
                                        key={"deck"} cards={['KingOfHearts']}
                                        orientation={"faceup"}
                                        ref={deckGrid => this.deckGrid = deckGrid}
                                    />
                                </td>
                            </tr>
                            
                            <tr className="third_row">                                
                                <td className="countedCell" colSpan={1}>
                                    <CardGrid
                                        cardCount={6} stacked={false} gridName={"counted"}
                                        key={"counted"} cards={['AceOfSpades', 'TwoOfSpades', 'ThreeOfSpades', "FourOfSpades", "FiveOfSpades", 'SixOfSpades']}
                                        ref={countedGrid => this.countedGrid = countedGrid}
                                        orientation={"faceup"}
                                    />
                                </td>
                            </tr>
                            <tr className="fourth_row">
                                <td className="playerCell">
                                    <CardGrid
                                        cardCount={6} stacked={false} gridName={"player"}
                                        key={"player"} cards={['AceOfHearts', 'TwoOfHearts', 'ThreeOfHearts', 'FourOfHearts', 'FiveOfHearts', 'SixOfHearts']}
                                        ref={playerGrid => this.playerGrid = playerGrid}
                                        orientation={"faceup"}
                                    />
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </main>
            </div>
        );
    }

}

export default CribbageGame;
