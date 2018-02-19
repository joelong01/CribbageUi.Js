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
                visible: false
            }

    }



    componentDidMount() 
    {
        /* StaticHelpers.dumpObject("state: ", this.state);
        StaticHelpers.dumpObject("props: ", this.props);
 */

        this.setState({ count: this.props.count, visible: this.props.visible });

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


            <div className={this.props.visible ? 'myCountControl_fadeIn' : 'myCountControl_fadeOut'}
                ref={myCountCtrl => this.myCountCtrl = myCountCtrl}>
                <span>
                    {this.props.count.toString()}
                </span>
            </div>

        );
    }

}

export default CountCtrl;