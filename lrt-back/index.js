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
  console.log("cashe scrape", cache.get('lrt-scrape'))
  console.log("cashe scrape end time", cache.get('show-ends-scrape'))
  console.log("cashe json end time ", cache.get('show-ends'))

  if(!cache.get('lrt-scrape') || checkTime(cache.get('show-ends-scrape')))
  
  {
    scrapeData().then((liveContent) => {
      let tempStartTime = cache.get('temp-start-time')
      let lastStartTime = cache.get('show-start-scrape')
      console.log("temp", tempStartTime)
      console.log("last", lastStartTime)

      if(!lastStartTime || (tempStartTime > lastStartTime)){

        console.log("fetching from, scrape")
        cache.set('lrt-scrape', liveContent[0].live_title)
        cache.set('show-ends-scrape', cache.get('show-ends'))
        cache.set('show-start-scrape', liveContent[0].live_start_time)
        response.json({title: liveContent[0].live_title})
      } else response.json({title: cache.get('lrt-scrape')})
  })} else {
    response.json({title: cache.get('lrt-scrape')})
  }
})

app.get('/api/lrt', (request, response) => {
  const url = "https://www.lrt.lt/static/tvprog/tvprog.json"
  console.log("cash scrape", cache.get('lrt-json'))

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
  cache.set('temp-start-time', lrtContent.live_start_time)
  console.log("scrapeaData liveContent", liveContent)

  return liveContent
}

const checkTime = (time) => {
  const requestTime = new Date()
  const programEndTime = time
  console.log(programEndTime)
  
  const formatedProgramEndTime = moment(programEndTime).format('YYYY/MM/DD/HH/mm/ss')
  
  const [year, month, day, hours, minutes, seconds] = formatedProgramEndTime.split('/')
  
  const eTime = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);

  console.log("REQUEST TIME", requestTime.getTime())
  console.log("END TIME", eTime.getTime())
  if(requestTime.getTime() > eTime.getTime()) {
    console.log("REQUEST TIME more thatn ENDTIME")
    return true
  } 
  return false
}


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})