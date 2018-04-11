/*eslint-disable no-unused-vars*/
import React, { Component } from 'react';
import util, { debuglog } from 'util';

export class StaticHelpers
{
    ////////////////////////////////////

    /***
     * get live runtime value of an element's css style
     *   http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element
     *     note: "styleName" is in CSS form (i.e. 'font-size', not 'fontSize').
     ***/
    static getStyle = function (e, styleName)
    {
        var styleValue = "";
        if (document.defaultView && document.defaultView.getComputedStyle)
        {
            styleValue = document.defaultView.getComputedStyle(e, "").getPropertyValue(styleName);
        }
        else if (e.currentStyle)
        {
            // eslint-disable-next-line
            styleName = styleName.replace(/\-(\w)/g, function (strMatch, p1)
            {
                return p1.toUpperCase();
            });
            styleValue = e.currentStyle[styleName];
        }
        return styleValue;
    }

    static wait = (ms) =>
    {
        //   util.log ("waiting for %s ms", ms);
        return new Promise((resolve, reject) =>
        {
            setTimeout(() =>
            {
                resolve();
            }, ms);
        });
    }

    static dumpObject(msg, obj)
    {
        console.log("%s: %o", msg, obj);
    }


    static animateAsync = async (divToAnimate, animationString, timeoutMs) =>
    {
        var myTimeout;
        divToAnimate.style['transition-duration'] = util.format("%sms", timeoutMs);
        return new Promise((resolve_func, reject_func) =>
        {
            var endAnimationAndResolvePromise = () =>
            {
                try
                {
                    //util.log("resolving animation: %s", animationString);
                    clearTimeout(myTimeout);
                    resolve_func();
                    divToAnimate.removeEventListener("transitionend", endAnimationAndResolvePromise);
                }
                catch (e)
                {
                    util.log("[%s] error in animate async: %s", animationString, e);
                    divToAnimate.removeEventListener("transitionend", endAnimationAndResolvePromise);
                    reject_func();
                }
            };

            divToAnimate.addEventListener("transitionend", endAnimationAndResolvePromise);


            try
            {
                if (animationString !== divToAnimate.style["transform"])
                {
                    divToAnimate.style["transform"] = animationString;
                }
                else
                {
                    divToAnimate.removeEventListener("transitionend", endAnimationAndResolvePromise);
                    resolve_func();
                }

                myTimeout = setTimeout(() =>
                {
                    // util.log ("%s:%s timed out after %sms", divToAnimate, animationString, timeoutMs);
                    endAnimationAndResolvePromise();

                }, timeoutMs);
            }
            catch (e)
            {
                util.log("error in animate async setting animation: %s", e);
            }

        });
    }

}

export default StaticHelpers;


