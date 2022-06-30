import React from "react"
import logo from "../logo-tv-hd.svg"
import "../app.css"

const Content = ({content}) =>{
    const liveContent = content
    if(liveContent){
    const liveTitle = liveContent.title

    console.log("live title", liveTitle)
       return (
        <div class="box">
            <a href="https://www.lrt.lt/mediateka/tiesiogiai/lrt-televizija">
                <img  class="logo__svg logo__svg--hd" alt="Logo" src={logo}/>
            </a>
            <span className="text">Live:  {liveTitle}</span>
        </div>
        
    )
       }
}
export default Content