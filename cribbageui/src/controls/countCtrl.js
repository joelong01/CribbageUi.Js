/*eslint no-unused-vars: off*/
import React, { Component } from 'react';
import util from 'util';
import "./countCtrl.css";
import { StaticHelpers } from '../helper_functions';

export class CountCtrl extends Component
{
    constructor(props)
    {
        super(props);
        this.state =
            {
                count: 0,
                visible: false,
                yTransform: 0

            }

    }



    componentDidMount() 
    {
        /* StaticHelpers.dumpObject("state: ", this.state);
        StaticHelpers.dumpObject("props: ", this.props);
 */
        let ytrans = this.props.isComputerCrib ? 0 : 481;

        this.setState(
            {
                count: this.props.count, visible: this.props.visible,
                yTransform: ytrans
            });

        let cmd = util.format("transform (0px, %spx)", ytrans);
        util.log("setting countCtrl transform to: %s", cmd);
        this.myCountCtrl.style['transform'] = cmd;
    }

    setXform = (cmd) =>
    {
        this.myCountCtrl.style['transform'] = cmd;
    }


    render()
    {
        /*  util.log ("Rendering Countctrl.  State: \n");
         for (let key of Object.keys(this.state))
         {
             util.log ("\t\tkey=%s state=%s props=%s\n", key, this.state[key], this.props[key] );
         }
        */



        return (

            <div className="CountCtrl_Root" ref={myCountCtrl => this.myCountCtrl = myCountCtrl}>
                <div className={this.props.visible ? 'myCountControl_fadeIn' : 'myCountControl_fadeOut'}>
                    <span>
                        {this.props.count.toString()}
                    </span>
                </div>
            </div>

        );
    }

}

export default CountCtrl;