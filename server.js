require('dotenv').config();
const Telegraf = require('telegraf');
const request = require('request');
const { CronJob } = require('cron');
const { pbkdf2Sync } = require('crypto');
const { JSDOM } = require('jsdom');
const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const people = process.env.PEOPLE
	? process.env.PEOPLE.split(',')
	: [ 'Akash' ];
const admin = process.env.ADMIN
	? Number(process.env.ADMIN)
	: 475757469;
const token = process.env.BOT_TOKEN;

//Function to calculate checksum using crypto
const checksum = (input) =>
	pbkdf2Sync(input, 'salt', 1, 64, 'sha512').toString('hex');

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const SiteSchema = new Schema({
	url: { type: String, required: true, unique: true },
	checksum: { type: String }
});
const Site = model('Site', SiteSchema);

const ChatSchema = new Schema({
	id: { type: Number, required: true, unique: true },
	sites: {
		type: [ { type: Schema.Types.ObjectId, ref: 'Site' } ],
		required: true,
		default: [],
		validate: x => x.length <= 100
	}
});

const Chat = model('Chat', ChatSchema);

const ensureSiteExists = url =>
	Site.findOneAndUpdate(
		{ url },
		{ $set: { url } },
		{ upsert: true, new: true });

const ensureChatExists = id =>
	Chat.findOneAndUpdate(
		{ id },
		{ $set: { id } },
		{ upsert: true, new: true });

const bot = new Telegraf(token);

bot.command('start', ctx => ctx.reply(`Welcome to SiteSeer !
Made by www.linkedin.com/in/akash-s-joshi 👻. 

/list to list websites
/watch {sitename} to watch a site, without {}
/unsub {sitename} to unsubscribe from the site, without {}

Note : Doesn't work for dynamic sites like Instagram or Facebook.

Your chatid is ${ctx.chat.id}`));

// Matches "/echo [whatever]"
bot.command('watch', ({ chat: { id }, message, reply }) => {
	const arg = message.text.split(' ').slice(1).join(' ').trim();
	const url = (/^http(s)?:\/\//).test(arg) ? arg : `http://${arg}`;
	return Promise.all([
		ensureSiteExists(url),
		ensureChatExists(id)
	])
		.then(([ site, chat ]) =>
			[ site, chat, chat.sites.some(x => x.equals(site.id)) ])
		.then(([ site, chat, chatHasSite ]) =>
			chatHasSite
				? reply('Already subscribed')
				: chat.updateOne(
					{ $push: { sites: site.id } },
					{ new: true })
					.then(() =>
						reply(`Checking ${url} for you!`)));
});

bot.command('list', ({ chat: { id }, reply }) =>
	ensureChatExists(id).populate('sites')
		.then(({ sites }) =>
			reply('Sites currently being checked by bot are \n' +
				sites.map(x => x.url).join('\n') +
				'\n\nUse /watch sitename " to subscribe to notifs of that site' +
				'\n\nUse /unsub sitename to unsubscribe')));

bot.command('unsub', (msg, match) => {
	if(siteList.indexOf(match[1]) != -1){
		Promise.all(sites.map((element)=>{
			if(element.url == match[1]){
				element.chatId = element.chatId.filter((value)=>{
					return value != msg.chat.id;
				})
				bot.telegram.sendMessage(msg.chat.id,`If you were subscribed to ${match[1]}, you no longer are`)
				return true;
			}
			return false
		}))
	}
	else bot.telegram.sendMessage(msg.chat.id,`${match[1]} isn't a valid site. Please check /list for available websites`)
})

var job = new CronJob('*/15 * * * *', batchWatch//()=>{console.log(1)}
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
				Promise.all(siteObject.chatId.map((element1)=>bot.telegram.sendMessage(element1,userMessages.SITE_IS_DOWN)
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

					Promise.all(siteObject.chatId.map((element1)=>bot.telegram.sendMessage(element1,userMessages.SITE_HAS_CHANGED)
					))
				}
				// else site still same
            }
            else  {
				Promise.all(siteObject.chatId.map((element1)=>bot.telegram.sendMessage(element1,userMessages.SITE_IS_DOWN)
				))
			} 
		})
	} 
}

bot.catch(console.error);

bot.telegram.sendMessage(
	admin,
	`Hello ${people.join(', ')}, the bot just restarted`)
	.then(() =>
		bot.startPolling());
