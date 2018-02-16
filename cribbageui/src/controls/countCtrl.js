//@ts-check
import React, { Component } from 'react';
import util from 'util';
import "./countCtrl.css";

export class CountCtrl extends Component
{
    constructor(props)
    {
        super(props);
        this.state =
            {
                count: 0
            }

    }

    componentDidMount() 
    {
        this.setState({ count: this.props.count });
    }

    render()
    {

        return (


            <div className="LayoutRoot_CountCtrl">
                <span>
                    {this.state.count}
                </span>
            </div>

        );
    }

}

export default CountCtrl;