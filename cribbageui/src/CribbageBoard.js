
import React, { Component } from 'react';

class CribbageBoard extends React.Component
{
    constructor()
    {
        super();
        this.draw = this.draw.bind(this);
        this.left = 175 * 7 + 10;
        this.height = 125 * 3 + 10;

    }
    render()
    {
        let w = window.innerWidth - this.left;
        return (
            <canvas ref="boardCanvas">
                width={w}
                height= {this.height}
                left = {this.left};
            top = {0};
        </canvas>
        );
    }
    draw()
    {

        const canvas = this.refs.boardCanvas;
        const hdc = this.refs.boardCanvas.getContext('2d');
        hdc.fillStyle = 'rgba(0,0,255, 1)';
        hdc.fillRect(0, 0, canvas.width, canvas.height);
        //roundRect(hdc, 0, 0, canvas.width, this.height, 4, true, true);
        hdc.fillStyle = 'rgba(0, 64, 0, 1)';
        hdc.strokeStyle = 'rgba(255, 0, 0, 1)';
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
        this.draw();
    }
}

class CardGrid extends React.Component
{
    constructor(props)
    {
        super(props);
        this.cardCount = props.children[5];
        this.gridName = props.children[9];
        this.state = {
            left: props.children[1],
            top: props.children[3],
            cardCount: props.children[5],
            stacked: props.children[7],
            gridName: props.children[9]
        }

        this.draw = this.draw.bind(this);
        this.render = this.render.bind(this);
    }

    render() 
    {
        return (
            <canvas ref="cardCanvas">
                width={(this.state.cardCount * 125) + (2 * this.state.left)}
                height= {175 + 2 * this.state.top}
                left = {this.state.left}
                top = {this.state.top}
            </canvas>
        );
    }

    draw()
    {
        const canvas = this.refs.cardCanvas;
        const hdc = this.refs.cardCanvas.getContext('2d');
        canvas.width = this.state.cardCount * 125 + this.state.left * 2;
        canvas.height = 175 + this.state.top * 2;

        hdc.fillStyle = 'rgba(128,128,128, .5)';
        hdc.fillRect(0, 0, canvas.width, canvas.height);

        hdc.fillStyle = 'rgba(0, 64, 0, 1)';
        hdc.strokeStyle = 'rgba(255, 0, 0, 1)';

        roundRect(hdc, this.state.left, this.state.top, this.state.cardCount * 125, 175, 10, true, true);
        hdc.font = "18px sans-serif";
        hdc.fillStyle = 'rgba(255,255,255,1)';
        hdc.fillText(this.state.gridName, 20, 40);
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
        this.draw();
    }

}



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
                        CardGrids: []
                    }
            }

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

    render()
    {


        return (

            <div className='page'>
                <div className='row'>
                    <div ref="cribCardGrid" className='column'>
                        {this.renderCardGrid(1, 2, 2, true, 'crib1')}
                        {this.renderCardGrid(1, 2, 2, true, 'crib2')}
                        {this.renderCardGrid(1, 2, 2, true, 'crib3')}
                    </div>
                    <div className='row'>
                        <div className='row'>
                            {this.renderCardGrid(6, 2, 2, true, 'computer')}
                            {this.renderCardGrid(5, 2, 2, true, 'counted')}
                            {this.renderCardGrid(1, 2, 2, true, 'deck')}
                            {this.renderCardGrid(6, 2, 0, true, 'player')}
                        </div>
                    </div>
                    <div class='row'>
                        {<CribbageBoard />}
                    </div>
                </div>
            </div>
        );
    }




}


/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
 * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke)
{
    if (typeof stroke === "undefined")
    {
        stroke = true;
    }
    if (typeof radius === "undefined")
    {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke)
    {
        ctx.stroke();
    }
    if (fill)
    {
        ctx.fill();
    }
}

export default CribbageGame;

/* draw()
{


    const canvas = this.refs.LayoutRoot;
    const hdc = this.refs.LayoutRoot.getContext('2d');
    canvas.width = this.state.screen.width - 1;
    canvas.height = this.state.screen.height - 4;


    hdc.save();

    hdc.scale(this.state.screen.ratio, this.state.screen.ratio);
    hdc.fillStyle = 'rgba(0, 64, 0, 0.5)';
    hdc.fillRect(0, 0, canvas.width, canvas.height);


    //   console.log("[" + this.state.screen.width.toString() + "," + this.state.screen.height.toString() + "]");

    hdc.fillStyle = 'rgba(64, 0, 0, 1)';
    roundRect(hdc, 20, 20, canvas.width - 40, canvas.height - 40, 10);



            hdc.beginPath();
            hdc.lineWidth = "10";
            hdc.strokeStyle = "blue";
            hdc.rect(50, 50, 150, 80);
            hdc.stroke();

            roundRect(hdc, 30, 30, 125, 175, 5, true, true);    // crib
            roundRect(hdc, 160, 30, 600, 175, 5, true, true);   // computer
            roundRect(hdc, 160, 210, 600, 175, 5, true, true);  // counted
            roundRect(hdc, 30, 210, 125, 175, 5, true, true);  // shared
            roundRect(hdc, 160, 390, 600, 175, 5, true, true);  // player


    roundRect(hdc, 30, 575, 735, 350, 5, true, true);  // control / messaging surface
    roundRect(hdc, 780, 30, canvas.width - 820, 895, 5, true, true);  // BOARD


    var img = new Image();
    img.onload = function ()
    {
                    hdc.drawImage(img, 0, 0);
                }
    img.src = "../public/deckOfCards.svg";

     var crib = this.refs.cribCardGrid;

}*/
