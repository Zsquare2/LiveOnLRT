const express = require('express')
const app = express()

app.use(express.json())
app.use(express.static('build'))

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const fetch = require('node-fetch')

const cache = require('./models/cache')
const moment = require('moment');
cache.set('temp-start-time', '00:00')

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})


app.get('/api/lrtgyvai', (request, response) =>{  
  if(!cache.get('lrt-scrape') || checkTime(cache.get('show-ends-scrape'))){
    let delay = 1000
    
    const interval = setInterval(()=>{
      scrapeData().then((liveContent) => {
        delay = delay + delay
        console.log("SCRAPE trye again after ", delay)
        console.log("fetching from, scrape")

        cache.set('lrt-scrape', liveContent[0].live_title)
        cache.set('show-ends-scrape', cache.get('show-ends'))
        cache.set('show-start-scrape', liveContent[0].live_start_time)

        if(!checkTime(cache.get('show-ends-scrape'))){
          console.log("can return FROM SCRAPE")
          clearInterval(interval)
          response.json({title: cache.get('lrt-scrape')})
        }
      }) 
   },delay)
  }  else response.json({title: cache.get('lrt-json')})
})

app.get('/api/lrt', (request, response) => {
  const url = "https://www.lrt.lt/static/tvprog/tvprog.json"
  if(!cache.get('lrt-json') || checkTime(cache.get('show-ends'))) {
    let delay = 1000
    const interval = setInterval(()=>{
      delay = delay + delay

      console.log("tryes again after JSON", delay)

      {fetch(url)
        .then((response) => {

          console.log("fetching from json")

          return (response.json())
          })
        .then(data => {
          const liveData = data
          const liveTitle = liveData.tvprog.items[0].title
          
          console.log("end time from json", liveData.tvprog.items[0].stop )
          cache.set('lrt-json', liveTitle)
          cache.set('show-ends', liveData.tvprog.items[0].stop )
          cache.set('lrt-json-last-update', Date())
          
          if(!checkTime(cache.get('show-ends'))){
            console.log("can return JSON")
            clearInterval(interval)
            response.json({title: cache.get('lrt-json')})
          }
        })}
    },delay)} else response.json({title: cache.get('lrt-json')})
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
  if(requestTime > eTime) {
    console.log("REQUEST TIME more thatn ENDTIME")
    return true
  } 
  return false
}


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})