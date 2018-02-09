/*eslint-disable no-unused-vars*/
import React, { Component } from 'react';
import { Shape } from 'react-konva';

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
export const roundRect =  (ctx, x, y, width, height, radius, fill, stroke) =>
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

export function MyRoundRect(x, y, width, height, radius, fillColor, strokeColor)
{
    return(
    <Shape fill={fillColor} stroke={strokeColor} draggable
        sceneFunc = 
        {
            function (ctx)
            {
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
                
            }
        }
    />);
}


export const printCanvasInfo =  (hdc, name, left, top, width, height) =>
{
        hdc.font = "12px Courier New";
        hdc.fillStyle = 'rgba(255,255,255,1)';
        hdc.fillText(name + "[l,t,w,h]", 10, top+40);
        hdc.fillText("[" + left +"," + top + "," +  width + "," + height + "]" , 10, top+60);
     
};

// Return a promise which resolves after the specified interval
export function delay(interval)
{
    return new Promise(function (resolve)
    {
        setTimeout(resolve, interval);
    });
};

export default roundRect;

