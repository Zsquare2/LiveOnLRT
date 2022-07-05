const express = require('express')
const app = express()

app.use(express.json())
app.use(express.static('build'))

const axios = require("axios");
const cheerio = require("cheerio");
const fetch = require('node-fetch')

const cache = require('./models/cache')
const moment = require('moment');

cache.set('temp-start-time', '00:00')
cache.set('show-ends-scrape', '2022-01-01 00:00')


app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})


// Gets data by scraping
app.get('/api/lrtgyvai', async (request, response) =>{

  // if no data or time for getting new data is right
  if(!cache.get('lrt-scrape') || checkTime(cache.get('show-ends-scrape'))){
    
    // w8 for correct data
    await isRightData()
    response.json({title: cache.get('lrt-scrape')})
  }
    //retun cache data
  else {
    response.json({title: cache.get('lrt-json')})
  }
})


// gets data from API 
app.get('/api/lrt', async (request, response) => {

  //if firs try of right time to update
  if(!cache.get('lrt-json') || checkTime(cache.get('show-ends'))) {
    
    // w8 for correct data
    await getDataFromUrl()
    response.json({title: cache.get('lrt-json')})
  }

  // retuns cache data
  else response.json({title: cache.get('lrt-json')})
})


// scraoes data
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


// checks if its time for update
const checkTime = (time) => {
  const requestTime = new Date()
  const programEndTime = time
  console.log(programEndTime)
  
  const formatedProgramEndTime = moment(programEndTime).format('YYYY/MM/DD/HH/mm/ss')
  
  const [year, month, day, hours, minutes, seconds] = formatedProgramEndTime.split('/')
  
  const eTime = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);

  if(requestTime > eTime) {
    console.log("REQUEST TIME more thatn ENDTIME")
    return true
  } 
  return false
}


// checks if data is rigt for scrape
const isRightData = async () =>{

    const liveContent = await scrapeData()
    cache.set('show-start-scrape', liveContent[0].live_start_time)
    
    // other way to compare date and time
    const startTime = moment(cache.get('show-start-scrape'), 'hh:mm')
    let endTime = moment(cache.get('show-ends-scrape'), 'YYYY-MM-DD hh:mm:ss')
        
    if((endTime <= startTime) && cache.get('show-ends')){
        console.log("SETS NEW END TIME FOR SCRAPE")
        cache.set('show-ends-scrape', cache.get('show-ends'))}

    // if new end time is right returns
    if(!checkTime(cache.get('show-ends-scrape'))){
      cache.set('lrt-scrape', liveContent[0].live_title)
      return new Promise(resolve => resolve())  
    } 
    
    //else repeat recirsively
    else {
        await timeout(500)
        await isRightData()
    }
}

// get right data for "JSON" method
const getDataFromUrl = async () => {
  const url = "https://www.lrt.lt/static/tvprog/tvprog.json"

  const response = await fetch(url)
  const liveData =  await (response.json());
  const liveTitle = liveData.tvprog.items[0].title
    
  cache.set('lrt-json', liveTitle)
  cache.set('show-ends', liveData.tvprog.items[0].stop )
    
  // if new time is right return
  if(!checkTime(cache.get('show-ends'))){
      return new Promise(resolve => resolve())
  } 

  //else repeat recirsively
  else {
    await timeout(500)
    await getDataFromUrl()
  }
}


const timeout = (ms) => {
  console.log("RUNS TIMOUT FOR", ms)
  return new Promise(resolve => setTimeout(resolve, ms));
}


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})