import React, { Component } from 'react';

class DividendRow extends Component
{
    render()
    {
        return (
            <tr>
                <td>{this.props.name}</td>
                <td>{this.props.dividendYield}</td>
            </tr>
        );
    }
}

export default DividendRow;