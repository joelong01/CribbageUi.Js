
// eslint-disable-next-line
import React, { Component } from 'react';
import CribCanvas from './controls/crib'

import ControlCanvas from './controls/userinput'
import CardGrid from './controls/cardGrid';
import CribbageBoard from './controls/CribbageBoard';



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

    renderCardGrid(count, l, t, isStacked, n)
    {
        return (
            <CardGrid>
                left:{l}
                top:{t}
                cardCount:{count}
                stacked:{isStacked}
                gridName:{n}
            </CardGrid>
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
                    {<CribCanvas ref="cribCanvas" cribOwner={"Computer"} clientHeight={577} />}                    
                </div>
                <div className='secondRow' ref='controlCanvas'>
                    <ControlCanvas cribOwnerChanged={this.cribOwnerChanged} cribOwner={"Computer"} />
                </div>
                <div className='secondCol'>
                    {this.renderCardGrid(6, 2, 2, true, 'computer')}
                    {this.renderCardGrid(5, 2, 2, true, 'counted')}
                    {this.renderCardGrid(1, 2, 2, true, 'deck')}
                    {this.renderCardGrid(6, 2, 0, true, 'player')}
                </div>
                <div className='thirdCol'>
                    {<CribbageBoard />}
                </div>


            </div>
        );
    }

}

export default CribbageGame;