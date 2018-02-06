
// eslint-disable-next-line
import React, { Component } from 'react';
import CribCanvas from './controls/crib'
import ControlCanvas from './controls/userinput'
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import cardFiles from './controls/deck';
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


    }

    draw()
    {
        /*  var div = this.refs.cribCardGrid;
         div.children[0].draw(); */

    }

    renderCardGrid(count, isStacked, n)
    {
        return (
            <CardGrid cardCount={count} stacked={isStacked} gridName={n} />
        );
    }

    renderCribbageBoard()
    {
        return (
            <CribbageBoard />
        );
    }

    componentDidMount()
    {
        window.addEventListener('resize', (value, e) => this.handleResize(this, false));
        this.draw();
    }

    componentWillUnmount()
    {
        window.removeEventListener('resize', this.handleResize);

    }

    handleResize(value, e)
    {
        this.setState(
            {
                screen:
                    {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        ratio: window.devicePixelRatio || 1,
                    }

            });


        this.draw();
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
            <table className="GameTable" bgcolor={"transparent"} >
                <tr valign={"top"} halign="center">
                    <td className="cribCell" ref={myCrib => this.myCrib = myCrib}>
                    {<CribCanvas ref="cribCanvas" cribOwner={"Computer"} cardName={cardFiles["KingOfSpades"]} />} 
                    </td>
                    <td className="computerCell" colSpan={1} >
                    {this.renderCardGrid(6,  false, 'computer')}
                    </td>
                    <td className="cribbageBoard" rowSpan={3} >
                    {<CribbageBoard />}
                    </td>
                </tr>
                <tr>
                    <td className="blank_2" />
                    <table colSpan={4}>
                        <tr valign="top" halign="left" className="secondRow">
                            <td className="countedCell" >
                            {this.renderCardGrid(5,  false, 'counted')}
                            </td>
                            <td className="deckCell">
                            {this.renderCardGrid(1,  true, 'deck')}
                            </td>
                        </tr>
                    </table>
                </tr>
                <tr valign={"top"} halign="center">
                    <td className="blank_3" />
                    <td className="playerCell">
                    {this.renderCardGrid(6,  false, 'player')} 
                    </td>                    
                </tr>
                <tr valign={"top"} halign="left">
                    <td className="control_cell" colSpan={3} >
                        <ControlCanvas cribOwnerChanged={this.cribOwnerChanged} cribOwner={"Computer"} />
                    </td>
                </tr>
            </table>

        );
    }

}

export default CribbageGame;
/*
<div className='cribbagePage'>
<div ref="cribCardGrid" className='firstCol'>
    {<CribCanvas ref="cribCanvas" cribOwner={"Computer"} cardName={cardFiles["KingOfSpades"]} clientHeight={681} width={127} height={681} />}                    
</div>
<div className='secondRow' ref='controlCanvas'>
    <ControlCanvas cribOwnerChanged={this.cribOwnerChanged} cribOwner={"Computer"} />
</div>
{ <div className='secondCol'>
    {this.renderCardGrid(6,  false, 'computer')}
    {this.renderCardGrid(5,  false, 'counted')}
    {this.renderCardGrid(1,  true, 'deck')}
    {this.renderCardGrid(6,  false, 'player')} 
</div>}
<div className='thirdCol'>
    {<CribbageBoard />}
</div>


</div>

*/