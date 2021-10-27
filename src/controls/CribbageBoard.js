// eslint-disable-next-line
import React, { Component } from 'react';
import Board from '../images/board.svg'




export class CribbageBoard extends React.Component
{
    render()
    {
        return (
            <img className="cribbageBoard" width={"250"} height={800}
                        alt="../images/Cards/error.png"
                        srcSet={Board}
                        ref={myBoard => this.myBoard = myBoard}

                    />
        );
    }
    componentDidMount()
    {
      
    }

    componentWillUnmount()
    {
      

    }

    
}


export default  CribbageBoard;


