
// eslint-disable-next-line
import React, { Component } from 'react';
import CribCanvas from './controls/crib'
import ControlCanvas from './controls/userinput'
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';
import cardFiles from './controls/deck';



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
        this.setState({ cribOwner: ownerName }, () => {
            var crib = this.refs.cribCanvas;
            crib.cribOwnerChanged(this, ownerName);
        });
        
    }

  
    render()
    {



        return (

            <div className='cribbagePage'>
                <div ref="cribCardGrid" className='firstCol'>
                    {<CribCanvas ref="cribCanvas" cribOwner={"Computer"} cardName={cardFiles["KingOfSpades"]} clientHeight={681} width={127} height={681} />}                    
                </div>
                <div className='secondRow' ref='controlCanvas'>
                    <ControlCanvas cribOwnerChanged={this.cribOwnerChanged} cribOwner={"Computer"} />
                </div>
               {/*  <div className='secondCol'>
                    {this.renderCardGrid(6,  false, 'computer')}
                    {this.renderCardGrid(5,  false, 'counted')}
                    {this.renderCardGrid(1,  true, 'deck')}
                    {this.renderCardGrid(6,  false, 'player')}
                </div> */}
                <div className='thirdCol'>
                    {<CribbageBoard />}
                </div>


            </div>
        );
    }

}

export default CribbageGame;