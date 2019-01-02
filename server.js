//require('dotenv').config()
const app = require('express')()
const http = require('http').Server(app)
const TelegramBot = require('node-telegram-bot-api')
const request = require('request')
const	cronJob = require('cron').CronJob
const crypto = require('crypto')
const jsdom = require('jsdom')
const {JSDOM} = jsdom;	
const people = ['Akash']
const admin = 475757469
const token = process.env.BOT_TOKEN
const mongoose = require('mongoose')
const bot = new TelegramBot(token, {polling: true});
const query = {"_id": "5c2c4461e7179a49f40abe2d"};
mongoose.connect(process.env.MONGO_URI)

//Function to calculate checksum using crypto
const checksum = (input) => {
	return crypto.createHash('md5').update(input).digest('hex')
}

bot.sendMessage(admin,`Hello ${people} , the bot just re/started`)

const {Schema} = mongoose
var myModel = mongoose.model('sites', new Schema({sites: Array}), 
'sites');

let sites = []
let siteList = []

myModel.find({}, function(err, data) {
	sites=data[0].sites
	siteList = sites.map(element=>element.url)
	console.log(err)
})

bot.onText(/\/start/,(msg) =>{
    bot.sendMessage(msg.chat.id,
		`Welcome to SiteSeer !
		Made by www.linkedin.com/in/akash-s-joshi 👻. 

		/list to list websites
		/watch {sitename} to watch a site, without {}
		/unsub {sitename} to unsubscribe from the site, without {}

		Note : Doesn't work for dynamic sites like Instagram or Facebook.
		
		Your chatid is ${msg.chat.id}`)
})

app.get('/', (req,res) => {
	res.send(sites);
});

app.get('/s', (req,res) =>{
	res.send(siteList)
})

// Matches "/echo [whatever]"
bot.onText(/\/watch (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram 'match' is the result of executing the regexp above on the text content of the message
	const chatId = msg.chat.id;
	let chatarr = [] 
	chatarr.push(chatId)
	let url = match[1].toLowerCase()  
    url = (/^http(s)?:\/\//).test(url) ? url : `http://${url}`;
    if(siteList.indexOf(url) == -1){
		siteList.push(url);
		sites.push({url,chatId:chatarr,checksumString:""})
		bot.sendMessage(msg.chat.id,`Checking ${url} for you !`)
	}
	else bot.sendMessage(msg.chat.id,`Already subscribed`)
});

bot.onText(/\/list/,(msg)=>{
	let temp = `Sites currently being checked by bot are \n ${siteList.join("\n\n")} \n\nUse /watch sitename to subscribe to notifs of that site\n\nUse /unsub sitename to unsubscribe`;

	bot.sendMessage(msg.chat.id,temp)
})

bot.onText(/\/unsub (.+)/,(msg,match)=>{
	if(siteList.indexOf(match[1]) != -1){
		Promise.all(sites.map((element)=>{
			if(element.url == match[1]){
				element.chatId = element.chatId.filter((value)=>{
					return value != msg.chat.id;
				})
				bot.sendMessage(msg.chat.id,`If you were subscribed to ${match[1]}, you no longer are`)
				return true;
			}
			return false
		}))
	}
	else bot.sendMessage(msg.chat.id,`${match[1]} isn't a valid site. Please check /list for available websites`)
})

bot.on ('polling_error', (error) => {
    var time = new Date();
	console.log("TIME:", time);
	console.log("CODE:", error.code);  // => 'EFATAL'
	console.log("MSG:", error.message);
	console.log("STACK:", error.stack);
 });

var job = new cronJob('*/15 * * * *', batchWatch//()=>{console.log(1)}
, function endCronJob(){
    console.log('cronJob ended')
  },true,
  'America/Los_Angeles' /* Time zone of this job. */
);

function batchWatch (){
	Promise.all(sites.map((element)=>{
		siteWatcher(element)
	}))
	const newData = {
		'sites' : sites,
		"_id": "5c2c4461e7179a49f40abe2d"
	}
	myModel.findOneAndUpdate(query, newData, {upsert:true}, function(err){
		if (err) return console.log(500, { error: err });
		return console.log("succesfully saved");
	});
}

// Watch the site for changes...
function siteWatcher(siteObject){
	let userMessages = {
		"SITE_HAS_CHANGED": `The site, ${siteObject.url}, might have changed!

		Support me here :
		http://m.p-y.tm/requestPayment?recipient=8669091448

		OR

		ko-fi.com/akashjoshi`,
        "SITE_IS_DOWN": `The site, ${siteObject.url}, is down!`
	}

	// Check to see if there is a seed checksum
	if(siteObject.checksumString == ''){

		// Create the first checksum and return
		return request(siteObject.url, function initialRequestCallback(error, response, body){

			if(error){return console.error(error)}

			if(response.statusCode < 400){
				const dom = new JSDOM(body)
				return siteObject.checksumString = checksum(dom.window.document.querySelector('body').textContent.trim())
            } 
            else{
				Promise.all(siteObject.chatId.map((element1)=>bot.sendMessage(element1,userMessages.SITE_IS_DOWN)
				))
			} 
		}) // end request
	}
	else{
		// Compare current checksum with latest request body 
		return request(siteObject.url, function recurringRequestCallback(error, response, body){

			if(error){return console.error(error)}

			if(response.statusCode < 400){
				
				const dom = new JSDOM(body)
				let currentCheckSum = checksum(dom.window.document.querySelector('body').textContent.trim())
				
				if(siteObject.checksumString != currentCheckSum){
					// They are not the same so send notification 
					
					// Update checkSumString's value
					siteObject.checksumString = currentCheckSum

					Promise.all(siteObject.chatId.map((element1)=>bot.sendMessage(element1,userMessages.SITE_HAS_CHANGED)
					))
				}
				// else site still same
            }
            else  {
				Promise.all(siteObject.chatId.map((element1)=>bot.sendMessage(element1,userMessages.SITE_IS_DOWN)
				))
			} 
		})
	} 
} 

var port = process.env.PORT || 8080;

http.listen(port, () => {
	console.log(`working on port ${port}`);
});