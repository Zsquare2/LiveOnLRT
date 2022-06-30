const express = require('express')
const app = express()

app.use(express.json())
app.use(express.static('build'))

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { response } = require('express');
const fetch = require('node-fetch')

const cache = require('./models/cache')
const moment = require('moment');



app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.get('/api/lrtgyvai', (request, response) =>{
  if(!cache.get('lrt-scrape') || checkTime(cache.get('show-ends-scrape'))){
    scrapeData().then((liveContent) => {
    console.log("fetching from, scrape")
    cache.set('lrt-scrape', liveContent[0].live_title)
    cache.set('lrt-scrape-last-update', Date())
    cache.set('show-ends-scrape', cache.get('show-ends'))
    response.json({title: liveContent[0].live_title})
  })} else {
    response.json({title: cache.get('lrt-scrape')})
  }
})

app.get('/api/lrt', (request, response) => {
  const url = "https://www.lrt.lt/static/tvprog/tvprog.json"
  
  if(!cache.get('lrt-json') || checkTime(cache.get('show-ends')))
  {fetch(url)
    .then((response) => {
      console.log("fetching from json")
      return (response.json())
      })
    .then(data => {
      const liveData = data
      const liveTitle = liveData.tvprog.items[0].title

      cache.set('lrt-json', liveTitle)
      cache.set('show-ends', liveData.tvprog.items[0].stop )
      cache.set('lrt-json-last-update', Date())
      response.json({title : liveTitle})
    })}
    else{
      response.json({title: cache.get('lrt-json')})
    }
  })

async function scrapeData() {
  liveContent = []
  let response = await axios.get("https://www.lrt.lt/mediateka/tiesiogiai/lrt-televizija")
  const $ = cheerio.load(response.data)
  const lrtContent = { live_title: "", live_start_time: "" }
  live_title = $(".channel-program-item.is-playing .channel-program-item__title").children("a").text();
  lrtContent.live_start_time = $(".channel-program-item.is-playing .channel-program-item__time").text();
  lrtContent.live_title = live_title.trim();
  liveContent.push(lrtContent);

  return liveContent

}

const checkTime = (time) => {
  console.log('whats in the cache??', cache.get())
  const requestTime = new Date()
  const programEndTime = time
  
  const formatedProgramEndTime = moment(programEndTime).format('YYYY/MM/DD/HH/mm/ss')
  
  const [year, month, day, hours, minutes, seconds] = formatedProgramEndTime.split('/')
  
  const eTime = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);

  console.log("rTIme", requestTime.getTime())
  console.log("eTIme", eTime.getTime())
  if(requestTime.getTime() > eTime.getTime()) {
    console.log("rTime more thatn eTime")
    return true
  } 
  return false
}


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})