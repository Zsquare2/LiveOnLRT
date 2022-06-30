import React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Content from "./components/content"
import './app.css'
import logo from "./logo-tv-hd2.svg"


const App = () => {

  const [content, setContent] = useState([])
  const [scrapeContent, setScrapeContent] = useState([])

  
  useEffect(() => {
    console.log('effect')
    axios
    .get('/api/lrt')
    .then(response => {
      console.log('promise fulifiled')
      setContent(response.data)
    })
    axios
    .get('/api/lrtgyvai')
    .then(response => {
      console.log('promise fulifiled')
      setScrapeContent(response.data)
      
  })}, []) 

  console.log("Content APP.JS ", content)


  return (
    <div className="App">
      <a href="https://www.lrt.lt">
        <img  class="logo__svg logo__svg--hd" alt="Logo" src={logo}/>
      </a>
      <h3 class="section-title">WHAT PROGRAM IS LIVE ON LRT TV IN TWO WAYS</h3>
      <p class="text-lead">NOW LIVE, fetching data from:
      <a href="https://www.lrt.lt/static/tvprog/tvprog.json">https://www.lrt.lt/static/tvprog/tvprog.json</a>
      </p>
      <Content content={content} />
      <p class="text-lead">NOW LIVE, fetching data from:
      <a href="https://www.lrt.lt/mediateka/tiesiogiai/lrt-televizija">https://www.lrt.lt/mediateka/tiesiogiai/lrt-televizija</a>
      </p>
      <Content content={scrapeContent} />
      <p className="content">Also saves fetched data to cache and updates it only after show ends.</p>
    </div>
  )
}

export default App;
