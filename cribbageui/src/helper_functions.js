/*eslint-disable no-unused-vars*/
import React, { Component } from 'react';
import util, { debuglog } from 'util';

export class StaticHelpers
{

    static wait = (ms) =>
    {
        util.log ("waiting for %s ms", ms);
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


    static animateAsync =  async (divToAnimate, animationString, timeoutMs) =>
    {
        
        var myTimeout;
        return new Promise((resolve_func, reject_func) =>
        {
            var endAnimationAndResolvePromise = () =>
            {
                try
                {

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


