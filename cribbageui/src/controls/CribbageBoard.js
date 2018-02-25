// eslint-disable-next-line
import React, { Component } from 'react';





export class CribbageBoard extends React.Component
{
    render()
    {
        return (
            <img className="cribbageBoard" width={"250"} height={800}
                        alt={require("../images/Cards/error.png")}
                        srcSet={require("../images/board.svg")}                        
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


