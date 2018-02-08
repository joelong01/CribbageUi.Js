
// eslint-disable-next-line
import React, { Component } from 'react';
import CribCanvas from './controls/crib'
import ControlCanvas from './controls/userinput'
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import cardFiles from './controls/deck';
import Menu from 'react-burger-menu/lib/menus/slide'
import "./game.css";




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
            var crib = this.refs.cribCanvas;
            crib.cribOwnerChanged(this, ownerName);
        });

    }


    render()
    {
      return (
            <div className="outer-container" width={300}>
                <Menu className="burgerMenu" isOpen={false} 
                      pageWrapId={"page-wrap"} outerContainerId={"outer-container"} 
                      ref={burgerMenu => this.burgerMenu = burgerMenu}>
                    <button onClick={this.showSettings} className="menu-item--large" href="">Change Cards</button>
                </Menu>
                <main className="page-wrap">
                    <table className="GameTable" bgcolor={"transparent"} >
                        <tbody className="tableBody">
                            <tr className="first_row">
                                <td className="emptyColumn1" rowSpan={4} />
                                <td className="cribCell" ref={myCrib => this.myCrib = myCrib} rowSpan={3}>
                                    {<CribCanvas ref="cribCanvas" cribOwner={"Computer"} cardName={cardFiles["KingOfSpades"]} />}
                                </td>
                                <td className="computerCell" colSpan={0} >
                                    <CardGrid
                                        cardCount={6} stacked={false} gridName={"computer"}
                                        key={"computer"} cards={['AceOfClubs', 'TwoOfClubs', 'ThreeOfClubs', 'FourOfClubs', "FiveOfClubs", 'SixOfClubs']}
                                        ref={computerGrid => this.computerGrid = computerGrid}
                                    />
                                </td>
                                    <td className="cribbageBoard" rowSpan={3} >
                                    {<CribbageBoard />}
                                </td>
                            </tr>
                            <tr className="second_row">
                                <td className="countedCell">
                                    <div className="divCounted">
                                        <CardGrid
                                            cardCount={5} stacked={false} gridName={"counted"}
                                            key={"counted"} cards={['AceOfSpades', 'TwoOfSpades', 'ThreeOfSpades', "FourOfSpades", "FiveOfSpades"]}
                                            ref={countedGrid => this.countedGrid = countedGrid}
                                        />
                                    </div>                                    
                                    <div className="divDeck">
                                        <CardGrid
                                            cardCount={1} stacked={true} gridName={"deck"}
                                            key={"deck"} cards={['KingOfHearts']}
                                            ref={deck => this.deck = deck}
                                        />
                                    </div>                                                                       
                                </td>
                            </tr>
                            <tr className="third_row">
                                <td className="playerCell">
                                    <CardGrid
                                        cardCount={6} stacked={false} gridName={"player"}
                                        key={"player"} cards={['AceOfHearts', 'TwoOfHearts', 'ThreeOfHearts', 'FourOfHearts', 'FiveOfHearts', 'SixOfHearts']}
                                        ref={playerGrid => this.playerGrid = playerGrid}
                                    />
                                </td>
                            </tr>
                            <tr className="fourth_row">
                                <td className="control_cell" colSpan={3} >
                                    <ControlCanvas cribOwnerChanged={this.cribOwnerChanged} cribOwner={"Computer"} />
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
